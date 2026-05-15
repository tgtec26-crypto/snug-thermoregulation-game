import * as Phaser from 'phaser';
import { BaseGameScene } from './BaseGameScene';
import type { Country, Phase } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

interface CountryInit {
  country: Country;
  slot: 1 | 2;
  area?: 'outdoor' | 'indoor';
}

export class CountryScene extends BaseGameScene {
  private country: Country = 'finland';
  private slot: 1 | 2 = 1;
  private area: 'outdoor' | 'indoor' = 'outdoor';
  private phaseUnsub: (() => void) | null = null;

  constructor() {
    super({
      sceneKey: 'country',
      backgroundKey: 'bg_country_finland_outdoor',
      nodesUrl: '/data/nodes-country_finland_outdoor.json',  // staticOverlay라 사용 안 됨
      staticOverlay: true,
      showsHud: true,   // outdoor/indoor 씬은 HUD 표시 → 배경 우측 110px 비움
    });
  }

  init(data: CountryInit) {
    this.country = data.country;
    this.slot = data.slot;
    this.area = data.area ?? 'outdoor';
    // 동적으로 backgroundKey 변경 — init_은 readonly이므로 cast
    const mutable = this.init_ as { sceneKey: string; backgroundKey: string; nodesUrl: string };
    mutable.backgroundKey = `bg_country_${this.country}_${this.area}`;
    mutable.nodesUrl = `/data/nodes-country_${this.country}_${this.area}.json`;
  }

  protected onSceneReady() {
    const store = useGameStore.getState();

    // 진입 시 phase 보정 (이미 country_map.onArrive가 설정했지만 안전망)
    // intro phase 도 정상 — TeacherIntro 종료 후 game phase 로 자동 전환됨
    const gamePhase = this.minigamePhase();
    const introPhase = `${gamePhase}_intro` as Phase;
    if (store.phase !== gamePhase && store.phase !== introPhase) {
      store.setPhase(introPhase);
    }

    // 방어적: 이전 instance의 phase subscriber 정리 (씬 재진입 시 closure leak 방지)
    if (this.phaseUnsub) { this.phaseUnsub(); this.phaseUnsub = null; }
    // 미니게임 완료(MinigameModal이 country_<slot>_arrived 로 phase 설정) → country_map 복귀
    const unsub = useGameStore.subscribe((s, prev) => {
      if (!this.scene) { unsub(); return; }
      if (prev.phase === s.phase) return;
      const arrivedPhase: Phase = this.slot === 1 ? 'country_1_arrived' : 'country_2_arrived';
      if (s.phase === arrivedPhase) {
        this.scene.start('country_map', { country: this.country, slot: this.slot, position: this.area });
      }
    });
    this.phaseUnsub = unsub;
    const cleanup = () => {
      unsub();
      if (this.phaseUnsub === unsub) this.phaseUnsub = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
  }

  private minigamePhase(): Phase {
    if (this.slot === 1) return this.area === 'outdoor' ? 'country_1_outdoor' : 'country_1_indoor';
    return this.area === 'outdoor' ? 'country_2_outdoor' : 'country_2_indoor';
  }
}
