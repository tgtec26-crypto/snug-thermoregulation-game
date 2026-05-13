'use client';

import { useGameStore } from '@/store/gameStore';
import { HUDBar } from '@/components/overlays/HUDBar';
import { Toast } from '@/components/overlays/Toast';
import { TitleNicknameModal } from '@/components/overlays/TitleNicknameModal';
import { ClassroomChoice } from '@/components/overlays/ClassroomChoice';
import { TeacherIntro } from '@/components/overlays/TeacherIntro';
import { RPSModal } from '@/components/overlays/RPSModal';
import { QuizModal } from '@/components/overlays/QuizModal';
import { MinigameModal } from '@/components/overlays/MinigameModal';
import { TempTickRunner } from '@/components/overlays/TempTickRunner';
import { EndingCard } from '@/components/overlays/EndingCard';
import { NodeLabelOverlay } from '@/components/overlays/NodeLabelOverlay';
import { GuidanceBanner } from '@/components/overlays/GuidanceBanner';
import type { Phase } from '@/game/types';

// HUD(체온·혈관·땀·티록신)는 실제 환경 노출이 일어나는 outdoor·indoor 씬에서만 표시.
// 다른 화면(타이틀·교실·버스·세계지도·국가맵·공항·결말)에서는 숨김.
// intro phase 도 같은 씬 위에 떠 있으므로 함께 표시.
const HUD_VISIBLE_PHASES = new Set<Phase>([
  'country_1_outdoor_intro', 'country_1_outdoor',
  'country_1_indoor_intro',  'country_1_indoor',
  'country_2_outdoor_intro', 'country_2_outdoor',
  'country_2_indoor_intro',  'country_2_indoor',
]);

export function UIOverlay() {
  const phase = useGameStore(s => s.phase);
  const showHud = HUD_VISIBLE_PHASES.has(phase);

  return (
    <>
      {showHud && <HUDBar />}
      <Toast />
      <TitleNicknameModal />
      <TeacherIntro />
      <ClassroomChoice />
      <RPSModal />
      <QuizModal />
      <TempTickRunner />
      <MinigameModal />
      <EndingCard />
      <NodeLabelOverlay />
      <GuidanceBanner />
    </>
  );
}
