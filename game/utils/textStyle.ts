import * as Phaser from 'phaser';
import { koreanFontStack } from '@/app/fonts';

export function getFontFamily(): string {
  return koreanFontStack;
}

export function defaultPhaserTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: koreanFontStack,
    fontSize: '18px',
    color: '#1a1a1a',
  };
}
