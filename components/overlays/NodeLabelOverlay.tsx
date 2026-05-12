'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';

interface CanvasRect { left: number; top: number; width: number; height: number; }

export function NodeLabelOverlay() {
  const activeNodes   = useGameStore(s => s.activeNodes);
  const clickNode     = useGameStore(s => s.clickNode);
  const targetNodeId  = useGameStore(s => s.targetNodeId);
  const [canvasRect, setCanvasRect] = useState<CanvasRect | null>(null);

  useEffect(() => {
    const update = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      setCanvasRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };

    update();

    // 캔버스가 NodeLabelOverlay 마운트 후에 생성될 수 있어 ResizeObserver를 등록할 캔버스가
    // 없는 경우 짧게 폴링해서 잡는다. (Phaser 비동기 부팅 대응)
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

  // activeNodes가 새로 들어올 때마다 캔버스 위치/크기 재측정 (씬 전환 후 첫 렌더에서 빠뜨림 방지)
  useEffect(() => {
    if (!activeNodes) return;
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    setCanvasRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, [activeNodes]);

  if (!activeNodes || !canvasRect) return null;

  const svgNodes = activeNodes.nodes.filter(n => n.labelSvg);
  if (!svgNodes.length) return null;

  const sx = canvasRect.width  / GAME_WIDTH;
  const sy = canvasRect.height / GAME_HEIGHT;

  // 핀 크기 (원본 50×50을 캔버스 스케일에 맞춰 비례)
  const PIN_SIZE = 44 * sx;

  // 어드민과 동일한 스타일: 흰 카드 + 색상 테두리 + img h-8(32px). 노드 좌표에 중심 정렬.
  // 어드민에서 배치 시 보이는 비주얼과 인게임 비주얼이 일치하도록 동일 마크업 사용.
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {svgNodes.map(n => {
        const isTarget = targetNodeId === n.id;
        const left = canvasRect.left + n.x * sx;
        const top  = canvasRect.top  + n.y * sy;
        return (
          <div key={n.id}>
            <button
              onClick={() => clickNode(n.id)}
              style={{
                position: 'absolute',
                left,
                top,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <div
                className={`rounded-md bg-white/95 shadow-lg border-2 px-1 py-0.5 ${isTarget ? 'guidance-blink' : ''}`}
                style={{ borderColor: BORDER_COLOR[n.id] ?? '#ffffff' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={n.labelSvg}
                  alt={n.label ?? n.id}
                  className="block h-8 w-auto"
                  draggable={false}
                />
              </div>
            </button>
            {isTarget && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/assets/etc/pin.png"
                alt=""
                className="guidance-pin"
                style={{
                  position: 'absolute',
                  left,
                  top: top - 42 * sx,    // 노드 카드 위쪽으로 띄움
                  width: PIN_SIZE,
                  height: PIN_SIZE,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                draggable={false}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// 노드 id별 테두리 색 (어드민의 DEST_COLOR와 동일)
const BORDER_COLOR: Record<string, string> = {
  airport: '#3b82f6',  // 파랑
  outdoor: '#84cc16',  // 라임
  indoor:  '#ec4899',  // 핑크
};
