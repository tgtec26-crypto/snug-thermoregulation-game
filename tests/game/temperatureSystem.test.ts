import { describe, it, expect } from 'vitest';
import {
  computeEnvironmentDelta,
  isInDangerZone,
  isInSafeZone,
  computeAutoRecoveryDelta,
} from '@/game/systems/temperatureSystem';

describe('temperatureSystem', () => {
  describe('computeEnvironmentDelta', () => {
    it('cold_outdoor에서 1초당 -0.05℃', () => {
      expect(computeEnvironmentDelta('cold_outdoor', 1000)).toBeCloseTo(-0.05, 5);
    });

    it('cold_indoor(사우나)에서 1초당 +0.08℃', () => {
      expect(computeEnvironmentDelta('cold_indoor', 1000)).toBeCloseTo(0.08, 5);
    });

    it('hot_outdoor에서 1초당 +0.05℃', () => {
      expect(computeEnvironmentDelta('hot_outdoor', 1000)).toBeCloseTo(0.05, 5);
    });

    it('hot_indoor(스키두바이)에서 1초당 -0.04℃', () => {
      expect(computeEnvironmentDelta('hot_indoor', 1000)).toBeCloseTo(-0.04, 5);
    });

    it('neutral 환경에서는 변화 없음', () => {
      expect(computeEnvironmentDelta('neutral', 5000)).toBe(0);
    });

    it('500ms는 1초의 절반 변화', () => {
      expect(computeEnvironmentDelta('cold_outdoor', 500)).toBeCloseTo(-0.025, 5);
    });
  });

  describe('isInSafeZone / isInDangerZone', () => {
    it('36.5는 적정', () => {
      expect(isInSafeZone(36.5)).toBe(true);
      expect(isInDangerZone(36.5)).toBe(false);
    });

    it('35.5 정확히는 적정 경계 포함', () => {
      expect(isInSafeZone(35.5)).toBe(true);
    });

    it('35.4는 저체온 위험', () => {
      expect(isInSafeZone(35.4)).toBe(false);
      expect(isInDangerZone(35.4)).toBe(true);
    });

    it('37.6은 고체온 위험', () => {
      expect(isInSafeZone(37.6)).toBe(false);
      expect(isInDangerZone(37.6)).toBe(true);
    });
  });

  describe('computeAutoRecoveryDelta', () => {
    it('저체온일 때 양수 회복', () => {
      const delta = computeAutoRecoveryDelta(34.8);
      expect(delta).toBeGreaterThan(0);
    });

    it('고체온일 때 음수 회복', () => {
      const delta = computeAutoRecoveryDelta(38.2);
      expect(delta).toBeLessThan(0);
    });

    it('적정 범위에서는 회복 0', () => {
      expect(computeAutoRecoveryDelta(36.5)).toBe(0);
    });
  });
});
