'use client';

import { useEffect, useRef } from 'react';

export function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      const Phaser = (await import('phaser')).default;
      const { makePhaserConfig } = await import('@/game/phaserConfig');
      if (cancelled || !containerRef.current) return;
      const config = makePhaserConfig(containerRef.current);
      gameRef.current = new Phaser.Game(config);
    })();

    return () => {
      cancelled = true;
      // @ts-expect-error Phaser.Game 타입은 동적 임포트라 추론 불가
      gameRef.current?.destroy?.(true);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
