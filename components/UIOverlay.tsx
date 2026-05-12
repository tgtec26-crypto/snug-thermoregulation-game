'use client';

import { useGameStore } from '@/store/gameStore';
import { HUDBar } from '@/components/overlays/HUDBar';
import { Toast } from '@/components/overlays/Toast';
import type { Phase } from '@/game/types';

const HUD_HIDDEN_PHASES = new Set<Phase>([
  'title', 'classroom_intro', 'classroom_choose_cold', 'classroom_choose_hot',
  'classroom_rps_cold', 'classroom_rps_hot', 'classroom_depart',
  'worldmap_to_1', 'worldmap_to_2', 'worldmap_to_home',
  'ending',
]);

export function UIOverlay() {
  const phase = useGameStore(s => s.phase);
  const showHud = !HUD_HIDDEN_PHASES.has(phase);

  return (
    <>
      {showHud && <HUDBar />}
      <Toast />
      {/* TitleNicknameModal·ClassroomChoice·RPSModal·QuizModal·MinigameModal·EndingCard 는 후속 task에서 추가 */}
    </>
  );
}
