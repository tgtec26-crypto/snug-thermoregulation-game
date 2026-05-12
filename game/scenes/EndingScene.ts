import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

export class EndingScene extends BaseGameScene {
  constructor() {
    super({ sceneKey: 'ending', backgroundKey: 'bg_ending', nodesUrl: '/data/nodes-ending.json' });
  }

  protected onSceneReady() {
    useGameStore.getState().setPhase('ending');
  }

  protected onNodeArrive(node: NodeConfig) {
    if (node.id === 'podium' && node.action === 'ending_card') {
      // React EndingCard가 phase = 'ending' 인데 podium 도착했음을 감지.
      // 단순화: phase 유지. React가 카드 표시.
    }
  }
}
