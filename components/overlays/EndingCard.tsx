'use client';

import { useGameStore } from '@/store/gameStore';

export function EndingCard() {
  const phase = useGameStore(s => s.phase);
  const reset = useGameStore(s => s.reset);

  if (phase !== 'ending') return null;

  return (
    <div
      className="absolute inset-0 z-40"
      style={{
        backgroundImage: `url('/assets/backgrounds/ending.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 하단 1줄 대화창 오버레이 */}
      <div className="absolute inset-x-0 bottom-0 pb-6">
        <div className="relative mx-auto w-full max-w-[1200px] px-6">
          <div
            className="relative bg-black/70 backdrop-blur-sm text-white rounded-2xl px-6 py-[14px] shadow-2xl border border-white/20"
            style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
          >
            <p
              className="leading-relaxed text-center text-[31px]"
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              여러분의 체온이 어떻게 조절되는지 배웠습니다. 잊어버리지 않도록 잘 기억합시다.
            </p>

            {/* 우측 상단 '다시 하기' 버튼 */}
            <button
              onClick={reset}
              className="absolute right-4 bg-indigo-900 hover:bg-indigo-950 text-white font-bold px-7 py-3 rounded-full shadow-lg border-2 border-white/40 text-[25px] transition-colors"
              style={{ top: -74 }}
            >
              다시 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
