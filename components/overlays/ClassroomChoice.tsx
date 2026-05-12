'use client';

import { useGameStore } from '@/store/gameStore';
import { getCountriesByGroup } from '@/game/data/countries';
import type { Country } from '@/game/types';

export function ClassroomChoice() {
  const phase = useGameStore(s => s.phase);
  const chooseCold = useGameStore(s => s.chooseCold);
  const chooseHot = useGameStore(s => s.chooseHot);
  const setPhase = useGameStore(s => s.setPhase);

  if (phase === 'classroom_intro') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
        <div className="bg-white rounded-xl p-6 shadow-lg w-[420px] flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-800">학급 회의가 시작됐어요</h2>
          <p className="text-slate-700">우리 반은 이번 수학여행에서 추운 나라 1곳과 더운 나라 1곳을 다녀오기로 했어요. 어디로 가고 싶은지 골라봅시다.</p>
          <button
            onClick={() => setPhase('classroom_choose_cold')}
            className="bg-sky-600 hover:bg-sky-700 text-white rounded py-2 font-semibold mt-2"
          >
            네, 시작할게요
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'classroom_choose_cold' || phase === 'classroom_choose_hot') {
    const group = phase === 'classroom_choose_cold' ? 'cold' : 'hot';
    const choices = getCountriesByGroup(group);
    const title = group === 'cold' ? '추운 나라 선택' : '더운 나라 선택';

    const onPick = (c: Country) => {
      if (group === 'cold') {
        chooseCold(c);
        setPhase('classroom_rps_cold');
      } else {
        chooseHot(c);
        setPhase('classroom_rps_hot');
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
        <div className="bg-white rounded-xl p-6 shadow-lg w-[420px] flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-slate-700">두 곳 중 가고 싶은 곳을 골라봐요.</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {choices.map(c => (
              <button
                key={c.id}
                onClick={() => onPick(c.id)}
                className="border border-slate-300 hover:border-sky-500 rounded-lg p-3 flex flex-col items-center gap-2 transition"
              >
                <span className="text-4xl">{c.flagEmoji}</span>
                <span className="text-sm text-slate-800 font-semibold text-center">{c.displayName.replace(c.flagEmoji + ' ', '')}</span>
              </button>
            ))}
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
