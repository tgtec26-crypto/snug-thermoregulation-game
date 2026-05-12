import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WALK_SPEED, HUD_WIDTH } from '@/game/config';
import type { SceneNodes, NodeConfig } from '@/game/types';

export interface BaseSceneInit {
  sceneKey: string;             // ex: 'classroom', 'country_finland_outdoor'
  backgroundKey: string;        // ex: 'bg_classroom'
  nodesUrl: string;             // ex: '/data/nodes-classroom.json'
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
  protected player!: Phaser.GameObjects.Image;
  protected isMoving = false;
  protected nodeGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(public readonly init_: BaseSceneInit) {
    super({ key: init_.sceneKey });
  }

  preload() {
    this.load.json(`nodes_${this.init_.sceneKey}`, this.init_.nodesUrl);
  }

  create() {
    const gameAreaW = GAME_WIDTH - HUD_WIDTH;

    // 배경
    this.add.image(0, 0, this.init_.backgroundKey)
      .setOrigin(0, 0)
      .setDisplaySize(gameAreaW, GAME_HEIGHT);

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

    this.player = this.add.image(startNode.x, startNode.y, 'player_idle')
      .setOrigin(0.5, 1)   // 발 끝이 노드 위치
      .setDisplaySize(80, 135);  // 디스플레이 크기 (실제 sprite 110x186 보다 조금 작게)

    // 노드 클릭 가능 영역 그리기 (디버그 + admin 외부에서도 보임)
    this.drawNodeHandles();

    // hook
    this.onSceneReady();
  }

  /** 서브클래스가 추가 초기화할 때 오버라이드 */
  protected onSceneReady(): void {}

  /** 캐릭터가 노드에 도착한 후 호출. 서브클래스가 phase 전환 등 처리 */
  protected abstract onNodeArrive(node: NodeConfig): void;

  protected findNode(id: string): NodeConfig | undefined {
    return this.nodesData?.nodes.find(n => n.id === id);
  }

  /** 노드 클릭 핸들 그리기 + 클릭 리스너 */
  protected drawNodeHandles() {
    if (!this.nodesData) return;
    this.nodeGraphics = this.add.graphics();

    this.nodesData.nodes.forEach(n => {
      const radius = 22;
      const color = n.type === 'trigger' ? 0xffd24a : n.type === 'exit' ? 0x88ddaa : 0xaaaaaa;
      this.nodeGraphics!.fillStyle(color, 0.6);
      this.nodeGraphics!.fillCircle(n.x, n.y, radius);
      this.nodeGraphics!.lineStyle(2, 0xffffff, 0.9);
      this.nodeGraphics!.strokeCircle(n.x, n.y, radius);

      // 클릭 영역 (보이지 않는 Zone)
      const zone = this.add.zone(n.x, n.y, radius * 2.4, radius * 2.4).setInteractive();
      zone.on('pointerdown', () => this.moveToNode(n));
    });
  }

  /** L자(맨해튼) 경로로 이동 후 onNodeArrive 호출 */
  protected moveToNode(node: NodeConfig) {
    if (this.isMoving) return;
    this.isMoving = true;

    const distX = Math.abs(node.x - this.player.x);
    const distY = Math.abs(node.y - this.player.y);
    const durX = (distX / WALK_SPEED) * 1000;
    const durY = (distY / WALK_SPEED) * 1000;

    // 가로 먼저 → 세로 (L자 1)
    this.tweens.add({
      targets: this.player,
      x: node.x,
      duration: durX,
      ease: 'Linear',
      onComplete: () => {
        this.tweens.add({
          targets: this.player,
          y: node.y,
          duration: durY,
          ease: 'Linear',
          onComplete: () => {
            this.isMoving = false;
            this.onNodeArrive(node);
          },
        });
      },
    });
  }
}
