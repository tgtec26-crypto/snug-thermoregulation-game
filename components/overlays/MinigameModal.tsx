'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MINIGAME_SUCCESS_DELTA } from '@/game/config';
import type { Phase } from '@/game/types';
import { ShiverRhythmGame } from './ShiverRhythmGame';
import { WhackWordMole } from './minigames/WhackWordMole';
import { CatchFallingItems } from './minigames/CatchFallingItems';
import { SpotTheDifference } from './minigames/SpotTheDifference';
import { playSfx } from '@/lib/audio';

const COUNTRY_PHASES = new Set<Phase>([
  'country_1_outdoor', 'country_1_indoor',
  'country_2_outdoor', 'country_2_indoor',
]);

export interface MinigameResult {
  success: boolean;
  /** 게임별 의미 다름 — 디버그/추후 별점 계산용 */
  score: number;
}

export function MinigameModal() {
  const phase = useGameStore(s => s.phase);
  const adjustTemp = useGameStore(s => s.adjustTemp);
  const showToast = useGameStore(s => s.showToast);
  const setPhase = useGameStore(s => s.setPhase);
  const actualHot = useGameStore(s => s.actualHot);

  const phaseRef = useRef<Phase>(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const isActive = COUNTRY_PHASES.has(phase);

  // 다음 phase로 진행
  const advancePhase = useCallback(() => {
    const p = phaseRef.current;
    const nextPhase: Phase | null =
      p === 'country_1_outdoor' || p === 'country_1_indoor' ? 'country_1_arrived' :
      p === 'country_2_outdoor' || p === 'country_2_indoor' ? 'country_2_arrived' :
      null;
    if (nextPhase) setPhase(nextPhase);
  }, [setPhase]);

  // ─────────────── 리듬게임용 콜백 (추1 야외) ───────────────
  const handleShiverSuccess = useCallback(() => {
    adjustTemp(+MINIGAME_SUCCESS_DELTA);
    showToast('🔥 떨림 성공! 체온 ↑');
  }, [adjustTemp, showToast]);

  const handleShiverMiss = useCallback(() => {
    adjustTemp(-0.1);
  }, [adjustTemp]);

  // 공통 종료 핸들러
  const handleFinish = useCallback((label: string) => (result: MinigameResult) => {
    if (result.success) {
      playSfx('success');
      showToast(`✅ ${label} 성공!`);
    } else {
      showToast(`아쉽... ${label} — 다음 단계로 갑니다`);
    }
    setTimeout(() => advancePhase(), 1200);
  }, [showToast, advancePhase]);

  const handleRhythmFinish = useCallback((result: { hits: number; misses: number; shiverPops: number }) => {
    if (result.shiverPops > 0) {
      playSfx('success');
      showToast(`💪 떨림 ${result.shiverPops}회 성공! 체온 회복`);
    } else {
      showToast('아쉽... 다음 단계로 갑니다');
    }
    setTimeout(() => advancePhase(), 1500);
  }, [showToast, advancePhase]);

  if (!isActive) return null;

  switch (phase) {
    case 'country_1_outdoor':
      // 추운 나라 야외 — 떨림 리듬게임 (Twinkle 4 레인)
      return (
        <ShiverRhythmGame
          onFinish={handleRhythmFinish}
          onShiverSuccess={handleShiverSuccess}
          onMiss={handleShiverMiss}
        />
      );

    case 'country_1_indoor':
      // 사우나 — 단어 두더지 (더위 반응 클릭, 추위 반응 페널티)
      return <WhackWordMole onFinish={handleFinish('두더지')} />;

    case 'country_2_outdoor':
      // 사막 — 떨어지는 아이템 받기
      return <CatchFallingItems onFinish={handleFinish('아이템 받기')} />;

    case 'country_2_indoor': {
      // 더운 나라 실내 — 다른 그림 찾기 (Dubai → 스키장 / Egypt → 카타콤)
      const variant = actualHot === 'egypt' ? 'catacomb' : 'ski';
      return <SpotTheDifference variant={variant} onFinish={handleFinish('다른 그림 찾기')} />;
    }

    default:
      return null;
  }
}
