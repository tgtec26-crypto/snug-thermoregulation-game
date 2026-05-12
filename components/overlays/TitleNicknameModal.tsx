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

  // 하단 중앙에 input + 버튼 한 줄. 배경 이미지를 거의 가리지 않도록 컴팩트.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-10 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-3 py-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
          maxLength={10}
          placeholder="이름을 입력하세요"
          className="w-56 bg-transparent border-0 outline-none px-3 py-1 text-slate-800 placeholder:text-slate-400"
          autoFocus
        />
        <button
          onClick={handleStart}
          disabled={value.trim().length < 1}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-full px-4 py-1.5 font-semibold text-sm"
        >
          시작
        </button>
      </div>
    </div>
  );
}
