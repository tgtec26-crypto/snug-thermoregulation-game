'use client';

import { useGameStore } from '@/store/gameStore';
import { computeStars, getEndingMessage } from '@/game/systems/scoreSystem';

export function EndingCard() {
  const phase = useGameStore(s => s.phase);
  const nickname = useGameStore(s => s.nickname);
  const inSafe = useGameStore(s => s.inSafeZoneTicks);
  const total = useGameStore(s => s.totalTicks);
  const firstCorrect = useGameStore(s => s.airportQuizFirstCorrect);
  const reset = useGameStore(s => s.reset);

  if (phase !== 'ending') return null;

  const tempRetentionPct = total > 0 ? (inSafe / total) * 100 : 0;
  // 첫시도 정답률: 3공항 모두 도전했다고 가정하면 분모 3
  const quizFirstTryPct = (firstCorrect / 3) * 100;

  const stars = computeStars({ tempRetentionPct, quizFirstTryPct });
  const message = getEndingMessage(stars);

  const starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/50">
      <div className="bg-white rounded-2xl p-8 shadow-xl w-[560px] flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-800 text-center">수학여행 끝!</h1>
        <p className="text-center text-slate-600 text-sm">{nickname}의 결과</p>

        <div className="text-5xl text-center my-2 tracking-widest">{starRow}</div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded p-3">
            <div className="text-slate-500">🌡️ 체온 유지율</div>
            <div className="text-2xl font-bold text-slate-800">{tempRetentionPct.toFixed(0)}%</div>
          </div>
          <div className="bg-slate-50 rounded p-3">
            <div className="text-slate-500">✈️ 공항 퀴즈 첫 시도</div>
            <div className="text-2xl font-bold text-slate-800">{firstCorrect}/3 ({quizFirstTryPct.toFixed(0)}%)</div>
          </div>
        </div>

        <p className="text-slate-800 mt-2">{message}</p>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-slate-700">
          💡 <strong>오늘 배운 것:</strong> 우리 몸은 추워도 더워도 일정한 체온을 유지하려 해요. 이걸 <strong>항상성</strong>이라고 해요.
          체온뿐 아니라 <strong>혈당량</strong>·<strong>수분량</strong>도 같은 원리로 일정하게 유지된답니다.
        </div>

        <button
          onClick={reset}
          className="bg-sky-600 hover:bg-sky-700 text-white rounded py-2 font-semibold mt-2"
        >
          처음부터 다시 하기
        </button>
      </div>
    </div>
  );
}
