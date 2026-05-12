import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { computeStars } from '@/game/systems/scoreSystem';

describe('전체 게임 플로우 한 사이클', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('타이틀 → 학급회의 → RPS → 공항 → 1국 → 2국 → 결말까지 phase가 일관되게 전환된다', () => {
    const store = useGameStore.getState();

    // 1. 닉네임 입력
    store.setNickname('태형');
    expect(useGameStore.getState().nickname).toBe('태형');

    // 2. 학급회의 진입
    store.setPhase('classroom_intro');
    store.setPhase('classroom_choose_cold');
    store.chooseCold('finland');
    store.setPhase('classroom_rps_cold');
    // 가위바위보 결과 — 승 가정
    store.setActualCountries('finland', 'finland'); // 임시
    store.setPhase('classroom_choose_hot');
    store.chooseHot('egypt');
    store.setPhase('classroom_rps_hot');
    store.setActualCountries('finland', 'egypt');
    store.setPhase('classroom_depart');

    // 3. 출발국 공항
    store.setPhase('airport_start');
    store.recordQuizAttempt('c1', true);  // 첫 시도 정답
    store.setPhase('worldmap_to_1');

    // 4. 1국 도착 및 진행
    store.setPhase('country_1_arrived');
    store.setPhase('country_1_outdoor');
    // 환경 변화 시뮬레이션 — 30틱 진행 (15초 분량)
    for (let i = 0; i < 30; i++) store.recordTick();
    store.setPhase('country_1_indoor');
    for (let i = 0; i < 30; i++) store.recordTick();
    store.completeCountry('finland');

    // 5. 1국 공항
    store.setPhase('airport_1');
    store.recordQuizAttempt('h1', true);
    store.setPhase('worldmap_to_2');

    // 6. 2국 진행
    store.setPhase('country_2_arrived');
    store.setPhase('country_2_outdoor');
    for (let i = 0; i < 30; i++) store.recordTick();
    store.setPhase('country_2_indoor');
    for (let i = 0; i < 30; i++) store.recordTick();
    store.completeCountry('egypt');

    // 7. 2국 공항 → 결말
    store.setPhase('airport_2');
    store.recordQuizAttempt('n1', true);
    store.setPhase('worldmap_to_home');
    store.setPhase('ending');

    // 검증
    const final = useGameStore.getState();
    expect(final.phase).toBe('ending');
    expect(final.completedCountries.sort()).toEqual(['egypt', 'finland']);
    expect(final.airportQuizFirstCorrect).toBe(3);
    expect(final.totalTicks).toBe(120);
    expect(final.inSafeZoneTicks).toBe(120);  // 환경 효과 안 적용했으므로 항상 적정

    const stars = computeStars({
      tempRetentionPct: (final.inSafeZoneTicks / final.totalTicks) * 100,
      quizFirstTryPct: (final.airportQuizFirstCorrect / 3) * 100,
    });
    expect(stars).toBe(3);
  });

  it('체온이 위험 범위 진입 → 적정 복귀 시 유지율 계산 정확', () => {
    const store = useGameStore.getState();
    store.setPhase('country_1_outdoor');

    // 50틱 적정
    for (let i = 0; i < 50; i++) store.recordTick();

    // 위험 진입
    store.adjustTemp(-2.0);  // 34.5℃
    for (let i = 0; i < 50; i++) store.recordTick();

    expect(useGameStore.getState().inSafeZoneTicks).toBe(50);
    expect(useGameStore.getState().totalTicks).toBe(100);
  });
});
