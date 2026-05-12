'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';

interface CanvasRect { left: number; top: number; width: number; height: number; }

export function NodeLabelOverlay() {
  const activeNodes = useGameStore(s => s.activeNodes);
  const clickNode   = useGameStore(s => s.clickNode);
  const [canvasRect, setCanvasRect] = useState<CanvasRect | null>(null);

  useEffect(() => {
    const update = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      setCanvasRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };

    update();

    const ro = new ResizeObserver(update);
    const canvas = document.querySelector('canvas');
    if (canvas) ro.observe(canvas);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  if (!activeNodes || !canvasRect) return null;

  const svgNodes = activeNodes.nodes.filter(n => n.labelSvg);
  if (!svgNodes.length) return null;

  const sx = canvasRect.width  / GAME_WIDTH;
  const sy = canvasRect.height / GAME_HEIGHT;
  // SVG 버튼 표시 크기 (Phaser 좌표 기준으로 설계 후 스케일 적용)
  const BTN_W = 220 * sx;
  const BTN_H =  70 * sy;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {svgNodes.map(n => (
        <button
          key={n.id}
          onClick={() => clickNode(n.id)}
          style={{
            position: 'absolute',
            left:  canvasRect.left + n.x * sx - BTN_W / 2,
            top:   canvasRect.top  + n.y * sy - BTN_H,   // 발 위치 기준으로 버튼을 위에 표시
            width: BTN_W,
            height: BTN_H,
            pointerEvents: 'auto',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={n.labelSvg}
            alt={n.label ?? n.id}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            draggable={false}
          />
        </button>
      ))}
    </div>
  );
}
