import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';
import { BACKGROUNDS, SPRITES, COUNTRY_MAPS, MOVE_ASSETS, PLACEHOLDER_BG_COLORS } from '@/game/asset-manifest';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // 자산이 실제로 있으면 로드, 없으면 onerror 후 BootScene.create()에서 placeholder 생성
    BACKGROUNDS.forEach(b => this.load.image(b.key, b.path));
    SPRITES.forEach(s => this.load.image(s.key, s.path));
    COUNTRY_MAPS.forEach(m => this.load.image(m.key, m.path));
    MOVE_ASSETS.forEach(a => this.load.image(a.key, a.path));

    // 누락된 자산 무시 (404 → 다음 자산 계속)
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`[BootScene] missing asset, will use placeholder: ${file.key}`);
    });
  }

  create() {
    // 자산이 없는 background에는 단색 placeholder 텍스처 생성
    BACKGROUNDS.forEach(b => {
      if (!this.textures.exists(b.key)) {
        const color = PLACEHOLDER_BG_COLORS[b.key] ?? 0x888888;
        const g = this.add.graphics();
        g.fillStyle(color, 1);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        const label = this.add.text(GAME_WIDTH / 2, 40, `[placeholder] ${b.key}`,
          { fontFamily: 'system-ui', fontSize: '22px', color: '#222' }).setOrigin(0.5, 0.5);
        g.generateTexture(b.key, GAME_WIDTH, GAME_HEIGHT);
        g.destroy();
        label.destroy();
      }
    });

    // 플레이어 복장 placeholder (자산 없을 때만): 110×186 색사각형
    const playerPlaceholders: Record<string, number> = {
      player_korea: 0x4488ff,
      player_cold:  0x88ccff,
      player_hot:   0xff8844,
    };
    Object.entries(playerPlaceholders).forEach(([key, color]) => {
      if (!this.textures.exists(key)) {
        const g = this.add.graphics();
        g.fillStyle(color, 1);
        g.fillRect(0, 0, 110, 186);
        g.generateTexture(key, 110, 186);
        g.destroy();
      }
    });

    // 첫 씬으로 전이
    this.scene.start('title');
  }
}
