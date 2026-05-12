import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';
import { useGameStore } from '@/store/gameStore';
import { bezierPoint } from '@/game/utils/bezier';
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
    // 크기 150%(120×60), 텍스트 fallback도 비례
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bus: any = busAssetExists
      ? this.add.image(p0.x, p0.y, 'move_bus').setOrigin(0.5, 0.5).setDisplaySize(120, 60)
      : this.add.text(p0.x, p0.y, '🚌', { fontSize: '54px' }).setOrigin(0.5, 0.5);

    // bus.png 원본이 왼쪽을 향하고 있음 → 출발/도착 x로 전체 진행 방향 판정 후 단 한 번 flip 결정
    // (매 프레임 베지어 tangent로 판정하면 곡선 중간/끝에서 부호가 흔들려 좌우 반전이 보임)
    if (busAssetExists) {
      const isGoingRight = p1.x > p0.x;
      bus.setFlipX(isGoingRight);
    }

    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      duration: 3125,   // 기존 2500ms × 1/0.8 = 80% 속도로 느려짐
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const pos = bezierPoint(progress.t, p0.x, p0.y, c1.x, c1.y, c2.x, c2.y, p1.x, p1.y);
        bus.setPosition(pos.x, pos.y);
        // 회전·flip 변경 없음. 버스는 똑바로 + 같은 방향 유지하며 곡선 따라 이동.
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
