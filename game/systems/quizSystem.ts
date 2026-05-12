import type { QuizQuestion } from '@/game/types';
import { drawQuiz } from '@/game/data/quizPool';

export interface QuizEvaluation {
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

/**
 * 공항 퀴즈 출제: attemptedIds에 없는 문제 1개를 무작위 반환.
 * 더 출제할 문제가 없으면 null (이론상 풀이 다 떨어진 경우, 학생이 너무 많이 틀린 케이스).
 */
export function startAirportQuiz(attemptedIds: string[]): QuizQuestion | null {
  return drawQuiz(attemptedIds);
}

/**
 * 학생 답안 채점.
 */
export function evaluateAnswer(q: QuizQuestion, chosenIndex: number): QuizEvaluation {
  return {
    correct: chosenIndex === q.answerIndex,
    correctIndex: q.answerIndex,
    explanation: q.explanation,
  };
}
