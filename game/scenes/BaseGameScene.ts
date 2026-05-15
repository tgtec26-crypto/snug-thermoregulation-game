import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WALK_SPEED, HUD_WIDTH } from '@/game/config';
import type { SceneNodes, NodeConfig } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

export interface BaseSceneInit {
  sceneKey: string;             // ex: 'classroom', 'country_finland_outdoor'
  backgroundKey: string;        // ex: 'bg_classroom'
  nodesUrl: string;             // ex: '/data/nodes-classroom.json'
  playerKey?: string;           // ex: 'player_korea' | 'player_cold' | 'player_hot'
  staticOverlay?: boolean;      // true면 배경만 그리고 노드/플레이어/클릭 모두 스킵 (오버레이 전용 씬)
  showsHud?: boolean;           // true면 우측 HUD_WIDTH 공간 비워둠. false(기본)=풀 폭(1280)
}

/**
 * 공통 동작:
 *  - 배경 그리기
 *  - 노드 JSON 로드 후 시작 노드에 캐릭터 sprite 배치
 *  - 노드 클릭 시 L자 경로로 이동 → 도착 후 onNodeArrive(node) 호출
 *  - 게임 영역은 좌측 GAME_AREA_WIDTH 만, 우측 HUD_WIDTH는 React가 차지
 */
export abstract class BaseGameScene extends Phaser.Scene {
  protected nodesData: SceneNodes | null = null;
  protected player!: Phaser.GameObjects.Sprite;
  protected isMoving = false;
  protected nodeGraphics: Phaser.GameObjects.Graphics | null = null;
  private storeUnsub: (() => void) | null = null;

  constructor(public readonly init_: BaseSceneInit) {
    super({ key: init_.sceneKey });
  }

  preload() {
    // staticOverlay 씬은 노드 JSON 불필요
    if (!this.init_.staticOverlay) {
      this.load.json(`nodes_${this.init_.sceneKey}`, this.init_.nodesUrl);
    }
  }

  create() {
    // HUD를 표시하는 씬만 우측 110px 비워둠. 나머지는 풀 폭 사용.
    const bgWidth = this.init_.showsHud ? (GAME_WIDTH - HUD_WIDTH) : GAME_WIDTH;

    // 배경
    this.add.image(0, 0, this.init_.backgroundKey)
      .setOrigin(0, 0)
      .setDisplaySize(bgWidth, GAME_HEIGHT);

    // staticOverlay 씬: 배경만 그리고 노드/플레이어/클릭 모두 스킵.
    // 진행은 React 오버레이가 phase 변경으로 처리. 씬 전환 트리거는 onSceneReady에서.
    if (this.init_.staticOverlay) {
      this.onSceneReady();
      return;
    }

    // 노드 JSON 파싱
    this.nodesData = this.cache.json.get(`nodes_${this.init_.sceneKey}`) as SceneNodes;
    if (!this.nodesData) {
      console.error(`[${this.init_.sceneKey}] nodes JSON not loaded`);
      return;
    }

    // 시작 노드에 플레이어 배치
    const startNode = this.findNode(this.nodesData.startNode);
    if (!startNode) {
      console.error(`[${this.init_.sceneKey}] startNode "${this.nodesData.startNode}" not found`);
      return;
    }

    // 자매 프로젝트 패턴: <char>_walk_down 스프라이트시트 frame 0을 idle 포즈로 사용
    const playerChar = this.init_.playerKey ?? 'player_korea';
    this.player = this.add.sprite(startNode.x, startNode.y, `${playerChar}_walk_down`, 0)
      .setOrigin(0.5, 1)   // 발 끝이 노드 위치
      .setDisplaySize(80, 150);  // tight crop 자산에 맞춘 캐릭터 표시 크기

    // 노드 클릭 가능 영역 그리기 (디버그 + admin 외부에서도 보임)
    this.drawNodeHandles();

    // store에 노드 정보 발행 (React 오버레이용)
    useGameStore.getState().setActiveNodes(this.nodesData);

    // React 오버레이 클릭 → Phaser 이동 브릿지
    const unsub = useGameStore.subscribe((state, prev) => {
      if (!this.scene) { unsub(); return; }
      if (state.pendingNodeClick && state.pendingNodeClick !== prev.pendingNodeClick) {
        const node = this.findNode(state.pendingNodeClick);
        if (node) this.moveToNode(node);
        useGameStore.getState().clearNodeClick();
      }
    });
    this.storeUnsub = unsub;

    // hook
    this.onSceneReady();
  }

  shutdown() {
    this.storeUnsub?.();
    useGameStore.getState().setActiveNodes(null);
  }

  /** 서브클래스가 추가 초기화할 때 오버라이드 */
  protected onSceneReady(): void {}

  /** 캐릭터가 노드에 도착한 후 호출. 서브클래스가 phase 전환 등 처리. staticOverlay 씬은 사용 안 함. */
  protected onNodeArrive(_node: NodeConfig): void {}

  protected findNode(id: string): NodeConfig | undefined {
    return this.nodesData?.nodes.find(n => n.id === id);
  }

  /** 노드 클릭 핸들 그리기 + 클릭 리스너 */
  protected drawNodeHandles() {
    if (!this.nodesData) return;
    this.nodeGraphics = this.add.graphics();

    this.nodesData.nodes.forEach(n => {
      const radius = 22;

      // labelSvg가 있는 노드는 React 오버레이로 렌더링 → Phaser 원 생략
      if (!n.labelSvg) {
        const color = n.type === 'trigger' ? 0xffd24a : n.type === 'exit' ? 0x88ddaa : 0xaaaaaa;
        this.nodeGraphics!.fillStyle(color, 0.6);
        this.nodeGraphics!.fillCircle(n.x, n.y, radius);
        this.nodeGraphics!.lineStyle(2, 0xffffff, 0.9);
        this.nodeGraphics!.strokeCircle(n.x, n.y, radius);
      }

      // 클릭 영역 (보이지 않는 Zone) — labelSvg 유무와 무관하게 항상 유지
      const zone = this.add.zone(n.x, n.y, radius * 2.4, radius * 2.4).setInteractive();
      zone.on('pointerdown', () => this.moveToNode(n));
    });
  }

  /** 맨해튼(L자) 경로로 이동 후 onNodeArrive 호출 */
  protected moveToNode(node: NodeConfig) {
    if (this.isMoving) return;
    this.isMoving = true;

    const distX = Math.abs(node.x - this.player.x);
    const distY = Math.abs(node.y - this.player.y);
    const durX = (distX / WALK_SPEED) * 1000;
    const durY = (distY / WALK_SPEED) * 1000;

    const dirX: 'left' | 'right' | null =
      node.x > this.player.x ? 'right' : node.x < this.player.x ? 'left' : null;
    const dirY: 'up' | 'down' | null =
      node.y > this.player.y ? 'down' : node.y < this.player.y ? 'up' : null;

    const playerKey = this.init_.playerKey ?? 'player_korea';
    const playAnim = (dir: 'left' | 'right' | 'up' | 'down' | null) => {
      if (!dir) return;
      const animKey = `anim_${playerKey}_walk_${dir}`;
      if (this.anims.exists(animKey)) this.player.play(animKey, true);
    };
    const idle = () => {
      this.player.stop();
      // 마지막 향한 방향의 frame 0(첫 프레임 = idle 포즈)로 정착
      if (this.player.texture.frameTotal > 1) this.player.setFrame(0);
    };

    // 시작 시: X 이동이 있으면 가로 방향 애니메이션, 없으면 곧장 세로 방향
    playAnim(dirX ?? dirY);

    // 가로 먼저 → 세로
    this.tweens.add({
      targets: this.player,
      x: node.x,
      duration: durX,
      ease: 'Linear',
      onComplete: () => {
        playAnim(dirY);   // 세로 구간 시작 시 위/아래 애니메이션으로 전환
        this.tweens.add({
          targets: this.player,
          y: node.y,
          duration: durY,
          ease: 'Linear',
          onComplete: () => {
            idle();
            this.isMoving = false;
            this.onNodeArrive(node);
          },
        });
      },
    });
  }
}
