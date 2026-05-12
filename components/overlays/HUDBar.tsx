'use client';

import { useGameStore } from '@/store/gameStore';
import { TEMP_SAFE_MIN, TEMP_SAFE_MAX, TEMP_DANGER_LOW, TEMP_DANGER_HIGH } from '@/game/config';

function tempToPercent(temp: number): number {
  const total = TEMP_DANGER_HIGH - TEMP_DANGER_LOW;
  return ((TEMP_DANGER_HIGH - temp) / total) * 100;
}

function tempStatusLabel(temp: number): { label: string; color: string } {
  if (temp < TEMP_SAFE_MIN) return { label: '저체온 진입!', color: '#1c4e8c' };
  if (temp > TEMP_SAFE_MAX) return { label: '고체온 진입!', color: '#a02717' };
  return { label: '적정 (GOOD)', color: '#1a7a3a' };
}

export function HUDBar() {
  const temp = useGameStore(s => s.currentTemp);
  const vessel = useGameStore(s => s.vesselState);
  const sweat = useGameStore(s => s.sweatLevel);
  const thyroxine = useGameStore(s => s.thyroxineLevel);

  const status = tempStatusLabel(temp);
  const markerTopPct = tempToPercent(temp);

  return (
    <aside className="fixed right-0 top-0 h-screen w-[110px] bg-white/95 border-l border-black/10 p-2 flex flex-col gap-2 font-sans text-[12px]">
      <div className="text-center font-bold text-slate-800 pb-1 border-b border-black/5">내 몸 상태</div>

      {/* 체온 막대 */}
      <div className="flex gap-1 items-stretch h-[260px] px-0.5 relative">
        <div className="relative w-[22px] rounded-md border border-black/15"
             style={{
               background: `linear-gradient(180deg,
                 #c0392b 0%, #c0392b 22%,
                 #2ecc71 24%, #2ecc71 56%,
                 #4a90e2 58%, #4a90e2 100%)`
             }}>
          {/* 슬라이더 마커 */}
          <div className="absolute -left-2 -translate-y-1/2 w-0 h-0"
               style={{
                 top: `${markerTopPct}%`,
                 borderTop: '6px solid transparent',
                 borderBottom: '6px solid transparent',
                 borderLeft: '10px solid #1a1a1a',
               }} />
        </div>
        <div className="flex flex-col justify-between text-[10px] text-slate-600 leading-none">
          <span>40 —</span>
          <span>38 —</span>
          <span>37.5</span>
          <span>36.5</span>
          <span>35.5</span>
          <span>35 —</span>
          <span>33 —</span>
        </div>
      </div>

      {/* 수치 readout */}
      <div className="text-center py-1 font-bold" style={{ color: status.color }}>
        {temp.toFixed(1)}℃
        <span className="block text-[10px] font-medium text-slate-600">{status.label}</span>
      </div>

      {/* 보조 인디케이터 */}
      <div className="flex flex-col gap-1 pt-1 border-t border-black/5">
        <div className="flex items-center gap-1 bg-slate-50 rounded px-1.5 py-1">
          <span className="text-base">🩸</span>
          <span className="flex-1 text-slate-700">혈관</span>
          <span className="font-semibold text-slate-800">
            {vessel === 'constricted' ? '▼ 수축' : vessel === 'dilated' ? '▲ 확장' : '— 정상'}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 rounded px-1.5 py-1">
          <span className="text-base">💧</span>
          <span className="flex-1 text-slate-700">땀</span>
          <span className="w-7 h-1 bg-slate-200 rounded overflow-hidden">
            <span className="block h-full bg-sky-500" style={{ width: `${sweat}%` }} />
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 rounded px-1.5 py-1">
          <span className="text-base">⚗️</span>
          <span className="flex-1 text-slate-700">티록신</span>
          <span className="w-7 h-1 bg-slate-200 rounded overflow-hidden">
            <span className="block h-full bg-purple-500" style={{ width: `${thyroxine}%` }} />
          </span>
        </div>
      </div>
    </aside>
  );
}
