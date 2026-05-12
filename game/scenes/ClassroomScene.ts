import * as Phaser from 'phaser';
import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

export class ClassroomScene extends BaseGameScene {
  constructor() {
    super({ sceneKey: 'classroom', backgroundKey: 'bg_classroom', nodesUrl: '/data/nodes-classroom.json' });
  }

  protected onSceneReady() {
    // 학급회의 종료(classroom_depart) 시 출구 노드로 자동 이동
    const unsub = useGameStore.subscribe((s, prev) => {
      if (prev.phase !== 'classroom_depart' && s.phase === 'classroom_depart') {
        const exitNode = this.findNode('depart');
        if (exitNode) this.moveToNode(exitNode);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
  }

  protected onNodeArrive(node: NodeConfig) {
    const { phase, setPhase } = useGameStore.getState();
    if (node.id === 'choose' && phase === 'classroom_intro') {
      setPhase('classroom_choose_cold');
    } else if (node.id === 'depart' && phase === 'classroom_depart') {
      setPhase('airport_start');
      this.scene.start('airport', { airportKey: 'airport_start' });
    }
  }
}
