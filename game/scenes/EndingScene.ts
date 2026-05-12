import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

export class EndingScene extends BaseGameScene {
  constructor() {
    super({ sceneKey: 'ending', backgroundKey: 'bg_ending', nodesUrl: '/data/nodes-ending.json' });
  }

  protected onSceneReady() {
    // 통상 WorldMapScene이 이미 phase='ending'으로 설정한 상태이지만,
    // 직접 EndingScene으로 점프하는 경로(테스트/디버그)도 안전하게 처리.
    if (useGameStore.getState().phase !== 'ending') {
      useGameStore.getState().setPhase('ending');
    }
  }

  protected onNodeArrive(node: NodeConfig) {
    if (node.id === 'podium' && node.action === 'ending_card') {
      // React EndingCard가 phase = 'ending' 인데 podium 도착했음을 감지.
      // 단순화: phase 유지. React가 카드 표시.
    }
  }
}
