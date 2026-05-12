import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { ClassroomScene } from './scenes/ClassroomScene';
import { AirportScene } from './scenes/AirportScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { CountryScene } from './scenes/CountryScene';
import { EndingScene } from './scenes/EndingScene';

export function makePhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000',
    scene: [
      BootScene, TitleScene, ClassroomScene,
      AirportScene, WorldMapScene, CountryScene, EndingScene,
    ],
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
}
