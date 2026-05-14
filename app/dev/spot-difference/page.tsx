'use client';

import { useState } from 'react';
import { SpotTheDifference } from '@/components/overlays/minigames/SpotTheDifference';

export default function SpotDifferenceTestPage() {
  const [runId, setRunId] = useState(0);
  const [last, setLast] = useState<{ success: boolean; score: number } | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <SpotTheDifference
        key={runId}
        onFinish={(r) => setLast(r)}
      />

      {last && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur">
          <h2 className="text-4xl font-bold">{last.success ? '🎉 성공' : '⏰ 실패'}</h2>
          <p className="text-xl">찾은 차이: <span className="text-cyan-300 font-bold">{last.score}</span></p>
          <button
            onClick={() => { setLast(null); setRunId(n => n + 1); }}
            className="bg-cyan-500 hover:bg-cyan-600 px-8 py-3 rounded-full text-lg font-bold shadow-xl"
          >
            🔄 다시 시작
          </button>
          <p className="text-xs text-slate-400">URL: /dev/spot-difference (테스트 전용)</p>
        </div>
      )}
    </div>
  );
}
