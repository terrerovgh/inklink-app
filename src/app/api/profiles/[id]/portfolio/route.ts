import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PortfolioImageRequest } from '@/shared/types/profiles';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/profiles/[id]/portfolio - Get portfolio images for a profile
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Profile not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch profile' }, success: false },
        { status: 500 }
      );
    }

    // Get portfolio images
    const { data: images, error: imagesError } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('profile_id', id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (imagesError) {
      console.error('Error fetching portfolio images:', imagesError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch portfolio images' }, success: false },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('portfolio_images')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', id);

    if (countError) {
      console.error('Error counting portfolio images:', countError);
      return NextResponse.json(
        { error: { code: 'COUNT_ERROR', message: 'Failed to count portfolio images' }, success: false },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: images,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      success: true
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/profiles/[id]/portfolio:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}

// POST /api/profiles/[id]/portfolio - Add a new portfolio image
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, success: false },
        { status: 401 }
      );
    }

    // Check if the user owns this profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_profile:user_profiles!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Profile not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch profile' }, success: false },
        { status: 500 }
      );
    }

    // Check ownership
    if (profile.user_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only add images to your own profile' }, success: false },
        { status: 403 }
      );
    }

    const body: PortfolioImageRequest = await request.json();

    // Validate required fields
    if (!body.image_url) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'image_url is required' }, success: false },
        { status: 400 }
      );
    }

    // Get the next display order if not provided
    let displayOrder = body.display_order;
    if (displayOrder === undefined) {
      const { data: lastImage } = await supabase
        .from('portfolio_images')
        .select('display_order')
        .eq('profile_id', id)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();
      
      displayOrder = (lastImage?.display_order || 0) + 1;
    }

    // Create the portfolio image
    const { data: newImage, error: createError } = await supabase
      .from('portfolio_images')
      .insert({
        profile_id: id,
        image_url: body.image_url,
        title: body.title || null,
        description: body.description || null,
        tags: body.tags || null,
        display_order: displayOrder
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating portfolio image:', createError);
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: 'Failed to create portfolio image' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newImage, success: true }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/profiles/[id]/portfolio:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}

// PUT /api/profiles/[id]/portfolio - Bulk update portfolio images (reorder, update multiple)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, success: false },
        { status: 401 }
      );
    }

    // Check if the user owns this profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_profile:user_profiles!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Profile not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch profile' }, success: false },
        { status: 500 }
      );
    }

    // Check ownership
    if (profile.user_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only update your own portfolio' }, success: false },
        { status: 403 }
      );
    }

    const body: { images: Array<{ id: string; display_order?: number; title?: string; description?: string; tags?: string[] }> } = await request.json();

    if (!body.images || !Array.isArray(body.images)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'images array is required' }, success: false },
        { status: 400 }
      );
    }

    // Update each image
    const updatePromises = body.images.map(async (imageUpdate) => {
      const updates: any = {};
      if (imageUpdate.display_order !== undefined) updates.display_order = imageUpdate.display_order;
      if (imageUpdate.title !== undefined) updates.title = imageUpdate.title;
      if (imageUpdate.description !== undefined) updates.description = imageUpdate.description;
      if (imageUpdate.tags !== undefined) updates.tags = imageUpdate.tags;

      return supabase
        .from('portfolio_images')
        .update(updates)
        .eq('id', imageUpdate.id)
        .eq('profile_id', id) // Ensure the image belongs to this profile
        .select('*')
        .single();
    });

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating portfolio images:', errors);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to update some portfolio images' }, success: false },
        { status: 500 }
      );
    }

    const updatedImages = results.map(result => result.data).filter(Boolean);

    return NextResponse.json({ data: updatedImages, success: true });
  } catch (error) {
    console.error('Unexpected error in PUT /api/profiles/[id]/portfolio:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}