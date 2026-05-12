import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';
import { useGameStore } from '@/store/gameStore';
import { bezierPoint, bezierAngle } from '@/game/utils/bezier';
import type { KoreaBusPath } from '@/game/types';

interface KoreaBusInit {
  direction: 'to_airport' | 'to_school';
}

export class KoreaBusScene extends Phaser.Scene {
  private direction: 'to_airport' | 'to_school' = 'to_airport';

  constructor() { super({ key: 'korea_bus' }); }

  init(data: KoreaBusInit) {
    this.direction = data.direction;
  }

  preload() {
    this.load.json('paths_korea', '/data/paths-korea.json');
  }

  create() {
    // HUD 미표시 씬이므로 풀 폭(1280) 사용
    this.add.image(0, 0, 'bg_korea_map')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    const path = this.cache.json.get('paths_korea') as KoreaBusPath;
    if (!path) {
      console.error('[KoreaBusScene] paths_korea JSON not loaded');
      this.advance();
      return;
    }

    const { school, airport, cp1, cp2 } = path;
    // 역방향 시 출발/도착 교환, 제어점도 교환해 자연스러운 역방향 곡선 생성
    const [p0, p1] = this.direction === 'to_airport' ? [school, airport] : [airport, school];
    const [c1, c2] = this.direction === 'to_airport' ? [cp1, cp2] : [cp2, cp1];

    const busAssetExists = this.textures.exists('move_bus');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bus: any = busAssetExists
      ? this.add.image(p0.x, p0.y, 'move_bus').setOrigin(0.5, 0.5).setDisplaySize(80, 40)
      : this.add.text(p0.x, p0.y, '🚌', { fontSize: '36px' }).setOrigin(0.5, 0.5);

    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      duration: 2500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const pos = bezierPoint(progress.t, p0.x, p0.y, c1.x, c1.y, c2.x, c2.y, p1.x, p1.y);
        const angle = bezierAngle(progress.t, p0.x, p0.y, c1.x, c1.y, c2.x, c2.y, p1.x, p1.y);
        bus.setPosition(pos.x, pos.y);
        bus.setRotation(angle);
      },
      onComplete: () => {
        this.time.delayedCall(400, () => this.advance());
      },
    });
  }

  private advance() {
    const { setPhase } = useGameStore.getState();
    if (this.direction === 'to_airport') {
      setPhase('airport_start');
      this.scene.start('airport', { airportKey: 'airport_start' });
    } else {
      setPhase('ending');
      this.scene.start('ending');
    }
  }
}
