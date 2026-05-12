'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export function TitleNicknameModal() {
  const phase = useGameStore(s => s.phase);
  const setNickname = useGameStore(s => s.setNickname);
  const setPhase = useGameStore(s => s.setPhase);
  const [value, setValue] = useState('');

  if (phase !== 'title') return null;

  const handleStart = () => {
    const trimmed = value.trim();
    if (trimmed.length < 1) return;
    setNickname(trimmed);
    setPhase('classroom_intro');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/30">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[360px] flex flex-col gap-3">
        <h2 className="text-xl font-bold text-slate-800">이름을 입력해주세요</h2>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
          maxLength={10}
          placeholder="예) 태형"
          className="border border-slate-300 rounded px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
          autoFocus
        />
        <button
          onClick={handleStart}
          disabled={value.trim().length < 1}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded py-2 font-semibold"
        >
          수학여행 시작
        </button>
      </div>
    </div>
  );
}
