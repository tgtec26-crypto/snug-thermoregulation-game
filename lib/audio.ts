/**
 * 단일 BGM 트랙 + one-shot SFX 매니저.
 * - playBgm(key): 같은 키면 재생 중인 한 무시. 같은 키 + paused면 재생 재시도(autoplay unlock).
 * - stopBgm(): 현재 BGM 정지. 위치 저장(RESUMABLE 키만).
 * - playSfx(key): 매번 새 인스턴스로 재생.
 * 브라우저는 첫 사용자 입력 전 재생을 막으므로, 호출 실패는 조용히 무시.
 */

export type BgmKey =
  | 'start_ending'
  | 'bus'
  | 'airplane'
  | 'finland'
  | 'canada'
  | 'dubai'
  | 'egypt'
  | 'quiz-background'
  | 'mole_game'
  | 'pang'
  | 'diff'
  | 'rock';

export type SfxKey = 'success' | 'correct' | 'error';

const BGM_PATHS: Record<BgmKey, string> = {
  start_ending:      '/assets/audio/start_ending.mp3',
  bus:               '/assets/audio/bus.mp3',
  airplane:          '/assets/audio/airplane.mp3',
  finland:           '/assets/audio/finland.mp3',
  canada:            '/assets/audio/canada.mp3',
  dubai:             '/assets/audio/dubai.mp3',
  egypt:             '/assets/audio/egypt.mp3',
  'quiz-background': '/assets/audio/quiz-background.mp3',
  mole_game:         '/assets/audio/mole_game.mp3',
  pang:              '/assets/audio/pang.m4a',
  diff:              '/assets/audio/diff.mp3',
  rock:              '/assets/audio/rock.mp3',
};

const SFX_PATHS: Record<SfxKey, string> = {
  success: '/assets/audio/success.mp3',
  correct: '/assets/audio/correct.mp3',
  error:   '/assets/audio/error.mp3',
};

// 시작 위치 오프셋 (초). 매번 이 지점부터 재생 시작 (lastPos 없을 때).
const START_OFFSET: Partial<Record<BgmKey, number>> = {
  bus: 5,
};

// 재개 가능 키 — stopBgm 시 currentTime 저장, 다음 재생 시 그 지점부터.
const RESUMABLE: Partial<Record<BgmKey, true>> = {
  finland: true,
  canada:  true,
  dubai:   true,
  egypt:   true,
};

const BGM_VOLUME = 0.45;
const SFX_VOLUME = 0.7;

const lastPos: Partial<Record<BgmKey, number>> = {};
let currentBgm: { key: BgmKey; el: HTMLAudioElement } | null = null;

function safePlay(el: HTMLAudioElement) {
  const p = el.play();
  if (p && typeof (p as Promise<void>).catch === 'function') {
    (p as Promise<void>).catch(() => { /* autoplay blocked — silent */ });
  }
}

function applyStartTime(el: HTMLAudioElement, key: BgmKey) {
  const resumed = RESUMABLE[key] ? lastPos[key] : undefined;
  const offset = resumed ?? START_OFFSET[key] ?? 0;
  if (offset <= 0) return;
  const set = () => {
    try { el.currentTime = offset; } catch { /* ignore */ }
  };
  if (el.readyState >= 1) set();
  else el.addEventListener('loadedmetadata', set, { once: true });
}

export function playBgm(key: BgmKey, opts: { loop?: boolean } = {}) {
  if (typeof window === 'undefined') return;

  if (currentBgm && currentBgm.key === key) {
    // 같은 키 — autoplay 차단으로 paused 상태면 재시도 (사용자 첫 제스처 직후 unlock)
    if (currentBgm.el.paused) safePlay(currentBgm.el);
    return;
  }

  if (currentBgm) {
    if (RESUMABLE[currentBgm.key]) {
      lastPos[currentBgm.key] = currentBgm.el.currentTime;
    }
    currentBgm.el.pause();
    currentBgm = null;
  }

  const el = new Audio(BGM_PATHS[key]);
  el.loop = opts.loop !== false;
  el.volume = BGM_VOLUME;
  applyStartTime(el, key);
  currentBgm = { key, el };
  safePlay(el);
}

export function stopBgm() {
  if (!currentBgm) return;
  if (RESUMABLE[currentBgm.key]) {
    lastPos[currentBgm.key] = currentBgm.el.currentTime;
  }
  currentBgm.el.pause();
  currentBgm = null;
}

export function playSfx(key: SfxKey) {
  if (typeof window === 'undefined') return;
  const el = new Audio(SFX_PATHS[key]);
  el.volume = SFX_VOLUME;
  safePlay(el);
}

/** 첫 사용자 제스처 직후 호출 — autoplay 차단으로 paused 된 현재 BGM 재시도. */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  if (currentBgm && currentBgm.el.paused) safePlay(currentBgm.el);
}
