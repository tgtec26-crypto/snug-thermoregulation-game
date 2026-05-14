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
    targets?: unknown;
  };
  if (!d.imageSize || typeof d.imageSize.w !== 'number' || typeof d.imageSize.h !== 'number') {
    return NextResponse.json({ error: 'imageSize must be { w:number, h:number }' }, { status: 400 });
  }
  if (!Array.isArray(d.targets) || d.targets.length === 0) {
    return NextResponse.json({ error: 'targets must be non-empty array' }, { status: 400 });
  }
  const isPoint = (p: unknown): boolean =>
    !!p && typeof (p as { x?: unknown }).x === 'number' && typeof (p as { y?: unknown }).y === 'number';
  for (const t of d.targets) {
    const tt = t as { id?: unknown; label?: unknown; r?: unknown; left?: unknown; right?: unknown };
    if (typeof tt.id !== 'string'
        || typeof tt.label !== 'string'
        || typeof tt.r !== 'number'
        || !isPoint(tt.left)
        || !isPoint(tt.right)) {
      return NextResponse.json({ error: 'each target must have id:string, label:string, r:number, left:{x,y}, right:{x,y}' }, { status: 400 });
    }
  }

  const filepath = path.resolve(process.cwd(), 'public', 'data', 'spot-difference-targets.json');
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: 'spot-difference-targets.json' });
}
