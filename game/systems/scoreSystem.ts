export interface ScoreInput {
  tempRetentionPct: number;   // 0~100
  quizFirstTryPct: number;    // 0~100
}

/**
 * 별점 산출 (스펙 §6.5). 초기값, 실제 플레이 후 튜닝 가능.
 */
export function computeStars(input: ScoreInput): 1 | 2 | 3 {
  const { tempRetentionPct, quizFirstTryPct } = input;
  if (tempRetentionPct >= 80 && quizFirstTryPct >= 100) return 3;
  if (tempRetentionPct >= 60 || quizFirstTryPct >= 66) return 2;
  return 1;
}

export function getEndingMessage(stars: 1 | 2 | 3): string {
  if (stars === 3) return '체온 유지의 달인! 항상성의 의미를 정확히 이해했어요.';
  if (stars === 2) return '체온 조절에 능숙하네요. 신경과 호르몬의 협동을 잘 활용했어요.';
  return '체온 조절은 어렵지만, 우리 몸은 끝까지 노력했어요. 다시 한 번 도전해 봐요!';
}
