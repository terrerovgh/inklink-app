import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface UseOptimizedFetchOptions {
  cacheTime?: number // Cache duration in milliseconds
  staleTime?: number // Time before data is considered stale
  enabled?: boolean
  refetchOnWindowFocus?: boolean
}

const cache = new Map<string, CacheEntry<any>>()

export function useOptimizedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseOptimizedFetchOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    enabled = true,
    refetchOnWindowFocus = true
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    // Check cache first
    const cached = cache.get(key)
    const now = Date.now()
    
    if (!force && cached && now - cached.timestamp < staleTime) {
      setData(cached.data)
      return cached.data
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: now,
        expiry: now + cacheTime
      })

      setData(result)
      return result
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [key, fetcher, enabled, staleTime, cacheTime])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  const invalidate = useCallback(() => {
    cache.delete(key)
  }, [key])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      const cached = cache.get(key)
      const now = Date.now()
      
      if (cached && now - cached.timestamp > staleTime) {
        fetchData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [key, staleTime, fetchData, refetchOnWindowFocus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Clean expired cache entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      for (const [cacheKey, entry] of cache.entries()) {
        if (now > entry.expiry) {
          cache.delete(cacheKey)
        }
      }
    }, 60000) // Clean every minute

    return () => clearInterval(interval)
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    isStale: (() => {
      const cached = cache.get(key)
      if (!cached) return true
      return Date.now() - cached.timestamp > staleTime
    })()
  }
}

// Utility function to prefetch data
export function prefetchData<T>(key: string, fetcher: () => Promise<T>, cacheTime = 5 * 60 * 1000) {
  const cached = cache.get(key)
  const now = Date.now()
  
  if (cached && now - cached.timestamp < cacheTime) {
    return Promise.resolve(cached.data)
  }

  return fetcher().then(data => {
    cache.set(key, {
      data,
      timestamp: now,
      expiry: now + cacheTime
    })
    return data
  })
}

// Clear all cache
export function clearCache() {
  cache.clear()
}