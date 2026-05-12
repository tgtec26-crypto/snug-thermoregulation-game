'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getCountriesByGroup, getCountryById } from '@/game/data/countries';
import type { Country, RPSChoice, RPSResult } from '@/game/types';

function judge(player: RPSChoice, npc: RPSChoice): RPSResult {
  if (player === npc) return 'draw';
  if (
    (player === 'rock' && npc === 'scissors') ||
    (player === 'paper' && npc === 'rock') ||
    (player === 'scissors' && npc === 'paper')
  ) return 'win';
  return 'lose';
}

const CHOICES: { id: RPSChoice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '✊', label: '바위' },
  { id: 'paper', emoji: '✋', label: '보' },
  { id: 'scissors', emoji: '✌️', label: '가위' },
];

export function RPSModal() {
  const phase = useGameStore(s => s.phase);
  const chosenCold = useGameStore(s => s.chosenCold);
  const chosenHot = useGameStore(s => s.chosenHot);
  const setPhase = useGameStore(s => s.setPhase);
  const setActualCountries = useGameStore(s => s.setActualCountries);
  const [npcChoice, setNpcChoice] = useState<RPSChoice | null>(null);
  const [result, setResult] = useState<RPSResult | null>(null);

  if (phase !== 'classroom_rps_cold' && phase !== 'classroom_rps_hot') return null;

  const group = phase === 'classroom_rps_cold' ? 'cold' : 'hot';
  const chosen = group === 'cold' ? chosenCold : chosenHot;
  if (!chosen) return null;

  // NPC가 고른 나라 = 같은 group에서 학생이 안 고른 나라
  const npcCountry: Country = getCountriesByGroup(group).find(c => c.id !== chosen)!.id;
  const npcCountryCfg = getCountryById(npcCountry)!;

  const play = (player: RPSChoice) => {
    const npc = CHOICES[Math.floor(Math.random() * 3)].id;
    const r = judge(player, npc);
    setNpcChoice(npc);
    setResult(r);
  };

  const proceed = () => {
    if (!result) return;
    if (result === 'draw') {
      setNpcChoice(null);
      setResult(null);
      return;
    }
    const winnerCountry: Country = result === 'win' ? chosen : npcCountry;

    if (group === 'cold') {
      // 임시 저장: actualCold만 결정. actualHot은 다음 단계에서 갱신.
      setActualCountries(winnerCountry, useGameStore.getState().actualHot ?? winnerCountry);
      setPhase('classroom_choose_hot');
    } else {
      const finalCold = useGameStore.getState().actualCold!;
      setActualCountries(finalCold, winnerCountry);
      setPhase('classroom_depart');
    }
    setNpcChoice(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[460px] flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          {npcCountryCfg.rpsNpcName}와의 가위바위보 — {group === 'cold' ? '추운 나라' : '더운 나라'} 결정
        </h2>
        <p className="text-slate-700 text-sm">
          {npcCountryCfg.rpsNpcName}: &quot;나는 {npcCountryCfg.displayName} 가고 싶어! 가위바위보로 정하자!&quot;
        </p>

        {!result ? (
          <div className="grid grid-cols-3 gap-3 mt-2">
            {CHOICES.map(c => (
              <button
                key={c.id}
                onClick={() => play(c.id)}
                className="border border-slate-300 hover:border-sky-500 rounded-lg p-4 flex flex-col items-center gap-1 transition"
              >
                <span className="text-4xl">{c.emoji}</span>
                <span className="text-sm font-semibold text-slate-800">{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mt-2">
            <p className="text-slate-700">{npcCountryCfg.rpsNpcName}: {CHOICES.find(c => c.id === npcChoice)!.emoji}</p>
            <p className="text-2xl font-bold" style={{ color: result === 'win' ? '#1a7a3a' : result === 'lose' ? '#a02717' : '#5a6c7d' }}>
              {result === 'win' ? '🎉 이겼다!' : result === 'lose' ? '😢 졌다…' : '😅 비겼다, 다시!'}
            </p>
            <button onClick={proceed} className="bg-sky-600 hover:bg-sky-700 text-white rounded py-2 px-6 font-semibold">
              {result === 'draw' ? '다시 하기' : '다음 단계로'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
