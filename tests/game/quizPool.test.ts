import { describe, it, expect } from 'vitest';
import { QUIZ_POOL, drawQuiz } from '@/game/data/quizPool';

describe('quizPool', () => {
  it('최소 15문제 이상 보유', () => {
    expect(QUIZ_POOL.length).toBeGreaterThanOrEqual(15);
  });

  it('모든 문제는 4개 선택지 + 0~3 정답 인덱스', () => {
    QUIZ_POOL.forEach(q => {
      expect(q.choices).toHaveLength(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThanOrEqual(3);
    });
  });

  it('3개 카테고리 모두 최소 5문제씩', () => {
    const cats = ['cold_response', 'hot_response', 'neuro_vs_hormone'] as const;
    cats.forEach(cat => {
      const inCat = QUIZ_POOL.filter(q => q.category === cat);
      expect(inCat.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('drawQuiz는 제외 목록에 없는 문제만 반환', () => {
    const excluded = QUIZ_POOL.slice(0, 14).map(q => q.id);
    const drawn = drawQuiz(excluded);
    expect(drawn).not.toBeNull();
    expect(excluded).not.toContain(drawn!.id);
  });

  it('drawQuiz는 모든 문제가 제외되면 null 반환', () => {
    const excluded = QUIZ_POOL.map(q => q.id);
    const drawn = drawQuiz(excluded);
    expect(drawn).toBeNull();
  });
});
