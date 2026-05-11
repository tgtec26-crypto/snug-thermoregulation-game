# 체온 조절 원정대 (Thermoregulation Quest)

중학교 3학년 과학 「체온 조절(항상성)」 단원의 **정리·심화 활동용** 2D 도트 RPG + 퀴즈 + 미니게임.

학생이 추운 나라(예: 핀란드)와 더운 나라(예: 두바이)를 여행하면서, 외부 환경 변화와 패러독스 실내 환경(추운 나라의 사우나, 더운 나라의 실내 스키장)에서 일어나는 체온 조절 기전을 체험·학습한다.

## 📍 현재 상태: 브레인스토밍 (Q4 답변 대기)

코드는 아직 한 줄도 작성되지 않았습니다. 디자인 스펙이 확정되기 전까지는 어떤 구현도 시작하지 않습니다.

**다음 작업을 이어가려면**: [docs/brainstorm-progress.md](docs/brainstorm-progress.md) 를 먼저 읽으세요. 어디까지 결정됐고, 다음 질문이 무엇인지가 정리되어 있습니다.

## 📚 자료

- [docs/brainstorm-progress.md](docs/brainstorm-progress.md) — 브레인스토밍 진행 기록 (메인 핸드오프 문서)
- [docs/textbook-summary.md](docs/textbook-summary.md) — 4종 교과서(비상·천재·동아·미래엔)의 체온 조절 단원 핵심 비교
- [docs/brainstorm-mockups/](docs/brainstorm-mockups/) — 브레인스토밍 중 사용한 시각 컴패니언 mockup 보관소

## 🔗 참고 프로젝트

| 프로젝트 | 역할 |
|---|---|
| `snug-hormone-game` | 인프라·패턴 재활용 베이스 (Next.js + Phaser + Zustand + admin 시각 편집기) |
| `pizza-expedition` | 좌표 데이터 분리 + `?admin=1` 부트스트랩 패턴의 출처 |
| `snug-online-office` | 자매 시뮬레이터 — 혈당량 조절은 이쪽이 담당하므로 본 게임과 콘텐츠 중복 회피 |

## 🛠 예정 기술 스택 (snug-hormone-game 동일)

- Next.js 16 (App Router) · Phaser 4 · TypeScript · Tailwind CSS 4 · Zustand · Vitest · pnpm
- 배포: Vercel (GitHub 자동)
