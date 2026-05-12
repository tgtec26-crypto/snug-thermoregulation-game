import { describe, it, expect } from 'vitest';
import { computeStars, getEndingMessage } from '@/game/systems/scoreSystem';

describe('scoreSystem', () => {
  it('체온 유지 80%+ AND 퀴즈 첫시도 100% → 3성', () => {
    expect(computeStars({ tempRetentionPct: 85, quizFirstTryPct: 100 })).toBe(3);
  });

  it('체온 유지 60%+ OR 퀴즈 첫시도 66%+ → 2성', () => {
    expect(computeStars({ tempRetentionPct: 60, quizFirstTryPct: 0 })).toBe(2);
    expect(computeStars({ tempRetentionPct: 0, quizFirstTryPct: 66.7 })).toBe(2);
  });

  it('둘 다 못 채우면 1성', () => {
    expect(computeStars({ tempRetentionPct: 30, quizFirstTryPct: 30 })).toBe(1);
  });

  it('최소 1성 (모든 학생 격려)', () => {
    expect(computeStars({ tempRetentionPct: 0, quizFirstTryPct: 0 })).toBe(1);
  });

  it('3성/2성/1성에 맞는 격려 메시지', () => {
    expect(getEndingMessage(3)).toContain('달인');
    expect(getEndingMessage(2)).toContain('능숙');
    expect(getEndingMessage(1)).toContain('노력');
  });
});
