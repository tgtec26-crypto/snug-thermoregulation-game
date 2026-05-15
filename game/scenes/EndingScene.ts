import * as Phaser from 'phaser';
import { BaseGameScene } from './BaseGameScene';
import { useGameStore } from '@/store/gameStore';

export class EndingScene extends BaseGameScene {
  constructor() {
    super({
      sceneKey: 'ending',
      backgroundKey: 'bg_ending',
      nodesUrl: '/data/nodes-ending.json',  // staticOverlay라 사용 안 됨
      staticOverlay: true,
    });
  }

  protected onSceneReady() {
    // 통상 WorldMapScene이 이미 phase='ending'으로 설정한 상태이지만,
    // 직접 EndingScene으로 점프하는 경로(테스트/디버그)도 안전하게 처리.
    if (useGameStore.getState().phase !== 'ending') {
      useGameStore.getState().setPhase('ending');
    }

    // EndingCard의 "다시 하기" → reset() → phase='title'. Phaser도 타이틀로 복귀.
    const unsub = useGameStore.subscribe((s, prev) => {
      if (prev.phase === 'ending' && s.phase === 'title') {
        this.scene.start('title');
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
  }
}
