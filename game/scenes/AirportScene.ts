import * as Phaser from 'phaser';
import { BaseGameScene } from './BaseGameScene';
import type { Country } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

interface AirportInit {
  airportKey: 'airport_start' | `airport_${Country}`;
}

export class AirportScene extends BaseGameScene {
  private airportKey: AirportInit['airportKey'] = 'airport_start';

  constructor() {
    super({
      sceneKey: 'airport',
      backgroundKey: 'bg_airport_start',
      nodesUrl: '/data/nodes-airport_start.json',  // staticOverlay라 사용 안 됨
      staticOverlay: true,
    });
  }

  init(data: AirportInit) {
    this.airportKey = data.airportKey;
    // 동적으로 backgroundKey 변경 — init_은 readonly이므로 cast
    const mutable = this.init_ as { sceneKey: string; backgroundKey: string; nodesUrl: string };
    mutable.backgroundKey = `bg_${data.airportKey}`;
    mutable.nodesUrl = `/data/nodes-${data.airportKey}.json`;  // unused; 일관성 위해 갱신
  }

  protected onSceneReady() {
    // QuizModal이 phase 보고 자동으로 띄움. 정답 시 phase가 worldmap_to_*로 바뀌면 여기서 씬 전환.
    const unsub = useGameStore.subscribe((s, prev) => {
      if (!this.scene) { unsub(); return; }
      const justEnteredWorldmap =
        prev.phase !== s.phase &&
        (s.phase === 'worldmap_to_1' || s.phase === 'worldmap_to_2' || s.phase === 'worldmap_to_home');
      if (justEnteredWorldmap) {
        this.time.delayedCall(200, () => { if (this.scene) this.scene.start('worldmap'); });
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
    this.events.once(Phaser.Scenes.Events.DESTROY, unsub);
  }
}
