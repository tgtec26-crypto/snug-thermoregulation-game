import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Admin API disabled in production' }, { status: 403 });
  }

  const body = await req.json();
  const { data } = body;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'invalid payload: data must be object' }, { status: 400 });
  }
  const d = data as {
    imageSize?: { w?: unknown; h?: unknown };
    cellSize?: { w?: unknown; h?: unknown };
    holes?: unknown;
  };
  if (!d.imageSize || typeof d.imageSize.w !== 'number' || typeof d.imageSize.h !== 'number') {
    return NextResponse.json({ error: 'imageSize must be { w:number, h:number }' }, { status: 400 });
  }
  if (!d.cellSize || typeof d.cellSize.w !== 'number' || typeof d.cellSize.h !== 'number') {
    return NextResponse.json({ error: 'cellSize must be { w:number, h:number }' }, { status: 400 });
  }
  if (!Array.isArray(d.holes) || d.holes.length !== 9) {
    return NextResponse.json({ error: 'holes must be array of 9' }, { status: 400 });
  }
  for (const h of d.holes) {
    if (!h || typeof (h as { x?: unknown }).x !== 'number' || typeof (h as { y?: unknown }).y !== 'number') {
      return NextResponse.json({ error: 'each hole must have numeric x,y' }, { status: 400 });
    }
  }

  const filepath = path.resolve(process.cwd(), 'public', 'data', 'sauna-mole-holes.json');
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: 'sauna-mole-holes.json' });
}
