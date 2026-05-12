export interface AssetEntry {
  key: string;
  path: string;        // /assets/... — public 디렉토리 기준
  type: 'image' | 'spritesheet';
  frameConfig?: { frameWidth: number; frameHeight: number };
}

// 모든 자산은 사용자가 도트로 직접 제작 예정. 파일이 없으면 BootScene이
// placeholder 색사각형을 generateTexture로 대체.
export const BACKGROUNDS: AssetEntry[] = [
  { key: 'bg_classroom',                 path: '/assets/backgrounds/classroom.png',                 type: 'image' },
  { key: 'bg_airport_start',             path: '/assets/backgrounds/airport_start.png',             type: 'image' },
  { key: 'bg_airport_finland',           path: '/assets/backgrounds/airport_finland.png',           type: 'image' },
  { key: 'bg_airport_canada',            path: '/assets/backgrounds/airport_canada.png',            type: 'image' },
  { key: 'bg_airport_dubai',             path: '/assets/backgrounds/airport_dubai.png',             type: 'image' },
  { key: 'bg_airport_egypt',             path: '/assets/backgrounds/airport_egypt.png',             type: 'image' },
  { key: 'bg_worldmap',                  path: '/assets/backgrounds/worldmap.png',                  type: 'image' },
  { key: 'bg_country_finland_outdoor',   path: '/assets/backgrounds/country_finland_outdoor.png',   type: 'image' },
  { key: 'bg_country_finland_indoor',    path: '/assets/backgrounds/country_finland_indoor.png',    type: 'image' },
  { key: 'bg_country_canada_outdoor',    path: '/assets/backgrounds/country_canada_outdoor.png',    type: 'image' },
  { key: 'bg_country_canada_indoor',     path: '/assets/backgrounds/country_canada_indoor.png',     type: 'image' },
  { key: 'bg_country_dubai_outdoor',     path: '/assets/backgrounds/country_dubai_outdoor.png',     type: 'image' },
  { key: 'bg_country_dubai_indoor',      path: '/assets/backgrounds/country_dubai_indoor.png',      type: 'image' },
  { key: 'bg_country_egypt_outdoor',     path: '/assets/backgrounds/country_egypt_outdoor.png',     type: 'image' },
  { key: 'bg_country_egypt_indoor',      path: '/assets/backgrounds/country_egypt_indoor.png',      type: 'image' },
  { key: 'bg_ending',                    path: '/assets/backgrounds/ending.png',                    type: 'image' },
];

export const SPRITES: AssetEntry[] = [
  { key: 'player_idle',       path: '/assets/sprites/player_idle.png',       type: 'image' },
  { key: 'player_walk_down',  path: '/assets/sprites/player_walk_down.png',  type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
  { key: 'player_walk_left',  path: '/assets/sprites/player_walk_left.png',  type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
  { key: 'player_walk_right', path: '/assets/sprites/player_walk_right.png', type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
  { key: 'player_walk_up',    path: '/assets/sprites/player_walk_up.png',    type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
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
