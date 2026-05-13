import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Admin API disabled in production' }, { status: 403 });
  }

  const body = await req.json();
  const { data } = body;

  // data: Record<string, Array<string | { text: string; size?: 'sm'|'md'|'lg' }>>
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'invalid payload: data must be object' }, { status: 400 });
  }
  const SIZES = new Set(['sm', 'md', 'lg']);
  for (const [k, v] of Object.entries(data)) {
    if (!Array.isArray(v)) {
      return NextResponse.json({ error: `invalid payload: data.${k} must be array` }, { status: 400 });
    }
    for (const item of v) {
      if (typeof item === 'string') continue;
      if (item && typeof item === 'object' && typeof (item as { text?: unknown }).text === 'string') {
        const sz = (item as { size?: unknown }).size;
        if (sz !== undefined && !(typeof sz === 'string' && SIZES.has(sz))) {
          return NextResponse.json({ error: `invalid payload: data.${k}[].size must be sm|md|lg` }, { status: 400 });
        }
        continue;
      }
      return NextResponse.json({ error: `invalid payload: data.${k}[] must be string or { text, size? }` }, { status: 400 });
    }
  }

  const filepath = path.resolve(process.cwd(), 'public', 'data', 'teacher-intro.json');
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: 'teacher-intro.json' });
}
