'use client';

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
import { AudioRunner } from '@/components/overlays/AudioRunner';

export function UIOverlay() {
  return (
    <>
      <AudioRunner />
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
