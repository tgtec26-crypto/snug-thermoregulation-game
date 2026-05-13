export type TeacherSize = 'sm' | 'md' | 'lg';

export interface TeacherLine {
  text: string;
  size?: TeacherSize;
}

export const TEACHER_FONT_PX: Record<TeacherSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

export const TEACHER_SIZE_LABEL: Record<TeacherSize, string> = {
  sm: '작게',
  md: '보통',
  lg: '크게',
};

export const TEACHER_SIZES: readonly TeacherSize[] = ['sm', 'md', 'lg'] as const;

export function normalizeTeacherLine(raw: unknown): TeacherLine {
  if (typeof raw === 'string') return { text: raw };
  if (raw && typeof raw === 'object' && 'text' in raw) {
    const r = raw as { text: unknown; size?: unknown };
    const text = typeof r.text === 'string' ? r.text : '';
    const size = r.size === 'sm' || r.size === 'md' || r.size === 'lg' ? r.size : undefined;
    return size ? { text, size } : { text };
  }
  return { text: '' };
}

export function normalizeTeacherData(
  raw: unknown,
): Record<string, TeacherLine[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, TeacherLine[]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) out[k] = v.map(normalizeTeacherLine);
  }
  return out;
}
