export interface AssetEntry {
  key: string;
  path: string;        // /assets/... — public 디렉토리 기준
  type: 'image' | 'spritesheet';
  frameConfig?: { frameWidth: number; frameHeight: number };
}

export const BACKGROUNDS: AssetEntry[] = [
  { key: 'bg_classroom',                 path: '/assets/backgrounds/classroom_start.png',     type: 'image' },
  // 모든 공항 내부는 airport.png 공용
  { key: 'bg_airport_start',             path: '/assets/backgrounds/airport.png',              type: 'image' },
  { key: 'bg_airport_finland',           path: '/assets/backgrounds/airport.png',              type: 'image' },
  { key: 'bg_airport_canada',            path: '/assets/backgrounds/airport.png',              type: 'image' },
  { key: 'bg_airport_dubai',             path: '/assets/backgrounds/airport.png',              type: 'image' },
  { key: 'bg_airport_egypt',             path: '/assets/backgrounds/airport.png',              type: 'image' },
  { key: 'bg_worldmap',                  path: '/assets/backgrounds/world_map.png',            type: 'image' },
  // 한국 버스 씬 — 학교↔공항 지도. to_airport / to_school 방향 모두 이 배경 재사용
  { key: 'bg_korea_map',                 path: '/assets/backgrounds/school_to_airport.png',    type: 'image' },
  { key: 'bg_country_finland_outdoor',   path: '/assets/backgrounds/finland_lapland.png',      type: 'image' },
  { key: 'bg_country_finland_indoor',    path: '/assets/backgrounds/finland_sauna.png',        type: 'image' },
  { key: 'bg_country_canada_outdoor',    path: '/assets/backgrounds/canada_yellowknife.png',   type: 'image' },
  { key: 'bg_country_canada_indoor',     path: '/assets/backgrounds/canada_hotspring.png',     type: 'image' },
  { key: 'bg_country_dubai_outdoor',     path: '/assets/backgrounds/dubai_desert.png',         type: 'image' },
  { key: 'bg_country_dubai_indoor',      path: '/assets/backgrounds/dubai_ski.png',            type: 'image' },
  { key: 'bg_country_egypt_outdoor',     path: '/assets/backgrounds/egypt_pyramid.png',        type: 'image' },
  { key: 'bg_country_egypt_indoor',      path: '/assets/backgrounds/egypt_catacombs.png',      type: 'image' },
  { key: 'bg_ending',                    path: '/assets/backgrounds/ending.png',               type: 'image' },
];

// 국가 내부 이동 맵 (각 나라 지도 배경 — CountryMapScene 구현 시 사용)
export const COUNTRY_MAPS: AssetEntry[] = [
  { key: 'map_finland', path: '/assets/backgrounds/Finland_map.png', type: 'image' },
  { key: 'map_canada',  path: '/assets/backgrounds/canada_map.png',  type: 'image' },
  { key: 'map_dubai',   path: '/assets/backgrounds/dubai_map.png',   type: 'image' },
  { key: 'map_egypt',   path: '/assets/backgrounds/egypt_map.png',   type: 'image' },
];

// 플레이어 복장 — 지역별 static 이미지 (한국/추운나라/더운나라)
export const SPRITES: AssetEntry[] = [
  { key: 'player_korea', path: '/assets/sprites/player_korea.png',        type: 'image' },
  { key: 'player_cold',  path: '/assets/sprites/player_cold_country.png', type: 'image' },
  { key: 'player_hot',   path: '/assets/sprites/player_hot_country.png',  type: 'image' },
];

// 이동 수단 아이콘
export const MOVE_ASSETS: AssetEntry[] = [
  { key: 'move_bus',      path: '/assets/move/bus.png',      type: 'image' },
  { key: 'move_airplane', path: '/assets/move/airplane.png', type: 'image' },
];

// Placeholder 색상 (자산 없을 때 fallback)
export const PLACEHOLDER_BG_COLORS: Record<string, number> = {
  bg_classroom:               0xfff4dc,
  bg_airport_start:           0xe0e8f4,
  bg_airport_finland:         0xd4e4f4,
  bg_airport_canada:          0xd4f4dc,
  bg_airport_dubai:           0xf4d4a0,
  bg_airport_egypt:           0xf4dca0,
  bg_worldmap:                0xc0d4e8,
  bg_korea_map:               0xe8f0e0,
  bg_country_finland_outdoor: 0xb6dcff,
  bg_country_finland_indoor:  0xf4c477,
  bg_country_canada_outdoor:  0xa0b8d4,
  bg_country_canada_indoor:   0xc8a878,
  bg_country_dubai_outdoor:   0xffd28a,
  bg_country_dubai_indoor:    0xb6e0ff,
  bg_country_egypt_outdoor:   0xffc880,
  bg_country_egypt_indoor:    0xc0c0d4,
  bg_ending:                  0xfff4dc,
};
