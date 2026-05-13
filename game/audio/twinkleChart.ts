/**
 * "반짝반짝 작은별" 멜로디 + 리듬게임 차트.
 * - BPM 160 (떨림 컨셉에 맞춰 본 동요보다 빠르게)
 * - 4 레인 매핑: 음높이 순 (C/D=0, E/F=1, G=2, A=3)
 * - 1절 전체 = 48박 ≈ 18초
 */

export const TWINKLE_BPM = 160;
export const LANE_COUNT = 4;

export type Pitch = 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4';

export interface ChartNote {
  /** beat 단위 시작 시각 (0부터) */
  t: number;
  pitch: Pitch;
  /** beat 단위 음 길이 */
  dur: number;
  /** 0~3 레인 인덱스 (왼쪽→오른쪽 = 낮은음→높은음) */
  lane: number;
}

const PITCH_TO_LANE: Record<Pitch, number> = {
  C4: 0, D4: 0,   // 가장 낮은 음 → 1번 레인
  E4: 1, F4: 1,   // 중저음 → 2번 레인
  G4: 2,          // 중고음 → 3번 레인
  A4: 3,          // 가장 높은 음 → 4번 레인
};

const note = (t: number, pitch: Pitch, dur: number): ChartNote => ({
  t, pitch, dur, lane: PITCH_TO_LANE[pitch],
});

// 6 phrase × 8 beat = 48 beat. 각 phrase 끝의 마지막 음은 half note.
export const TWINKLE_CHART: ChartNote[] = [
  // 반짝반짝 작은별
  note(0, 'C4', 1), note(1, 'C4', 1), note(2, 'G4', 1), note(3, 'G4', 1),
  note(4, 'A4', 1), note(5, 'A4', 1), note(6, 'G4', 2),
  // 아름답게 비치네
  note(8, 'F4', 1), note(9, 'F4', 1), note(10, 'E4', 1), note(11, 'E4', 1),
  note(12, 'D4', 1), note(13, 'D4', 1), note(14, 'C4', 2),
  // 동쪽 하늘에서도
  note(16, 'G4', 1), note(17, 'G4', 1), note(18, 'F4', 1), note(19, 'F4', 1),
  note(20, 'E4', 1), note(21, 'E4', 1), note(22, 'D4', 2),
  // 서쪽 하늘에서도
  note(24, 'G4', 1), note(25, 'G4', 1), note(26, 'F4', 1), note(27, 'F4', 1),
  note(28, 'E4', 1), note(29, 'E4', 1), note(30, 'D4', 2),
  // 반짝반짝 작은별
  note(32, 'C4', 1), note(33, 'C4', 1), note(34, 'G4', 1), note(35, 'G4', 1),
  note(36, 'A4', 1), note(37, 'A4', 1), note(38, 'G4', 2),
  // 아름답게 비치네
  note(40, 'F4', 1), note(41, 'F4', 1), note(42, 'E4', 1), note(43, 'E4', 1),
  note(44, 'D4', 1), note(45, 'D4', 1), note(46, 'C4', 2),
];

export const TOTAL_BEATS = 48;

export function beatsToSeconds(beats: number, bpm = TWINKLE_BPM): number {
  return (beats * 60) / bpm;
}

export const SONG_DURATION_SEC = beatsToSeconds(TOTAL_BEATS);
