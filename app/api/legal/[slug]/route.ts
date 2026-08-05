import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[API/LEGAL] Missing Supabase environment variables in runtime.');
    return NextResponse.json({ error: 'Server Environment Misconfigured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase
      .from('LegalDocument')
      .select('title, content, version')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`[API/LEGAL] Supabase Error fetching slug "${slug}":`, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.warn(`[API/LEGAL] No record found in LegalDocument table for slug: "${slug}"`);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API/LEGAL] Exception encountered:', err?.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}