'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { MinigameResult } from '../MinigameModal';

/**
 * 스키장(더2 실내) — 다른 그림 찾기.
 * 왼쪽: 직전 사막에서의 더위 반응 인체.
 * 오른쪽: 실내 스키장에서의 추위 반응 인체.
 * 두 그림에서 다른 부분 5가지를 찾아 클릭.
 */

const PANEL_W = 320;
const PANEL_H = 320;
const TIME_LIMIT_SEC = 90;
const DIFF_TARGET = 5;

interface Diff {
  id: string;
  panel: 'left' | 'right';
  x: number;     // 패널 내 좌표
  y: number;
  emoji: string;
  fontSize: number;
  label: string;   // 발견 후 표시 라벨
}

const DIFFS: Diff[] = [
  { id: 'sweat',   panel: 'left',  x: 80,  y: 100, emoji: '💧', fontSize: 36, label: '땀' },
  { id: 'fan',     panel: 'left',  x: 230, y: 180, emoji: '🪭', fontSize: 40, label: '부채' },
  { id: 'shiver',  panel: 'right', x: 100, y: 150, emoji: '〰️', fontSize: 32, label: '떨림' },
  { id: 'breath',  panel: 'right', x: 220, y: 80,  emoji: '💨', fontSize: 38, label: '입김' },
  { id: 'gooseb',  panel: 'right', x: 150, y: 230, emoji: '🟣', fontSize: 22, label: '소름' },
];

interface Props {
  onFinish: (result: MinigameResult) => void;
}

export function SpotTheDifference({ onFinish }: Props) {
  const adjustTemp = useGameStore(s => s.adjustTemp);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [wrongFlash, setWrongFlash] = useState<{ x: number; y: number; panel: 'left' | 'right'; key: number } | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const finishedRef = useRef(false);

  const finish = useCallback((success: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    setTimeout(() => onFinish({ success, score: found.size }), 800);
  }, [onFinish, found.size]);

  // 타이머
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          finish(found.size >= DIFF_TARGET);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, finished, finish, found.size]);

  // 추운 실내 → 체온 자동 하강 (약하게)
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => adjustTemp(-0.03), 250);
    return () => clearInterval(id);
  }, [started, finished, adjustTemp]);

  // 모두 찾으면 성공
  useEffect(() => {
    if (found.size >= DIFF_TARGET && started && !finished) {
      finish(true);
    }
  }, [found, started, finished, finish]);

  const onClickDiff = (d: Diff) => {
    if (finished) return;
    if (found.has(d.id)) return;
    setFound(prev => {
      const next = new Set(prev);
      next.add(d.id);
      return next;
    });
    adjustTemp(-0.1);   // 정답 → 체온 회복
  };

  const onPanelClick = (e: React.MouseEvent<HTMLDivElement>, panel: 'left' | 'right') => {
    if (finished) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // diff 영역 클릭은 onClickDiff(이벤트 버블)로 처리됨. 빈 곳 클릭 = 오답.
    setWrongCount(c => c + 1);
    setWrongFlash({ x, y, panel, key: Date.now() });
  };

  // wrongFlash fade
  useEffect(() => {
    if (!wrongFlash) return;
    const id = setTimeout(() => setWrongFlash(null), 500);
    return () => clearTimeout(id);
  }, [wrongFlash]);

  // 인체 SVG (간단) — 공통 figure
  const Figure = ({ skinColor }: { skinColor: string }) => (
    <svg width="120" height="200" viewBox="0 0 60 100" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
      <circle cx="30" cy="15" r="11" fill={skinColor} stroke="#444" strokeWidth="1" />
      <rect x="22" y="26" width="16" height="30" rx="4" fill={skinColor} stroke="#444" strokeWidth="1" />
      <line x1="22" y1="32" x2="14" y2="48" stroke={skinColor} strokeWidth="6" strokeLinecap="round" />
      <line x1="38" y1="32" x2="46" y2="48" stroke={skinColor} strokeWidth="6" strokeLinecap="round" />
      <line x1="26" y1="56" x2="22" y2="84" stroke={skinColor} strokeWidth="6" strokeLinecap="round" />
      <line x1="34" y1="56" x2="38" y2="84" stroke={skinColor} strokeWidth="6" strokeLinecap="round" />
      {/* 표정 */}
      <circle cx="26" cy="14" r="1.2" fill="#222" />
      <circle cx="34" cy="14" r="1.2" fill="#222" />
    </svg>
  );

  const renderPanel = (panel: 'left' | 'right') => {
    const isLeft = panel === 'left';
    const skinColor = isLeft ? '#fda4af' : '#bfdbfe';   // 더위 = 핑크 (혈관 확장), 추위 = 창백 파랑
    const bg = isLeft
      ? 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 100%)'
      : 'linear-gradient(180deg, #e0e7ff 0%, #93c5fd 100%)';
    return (
      <div
        onClick={(e) => onPanelClick(e, panel)}
        className="relative overflow-hidden rounded-lg cursor-crosshair"
        style={{
          width: PANEL_W,
          height: PANEL_H,
          background: bg,
          border: `3px solid ${isLeft ? '#92400e' : '#1e3a8a'}`,
        }}
      >
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-bold">
          {isLeft ? '🏜️ 더운 사막 직후' : '⛷️ 실내 스키장 안'}
        </div>
        <Figure skinColor={skinColor} />

        {/* 패널 고유 diff 요소 */}
        {DIFFS.filter(d => d.panel === panel).map(d => {
          const isFound = found.has(d.id);
          return (
            <button
              key={d.id}
              onClick={(e) => { e.stopPropagation(); onClickDiff(d); }}
              className="absolute select-none"
              style={{
                left: d.x - d.fontSize / 2,
                top: d.y - d.fontSize / 2,
                width: d.fontSize + 16,
                height: d.fontSize + 16,
                fontSize: d.fontSize,
                lineHeight: 1,
                background: 'transparent',
                border: 'none',
                cursor: isFound ? 'default' : 'pointer',
                padding: 0,
                color: 'inherit',
                textAlign: 'center',
              }}
              title={isFound ? d.label : ''}
            >
              {d.emoji}
              {isFound && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    border: '3px solid #22c55e',
                    borderRadius: '50%',
                    boxShadow: '0 0 12px #22c55e',
                  }}
                />
              )}
            </button>
          );
        })}

        {/* 오답 X 마크 */}
        {wrongFlash && wrongFlash.panel === panel && (
          <div
            key={wrongFlash.key}
            className="absolute pointer-events-none font-bold"
            style={{
              left: wrongFlash.x - 14,
              top: wrongFlash.y - 18,
              color: '#dc2626',
              fontSize: 32,
              textShadow: '2px 2px 0 #fff, 0 0 6px #dc2626',
              animation: 'wrong-x 0.5s ease-out forwards',
            }}
          >
            ✗
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
      <div className="relative bg-slate-900 border-4 border-cyan-300 rounded-2xl shadow-2xl" style={{ padding: 24, width: PANEL_W * 2 + 96 }}>
        {/* HUD */}
        <div className="flex justify-between items-center mb-3 text-white font-mono">
          <div>
            <div className="text-xs text-cyan-200">찾은 차이</div>
            <div className="text-3xl font-bold" style={{ color: found.size >= DIFF_TARGET ? '#fde047' : '#fff' }}>
              {found.size} / {DIFF_TARGET}
            </div>
          </div>
          <div className="text-center text-cyan-100 font-bold text-lg">⛷️ 다른 그림 5가지 찾기</div>
          <div className="text-right">
            <div className="text-xs text-cyan-200">남은 시간</div>
            <div className="text-3xl font-bold text-emerald-300">{timeLeft}s</div>
          </div>
        </div>

        {/* 패널 2개 */}
        <div className="flex gap-6 justify-center">
          {renderPanel('left')}
          {renderPanel('right')}
        </div>

        {/* 발견 라벨 리스트 */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {DIFFS.map(d => {
            const f = found.has(d.id);
            return (
              <span
                key={d.id}
                className="px-3 py-1 rounded-full text-sm font-bold border-2"
                style={{
                  background: f ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  color: f ? '#fff' : '#94a3b8',
                  borderColor: f ? '#86efac' : '#334155',
                }}
              >
                {f ? `✓ ${d.label}` : '???'}
              </span>
            );
          })}
        </div>

        {wrongCount > 0 && (
          <p className="text-center text-red-300 text-xs mt-2 font-mono">오답 클릭: {wrongCount}</p>
        )}

        {/* 시작/완료 오버레이 */}
        {!started && (
          <div className="absolute inset-0 bg-black/85 rounded-2xl flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2">⛷️ 다른 그림 찾기</h2>
            <p className="text-sm text-cyan-200 mb-1 max-w-md text-center">
              <strong>더운 환경(왼쪽)</strong>과 <strong>추운 실내 스키장(오른쪽)</strong>에서의
              우리 몸 반응 차이 5가지를 찾아 클릭하세요.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-8 py-3 rounded-full shadow-xl text-lg"
            >
              시작
            </button>
          </div>
        )}
        {finished && (
          <div className="absolute inset-0 bg-black/85 rounded-2xl flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2">
              {found.size >= DIFF_TARGET ? '🎉 모두 찾았어요!' : '⏰ 시간 종료'}
            </h2>
            <p className="text-lg mb-1">
              찾은 차이 <span className="text-cyan-300 font-bold">{found.size}</span> / {DIFF_TARGET}
            </p>
            <p className="text-sm text-slate-300">다음 단계로 진행…</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes wrong-x {
          0%   { opacity: 0; transform: scale(0.5); }
          15%  { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
