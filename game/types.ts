export type Country = 'finland' | 'canada' | 'dubai' | 'egypt';
export type CountryGroup = 'cold' | 'hot';  // 'finland'·'canada' = cold, 'dubai'·'egypt' = hot

export type Phase =
  | 'title'
  | 'classroom_intro'        // 도입 멘트
  | 'classroom_choose_cold'  // 추 선택
  | 'classroom_choose_hot'   // 더 선택
  | 'classroom_rps_cold'     // 추 가위바위보
  | 'classroom_rps_hot'      // 더 가위바위보
  | 'classroom_depart'       // 출발 멘트
  | 'korea_bus_to_airport'   // 버스 컷씬: 학교 → 공항
  | 'airport_start'          // 출발국 공항 퀴즈
  | 'worldmap_to_1'          // 비행기 컷씬: 한국 → 1국
  | 'country_1_arrived'      // 1국 공항 도착
  | 'country_1_outdoor'      // 1국 야외
  | 'country_1_indoor'       // 1국 실내
  | 'airport_1'              // 1국 공항 퀴즈
  | 'worldmap_to_2'          // 비행기 컷씬: 1국 → 2국
  | 'country_2_arrived'
  | 'country_2_outdoor'
  | 'country_2_indoor'
  | 'airport_2'              // 2국 공항 퀴즈
  | 'worldmap_to_home'       // 비행기 컷씬: 2국 → 한국
  | 'korea_bus_to_school'    // 버스 컷씬: 공항 → 학교
  | 'ending';

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'win' | 'lose' | 'draw';

export type EnvironmentType =
  | 'cold_outdoor' | 'cold_indoor'
  | 'hot_outdoor'  | 'hot_indoor'
  | 'neutral';

export type VesselState = 'constricted' | 'normal' | 'dilated';

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];          // length 4
  answerIndex: number;        // 0~3
  category: 'cold_response' | 'hot_response' | 'neuro_vs_hormone';
  explanation: string;        // 정답 선택 시 1줄 해설
}

export interface CountryConfig {
  id: Country;
  group: CountryGroup;
  displayName: string;        // "🇫🇮 핀란드 라플란드"
  flagEmoji: string;          // "🇫🇮"
  outdoorEnv: EnvironmentType;  // 'cold_outdoor' / 'hot_outdoor'
  indoorEnv: EnvironmentType;   // 'cold_indoor' / 'hot_indoor'  ← 패러독스
  outdoorLabel: string;       // "라플란드 시내 (-15℃)"
  indoorLabel: string;        // "사우나 (+85℃)"
  rpsNpcName: string;         // 학급 친구 이름 (이 나라 가고 싶다는)
}

export interface NodeConfig {
  id: string;
  x: number;
  y: number;
  type: 'walk' | 'trigger' | 'exit';
  label?: string;             // 디버그용
  action?: string;            // 트리거 시 dispatch할 phase 전환 등
  labelSvg?: string;          // React 오버레이로 그릴 SVG 버튼 경로 (있으면 Phaser 원 숨김)
}

export interface SceneNodes {
  scene: string;              // 'classroom' | 'airport_start' | 'country_finland_outdoor' 등
  startNode: string;          // 캐릭터 입장 위치
  nodes: NodeConfig[];
}

// 베지어 경로 제어점
export interface BezierCP {
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
}

export type WorldmapRouteKey =
  | 'korea_finland' | 'korea_canada'
  | 'finland_dubai' | 'finland_egypt'
  | 'canada_dubai'  | 'canada_egypt'
  | 'dubai_korea'   | 'egypt_korea';

export type WorldmapPaths = Record<WorldmapRouteKey, BezierCP>;

export interface KoreaBusPath {
  school:  { x: number; y: number };
  airport: { x: number; y: number };
  cp1:     { x: number; y: number };
  cp2:     { x: number; y: number };
}
