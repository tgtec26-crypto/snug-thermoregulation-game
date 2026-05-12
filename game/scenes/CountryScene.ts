import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig, Country } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

interface CountryInit {
  country: Country;
  slot: 1 | 2;
  area?: 'outdoor' | 'indoor';
}

export class CountryScene extends BaseGameScene {
  private country: Country = 'finland';
  private slot: 1 | 2 = 1;
  private area: 'outdoor' | 'indoor' = 'outdoor';

  constructor() {
    super({
      sceneKey: 'country',
      backgroundKey: 'bg_country_finland_outdoor',
      nodesUrl: '/data/nodes-country_finland_outdoor.json',
    });
  }

  init(data: CountryInit) {
    this.country = data.country;
    this.slot = data.slot;
    this.area = data.area ?? 'outdoor';
    const mutable = this.init_ as { sceneKey: string; backgroundKey: string; nodesUrl: string };
    mutable.backgroundKey = `bg_country_${this.country}_${this.area}`;
    mutable.nodesUrl = `/data/nodes-country_${this.country}_${this.area}.json`;
  }

  protected onNodeArrive(node: NodeConfig) {
    const store = useGameStore.getState();

    if (node.type === 'trigger' && node.action?.startsWith('minigame_')) {
      const phase = this.slot === 1
        ? (this.area === 'outdoor' ? 'country_1_outdoor' : 'country_1_indoor')
        : (this.area === 'outdoor' ? 'country_2_outdoor' : 'country_2_indoor');
      store.setPhase(phase);
    } else if (node.type === 'exit' && node.action === 'next_phase') {
      if (this.area === 'outdoor') {
        this.scene.restart({ country: this.country, slot: this.slot, area: 'indoor' });
      } else {
        store.completeCountry(this.country);
        if (this.slot === 1) {
          store.setPhase('airport_1');
        } else {
          store.setPhase('airport_2');
        }
        this.scene.start('airport', { airportKey: `airport_${this.country}` });
      }
    }
  }
}
