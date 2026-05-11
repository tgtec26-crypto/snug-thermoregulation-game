# AGENTS

> AI 코딩 에이전트(Claude / Gemini / Codex 등)가 이 저장소에서 작업할 때 따라야 할 지침.

## 🚦 현재 단계: 브레인스토밍 (코드 없음)

이 저장소는 **디자인 스펙이 아직 확정되지 않은** 상태입니다. 어떤 구현도 시작하지 마세요.

작업을 이어받으면 가장 먼저:

1. **[docs/brainstorm-progress.md](docs/brainstorm-progress.md)** 를 처음부터 끝까지 읽는다 — 결정된 내용, 미결정 질문, 다음 단계가 정리돼 있다.
2. 사용자가 어디서 멈췄는지 확인하고, 그 지점부터 브레인스토밍을 재개한다.
3. 모든 질문을 마무리하고 사용자가 디자인을 승인한 후에만 `superpowers:writing-plans` 스킬로 넘어간다.

브레인스토밍이 끝나기 전 **`pnpm create next-app` 등 어떤 scaffolding도 실행하지 말 것**.

## 🎯 학습 목표

체온 조절(항상성) 단원의 정리·심화 활동. 학생이 이미 한 번 배운 개념(혈관 수축/확장, 근육 떨림, 땀·기화열, 티록신)을 실제 시나리오에 적용·평가하는 게임.

자세한 학습 목표·범위·결정 사항은 `docs/brainstorm-progress.md` 참조.

## 🧰 참고 패턴

이 게임의 인프라와 상태 머신은 `../snug-hormone-game` 프로젝트의 디자인을 거의 그대로 재활용한다. 코드 작성 단계로 넘어가면 다음 두 문서를 베이스라인으로 삼을 것:

- `../snug-hormone-game/docs/superpowers/specs/2026-05-02-hormone-design.md` (디자인 스펙)
- `../snug-hormone-game/docs/superpowers/plans/2026-05-02-hormone-implementation.md` (구현 계획)

## 🔧 Next.js 사용 시 주의

이 프로젝트는 Next.js 16 App Router를 사용할 예정이다. 학습 데이터에 있는 구버전 Next.js와 API·관례가 다를 수 있으니, scaffolding 후에는 `node_modules/next/dist/docs/` 의 가이드를 먼저 읽고 작업한다.

## 🌐 시각 컴패니언 (브레인스토밍용)

브레인스토밍 단계에서 mockup·다이어그램이 필요하면 `superpowers:brainstorming` 스킬의 visual-companion을 사용한다. 세션 상태는 `.superpowers/` 에 저장되며 **gitignore 처리**되어 있다 (기기 간 공유 X). 이전 mockup 스냅샷은 `docs/brainstorm-mockups/` 에 보관되어 있으니 참고할 것.
