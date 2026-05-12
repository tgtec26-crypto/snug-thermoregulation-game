import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';
import { useGameStore } from '@/store/gameStore';

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'title' }); }

  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a3a5a).setOrigin(0, 0);
    this.add.text(GAME_WIDTH / 2, 240, '🌡️ 체온 조절 RPG', {
      fontFamily: 'Pretendard, system-ui',
      fontSize: '64px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    this.add.text(GAME_WIDTH / 2, 320, '— 수학여행으로 배우는 항상성 —', {
      fontFamily: 'Pretendard, system-ui',
      fontSize: '24px',
      color: '#aac0d8',
    }).setOrigin(0.5, 0.5);

    // 닉네임 입력은 React 오버레이가 담당. 여기선 트리거만:
    // store의 phase가 'title'에서 'classroom_intro'로 변할 때 ClassroomScene 시작.
    const unsub = useGameStore.subscribe((s, prev) => {
      if (prev.phase === 'title' && s.phase === 'classroom_intro') {
        this.scene.start('classroom');
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
  }
}
