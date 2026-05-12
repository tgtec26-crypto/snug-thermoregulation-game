'use client';

import { useEffect, useState, useRef } from 'react';
import type { SceneNodes, WorldmapPaths, WorldmapRouteKey, KoreaBusPath } from '@/game/types';
import { bezierSvgPath } from '@/game/utils/bezier';

// ─── 노드 편집 ───────────────────────────────────────────────────────────────

const SCENES = [
  'classroom', 'airport_start',
  'airport_finland', 'airport_canada', 'airport_dubai', 'airport_egypt',
  'worldmap', 'ending',
  'country_finland_outdoor', 'country_finland_indoor',
  'country_canada_outdoor', 'country_canada_indoor',
  'country_dubai_outdoor', 'country_dubai_indoor',
  'country_egypt_outdoor', 'country_egypt_indoor',
];

const BG_BY_SCENE: Record<string, string> = {
  classroom:                 '/assets/backgrounds/classroom_start.png',
  airport_start:             '/assets/backgrounds/airport.png',
  airport_finland:           '/assets/backgrounds/airport.png',
  airport_canada:            '/assets/backgrounds/airport.png',
  airport_dubai:             '/assets/backgrounds/airport.png',
  airport_egypt:             '/assets/backgrounds/airport.png',
  worldmap:                  '/assets/backgrounds/world_map.png',
  ending:                    '/assets/backgrounds/ending.png',
  country_finland_outdoor:   '/assets/backgrounds/finland_lapland.png',
  country_finland_indoor:    '/assets/backgrounds/finland_sauna.png',
  country_canada_outdoor:    '/assets/backgrounds/canada_yellowknife.png',
  country_canada_indoor:     '/assets/backgrounds/canada_hotspring.png',
  country_dubai_outdoor:     '/assets/backgrounds/dubai_desert.png',
  country_dubai_indoor:      '/assets/backgrounds/dubai_ski.png',
  country_egypt_outdoor:     '/assets/backgrounds/egypt_pyramid.png',
  country_egypt_indoor:      '/assets/backgrounds/egypt_catacombs.png',
};

// ─── 경로 편집 ────────────────────────────────────────────────────────────────

const WORLDMAP_ROUTES: { key: WorldmapRouteKey; label: string }[] = [
  { key: 'korea_finland',  label: '한국 → 핀란드' },
  { key: 'korea_canada',   label: '한국 → 캐나다' },
  { key: 'finland_dubai',  label: '핀란드 → 두바이' },
  { key: 'finland_egypt',  label: '핀란드 → 이집트' },
  { key: 'canada_dubai',   label: '캐나다 → 두바이' },
  { key: 'canada_egypt',   label: '캐나다 → 이집트' },
  { key: 'dubai_korea',    label: '두바이 → 한국' },
  { key: 'egypt_korea',    label: '이집트 → 한국' },
];

const ROUTE_ENDPOINTS: Record<WorldmapRouteKey, { from: string; to: string }> = {
  korea_finland:  { from: 'korea',   to: 'finland' },
  korea_canada:   { from: 'korea',   to: 'canada'  },
  finland_dubai:  { from: 'finland', to: 'dubai'   },
  finland_egypt:  { from: 'finland', to: 'egypt'   },
  canada_dubai:   { from: 'canada',  to: 'dubai'   },
  canada_egypt:   { from: 'canada',  to: 'egypt'   },
  dubai_korea:    { from: 'dubai',   to: 'korea'   },
  egypt_korea:    { from: 'egypt',   to: 'korea'   },
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

type AdminMode = 'nodes' | 'paths';
type PathMode  = 'worldmap' | 'korea';

export default function AdminPage() {
  // ── 노드 편집 상태 ──
  const [scene, setScene]         = useState('classroom');
  const [nodeData, setNodeData]   = useState<SceneNodes | null>(null);
  const [nodeDrag, setNodeDrag]   = useState<string | null>(null);
  const nodeWrapRef               = useRef<HTMLDivElement>(null);
  const [nodeSaved, setNodeSaved] = useState(false);

  // 노드 추가 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId]     = useState('');
  const [newType, setNewType] = useState<'walk' | 'trigger' | 'exit'>('walk');

  // ── 경로 편집 상태 ──
  const [pathMode, setPathMode]         = useState<PathMode>('worldmap');
  const [selectedRoute, setSelectedRoute] = useState<WorldmapRouteKey>('korea_finland');
  const [worldmapPaths, setWorldmapPaths] = useState<WorldmapPaths | null>(null);
  const [worldmapNodes, setWorldmapNodes] = useState<SceneNodes | null>(null);
  const [koreaPaths, setKoreaPaths]       = useState<KoreaBusPath | null>(null);
  const [pathDrag, setPathDrag]           = useState<string | null>(null);
  const pathWrapRef                       = useRef<HTMLDivElement>(null);
  const [pathSaved, setPathSaved]         = useState(false);

  // ── 공통 ──
  const [mode, setMode] = useState<AdminMode>('nodes');

  // 노드 데이터 로드
  useEffect(() => {
    if (mode !== 'nodes') return;
    fetch(`/data/nodes-${scene}.json`).then(r => r.json()).then(setNodeData);
  }, [scene, mode]);

  // 경로 데이터 로드
  useEffect(() => {
    if (mode !== 'paths') return;
    fetch('/data/paths-worldmap.json').then(r => r.json()).then(setWorldmapPaths);
    fetch('/data/nodes-worldmap.json').then(r => r.json()).then(setWorldmapNodes);
    fetch('/data/paths-korea.json').then(r => r.json()).then(setKoreaPaths);
  }, [mode]);

  // ── 노드 편집 핸들러 ──
  const onNodeMouseMove = (e: React.MouseEvent) => {
    if (!nodeDrag || !nodeData || !nodeWrapRef.current) return;
    const rect = nodeWrapRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1280 / rect.width));
    const y = Math.round((e.clientY - rect.top)  * (800  / rect.height));
    setNodeData({ ...nodeData, nodes: nodeData.nodes.map(n => n.id === nodeDrag ? { ...n, x, y } : n) });
  };

  const addNode = () => {
    const id = newId.trim();
    if (!id || !nodeData) return;
    if (nodeData.nodes.some(n => n.id === id)) {
      alert(`이미 존재하는 id: "${id}"`);
      return;
    }
    setNodeData({
      ...nodeData,
      nodes: [...nodeData.nodes, { id, x: 640, y: 400, type: newType }],
    });
    setNewId('');
    setShowAddForm(false);
  };

  const saveNodes = async () => {
    if (!nodeData) return;
    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, payload: nodeData }),
    });
    if (res.ok) { setNodeSaved(true); setTimeout(() => setNodeSaved(false), 1500); }
    else alert('저장 실패: ' + await res.text());
  };

  // ── 경로 편집 핸들러 ──
  const onPathMouseMove = (e: React.MouseEvent) => {
    if (!pathDrag || !pathWrapRef.current) return;
    const rect = pathWrapRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1280 / rect.width));
    const y = Math.round((e.clientY - rect.top)  * (800  / rect.height));

    if (pathMode === 'worldmap' && worldmapPaths) {
      const cur = worldmapPaths[selectedRoute];
      setWorldmapPaths({
        ...worldmapPaths,
        [selectedRoute]: {
          cp1: pathDrag === 'cp1' ? { x, y } : cur.cp1,
          cp2: pathDrag === 'cp2' ? { x, y } : cur.cp2,
        },
      });
    } else if (pathMode === 'korea' && koreaPaths) {
      setKoreaPaths({ ...koreaPaths, [pathDrag]: { x, y } });
    }
  };

  const savePaths = async () => {
    const pathType = pathMode;
    const payload  = pathMode === 'worldmap' ? worldmapPaths : koreaPaths;
    if (!payload) return;
    const res = await fetch('/api/paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathType, payload }),
    });
    if (res.ok) { setPathSaved(true); setTimeout(() => setPathSaved(false), 1500); }
    else alert('저장 실패: ' + await res.text());
  };

  // ── 헬퍼 ──
  const pct = (v: number, max: number) => `${(v / max) * 100}%`;

  const getWorldmapEndpoints = () => {
    if (!worldmapNodes || !worldmapPaths) return null;
    const ep = ROUTE_ENDPOINTS[selectedRoute];
    const p0 = worldmapNodes.nodes.find(n => n.id === ep.from);
    const p1 = worldmapNodes.nodes.find(n => n.id === ep.to);
    const cps = worldmapPaths[selectedRoute];
    if (!p0 || !p1) return null;
    return { p0, p1, ...cps };
  };

  // ── 렌더 ─────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 flex flex-col gap-4">
      {/* 모드 탭 */}
      <header className="flex items-center gap-2">
        <h1 className="text-xl font-bold mr-2">Admin</h1>
        {(['nodes', 'paths'] as AdminMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded text-sm ${mode === m ? 'bg-sky-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {m === 'nodes' ? '노드 편집' : '경로 편집'}
          </button>
        ))}
      </header>

      {/* ── 노드 편집 ──────────────────────────────────────────────────────── */}
      {mode === 'nodes' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={scene}
              onChange={e => { setScene(e.target.value); setShowAddForm(false); }}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1"
            >
              {SCENES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded"
            >
              + 노드 추가
            </button>
            <button onClick={saveNodes} className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded">저장</button>
            {nodeSaved && <span className="text-green-400">✅ 저장 완료</span>}
          </div>

          {/* 노드 추가 폼 */}
          {showAddForm && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded px-3 py-2 w-fit">
              <input
                type="text"
                placeholder="노드 id (예: npc_1)"
                value={newId}
                onChange={e => setNewId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNode()}
                className="bg-slate-700 border border-slate-500 rounded px-2 py-1 text-sm w-44 focus:outline-none focus:border-sky-400"
                autoFocus
              />
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as 'walk' | 'trigger' | 'exit')}
                className="bg-slate-700 border border-slate-500 rounded px-2 py-1 text-sm"
              >
                <option value="walk">walk</option>
                <option value="trigger">trigger</option>
                <option value="exit">exit</option>
              </select>
              <button
                onClick={addNode}
                disabled={!newId.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-3 py-1 rounded text-sm"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white text-sm px-2"
              >
                취소
              </button>
              <span className="text-slate-400 text-xs">추가 후 캔버스에서 드래그로 위치 조정</span>
            </div>
          )}

          <div
            ref={nodeWrapRef}
            className="relative border border-slate-600 mx-auto"
            style={{ width: '100%', maxWidth: 1280, aspectRatio: '16 / 10' }}
            onMouseMove={onNodeMouseMove}
            onMouseUp={() => setNodeDrag(null)}
            onMouseLeave={() => setNodeDrag(null)}
          >
            <img
              src={BG_BY_SCENE[scene]}
              alt=""
              className="absolute inset-0 w-full h-full object-fill"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-slate-200/40" />
            {nodeData?.nodes.map(n => (
              <div
                key={n.id}
                onMouseDown={e => { e.preventDefault(); setNodeDrag(n.id); }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                style={{ left: pct(n.x, 1280), top: pct(n.y, 800) }}
              >
                <div className={`w-6 h-6 rounded-full border-2 border-white shadow-md ${
                  n.type === 'trigger' ? 'bg-yellow-400' : n.type === 'exit' ? 'bg-green-400' : 'bg-slate-400'
                }`} />
                <div className="text-xs bg-black/70 text-white px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
                  {n.id} ({n.x}, {n.y})
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-400 mx-auto">
            노드를 드래그해서 위치 조정 후 &quot;저장&quot;. 노란=trigger, 녹색=exit, 회색=walk.
          </p>
        </>
      )}

      {/* ── 경로 편집 ──────────────────────────────────────────────────────── */}
      {mode === 'paths' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            {(['worldmap', 'korea'] as PathMode[]).map(pm => (
              <button
                key={pm}
                onClick={() => setPathMode(pm)}
                className={`px-3 py-1 rounded text-sm ${pathMode === pm ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                {pm === 'worldmap' ? '세계지도 비행 경로' : '버스 경로(한국)'}
              </button>
            ))}
            {pathMode === 'worldmap' && (
              <select
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value as WorldmapRouteKey)}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1"
              >
                {WORLDMAP_ROUTES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            )}
            <button onClick={savePaths} className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded ml-auto">저장</button>
            {pathSaved && <span className="text-green-400">✅ 저장 완료</span>}
          </div>

          <div
            ref={pathWrapRef}
            className="relative border border-slate-600 mx-auto select-none"
            style={{ width: '100%', maxWidth: 1280, aspectRatio: '16 / 10' }}
            onMouseMove={onPathMouseMove}
            onMouseUp={() => setPathDrag(null)}
            onMouseLeave={() => setPathDrag(null)}
          >
            {/* 배경 */}
            <img
              src={pathMode === 'worldmap' ? '/assets/backgrounds/world_map.png' : '/assets/backgrounds/school_to_airport.png'}
              alt=""
              className="absolute inset-0 w-full h-full object-fill"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-slate-200/30" />

            {/* ── 세계지도 경로 ── */}
            {pathMode === 'worldmap' && (() => {
              const ep = getWorldmapEndpoints();
              if (!ep) return null;
              const { p0, p1, cp1, cp2 } = ep;
              const svgPath = bezierSvgPath(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);

              return (
                <>
                  {/* SVG 곡선 오버레이 */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1280 800" preserveAspectRatio="none">
                    {/* 모든 경로 회색으로 표시 */}
                    {worldmapPaths && WORLDMAP_ROUTES.map(r => {
                      if (r.key === selectedRoute) return null;
                      const ep2 = ROUTE_ENDPOINTS[r.key];
                      const n0 = worldmapNodes?.nodes.find(n => n.id === ep2.from);
                      const n1 = worldmapNodes?.nodes.find(n => n.id === ep2.to);
                      const c = worldmapPaths[r.key];
                      if (!n0 || !n1) return null;
                      return (
                        <path key={r.key}
                          d={bezierSvgPath(n0.x, n0.y, c.cp1.x, c.cp1.y, c.cp2.x, c.cp2.y, n1.x, n1.y)}
                          stroke="#ffffff44" strokeWidth="1.5" fill="none" strokeDasharray="4 3"
                        />
                      );
                    })}
                    {/* 선택 경로 주황 */}
                    <path d={svgPath} stroke="#ff9900" strokeWidth="2.5" fill="none" strokeDasharray="6 3" />
                    {/* CP 연결선 */}
                    <line x1={p0.x} y1={p0.y} x2={cp1.x} y2={cp1.y} stroke="#ff990066" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1={p1.x} y1={p1.y} x2={cp2.x} y2={cp2.y} stroke="#ff990066" strokeWidth="1.5" strokeDasharray="3 2" />
                  </svg>

                  {/* 국가 노드 (고정) */}
                  {worldmapNodes?.nodes.map(n => (
                    <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ left: pct(n.x, 1280), top: pct(n.y, 800) }}>
                      <div className="w-4 h-4 rounded-full bg-white/70 border border-white shadow" />
                      <div className="text-[10px] bg-black/60 text-white px-1 rounded mt-0.5 whitespace-nowrap">{n.label ?? n.id}</div>
                    </div>
                  ))}

                  {/* cp1 드래그 핸들 */}
                  <div
                    onMouseDown={e => { e.preventDefault(); setPathDrag('cp1'); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                    style={{ left: pct(cp1.x, 1280), top: pct(cp1.y, 800) }}
                  >
                    <div className="w-5 h-5 bg-orange-400 border-2 border-white shadow-lg rotate-45" />
                    <div className="text-[10px] bg-black/70 text-white px-1 rounded mt-1 whitespace-nowrap">cp1 ({cp1.x},{cp1.y})</div>
                  </div>

                  {/* cp2 드래그 핸들 */}
                  <div
                    onMouseDown={e => { e.preventDefault(); setPathDrag('cp2'); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                    style={{ left: pct(cp2.x, 1280), top: pct(cp2.y, 800) }}
                  >
                    <div className="w-5 h-5 bg-yellow-400 border-2 border-white shadow-lg rotate-45" />
                    <div className="text-[10px] bg-black/70 text-white px-1 rounded mt-1 whitespace-nowrap">cp2 ({cp2.x},{cp2.y})</div>
                  </div>
                </>
              );
            })()}

            {/* ── 버스 경로(한국) ── */}
            {pathMode === 'korea' && koreaPaths && (() => {
              const { school, airport, cp1, cp2 } = koreaPaths;
              const svgPath = bezierSvgPath(school.x, school.y, cp1.x, cp1.y, cp2.x, cp2.y, airport.x, airport.y);

              return (
                <>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1280 800" preserveAspectRatio="none">
                    <path d={svgPath} stroke="#22dd88" strokeWidth="2.5" fill="none" strokeDasharray="6 3" />
                    <line x1={school.x}  y1={school.y}  x2={cp1.x} y2={cp1.y} stroke="#22dd8866" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1={airport.x} y1={airport.y} x2={cp2.x} y2={cp2.y} stroke="#22dd8866" strokeWidth="1.5" strokeDasharray="3 2" />
                  </svg>

                  {/* school */}
                  <div onMouseDown={e => { e.preventDefault(); setPathDrag('school'); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                    style={{ left: pct(school.x, 1280), top: pct(school.y, 800) }}>
                    <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white shadow-lg" />
                    <div className="text-[10px] bg-black/70 text-white px-1 rounded mt-1 whitespace-nowrap">학교 ({school.x},{school.y})</div>
                  </div>

                  {/* airport */}
                  <div onMouseDown={e => { e.preventDefault(); setPathDrag('airport'); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                    style={{ left: pct(airport.x, 1280), top: pct(airport.y, 800) }}>
                    <div className="w-6 h-6 rounded-full bg-purple-400 border-2 border-white shadow-lg" />
                    <div className="text-[10px] bg-black/70 text-white px-1 rounded mt-1 whitespace-nowrap">공항 ({airport.x},{airport.y})</div>
                  </div>

                  {/* cp1 */}
                  <div onMouseDown={e => { e.preventDefault(); setPathDrag('cp1'); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                    style={{ left: pct(cp1.x, 1280), top: pct(cp1.y, 800) }}>
                    <div className="w-5 h-5 bg-orange-400 border-2 border-white shadow-lg rotate-45" />
                    <div className="text-[10px] bg-black/70 text-white px-1 rounded mt-1 whitespace-nowrap">cp1 ({cp1.x},{cp1.y})</div>
                  </div>

                  {/* cp2 */}
                  <div onMouseDown={e => { e.preventDefault(); setPathDrag('cp2'); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
                    style={{ left: pct(cp2.x, 1280), top: pct(cp2.y, 800) }}>
                    <div className="w-5 h-5 bg-yellow-400 border-2 border-white shadow-lg rotate-45" />
                    <div className="text-[10px] bg-black/70 text-white px-1 rounded mt-1 whitespace-nowrap">cp2 ({cp2.x},{cp2.y})</div>
                  </div>
                </>
              );
            })()}
          </div>

          <p className="text-sm text-slate-400 mx-auto">
            {pathMode === 'worldmap'
              ? '🔶 주황 다이아몬드(cp1·cp2)를 드래그해 베지어 곡선 조정 → 저장'
              : '🔵 파란=학교, 보라=공항 (위치 조정 가능), 🔶 다이아몬드=제어점 → 저장'}
          </p>
        </>
      )}
    </main>
  );
}
