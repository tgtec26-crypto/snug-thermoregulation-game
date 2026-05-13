'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';

interface CanvasRect { left: number; top: number; width: number; height: number; }

/**
 * 영구 안내 배너 — 캔버스 중앙에 게시판 이미지 + 텍스트 오버레이.
 * 토스트(짧은 알림)와 별개. 명시적으로 setGuidance('')로 지울 때까지 유지.
 */
export function GuidanceBanner() {
  const guidance = useGameStore(s => s.guidance);
  const [canvasRect, setCanvasRect] = useState<CanvasRect | null>(null);

  useEffect(() => {
    const update = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      setCanvasRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };

    update();

    // 캔버스가 마운트 후에 생성될 수 있어 짧게 폴링해서 잡는다.
    let pollId: ReturnType<typeof setInterval> | null = null;
    let ro: ResizeObserver | null = null;
    const setupObserver = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas || ro) return false;
      update();
      ro = new ResizeObserver(update);
      ro.observe(canvas);
      return true;
    };
    if (!setupObserver()) {
      pollId = setInterval(() => {
        if (setupObserver() && pollId) { clearInterval(pollId); pollId = null; }
      }, 200);
    }
    window.addEventListener('resize', update);

    return () => {
      if (pollId) clearInterval(pollId);
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // 안내 메시지 갱신 시 캔버스 위치 재측정
  useEffect(() => {
    if (!guidance) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    setCanvasRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, [guidance]);

  if (!guidance || !canvasRect) return null;

  // 캔버스 중앙 좌표 (게임 좌표계: 640, 360)
  const sx = canvasRect.width / GAME_WIDTH;
  const sy = canvasRect.height / GAME_HEIGHT;
  const cx = canvasRect.left + (GAME_WIDTH / 2) * sx;
  const cy = canvasRect.top + (GAME_HEIGHT / 2) * sy;

  // 원본 게시판 이미지 400×228 — 캔버스 스케일에 맞춰 비례 축소/확대 (70%로 축소)
  const SCALE = 0.7;
  const boardW = 400 * sx * SCALE;
  const boardH = 228 * sx * SCALE;  // 정사각 비율 유지 위해 sx 사용 (sx≈sy)
  const fontSize = 26 * 1.5 * sx * SCALE;

  return (
    <div
      style={{
        position: 'fixed',
        left: cx,
        top: cy,
        width: boardW,
        height: boardH,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/etc/toastpop_country_map.png"
        alt="안내"
        style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
        draggable={false}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // 상단 오렌지 헤더(Departures · Terminal 3)와 하단 베벨만 비워두고
          // 검은 body 영역 중앙에 텍스트가 오도록 패딩 조정
          paddingTop: `${boardH * 0.18}px`,
          paddingBottom: `${boardH * 0.07}px`,
          paddingLeft: `${48 * sx * SCALE}px`,
          paddingRight: `${48 * sx * SCALE}px`,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: `${fontSize}px`,
          lineHeight: 1.25,
          color: '#ffffff',
          textShadow: '0 0 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)',
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
      >
        {guidance}
      </div>
    </div>
  );
}
