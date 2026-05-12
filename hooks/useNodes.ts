'use client';

import { useEffect, useState } from 'react';
import type { SceneNodes } from '@/game/types';

/**
 * public/data/nodes-<scene>.json을 비동기 로드.
 * Phaser Scene 외부(React)에서 admin 모드 등에 사용.
 */
export function useNodes(sceneName: string): SceneNodes | null {
  const [data, setData] = useState<SceneNodes | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/data/nodes-${sceneName}.json`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => console.error(`useNodes(${sceneName}) failed:`, err));
    return () => { cancelled = true; };
  }, [sceneName]);
  return data;
}
