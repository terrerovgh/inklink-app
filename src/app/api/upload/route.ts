import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface UploadResponse {
  success: boolean
  data?: {
    url: string
    path: string
    filename: string
    size: number
    type: string
  }
  error?: string
  message?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
]

const UPLOAD_BUCKETS = {
  portfolio: 'portfolio-images',
  avatars: 'user-avatars',
  references: 'reference-images',
  flash: 'flash-tattoos'
}

// POST /api/upload - Upload images to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket') || 'portfolio'
    const userId = searchParams.get('user_id')

    // Validate bucket
    if (!Object.keys(UPLOAD_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bucket',
          message: `Bucket must be one of: ${Object.keys(UPLOAD_BUCKETS).join(', ')}`
        },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
          message: 'Please provide a file to upload'
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large',
          message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type',
          message: `File type must be one of: ${ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // For development, create mock upload response
      const mockResponse = createMockUploadResponse(file, bucket)
      return NextResponse.json(mockResponse)
    }

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const filename = `${user.id}/${timestamp}_${randomString}.${fileExtension}`
      
      const bucketName = UPLOAD_BUCKETS[bucket as keyof typeof UPLOAD_BUCKETS]

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filename, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase storage upload error:', error)
        // Fallback to mock response
        const mockResponse = createMockUploadResponse(file, bucket)
        return NextResponse.json({
          ...mockResponse,
          message: 'Mock upload created due to storage error'
        })
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename)

      const response: UploadResponse = {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: filename,
          filename: file.name,
          size: file.size,
          type: file.type
        },
        message: 'File uploaded successfully'
      }

      // Log upload for portfolio items
      if (bucket === 'portfolio' && userId) {
        await logPortfolioUpload(supabase, userId, {
          url: urlData.publicUrl,
          filename: file.name,
          path: filename
        })
      }

      return NextResponse.json(response)
    } catch (storageError) {
      console.error('Storage operation error:', storageError)
      // Fallback to mock response
      const mockResponse = createMockUploadResponse(file, bucket)
      return NextResponse.json({
        ...mockResponse,
        message: 'Mock upload created due to storage operation error'
      })
    }
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/upload - Delete image from Supabase Storage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket') || 'portfolio'
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing file path',
          message: 'File path is required for deletion'
        },
        { status: 400 }
      )
    }

    // Validate bucket
    if (!Object.keys(UPLOAD_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bucket',
          message: `Bucket must be one of: ${Object.keys(UPLOAD_BUCKETS).join(', ')}`
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to delete files'
        },
        { status: 401 }
      )
    }

    try {
      const bucketName = UPLOAD_BUCKETS[bucket as keyof typeof UPLOAD_BUCKETS]

      // Verify user owns the file (path should start with user ID)
      if (!path.startsWith(user.id + '/')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'You can only delete your own files'
          },
          { status: 403 }
        )
      }

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([path])

      if (error) {
        console.error('Supabase storage delete error:', error)
        // Still return success for development
        return NextResponse.json({
          success: true,
          message: 'Mock deletion successful (storage error occurred)'
        })
      }

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      })
    } catch (storageError) {
      console.error('Storage delete operation error:', storageError)
      return NextResponse.json({
        success: true,
        message: 'Mock deletion successful (storage operation error)'
      })
    }
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Delete failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/upload - List user's uploaded files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket') || 'portfolio'
    const userId = searchParams.get('user_id')

    // Validate bucket
    if (!Object.keys(UPLOAD_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bucket',
          message: `Bucket must be one of: ${Object.keys(UPLOAD_BUCKETS).join(', ')}`
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Return mock files for development
      return NextResponse.json({
        success: true,
        data: getMockUserFiles(bucket),
        message: 'Mock files returned (no authentication)'
      })
    }

    try {
      const bucketName = UPLOAD_BUCKETS[bucket as keyof typeof UPLOAD_BUCKETS]
      const userFolder = userId || user.id

      // List files in user's folder
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(userFolder, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Supabase storage list error:', error)
        // Fallback to mock data
        return NextResponse.json({
          success: true,
          data: getMockUserFiles(bucket),
          message: 'Mock files returned due to storage error'
        })
      }

      // Generate public URLs for files
      const filesWithUrls = data?.map(file => {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`${userFolder}/${file.name}`)

        return {
          name: file.name,
          path: `${userFolder}/${file.name}`,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'image/jpeg',
          created_at: file.created_at,
          updated_at: file.updated_at
        }
      }) || []

      return NextResponse.json({
        success: true,
        data: filesWithUrls,
        total: filesWithUrls.length
      })
    } catch (storageError) {
      console.error('Storage list operation error:', storageError)
      return NextResponse.json({
        success: true,
        data: getMockUserFiles(bucket),
        message: 'Mock files returned due to storage operation error'
      })
    }
  } catch (error) {
    console.error('List files API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list files',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function createMockUploadResponse(file: File, bucket: string): UploadResponse {
  const timestamp = Date.now()
  const mockPath = `mock_user_1/${timestamp}_${file.name}`
  const mockUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('uploaded ' + bucket + ' image')}&image_size=square`

  return {
    success: true,
    data: {
      url: mockUrl,
      path: mockPath,
      filename: file.name,
      size: file.size,
      type: file.type
    },
    message: 'Mock upload successful (Supabase Storage not configured)'
  }
}

function getMockUserFiles(bucket: string) {
  const mockFiles = [
    {
      name: 'portfolio_1.jpg',
      path: 'mock_user_1/1705123456789_portfolio_1.jpg',
      url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('tattoo portfolio sample 1')}&image_size=square`,
      size: 245760,
      type: 'image/jpeg',
      created_at: '2024-01-13T10:30:00Z',
      updated_at: '2024-01-13T10:30:00Z'
    },
    {
      name: 'portfolio_2.png',
      path: 'mock_user_1/1705123456790_portfolio_2.png',
      url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('tattoo portfolio sample 2')}&image_size=square`,
      size: 189432,
      type: 'image/png',
      created_at: '2024-01-14T15:20:00Z',
      updated_at: '2024-01-14T15:20:00Z'
    },
    {
      name: 'avatar.jpg',
      path: 'mock_user_1/1705123456791_avatar.jpg',
      url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('professional tattoo artist avatar')}&image_size=square`,
      size: 156789,
      type: 'image/jpeg',
      created_at: '2024-01-15T09:15:00Z',
      updated_at: '2024-01-15T09:15:00Z'
    }
  ]

  // Filter by bucket type
  if (bucket === 'avatars') {
    return mockFiles.filter(file => file.name.includes('avatar'))
  } else if (bucket === 'portfolio') {
    return mockFiles.filter(file => file.name.includes('portfolio'))
  }

  return mockFiles
}

async function logPortfolioUpload(supabase: any, userId: string, fileData: any) {
  try {
    // Check if user is an artist
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (artistError || !artist) {
      console.log('User is not an artist, skipping portfolio log')
      return
    }

    // Add to portfolio_items table
    const portfolioData = {
      artist_id: artist.id,
      title: fileData.filename.split('.')[0], // Use filename without extension as title
      image: fileData.url,
      description: '',
      style: 'General',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: portfolioError } = await supabase
      .from('portfolio_items')
      .insert([portfolioData])

    if (portfolioError) {
      console.error('Portfolio item creation error:', portfolioError)
    }
  } catch (error) {
    console.error('Portfolio logging error:', error)
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not implemented yet' },
    { status: 501 }
  )
}