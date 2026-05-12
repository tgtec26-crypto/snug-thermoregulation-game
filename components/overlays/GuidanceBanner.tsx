'use client';

import { useGameStore } from '@/store/gameStore';

/**
 * 영구 안내 배너 — 화면 상단 중앙에 prominent 하게 표시. 자동 사라짐 X.
 * 토스트(짧은 알림)와 별개. 명시적으로 setGuidance('')로 지울 때까지 유지.
 */
export function GuidanceBanner() {
  const guidance = useGameStore(s => s.guidance);
  if (!guidance) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-6 -translate-x-1/2 z-30">
      <div className="bg-slate-900/85 text-white text-lg md:text-xl font-semibold px-5 py-2.5 rounded-full shadow-2xl border border-white/20 whitespace-nowrap">
        {guidance}
      </div>
    </div>
  );
}
