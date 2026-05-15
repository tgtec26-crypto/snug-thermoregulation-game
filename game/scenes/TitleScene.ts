import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';
import { useGameStore } from '@/store/gameStore';

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'title' }); }

  create() {
    // 사용자 제작 타이틀 이미지(start.png)를 풀화면 배경으로 사용. 이미지에 타이틀 텍스트 포함됨.
    this.add.image(0, 0, 'bg_title').setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // 닉네임 입력은 React 오버레이가 담당. 여기선 트리거만:
    // store의 phase가 'title'에서 'classroom_intro'로 변할 때 ClassroomScene 시작.
    // dev HMR/StrictMode에서 stale 구독이 남아있을 수 있어 null 가드 필수.
    const unsub = useGameStore.subscribe((s, prev) => {
      if (!this.scene) { unsub(); return; }
      if (prev.phase === 'title' && s.phase === 'classroom_intro') {
        this.scene.start('classroom');
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
    this.events.once(Phaser.Scenes.Events.DESTROY, unsub);

    // 방어적 idempotency check: TitleScene 부팅 전에 이미 classroom_intro로 전환된 경우
    if (useGameStore.getState().phase === 'classroom_intro') {
      this.scene.start('classroom');
    }
  }
}
