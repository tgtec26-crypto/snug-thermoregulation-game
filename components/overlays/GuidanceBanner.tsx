'use client';

import { useGameStore } from '@/store/gameStore';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';

/**
 * 영구 안내 배너 — 게임 영역 중앙에 게시판 이미지 + 텍스트 오버레이.
 * UIOverlay 안의 1280×800 transformed 컨테이너에 배치되므로 네이티브 좌표 사용.
 */
export function GuidanceBanner() {
  const guidance = useGameStore(s => s.guidance);
  if (!guidance) return null;

  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;

  // 원본 게시판 이미지 400×228 — 70% 축소
  const SCALE = 0.7;
  const boardW = 400 * SCALE;
  const boardH = 228 * SCALE;
  const fontSize = 26 * 1.5 * SCALE;

  return (
    <div
      style={{
        position: 'absolute',
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
          paddingTop: `${boardH * 0.18}px`,
          paddingBottom: `${boardH * 0.07}px`,
          paddingLeft: `${48 * SCALE}px`,
          paddingRight: `${48 * SCALE}px`,
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
