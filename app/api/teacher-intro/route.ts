import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Admin API disabled in production' }, { status: 403 });
  }

  const body = await req.json();
  const { data } = body;

  // data: Record<string, string[]>  (예: { intro: [...], rps_cold_intro: [...] })
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'invalid payload: data must be object' }, { status: 400 });
  }
  for (const [k, v] of Object.entries(data)) {
    if (!Array.isArray(v) || !v.every(l => typeof l === 'string')) {
      return NextResponse.json({ error: `invalid payload: data.${k} must be string[]` }, { status: 400 });
    }
  }

  const filepath = path.resolve(process.cwd(), 'public', 'data', 'teacher-intro.json');
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: 'teacher-intro.json' });
}
