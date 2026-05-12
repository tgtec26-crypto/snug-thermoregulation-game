'use client';

import { useGameStore } from '@/store/gameStore';
import { HUDBar } from '@/components/overlays/HUDBar';
import { Toast } from '@/components/overlays/Toast';
import { TitleNicknameModal } from '@/components/overlays/TitleNicknameModal';
import { ClassroomChoice } from '@/components/overlays/ClassroomChoice';
import { RPSModal } from '@/components/overlays/RPSModal';
import { QuizModal } from '@/components/overlays/QuizModal';
import { MinigameModal } from '@/components/overlays/MinigameModal';
import { TempTickRunner } from '@/components/overlays/TempTickRunner';
import { EndingCard } from '@/components/overlays/EndingCard';
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
      <TitleNicknameModal />
      <ClassroomChoice />
      <RPSModal />
      <QuizModal />
      <TempTickRunner />
      <MinigameModal />
      <EndingCard />
    </>
  );
}
