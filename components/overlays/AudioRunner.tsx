'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { playBgm, stopBgm, type BgmKey } from '@/lib/audio';
import type { Phase, Country } from '@/game/types';

/**
 * phase 변화에 맞춰 BGM 자동 전환.
 * SFX(success/correct/error)는 호출지(MinigameModal/QuizModal)에서 직접 emit.
 */
function pickBgm(phase: Phase, actualCold: Country | null, actualHot: Country | null): BgmKey | null {
  switch (phase) {
    case 'title':
    case 'classroom_intro':
    case 'classroom_choose_cold':
    case 'classroom_rps_cold_intro':
    case 'classroom_rps_cold_result':
    case 'classroom_choose_hot':
    case 'classroom_rps_hot_result':
    case 'classroom_depart':
    case 'ending':
      return 'start_ending';

    case 'classroom_rps_cold':
    case 'classroom_rps_hot':
      return 'rock';

    case 'korea_bus_to_airport':
    case 'korea_bus_to_school':
      return 'bus';

    case 'worldmap_to_1':
    case 'worldmap_to_2':
    case 'worldmap_to_home':
      return 'airplane';

    case 'airport_start':
    case 'airport_1':
    case 'airport_2':
      return 'quiz-background';

    case 'country_1_arrived':
    case 'country_1_outdoor_intro':
    case 'country_1_indoor_intro':
      return actualCold;

    case 'country_2_arrived':
    case 'country_2_outdoor_intro':
    case 'country_2_indoor_intro':
      return actualHot;

    case 'country_1_outdoor':
      // 추운 나라 야외 — 떨림 리듬게임 (자체 음악 보유)
      return null;

    case 'country_1_indoor':
      // 사우나 두더지
      return 'mole_game';

    case 'country_2_outdoor':
      // 사막 PANG
      return 'pang';

    case 'country_2_indoor':
      // 다른 그림 찾기
      return 'diff';

    default:
      return null;
  }
}

export function AudioRunner() {
  const phase = useGameStore(s => s.phase);
  const actualCold = useGameStore(s => s.actualCold);
  const actualHot = useGameStore(s => s.actualHot);

  useEffect(() => {
    const bgm = pickBgm(phase, actualCold, actualHot);
    if (bgm) playBgm(bgm);
    else stopBgm();
  }, [phase, actualCold, actualHot]);

  return null;
}
