import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_SCENES = new Set([
  'classroom', 'airport_start', 'airport_finland', 'airport_canada',
  'airport_dubai', 'airport_egypt', 'worldmap', 'ending',
  'country_finland_outdoor', 'country_finland_indoor',
  'country_canada_outdoor', 'country_canada_indoor',
  'country_dubai_outdoor', 'country_dubai_indoor',
  'country_egypt_outdoor', 'country_egypt_indoor',
  'country_finland_map', 'country_canada_map',
  'country_dubai_map',   'country_egypt_map',
]);

export async function POST(req: NextRequest) {
  // dev에서만 허용
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Admin API disabled in production' }, { status: 403 });
  }

  const body = await req.json();
  const { scene, payload } = body;

  if (!scene || typeof scene !== 'string' || !ALLOWED_SCENES.has(scene)) {
    return NextResponse.json({ error: 'invalid scene' }, { status: 400 });
  }

  if (!payload || !Array.isArray(payload.nodes)) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const filepath = path.resolve(process.cwd(), 'public', 'data', `nodes-${scene}.json`);
  await fs.writeFile(filepath, JSON.stringify(payload, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: `nodes-${scene}.json` });
}
