import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';
import { BACKGROUNDS, SPRITES, PLACEHOLDER_BG_COLORS } from '@/game/asset-manifest';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // 자산이 실제로 있으면 로드, 없으면 onerror 후 BootScene.create()에서 placeholder 생성
    BACKGROUNDS.forEach(b => this.load.image(b.key, b.path));
    SPRITES.forEach(s => {
      if (s.type === 'spritesheet' && s.frameConfig) {
        this.load.spritesheet(s.key, s.path, s.frameConfig);
      } else {
        this.load.image(s.key, s.path);
      }
    });

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
        // 자산 이름 라벨 (어떤 화면인지 식별)
        const label = this.add.text(GAME_WIDTH / 2, 40, `[placeholder] ${b.key}`,
          { fontFamily: 'system-ui', fontSize: '22px', color: '#222' }).setOrigin(0.5, 0.5);
        g.generateTexture(b.key, GAME_WIDTH, GAME_HEIGHT);
        g.destroy();
        label.destroy();
      }
    });

    // player_idle placeholder (자산 없을 때만): 110×186 빨간 사각형
    if (!this.textures.exists('player_idle')) {
      const g = this.add.graphics();
      g.fillStyle(0xff5555, 1);
      g.fillRect(0, 0, 110, 186);
      g.generateTexture('player_idle', 110, 186);
      g.destroy();
    }

    // 첫 씬으로 전이 (TitleScene이 만들어진 다음 단계에서 활성화)
    this.scene.start('title');
  }
}
