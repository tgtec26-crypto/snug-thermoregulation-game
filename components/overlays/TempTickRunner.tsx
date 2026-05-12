'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  computeEnvironmentDelta,
  isInDangerZone,
  computeAutoRecoveryDelta,
} from '@/game/systems/temperatureSystem';
import { TEMP_TICK_MS, DANGER_AUTO_RECOVERY_DELAY_MS } from '@/game/config';
import { getCountryById } from '@/game/data/countries';
import type { Phase, EnvironmentType, Country } from '@/game/types';

function phaseToEnv(phase: Phase, actualCold: Country | null, actualHot: Country | null): EnvironmentType {
  if (phase === 'country_1_outdoor' && actualCold) return getCountryById(actualCold)!.outdoorEnv;
  if (phase === 'country_1_indoor' && actualCold) return getCountryById(actualCold)!.indoorEnv;
  if (phase === 'country_2_outdoor' && actualHot) return getCountryById(actualHot)!.outdoorEnv;
  if (phase === 'country_2_indoor' && actualHot) return getCountryById(actualHot)!.indoorEnv;
  return 'neutral';
}

export function TempTickRunner() {
  const dangerEnteredAtRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = useGameStore.getState();
      const env = phaseToEnv(s.phase, s.actualCold, s.actualHot);

      // 환경 변화 적용
      const envDelta = computeEnvironmentDelta(env, TEMP_TICK_MS);
      if (envDelta !== 0) s.adjustTemp(envDelta);

      // 위험 범위 자동 회복 트리거
      const now = Date.now();
      if (isInDangerZone(s.currentTemp)) {
        if (dangerEnteredAtRef.current === null) {
          dangerEnteredAtRef.current = now;
          if (s.currentTemp < 35.5) s.showToast('🥶 어지러움! 따뜻한 곳을 찾아야 해요');
          else                       s.showToast('🥵 너무 더워! 시원한 곳을 찾아야 해요');
        } else if (now - dangerEnteredAtRef.current >= DANGER_AUTO_RECOVERY_DELAY_MS) {
          const recover = computeAutoRecoveryDelta(s.currentTemp);
          if (recover !== 0) {
            s.adjustTemp(recover);
            s.showToast('💪 NPC 도움으로 체온 회복 중…');
            dangerEnteredAtRef.current = now;
          }
        }
      } else {
        dangerEnteredAtRef.current = null;
      }

      // 보조 인디케이터 갱신 (간소화)
      if (env === 'cold_outdoor' || env === 'hot_indoor') {
        s.setVesselState('constricted');
        s.setThyroxineLevel(Math.min(s.thyroxineLevel + 0.5, 100));
        s.setSweatLevel(Math.max(s.sweatLevel - 1, 0));
      } else if (env === 'hot_outdoor' || env === 'cold_indoor') {
        s.setVesselState('dilated');
        s.setSweatLevel(Math.min(s.sweatLevel + 1, 100));
        s.setThyroxineLevel(Math.max(s.thyroxineLevel - 0.3, 0));
      } else {
        s.setVesselState('normal');
      }

      // 유지 점수 기록 (게임 진행 중 phase에서만)
      const activePhases: Phase[] = ['country_1_outdoor', 'country_1_indoor', 'country_2_outdoor', 'country_2_indoor'];
      if (activePhases.includes(s.phase)) {
        s.recordTick();
      }
    }, TEMP_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}
