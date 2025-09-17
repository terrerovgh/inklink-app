import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PortfolioImageRequest } from '@/shared/types/profiles';

interface RouteParams {
  params: {
    id: string;
    imageId: string;
  };
}

// GET /api/profiles/[id]/portfolio/[imageId] - Get a specific portfolio image
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id, imageId } = params;

    const { data: image, error } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('id', imageId)
      .eq('profile_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Portfolio image not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching portfolio image:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch portfolio image' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: image, success: true });
  } catch (error) {
    console.error('Unexpected error in GET /api/profiles/[id]/portfolio/[imageId]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}

// PUT /api/profiles/[id]/portfolio/[imageId] - Update a specific portfolio image
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id, imageId } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, success: false },
        { status: 401 }
      );
    }

    // Check if the user owns this profile and the image exists
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
        { error: { code: 'FORBIDDEN', message: 'You can only update your own portfolio images' }, success: false },
        { status: 403 }
      );
    }

    // Check if the image exists and belongs to this profile
    const { data: existingImage, error: imageError } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('id', imageId)
      .eq('profile_id', id)
      .single();

    if (imageError) {
      if (imageError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Portfolio image not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching portfolio image:', imageError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch portfolio image' }, success: false },
        { status: 500 }
      );
    }

    const body: Partial<PortfolioImageRequest> = await request.json();

    // Prepare updates
    const updates: any = {};
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.display_order !== undefined) updates.display_order = body.display_order;

    // Update the image
    const { data: updatedImage, error: updateError } = await supabase
      .from('portfolio_images')
      .update(updates)
      .eq('id', imageId)
      .eq('profile_id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating portfolio image:', updateError);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to update portfolio image' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedImage, success: true });
  } catch (error) {
    console.error('Unexpected error in PUT /api/profiles/[id]/portfolio/[imageId]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}

// DELETE /api/profiles/[id]/portfolio/[imageId] - Delete a specific portfolio image
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id, imageId } = params;
    
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
        { error: { code: 'FORBIDDEN', message: 'You can only delete your own portfolio images' }, success: false },
        { status: 403 }
      );
    }

    // Check if the image exists and belongs to this profile
    const { data: existingImage, error: imageError } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('id', imageId)
      .eq('profile_id', id)
      .single();

    if (imageError) {
      if (imageError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Portfolio image not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching portfolio image:', imageError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch portfolio image' }, success: false },
        { status: 500 }
      );
    }

    // Delete the image
    const { error: deleteError } = await supabase
      .from('portfolio_images')
      .delete()
      .eq('id', imageId)
      .eq('profile_id', id);

    if (deleteError) {
      console.error('Error deleting portfolio image:', deleteError);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: 'Failed to delete portfolio image' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/profiles/[id]/portfolio/[imageId]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}