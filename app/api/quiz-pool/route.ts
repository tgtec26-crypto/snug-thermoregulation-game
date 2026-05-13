import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const VALID_CATEGORIES = new Set(['cold_response', 'hot_response', 'neuro_vs_hormone']);

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Admin API disabled in production' }, { status: 403 });
  }

  const body = await req.json();
  const { data } = body;

  if (!Array.isArray(data)) {
    return NextResponse.json({ error: 'invalid payload: data must be array' }, { status: 400 });
  }
  const seenIds = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const q = data[i];
    if (!q || typeof q !== 'object') {
      return NextResponse.json({ error: `data[${i}] must be object` }, { status: 400 });
    }
    if (typeof q.id !== 'string' || !q.id) {
      return NextResponse.json({ error: `data[${i}].id invalid` }, { status: 400 });
    }
    if (seenIds.has(q.id)) {
      return NextResponse.json({ error: `data[${i}].id duplicate: ${q.id}` }, { status: 400 });
    }
    seenIds.add(q.id);
    if (typeof q.question !== 'string') {
      return NextResponse.json({ error: `data[${i}].question must be string` }, { status: 400 });
    }
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || !q.choices.every((c: unknown) => typeof c === 'string')) {
      return NextResponse.json({ error: `data[${i}].choices must be string[4]` }, { status: 400 });
    }
    if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex > 3 || !Number.isInteger(q.answerIndex)) {
      return NextResponse.json({ error: `data[${i}].answerIndex must be 0..3` }, { status: 400 });
    }
    if (typeof q.category !== 'string' || !VALID_CATEGORIES.has(q.category)) {
      return NextResponse.json({ error: `data[${i}].category invalid` }, { status: 400 });
    }
    if (typeof q.explanation !== 'string') {
      return NextResponse.json({ error: `data[${i}].explanation must be string` }, { status: 400 });
    }
  }

  const filepath = path.resolve(process.cwd(), 'public', 'data', 'quiz-pool.json');
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: 'quiz-pool.json' });
}
