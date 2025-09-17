import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://inklink.app'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/studios`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/requests`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Get all artists
    const { data: artists } = await supabase
      .from('artists')
      .select('id, updated_at')
      .eq('is_active', true)
      .limit(1000)

    const artistPages: MetadataRoute.Sitemap = (artists || []).map((artist) => ({
      url: `${baseUrl}/artists/${artist.id}`,
      lastModified: new Date(artist.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Get all studios
    const { data: studios } = await supabase
      .from('studios')
      .select('id, updated_at')
      .eq('is_active', true)
      .limit(1000)

    const studioPages: MetadataRoute.Sitemap = (studios || []).map((studio) => ({
      url: `${baseUrl}/studios/${studio.id}`,
      lastModified: new Date(studio.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Get all tattoo requests
    const { data: requests } = await supabase
      .from('tattoo_requests')
      .select('id, updated_at')
      .eq('status', 'open')
      .limit(500)

    const requestPages: MetadataRoute.Sitemap = (requests || []).map((request) => ({
      url: `${baseUrl}/requests/${request.id}`,
      lastModified: new Date(request.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    }))

    return [...staticPages, ...artistPages, ...studioPages, ...requestPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}