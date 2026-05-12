import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig, Country } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

interface AirportInit {
  airportKey: 'airport_start' | `airport_${Country}`;
}

export class AirportScene extends BaseGameScene {
  private airportKey: AirportInit['airportKey'] = 'airport_start';

  constructor() {
    super({ sceneKey: 'airport', backgroundKey: 'bg_airport_start', nodesUrl: '/data/nodes-airport_start.json' });
  }

  init(data: AirportInit) {
    this.airportKey = data.airportKey;
    // 동적으로 backgroundKey / nodesUrl 변경 — init_은 readonly이므로 cast
    const mutable = this.init_ as { sceneKey: string; backgroundKey: string; nodesUrl: string };
    mutable.backgroundKey = `bg_${data.airportKey}`;
    mutable.nodesUrl = `/data/nodes-${data.airportKey}.json`;
  }

  protected onNodeArrive(node: NodeConfig) {
    const store = useGameStore.getState();
    if (node.type === 'trigger' && node.action === 'airport_quiz') {
      // React QuizModal이 phase를 보고 띄움.
    } else if (node.type === 'exit' && node.action === 'next_phase') {
      const nextPhase = this.computeNextPhase();
      if (nextPhase) {
        store.setPhase(nextPhase);
        this.scene.start('worldmap');
      }
    }
  }

  private computeNextPhase() {
    const { phase } = useGameStore.getState();
    switch (phase) {
      case 'airport_start': return 'worldmap_to_1' as const;
      case 'airport_1':     return 'worldmap_to_2' as const;
      case 'airport_2':     return 'worldmap_to_home' as const;
      default: return null;
    }
  }
}
