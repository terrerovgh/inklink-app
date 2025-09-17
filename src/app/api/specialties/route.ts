import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Specialty, SpecialtiesResponse } from '@/shared/types/profiles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('specialties')
      .select('*')
      .order('name', { ascending: true });

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: specialties, error, count } = await query;

    if (error) {
      console.error('Error fetching specialties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch specialties' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let totalCount = count;
    if (totalCount === null) {
      const { count: totalCountResult } = await supabase
        .from('specialties')
        .select('*', { count: 'exact', head: true });
      totalCount = totalCountResult || 0;
    }

    const response: SpecialtiesResponse = {
      specialties: specialties || [],
      total: totalCount,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: (offset + limit) < totalCount
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in specialties API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if specialty already exists
    const { data: existingSpecialty } = await supabase
      .from('specialties')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existingSpecialty) {
      return NextResponse.json(
        { error: 'A specialty with this name already exists' },
        { status: 409 }
      );
    }

    // Create new specialty
    const { data: specialty, error } = await supabase
      .from('specialties')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating specialty:', error);
      return NextResponse.json(
        { error: 'Failed to create specialty' },
        { status: 500 }
      );
    }

    return NextResponse.json({ specialty }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in specialty creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}