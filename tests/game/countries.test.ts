import { describe, it, expect } from 'vitest';
import { COUNTRIES, getCountryById, getCountriesByGroup } from '@/game/data/countries';

describe('countries', () => {
  it('정확히 4국이 있다', () => {
    expect(COUNTRIES).toHaveLength(4);
  });

  it('추운 나라 2개 + 더운 나라 2개', () => {
    expect(getCountriesByGroup('cold')).toHaveLength(2);
    expect(getCountriesByGroup('hot')).toHaveLength(2);
  });

  it('각 국가는 야외/실내 환경이 서로 반대 (패러독스)', () => {
    COUNTRIES.forEach(c => {
      if (c.group === 'cold') {
        expect(c.outdoorEnv).toBe('cold_outdoor');
        expect(c.indoorEnv).toBe('cold_indoor'); // cold_indoor = 사우나 (더운 실내)
      } else {
        expect(c.outdoorEnv).toBe('hot_outdoor');
        expect(c.indoorEnv).toBe('hot_indoor');  // hot_indoor = 실내 스키장 (추운 실내)
      }
    });
  });

  it('getCountryById 조회 가능', () => {
    expect(getCountryById('finland')?.flagEmoji).toBe('🇫🇮');
    expect(getCountryById('egypt')?.group).toBe('hot');
  });
});
