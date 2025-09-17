import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') // 'artist' | 'studio' | 'all'
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '10000' // Default 10km in meters
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let results = []

    // Search artists
    if (type === 'artist' || type === 'all' || !type) {
      let artistQuery = supabase
        .from('artists')
        .select(`
          *,
          user:users!inner(*)
        `)
        .limit(limit)
        .range(offset, offset + limit - 1)

      // Text search
      if (query) {
        artistQuery = artistQuery.or(
          `bio.ilike.%${query}%,specialties.cs.{${query}},user.full_name.ilike.%${query}%`
        )
      }

      // Geographic search
      if (lat && lng) {
        artistQuery = artistQuery.rpc('find_nearby_artists', {
          user_lat: parseFloat(lat),
          user_lng: parseFloat(lng),
          radius_meters: parseInt(radius)
        })
      }

      const { data: artists, error: artistError } = await artistQuery

      if (artistError) {
        console.error('Artist search error:', artistError)
      } else {
        results.push(...(artists || []).map(artist => ({
          ...artist,
          type: 'artist'
        })))
      }
    }

    // Search studios
    if (type === 'studio' || type === 'all' || !type) {
      let studioQuery = supabase
        .from('studios')
        .select(`
          *,
          user:users!inner(*)
        `)
        .limit(limit)
        .range(offset, offset + limit - 1)

      // Text search
      if (query) {
        studioQuery = studioQuery.or(
          `name.ilike.%${query}%,description.ilike.%${query}%,services.cs.{${query}},user.full_name.ilike.%${query}%`
        )
      }

      // Geographic search
      if (lat && lng) {
        studioQuery = studioQuery.rpc('find_nearby_studios', {
          user_lat: parseFloat(lat),
          user_lng: parseFloat(lng),
          radius_meters: parseInt(radius)
        })
      }

      const { data: studios, error: studioError } = await studioQuery

      if (studioError) {
        console.error('Studio search error:', studioError)
      } else {
        results.push(...(studios || []).map(studio => ({
          ...studio,
          type: 'studio'
        })))
      }
    }

    // Sort by distance if geographic search
    if (lat && lng) {
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      query: {
        q: query,
        type,
        lat,
        lng,
        radius,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}