import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED = new Set(['worldmap', 'korea']);

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Admin API disabled in production' }, { status: 403 });
  }

  const body = await req.json();
  const { pathType, payload } = body;

  if (!pathType || !ALLOWED.has(pathType) || !payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const filename = `paths-${pathType}.json`;
  const filepath = path.resolve(process.cwd(), 'public', 'data', filename);
  await fs.writeFile(filepath, JSON.stringify(payload, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: filename });
}
