'use client';

import { useEffect, useState, useRef } from 'react';
import type { SceneNodes } from '@/game/types';

const SCENES = [
  'classroom', 'airport_start',
  'airport_finland', 'airport_canada', 'airport_dubai', 'airport_egypt',
  'worldmap', 'ending',
  'country_finland_outdoor', 'country_finland_indoor',
  'country_canada_outdoor', 'country_canada_indoor',
  'country_dubai_outdoor', 'country_dubai_indoor',
  'country_egypt_outdoor', 'country_egypt_indoor',
];

const BG_KEYS_BY_SCENE: Record<string, string> = SCENES.reduce((acc, s) => ({
  ...acc, [s]: `/assets/backgrounds/${s}.png`
}), {});

export default function AdminPage() {
  const [scene, setScene] = useState('classroom');
  const [data, setData] = useState<SceneNodes | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/data/nodes-${scene}.json`)
      .then(r => r.json())
      .then(setData);
  }, [scene]);

  const save = async () => {
    if (!data) return;
    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, payload: data }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      alert('저장 실패: ' + (await res.text()));
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !data || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1280 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (800 / rect.height));
    setData({
      ...data,
      nodes: data.nodes.map(n => n.id === dragging ? { ...n, x, y } : n),
    });
  };

  if (!data) return <div className="p-8 text-white">Loading…</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-bold">노드 좌표 편집기</h1>
        <select
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded px-2 py-1"
        >
          {SCENES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={save} className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded">
          저장
        </button>
        {saved && <span className="text-green-400">✅ 저장 완료</span>}
      </header>

      <div
        ref={wrapRef}
        className="relative border border-slate-600 mx-auto"
        style={{ width: '100%', maxWidth: 1280, aspectRatio: '16 / 10' }}
        onMouseMove={onMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        {/* 배경 — 자산이 없으면 hidden */}
        <img
          src={BG_KEYS_BY_SCENE[scene]}
          alt=""
          className="absolute inset-0 w-full h-full object-fill"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-slate-200/40" />

        {/* 노드 */}
        {data.nodes.map(n => (
          <div
            key={n.id}
            onMouseDown={(e) => { e.preventDefault(); setDragging(n.id); }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
            style={{ left: `${(n.x / 1280) * 100}%`, top: `${(n.y / 800) * 100}%` }}
          >
            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-md ${
              n.type === 'trigger' ? 'bg-yellow-400' :
              n.type === 'exit' ? 'bg-green-400' : 'bg-slate-400'
            }`} />
            <div className="text-xs bg-black/70 text-white px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
              {n.id} ({n.x}, {n.y})
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-400 mx-auto">
        노드를 드래그해서 위치 조정 후 &quot;저장&quot; 클릭. 노란 = trigger, 녹색 = exit, 회색 = walk.
      </p>
    </main>
  );
}
