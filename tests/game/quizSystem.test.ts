import { describe, it, expect } from 'vitest';
import { startAirportQuiz, evaluateAnswer } from '@/game/systems/quizSystem';

describe('quizSystem', () => {
  it('startAirportQuiz는 attemptedIds에 없는 문제 반환', () => {
    const result = startAirportQuiz([]);
    expect(result).not.toBeNull();
    expect(result!.choices).toHaveLength(4);
  });

  it('startAirportQuiz — 모든 문제 제외 시 null', () => {
    const allIds = ['c1','c2','c3','c4','c5','h1','h2','h3','h4','h5','n1','n2','n3','n4','n5'];
    const result = startAirportQuiz(allIds);
    expect(result).toBeNull();
  });

  it('evaluateAnswer — 정답이면 correct=true', () => {
    const q = startAirportQuiz([])!;
    const result = evaluateAnswer(q, q.answerIndex);
    expect(result.correct).toBe(true);
    expect(result.explanation).toBe(q.explanation);
  });

  it('evaluateAnswer — 오답이면 correct=false', () => {
    const q = startAirportQuiz([])!;
    const wrongIdx = (q.answerIndex + 1) % 4;
    const result = evaluateAnswer(q, wrongIdx);
    expect(result.correct).toBe(false);
  });
});
