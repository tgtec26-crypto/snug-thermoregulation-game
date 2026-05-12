export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 800;

// HUD 우측 사이드바 (스펙 §5.1)
export const HUD_WIDTH = 110;
export const GAME_AREA_WIDTH = GAME_WIDTH - HUD_WIDTH;

// 캐릭터 sprite 표시 크기 (스펙 §3.2, snug-hormone-game 답습)
export const CHARACTER_FRAME_WIDTH = 110;
export const CHARACTER_FRAME_HEIGHT = 186;

// 이동 속도 (px/second)
export const WALK_SPEED = 280;

// 체온 시스템 상수 (스펙 §6)
export const TEMP_INITIAL = 36.5;        // 시작 체온
export const TEMP_SAFE_MIN = 35.5;       // 적정 녹색대 하한
export const TEMP_SAFE_MAX = 37.5;       // 적정 녹색대 상한
export const TEMP_DANGER_LOW = 33.0;     // 막대 표시 최저
export const TEMP_DANGER_HIGH = 40.0;    // 막대 표시 최고
export const TEMP_TICK_MS = 500;         // 0.5초마다 체온 변화 적용

// 게임 phase별 환경 변화율 (℃/초, 스펙 §6.2)
export const ENV_TEMP_DELTA_PER_SEC = {
  cold_outdoor: -0.05,
  cold_indoor:  +0.08,
  hot_outdoor:  +0.05,
  hot_indoor:   -0.04,
  neutral:       0,
} as const;

// 미니게임 성공/실패 효과 (스펙 §6.3)
export const MINIGAME_SUCCESS_DELTA = 0.3;  // 체온 ±0.3℃ 회복

// 위험 범위 자동 회복 (스펙 §6.4)
export const DANGER_AUTO_RECOVERY_DELAY_MS = 4000;
export const DANGER_AUTO_RECOVERY_DELTA = 0.25;

// 4국 ID
export const COUNTRY_IDS = ['finland', 'canada', 'dubai', 'egypt'] as const;
