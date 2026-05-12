'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MINIGAME_SUCCESS_DELTA } from '@/game/config';
import type { Phase } from '@/game/types';

const COUNTRY_PHASES = new Set<Phase>([
  'country_1_outdoor', 'country_1_indoor',
  'country_2_outdoor', 'country_2_indoor',
]);

type MinigameKind = 'shiver' | 'sweat';

export function MinigameModal() {
  const phase = useGameStore(s => s.phase);
  const adjustTemp = useGameStore(s => s.adjustTemp);
  const showToast = useGameStore(s => s.showToast);

  const [active, setActive] = useState(false);
  const [kind, setKind] = useState<MinigameKind>('shiver');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const kindRef = useRef<MinigameKind>('shiver');

  // phase 변화에 따라 미니게임 자동 시작 (phase 진입 시 한 번)
  useEffect(() => {
    if (!COUNTRY_PHASES.has(phase)) {
      setActive(false);
      return;
    }
    // 환경에 맞춰 미니게임 종류 결정 (cold_outdoor=shiver, cold_indoor=sweat, hot_outdoor=sweat, hot_indoor=shiver)
    const isShiver = phase === 'country_1_outdoor' || phase === 'country_2_indoor';
    setKind(isShiver ? 'shiver' : 'sweat');
    kindRef.current = isShiver ? 'shiver' : 'sweat';
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(8);
    setActive(true);
  }, [phase]);

  // 타이머
  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const tap = () => {
    if (!active) return;
    scoreRef.current += 1;
    setScore(scoreRef.current);
  };

  const finish = () => {
    setActive(false);
    const success = scoreRef.current >= 10;
    if (success) {
      const isCooling = kindRef.current === 'sweat'; // 땀 닦기 = 더위 → 식힘
      adjustTemp(isCooling ? -MINIGAME_SUCCESS_DELTA : +MINIGAME_SUCCESS_DELTA);
      showToast(kindRef.current === 'shiver' ? '💪 떨림으로 열 발생! 체온 회복' : '💧 땀 발산! 체온 회복');
    } else {
      showToast('아쉽! 다음 단계로 갑니다');
    }
  };

  if (!active) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[520px] flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          {kind === 'shiver' ? '🥶 떨림 리듬 — 추위 반응!' : '💦 땀 닦기 — 더위 반응!'}
        </h2>
        <p className="text-sm text-slate-600">
          {kind === 'shiver'
            ? '아래 버튼을 빠르게 두드려서 떨림으로 열을 만들어요. 10번 이상 두드리면 체온 회복.'
            : '아래 버튼을 빠르게 두드려서 땀을 발산해요. 10번 이상 두드리면 체온 회복.'}
        </p>

        <button
          onClick={tap}
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xl font-bold rounded-lg py-8 select-none"
        >
          {kind === 'shiver' ? '🥶 떨림!' : '💧 닦기!'}
        </button>

        <div className="flex justify-between text-sm">
          <span className="text-slate-600">탭 횟수: <strong className="text-slate-900">{score}</strong></span>
          <span className="text-slate-600">남은 시간: <strong className="text-slate-900">{timeLeft}초</strong></span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded overflow-hidden">
          <div className="h-full bg-sky-500" style={{ width: `${Math.min((score/10)*100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
