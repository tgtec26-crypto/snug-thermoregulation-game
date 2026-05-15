'use client';

import { useGameStore } from '@/store/gameStore';

/**
 * 노드 라벨 오버레이는 UIOverlay 안에서 1280×800 네이티브 좌표를 사용.
 * 부모(UI overlay 컨테이너)가 transform scale 로 stage 시각 크기에 맞춰 축소되므로
 * 별도 캔버스 rect 측정 불필요. 게임 좌표 그대로 배치.
 */
export function NodeLabelOverlay() {
  const activeNodes   = useGameStore(s => s.activeNodes);
  const clickNode     = useGameStore(s => s.clickNode);
  const targetNodeId  = useGameStore(s => s.targetNodeId);

  if (!activeNodes) return null;

  const svgNodes = activeNodes.nodes.filter(n => n.labelSvg);
  if (!svgNodes.length) return null;

  const PIN_SIZE = 44;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {svgNodes.map(n => {
        const isTarget = targetNodeId === n.id;
        return (
          <div key={n.id}>
            <button
              onClick={() => clickNode(n.id)}
              style={{
                position: 'absolute',
                left: n.x,
                top: n.y,
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
                  left: n.x,
                  top: n.y - 42,
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
