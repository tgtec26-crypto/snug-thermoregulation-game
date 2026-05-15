import * as Phaser from 'phaser';
import { BaseGameScene } from './BaseGameScene';
import { useGameStore } from '@/store/gameStore';

export class ClassroomScene extends BaseGameScene {
  constructor() {
    super({
      sceneKey: 'classroom',
      backgroundKey: 'bg_classroom',
      nodesUrl: '/data/nodes-classroom.json',  // staticOverlay라 사용 안 됨 (스펙 호환용)
      staticOverlay: true,
    });
  }

  protected onSceneReady() {
    // 학급회의 종료(classroom_depart) → 바로 버스 씬으로 전환 (오버레이 방식, 캐릭터 이동 없음)
    const unsub = useGameStore.subscribe((s, prev) => {
      if (!this.scene) { unsub(); return; }
      if (prev.phase !== 'classroom_depart' && s.phase === 'classroom_depart') {
        this.time.delayedCall(250, () => {
          if (!this.scene) return;
          useGameStore.getState().setPhase('korea_bus_to_airport');
          this.scene.start('korea_bus', { direction: 'to_airport' });
        });
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
    this.events.once(Phaser.Scenes.Events.DESTROY, unsub);
  }
}
