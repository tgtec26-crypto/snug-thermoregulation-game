import type { EnvironmentType } from '@/game/types';
import {
  ENV_TEMP_DELTA_PER_SEC,
  TEMP_SAFE_MIN, TEMP_SAFE_MAX,
  DANGER_AUTO_RECOVERY_DELTA,
} from '@/game/config';

/**
 * 환경에 의한 체온 변화량 계산 (deltaMs 동안).
 */
export function computeEnvironmentDelta(env: EnvironmentType, deltaMs: number): number {
  const ratePerSec = ENV_TEMP_DELTA_PER_SEC[env];
  return (ratePerSec * deltaMs) / 1000;
}

/**
 * 적정 녹색대 안에 있는가? (경계 포함)
 */
export function isInSafeZone(temp: number): boolean {
  return temp >= TEMP_SAFE_MIN && temp <= TEMP_SAFE_MAX;
}

/**
 * 위험 범위(저체온 또는 고체온)인가?
 */
export function isInDangerZone(temp: number): boolean {
  return !isInSafeZone(temp);
}

/**
 * 자동 회복 시 적용할 체온 변화량. 적정 범위 쪽으로 일정량 회복.
 */
export function computeAutoRecoveryDelta(temp: number): number {
  if (temp < TEMP_SAFE_MIN) return DANGER_AUTO_RECOVERY_DELTA;
  if (temp > TEMP_SAFE_MAX) return -DANGER_AUTO_RECOVERY_DELTA;
  return 0;
}
