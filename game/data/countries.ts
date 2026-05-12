import type { Country, CountryConfig, CountryGroup } from '@/game/types';

export const COUNTRIES: CountryConfig[] = [
  {
    id: 'finland',
    group: 'cold',
    displayName: '🇫🇮 핀란드 라플란드',
    flagEmoji: '🇫🇮',
    outdoorEnv: 'cold_outdoor',
    indoorEnv: 'cold_indoor',
    outdoorLabel: '라플란드 시내 (-15℃)',
    indoorLabel: '핀란드식 사우나 (+85℃)',
    rpsNpcName: '민준',
  },
  {
    id: 'canada',
    group: 'cold',
    displayName: '🇨🇦 캐나다 옐로나이프',
    flagEmoji: '🇨🇦',
    outdoorEnv: 'cold_outdoor',
    indoorEnv: 'cold_indoor',
    outdoorLabel: '옐로나이프 호숫가 (-30℃)',
    indoorLabel: '노천 핫스프링 (+38℃)',
    rpsNpcName: '서연',
  },
  {
    id: 'dubai',
    group: 'hot',
    displayName: '🇦🇪 UAE 두바이',
    flagEmoji: '🇦🇪',
    outdoorEnv: 'hot_outdoor',
    indoorEnv: 'hot_indoor',
    outdoorLabel: '두바이 사막 (+45℃)',
    indoorLabel: '스키두바이 실내 스키장 (-3℃)',
    rpsNpcName: '도윤',
  },
  {
    id: 'egypt',
    group: 'hot',
    displayName: '🇪🇬 이집트 카이로',
    flagEmoji: '🇪🇬',
    outdoorEnv: 'hot_outdoor',
    indoorEnv: 'hot_indoor',
    outdoorLabel: '기자 피라미드 (+40℃)',
    indoorLabel: '알렉산드리아 카타콤 (서늘)',
    rpsNpcName: '하은',
  },
];

export function getCountryById(id: Country): CountryConfig | undefined {
  return COUNTRIES.find(c => c.id === id);
}

export function getCountriesByGroup(group: CountryGroup): CountryConfig[] {
  return COUNTRIES.filter(c => c.group === group);
}
