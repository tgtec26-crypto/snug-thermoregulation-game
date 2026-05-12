import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HUD_WIDTH } from '@/game/config';
import { useGameStore } from '@/store/gameStore';
import type { SceneNodes, Country } from '@/game/types';

export class WorldMapScene extends Phaser.Scene {
  private nodesData: SceneNodes | null = null;

  constructor() { super({ key: 'worldmap' }); }

  preload() {
    this.load.json('nodes_worldmap', '/data/nodes-worldmap.json');
  }

  create() {
    const gameAreaW = GAME_WIDTH - HUD_WIDTH;
    this.add.image(0, 0, 'bg_worldmap').setOrigin(0, 0).setDisplaySize(gameAreaW, GAME_HEIGHT);

    this.nodesData = this.cache.json.get('nodes_worldmap') as SceneNodes;

    const { phase, actualCold, actualHot } = useGameStore.getState();
    let from: Country | 'korea' = 'korea';
    let to: Country | 'korea' = 'korea';

    if (phase === 'worldmap_to_1') {
      from = 'korea'; to = actualCold ?? 'korea';
    } else if (phase === 'worldmap_to_2') {
      from = actualCold ?? 'korea'; to = actualHot ?? 'korea';
    } else if (phase === 'worldmap_to_home') {
      from = actualHot ?? 'korea'; to = 'korea';
    }

    const fromNode = this.nodesData?.nodes.find(n => n.id === from);
    const toNode = this.nodesData?.nodes.find(n => n.id === to);

    if (!fromNode || !toNode) {
      console.error('[WorldMapScene] from/to node missing', { from, to });
      this.advanceAfterCutscene();
      return;
    }

    // 비행기 아이콘 (placeholder: 이모지)
    const plane = this.add.text(fromNode.x, fromNode.y, '✈️', { fontSize: '48px' }).setOrigin(0.5, 0.5);

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    plane.setRotation(Math.atan2(dy, dx));

    this.tweens.add({
      targets: plane,
      x: toNode.x,
      y: toNode.y,
      duration: 2500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.time.delayedCall(500, () => this.advanceAfterCutscene());
      },
    });

    this.add.text(gameAreaW / 2, 40, `${fromNode.label ?? from} → ${toNode.label ?? to}`, {
      fontFamily: 'Pretendard, system-ui',
      fontSize: '26px',
      color: '#1a3a5a',
      backgroundColor: '#ffffffcc',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 0.5);
  }

  private advanceAfterCutscene() {
    const { phase, setPhase, actualCold, actualHot } = useGameStore.getState();

    if (phase === 'worldmap_to_1') {
      setPhase('country_1_arrived');
      this.scene.start('country', { country: actualCold!, slot: 1 });
    } else if (phase === 'worldmap_to_2') {
      setPhase('country_2_arrived');
      this.scene.start('country', { country: actualHot!, slot: 2 });
    } else if (phase === 'worldmap_to_home') {
      setPhase('ending');
      this.scene.start('ending');
    }
  }
}
