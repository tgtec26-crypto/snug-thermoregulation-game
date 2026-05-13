'use client';

import { useGameStore } from '@/store/gameStore';
import { getCountriesByGroup } from '@/game/data/countries';
import type { Country } from '@/game/types';

export function ClassroomChoice() {
  const phase = useGameStore(s => s.phase);
  const chooseCold = useGameStore(s => s.chooseCold);
  const chooseHot = useGameStore(s => s.chooseHot);
  const setPhase = useGameStore(s => s.setPhase);

  // classroom_intro는 TeacherIntro 컴포넌트가 담당.

  if (phase === 'classroom_choose_cold' || phase === 'classroom_choose_hot') {
    const group = phase === 'classroom_choose_cold' ? 'cold' : 'hot';
    const choices = getCountriesByGroup(group);
    const title = group === 'cold' ? '추운 나라 선택' : '더운 나라 선택';

    const onPick = (c: Country) => {
      if (group === 'cold') {
        chooseCold(c);
        setPhase('classroom_rps_cold_intro');
      } else {
        chooseHot(c);
        setPhase('classroom_rps_hot');
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/50 backdrop-blur-[2px] px-6">
        <div
          className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl px-10 py-8 w-full max-w-[1100px] flex flex-col gap-6"
          style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
        >
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-amber-300 font-bold text-[36px] tracking-wide">{title}</h2>
            <p className="text-white/80 text-[20px]">두 곳 중 가고 싶은 곳을 골라봐요.</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {choices.map(c => {
              const cleanName = c.displayName.replace(c.flagEmoji + ' ', '');
              return (
                <button
                  key={c.id}
                  onClick={() => onPick(c.id)}
                  className="group bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-300 rounded-2xl p-5 flex flex-col items-center gap-4 transition shadow-lg"
                >
                  {/* 대표 이미지 — 불투명 */}
                  <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/30 shadow-inner bg-slate-900">
                    <img
                      src={c.previewImage}
                      alt={cleanName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-[26px] font-bold">{cleanName}</span>
                  </div>
                  <span className="text-white/60 text-sm">
                    {c.outdoorLabel} · {c.indoorLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'classroom_depart') {
    // ClassroomScene이 즉시 출구로 이동시키므로 모달 불필요. 간소한 토스트성 안내.
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white px-3 py-1.5 rounded-full text-sm">
        🎒 가방 챙기고 공항으로!
      </div>
    );
  }

  return null;
}
