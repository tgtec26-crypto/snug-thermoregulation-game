# 체온 조절 RPG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 체온 조절 RPG MVP — 학급회의 시작 → 4국 자유방문(2국 미션) → 결말까지 한 사이클 완주 가능 + 체온 게이지 시스템 + 공항 퀴즈 + 우측 세로 막대형 HUD + 미니액션(떨림·땀 닦기) + admin 좌표 편집기 v1.

**Architecture:** Next.js 16 App Router + Phaser 4 (Scene 7개: Title/Classroom/Airport/WorldMap/Country/Ending) + React 오버레이(HUDBar·QuizModal·MinigameModal·EndingCard 등) + Zustand store(체온·진행상태·체온 유지 점수·퀴즈 첫시도 추적). 좌표는 `public/data/*.json` 분리 + `/admin` 시각 편집.

**Tech Stack:** Next.js 16, Phaser 4, TypeScript, Tailwind CSS 4, Zustand (persist), Vitest, pnpm, localStorage.

**Spec:** `docs/superpowers/specs/2026-05-12-thermoregulation-design.md` (스펙 §1~§17)

**Scope (MVP only):** 스펙 §13.1 의 13개 MVP 항목. Phase 2(국가별 문화 이벤트) · Polish(BGM, 보너스 자율방문 등)은 본 계획에서 다루지 않음 — MVP 검증 후 별도 계획에서 처리.

---

## Phase 1: 프로젝트 셋업 + 데이터 레이어

### Task 1.1: 기존 디렉토리에 Next.js 16 통합

**배경:** `C:\Users\user\agent\thermoregulation\` 에는 이미 `docs/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`, `.git/` 등이 있다. `create-next-app`은 빈 디렉토리만 허용하므로 임시 폴더에서 생성 후 병합한다.

**Files:**
- Create: `C:\Users\user\agent\thermoregulation\app\` (Next.js 기본 구조)
- Create: `C:\Users\user\agent\thermoregulation\package.json`
- Create: `C:\Users\user\agent\thermoregulation\tsconfig.json`
- Create: `C:\Users\user\agent\thermoregulation\next.config.ts`
- Create: `C:\Users\user\agent\thermoregulation\postcss.config.mjs`
- Create: `C:\Users\user\agent\thermoregulation\eslint.config.mjs`
- Modify: `C:\Users\user\agent\thermoregulation\.gitignore` (Next.js 기본 항목 병합)

- [ ] **Step 1: 임시 디렉토리에 Next.js 프로젝트 생성**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent
  pnpm dlx create-next-app@latest thermoregulation-tmp `
    --typescript --tailwind --app --no-src-dir `
    --import-alias "@/*" --use-pnpm --eslint --no-turbopack `
    --yes
}
```

질문이 추가로 뜨면 모두 기본값(엔터).

- [ ] **Step 2: 생성된 파일을 thermoregulation/로 복사 (기존 docs/, README.md, .gitignore 보존)**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  $src = 'C:\Users\user\agent\thermoregulation-tmp'
  $dst = 'C:\Users\user\agent\thermoregulation'

  # 복사할 항목 (기존 파일 덮어쓰지 않을 것: docs/, AGENTS.md, CLAUDE.md, README.md, .gitignore)
  $items = @('app','public','package.json','tsconfig.json','next.config.ts','next-env.d.ts','postcss.config.mjs','eslint.config.mjs')
  foreach ($i in $items) {
    if (Test-Path "$src\$i") {
      Copy-Item -Path "$src\$i" -Destination "$dst\$i" -Recurse -Force
    }
  }
}
```

- [ ] **Step 3: .gitignore 병합 (Next.js 생성 항목을 기존 파일에 추가, 중복 제외)**

`C:\Users\user\agent\thermoregulation\.gitignore` 끝에 다음 블록을 추가 (이미 있는 항목은 건너뛰기 — 현재 .gitignore 내용 확인 후 누락분만 추가):

```
# next.js (create-next-app 추가본)
.next/
out/
next-env.d.ts

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# vercel
.vercel
```

- [ ] **Step 4: 임시 디렉토리 삭제**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Remove-Item -Path 'C:\Users\user\agent\thermoregulation-tmp' -Recurse -Force
}
```

- [ ] **Step 5: dev 서버로 정상 동작 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm install
}
```

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm dev
}
```

브라우저(Chrome)에서 `http://localhost:3000` 열어 Next.js 기본 페이지 보이면 OK. Ctrl+C로 종료.

- [ ] **Step 6: 첫 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "chore: Next.js 16 + Tailwind 4 + TypeScript 초기 셋업"
}
```

**Expected**: 커밋 성공, `git log --oneline` 시 새 커밋이 보임.

---

### Task 1.2: 게임 의존성 설치 (Phaser 4 + Zustand + Vitest)

**Files:**
- Modify: `package.json` (의존성 + scripts)
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/sanity.test.ts`

- [ ] **Step 1: Phaser + Zustand 설치**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm add phaser zustand
}
```

- [ ] **Step 2: Vitest + 테스트 의존성 설치**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
}
```

- [ ] **Step 3: package.json scripts 갱신**

`package.json`의 `"scripts"` 섹션을 다음과 같이 수정:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 4: vitest.config.ts 생성**

`C:\Users\user\agent\thermoregulation\vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 5: tests/setup.ts 생성**

`C:\Users\user\agent\thermoregulation\tests\setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: sanity 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\sanity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: 테스트 실행**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test
}
```

**Expected**: `1 passed`.

- [ ] **Step 8: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "chore: Phaser 4 + Zustand + Vitest 설치 + sanity 테스트"
}
```

---

### Task 1.3: 디렉토리 구조 + 게임 상수 + 타입 + 한글 폰트

**Files:**
- Create: `game/config.ts`
- Create: `game/types.ts`
- Create: `game/utils/textStyle.ts`
- Create: `app/fonts.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: 디렉토리 생성**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  New-Item -ItemType Directory -Force -Path `
    game\scenes, game\data, game\systems, game\utils, `
    components\overlays, hooks, store, `
    public\assets\backgrounds, public\assets\sprites, public\assets\icons, `
    public\data, `
    tests\game, tests\components | Out-Null
}
```

- [ ] **Step 2: 게임 상수 작성**

`C:\Users\user\agent\thermoregulation\game\config.ts`:

```typescript
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 800;

// HUD 우측 사이드바 (스펙 §5.1)
export const HUD_WIDTH = 110;
export const GAME_AREA_WIDTH = GAME_WIDTH - HUD_WIDTH;

// 캐릭터 sprite 표시 크기 (스펙 §3.2, snug-hormone-game 답습)
export const CHARACTER_FRAME_WIDTH = 110;
export const CHARACTER_FRAME_HEIGHT = 186;

// 이동 속도 (px/second)
export const WALK_SPEED = 280;

// 체온 시스템 상수 (스펙 §6)
export const TEMP_INITIAL = 36.5;        // 시작 체온
export const TEMP_SAFE_MIN = 35.5;       // 적정 녹색대 하한
export const TEMP_SAFE_MAX = 37.5;       // 적정 녹색대 상한
export const TEMP_DANGER_LOW = 33.0;     // 막대 표시 최저
export const TEMP_DANGER_HIGH = 40.0;    // 막대 표시 최고
export const TEMP_TICK_MS = 500;         // 0.5초마다 체온 변화 적용

// 게임 phase별 환경 변화율 (℃/초, 스펙 §6.2)
export const ENV_TEMP_DELTA_PER_SEC = {
  cold_outdoor: -0.05,
  cold_indoor:  +0.08,
  hot_outdoor:  +0.05,
  hot_indoor:   -0.04,
  neutral:       0,
} as const;

// 미니게임 성공/실패 효과 (스펙 §6.3)
export const MINIGAME_SUCCESS_DELTA = 0.3;  // 체온 ±0.3℃ 회복

// 위험 범위 자동 회복 (스펙 §6.4)
export const DANGER_AUTO_RECOVERY_DELAY_MS = 4000;
export const DANGER_AUTO_RECOVERY_DELTA = 0.25;

// 4국 ID
export const COUNTRY_IDS = ['finland', 'canada', 'dubai', 'egypt'] as const;
```

- [ ] **Step 3: 타입 정의**

`C:\Users\user\agent\thermoregulation\game\types.ts`:

```typescript
export type Country = 'finland' | 'canada' | 'dubai' | 'egypt';
export type CountryGroup = 'cold' | 'hot';  // 'finland'·'canada' = cold, 'dubai'·'egypt' = hot

export type Phase =
  | 'title'
  | 'classroom_intro'        // 도입 멘트
  | 'classroom_choose_cold'  // 추 선택
  | 'classroom_choose_hot'   // 더 선택
  | 'classroom_rps_cold'     // 추 가위바위보
  | 'classroom_rps_hot'      // 더 가위바위보
  | 'classroom_depart'       // 출발 멘트
  | 'airport_start'          // 출발국 공항 퀴즈
  | 'worldmap_to_1'          // 비행기 컷씬: 한국 → 1국
  | 'country_1_arrived'      // 1국 공항 도착
  | 'country_1_outdoor'      // 1국 야외
  | 'country_1_indoor'       // 1국 실내
  | 'airport_1'              // 1국 공항 퀴즈
  | 'worldmap_to_2'          // 비행기 컷씬: 1국 → 2국
  | 'country_2_arrived'
  | 'country_2_outdoor'
  | 'country_2_indoor'
  | 'airport_2'              // 2국 공항 퀴즈
  | 'worldmap_to_home'       // 비행기 컷씬: 2국 → 한국
  | 'ending';

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'win' | 'lose' | 'draw';

export type EnvironmentType =
  | 'cold_outdoor' | 'cold_indoor'
  | 'hot_outdoor'  | 'hot_indoor'
  | 'neutral';

export type VesselState = 'constricted' | 'normal' | 'dilated';

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];          // length 4
  answerIndex: number;        // 0~3
  category: 'cold_response' | 'hot_response' | 'neuro_vs_hormone';
  explanation: string;        // 정답 선택 시 1줄 해설
}

export interface CountryConfig {
  id: Country;
  group: CountryGroup;
  displayName: string;        // "🇫🇮 핀란드 라플란드"
  flagEmoji: string;          // "🇫🇮"
  outdoorEnv: EnvironmentType;  // 'cold_outdoor' / 'hot_outdoor'
  indoorEnv: EnvironmentType;   // 'cold_indoor' / 'hot_indoor'  ← 패러독스
  outdoorLabel: string;       // "라플란드 시내 (-15℃)"
  indoorLabel: string;        // "사우나 (+85℃)"
  rpsNpcName: string;         // 학급 친구 이름 (이 나라 가고 싶다는)
}

export interface NodeConfig {
  id: string;
  x: number;
  y: number;
  type: 'walk' | 'trigger' | 'exit';
  label?: string;             // 디버그용
  action?: string;             // 트리거 시 dispatch할 phase 전환 등
}

export interface SceneNodes {
  scene: string;              // 'classroom' | 'airport_start' | 'country_finland_outdoor' 등
  startNode: string;          // 캐릭터 입장 위치
  nodes: NodeConfig[];
}
```

- [ ] **Step 4: 한글 폰트 + 텍스트 스타일 헬퍼**

`C:\Users\user\agent\thermoregulation\app\fonts.ts`:

```typescript
export const koreanFontStack =
  'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
```

`C:\Users\user\agent\thermoregulation\game\utils\textStyle.ts`:

```typescript
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
```

- [ ] **Step 5: globals.css 한글 줄바꿈 + 픽셀 렌더링 규칙 추가**

`C:\Users\user\agent\thermoregulation\app\globals.css` 끝에 추가:

```css
/* CLAUDE.md 글로벌 규칙: 한글 음절 단위 끊김 방지 */
* {
  word-break: keep-all;
  overflow-wrap: break-word;
}

html, body {
  font-family: Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
  background: #000;
  color: #fff;
  margin: 0;
  padding: 0;
}

/* 도트 이미지 픽셀 렌더링 (스펙 §3.1) */
img.pixelated, canvas {
  image-rendering: pixelated;
}
```

- [ ] **Step 6: layout.tsx 한글 lang 설정**

`C:\Users\user\agent\thermoregulation\app\layout.tsx`의 `<html lang="en">` → `<html lang="ko">`로 수정.

- [ ] **Step 7: tsc 검증**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

**Expected**: 오류 없음.

- [ ] **Step 8: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat: 게임 디렉토리 구조 + 상수 + 타입 + 한글 폰트"
}
```

---

### Task 1.4: 4국 데이터 (countries.ts)

**Files:**
- Create: `game/data/countries.ts`
- Create: `tests/game/countries.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\game\countries.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { COUNTRIES, getCountryById, getCountriesByGroup } from '@/game/data/countries';

describe('countries', () => {
  it('정확히 4국이 있다', () => {
    expect(COUNTRIES).toHaveLength(4);
  });

  it('추운 나라 2개 + 더운 나라 2개', () => {
    expect(getCountriesByGroup('cold')).toHaveLength(2);
    expect(getCountriesByGroup('hot')).toHaveLength(2);
  });

  it('각 국가는 야외/실내 환경이 서로 반대 (패러독스)', () => {
    COUNTRIES.forEach(c => {
      if (c.group === 'cold') {
        expect(c.outdoorEnv).toBe('cold_outdoor');
        expect(c.indoorEnv).toBe('cold_indoor'); // cold_indoor = 사우나 (더운 실내)
      } else {
        expect(c.outdoorEnv).toBe('hot_outdoor');
        expect(c.indoorEnv).toBe('hot_indoor');  // hot_indoor = 실내 스키장 (추운 실내)
      }
    });
  });

  it('getCountryById 조회 가능', () => {
    expect(getCountryById('finland')?.flagEmoji).toBe('🇫🇮');
    expect(getCountryById('egypt')?.group).toBe('hot');
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test countries
}
```

**Expected**: FAIL with "Cannot find module '@/game/data/countries'".

- [ ] **Step 3: countries.ts 작성**

`C:\Users\user\agent\thermoregulation\game\data\countries.ts`:

```typescript
import type { Country, CountryConfig, CountryGroup } from '@/game/types';

export const COUNTRIES: CountryConfig[] = [
  {
    id: 'finland',
    group: 'cold',
    displayName: '🇫🇮 핀란드 라플란드',
    flagEmoji: '🇫🇮',
    outdoorEnv: 'cold_outdoor',
    indoorEnv: 'cold_indoor',
    outdoorLabel: '라플란드 시내 (-15℃)',
    indoorLabel: '핀란드식 사우나 (+85℃)',
    rpsNpcName: '민준',
  },
  {
    id: 'canada',
    group: 'cold',
    displayName: '🇨🇦 캐나다 옐로나이프',
    flagEmoji: '🇨🇦',
    outdoorEnv: 'cold_outdoor',
    indoorEnv: 'cold_indoor',
    outdoorLabel: '옐로나이프 호숫가 (-30℃)',
    indoorLabel: '노천 핫스프링 (+38℃)',
    rpsNpcName: '서연',
  },
  {
    id: 'dubai',
    group: 'hot',
    displayName: '🇦🇪 UAE 두바이',
    flagEmoji: '🇦🇪',
    outdoorEnv: 'hot_outdoor',
    indoorEnv: 'hot_indoor',
    outdoorLabel: '두바이 사막 (+45℃)',
    indoorLabel: '스키두바이 실내 스키장 (-3℃)',
    rpsNpcName: '도윤',
  },
  {
    id: 'egypt',
    group: 'hot',
    displayName: '🇪🇬 이집트 카이로',
    flagEmoji: '🇪🇬',
    outdoorEnv: 'hot_outdoor',
    indoorEnv: 'hot_indoor',
    outdoorLabel: '기자 피라미드 (+40℃)',
    indoorLabel: '알렉산드리아 카타콤 (서늘)',
    rpsNpcName: '하은',
  },
];

export function getCountryById(id: Country): CountryConfig | undefined {
  return COUNTRIES.find(c => c.id === id);
}

export function getCountriesByGroup(group: CountryGroup): CountryConfig[] {
  return COUNTRIES.filter(c => c.group === group);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test countries
}
```

**Expected**: 4 passed.

- [ ] **Step 5: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(data): 4개국(핀란드·캐나다·UAE·이집트) 데이터"
}
```

---

### Task 1.5: 퀴즈 풀 (quizPool.ts)

**Files:**
- Create: `game/data/quizPool.ts`
- Create: `tests/game/quizPool.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\game\quizPool.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { QUIZ_POOL, drawQuiz } from '@/game/data/quizPool';

describe('quizPool', () => {
  it('최소 15문제 이상 보유', () => {
    expect(QUIZ_POOL.length).toBeGreaterThanOrEqual(15);
  });

  it('모든 문제는 4개 선택지 + 0~3 정답 인덱스', () => {
    QUIZ_POOL.forEach(q => {
      expect(q.choices).toHaveLength(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThanOrEqual(3);
    });
  });

  it('3개 카테고리 모두 최소 5문제씩', () => {
    const cats = ['cold_response', 'hot_response', 'neuro_vs_hormone'] as const;
    cats.forEach(cat => {
      const inCat = QUIZ_POOL.filter(q => q.category === cat);
      expect(inCat.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('drawQuiz는 제외 목록에 없는 문제만 반환', () => {
    const excluded = QUIZ_POOL.slice(0, 14).map(q => q.id);
    const drawn = drawQuiz(excluded);
    expect(drawn).not.toBeNull();
    expect(excluded).not.toContain(drawn!.id);
  });

  it('drawQuiz는 모든 문제가 제외되면 null 반환', () => {
    const excluded = QUIZ_POOL.map(q => q.id);
    const drawn = drawQuiz(excluded);
    expect(drawn).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test quizPool
}
```

**Expected**: FAIL.

- [ ] **Step 3: quizPool.ts 작성**

`C:\Users\user\agent\thermoregulation\game\data\quizPool.ts`:

```typescript
import type { QuizQuestion } from '@/game/types';

export const QUIZ_POOL: QuizQuestion[] = [
  // === cold_response (추울 때 반응) ===
  {
    id: 'c1',
    category: 'cold_response',
    question: '추운 환경에 노출되었을 때, 피부의 혈관에서 일어나는 변화는?',
    choices: ['확장된다', '수축한다', '없어진다', '두꺼워진다'],
    answerIndex: 1,
    explanation: '👍 혈관이 수축해서 피부 표면의 열 손실을 줄여요.',
  },
  {
    id: 'c2',
    category: 'cold_response',
    question: '추울 때 근육이 떨리는 까닭은?',
    choices: ['열을 발산하기 위해', '열을 발생시키기 위해', '땀을 내기 위해', '혈관을 식히기 위해'],
    answerIndex: 1,
    explanation: '👍 근육 떨림은 열을 발생시켜 체온을 유지해요.',
  },
  {
    id: 'c3',
    category: 'cold_response',
    question: '추울 때 갑상샘에서 분비량이 증가하는 호르몬은?',
    choices: ['인슐린', '글루카곤', '티록신', '아드레날린'],
    answerIndex: 2,
    explanation: '👍 티록신은 세포 호흡을 촉진해 열 발생을 늘려요.',
  },
  {
    id: 'c4',
    category: 'cold_response',
    question: '티록신이 체온 조절에서 하는 일은?',
    choices: ['땀을 내게 한다', '세포 호흡을 촉진해 열을 만든다', '혈관을 확장한다', '근육을 식힌다'],
    answerIndex: 1,
    explanation: '👍 티록신 → 세포 호흡 ↑ → 열 발생 ↑.',
  },
  {
    id: 'c5',
    category: 'cold_response',
    question: '추울 때 우리 몸이 보이는 반응이 아닌 것은?',
    choices: ['혈관 수축', '근육 떨림', '땀 분비 증가', '티록신 증가'],
    answerIndex: 2,
    explanation: '👍 땀은 더울 때 늘어나요. 추울 때는 줄어들어요.',
  },

  // === hot_response (더울 때 반응) ===
  {
    id: 'h1',
    category: 'hot_response',
    question: '더운 환경에 노출되었을 때, 피부의 혈관에서 일어나는 변화는?',
    choices: ['수축한다', '확장한다', '두꺼워진다', '얇아진다'],
    answerIndex: 1,
    explanation: '👍 혈관이 확장되어 피부 표면으로 열을 더 많이 내보내요.',
  },
  {
    id: 'h2',
    category: 'hot_response',
    question: '땀이 증발할 때 우리 몸에서 일어나는 일은?',
    choices: ['열을 흡수해 체온을 낮춘다', '열을 더 발생시킨다', '아무 변화 없다', '근육이 떨린다'],
    answerIndex: 0,
    explanation: '👍 땀이 증발할 때 기화열로 열을 가져가서 체온이 내려가요.',
  },
  {
    id: 'h3',
    category: 'hot_response',
    question: '운동 후 얼굴이 빨개지는 까닭은?',
    choices: ['혈관이 수축해서', '혈관이 확장되어 열을 발산해서', '땀이 멈춰서', '근육이 떨려서'],
    answerIndex: 1,
    explanation: '👍 혈관 확장으로 피부에 피가 많이 가서 열을 더 발산해요.',
  },
  {
    id: 'h4',
    category: 'hot_response',
    question: '더울 때 우리 몸이 보이는 반응이 아닌 것은?',
    choices: ['혈관 확장', '땀 분비 증가', '근육 떨림', '기화열 발산'],
    answerIndex: 2,
    explanation: '👍 근육 떨림은 추울 때 일어나요.',
  },
  {
    id: 'h5',
    category: 'hot_response',
    question: '기화열이란?',
    choices: ['물이 끓을 때 나오는 열', '물이 증발할 때 흡수하는 열', '얼음이 녹을 때 내는 열', '근육이 만드는 열'],
    answerIndex: 1,
    explanation: '👍 물(땀)이 수증기가 될 때 주변 열을 흡수해요.',
  },

  // === neuro_vs_hormone (신경 vs 호르몬 비교) ===
  {
    id: 'n1',
    category: 'neuro_vs_hormone',
    question: '신경 작용의 특징은?',
    choices: ['느리고 지속적', '빠르고 일시적', '느리고 일시적', '빠르고 지속적'],
    answerIndex: 1,
    explanation: '👍 신경은 빠르게 작용하고 그 효과가 짧아요.',
  },
  {
    id: 'n2',
    category: 'neuro_vs_hormone',
    question: '호르몬 작용의 특징은?',
    choices: ['빠르고 일시적', '느리지만 지속적', '느리고 일시적', '빠르고 지속적'],
    answerIndex: 1,
    explanation: '👍 호르몬은 천천히 시작되지만 효과가 오래 지속돼요.',
  },
  {
    id: 'n3',
    category: 'neuro_vs_hormone',
    question: '체온 조절에서 신경 작용에 해당하는 것은?',
    choices: ['티록신 분비', '혈관 수축', '항이뇨호르몬', '인슐린'],
    answerIndex: 1,
    explanation: '👍 혈관 수축은 자율신경계가 즉시 일으키는 반응이에요.',
  },
  {
    id: 'n4',
    category: 'neuro_vs_hormone',
    question: '체온 조절에서 호르몬 작용에 해당하는 것은?',
    choices: ['근육 떨림', '땀 분비', '티록신에 의한 세포 호흡 촉진', '혈관 확장'],
    answerIndex: 2,
    explanation: '👍 티록신은 호르몬이고, 세포 호흡 촉진으로 열을 만들어요.',
  },
  {
    id: 'n5',
    category: 'neuro_vs_hormone',
    question: '체온 조절의 중추 기관은?',
    choices: ['소뇌', '연수', '간뇌', '척수'],
    answerIndex: 2,
    explanation: '👍 간뇌가 체온 조절의 중추예요. 피부의 온도 정보를 받아 신경·호르몬을 조절해요.',
  },
];

export function drawQuiz(excludeIds: string[]): QuizQuestion | null {
  const available = QUIZ_POOL.filter(q => !excludeIds.includes(q.id));
  if (available.length === 0) return null;
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test quizPool
}
```

**Expected**: 5 passed.

- [ ] **Step 5: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(data): 공항 퀴즈 풀 15문항 (3카테고리 × 5)"
}
```

---

### Task 1.6: 씬 노드 config JSON 템플릿

**배경:** 각 씬의 노드 좌표는 `public/data/nodes-<scene>.json`에 분리한다. 초기값은 화면 중앙 등 합리적 위치, 추후 `/admin`에서 드래그로 수정.

**Files:**
- Create: `public/data/nodes-classroom.json`
- Create: `public/data/nodes-airport_start.json`
- Create: `public/data/nodes-airport_finland.json`
- Create: `public/data/nodes-airport_canada.json`
- Create: `public/data/nodes-airport_dubai.json`
- Create: `public/data/nodes-airport_egypt.json`
- Create: `public/data/nodes-country_finland_outdoor.json`
- Create: `public/data/nodes-country_finland_indoor.json`
- Create: `public/data/nodes-country_canada_outdoor.json`
- Create: `public/data/nodes-country_canada_indoor.json`
- Create: `public/data/nodes-country_dubai_outdoor.json`
- Create: `public/data/nodes-country_dubai_indoor.json`
- Create: `public/data/nodes-country_egypt_outdoor.json`
- Create: `public/data/nodes-country_egypt_indoor.json`
- Create: `public/data/nodes-worldmap.json`
- Create: `public/data/nodes-ending.json`

- [ ] **Step 1: classroom 노드**

`C:\Users\user\agent\thermoregulation\public\data\nodes-classroom.json`:

```json
{
  "scene": "classroom",
  "startNode": "entry",
  "nodes": [
    { "id": "entry",     "x": 640, "y": 700, "type": "walk",    "label": "교실 입구" },
    { "id": "choose",    "x": 640, "y": 400, "type": "trigger", "label": "학급회의 위치", "action": "classroom_choose_cold" },
    { "id": "depart",    "x": 1100, "y": 700, "type": "exit",   "label": "교실 출구 → 공항", "action": "airport_start" }
  ]
}
```

- [ ] **Step 2: 4개 공항 노드 (출발국 + 4국 공항, 공통 구조)**

각 공항 파일은 동일 구조. `nodes-airport_start.json`:

```json
{
  "scene": "airport_start",
  "startNode": "entry",
  "nodes": [
    { "id": "entry", "x": 200, "y": 600, "type": "walk",    "label": "공항 입구" },
    { "id": "gate",  "x": 640, "y": 400, "type": "trigger", "label": "탑승 게이트", "action": "airport_quiz" },
    { "id": "board", "x": 1100, "y": 400, "type": "exit",   "label": "탑승", "action": "next_phase" }
  ]
}
```

같은 형식으로 `nodes-airport_finland.json`, `nodes-airport_canada.json`, `nodes-airport_dubai.json`, `nodes-airport_egypt.json` 생성 (내용은 `scene` 필드만 각각 `airport_finland`·`airport_canada`·`airport_dubai`·`airport_egypt`로 변경).

- [ ] **Step 3: 4국 야외/실내 노드 (공통 구조 × 8개)**

`nodes-country_finland_outdoor.json`:

```json
{
  "scene": "country_finland_outdoor",
  "startNode": "entry",
  "nodes": [
    { "id": "entry",      "x": 200, "y": 600, "type": "walk",    "label": "야외 도착" },
    { "id": "minigame",   "x": 640, "y": 400, "type": "trigger", "label": "추위 반응 미니액션", "action": "minigame_shiver" },
    { "id": "exit_indoor","x": 1100, "y": 400, "type": "exit",   "label": "실내로", "action": "next_phase" }
  ]
}
```

다른 7개 파일도 동일 구조로 생성. `scene` 필드와 `action`(미니게임 종류)만 변경:

| 파일 | scene | minigame action |
|---|---|---|
| `nodes-country_finland_indoor.json` | `country_finland_indoor` | `minigame_sweat` |
| `nodes-country_canada_outdoor.json` | `country_canada_outdoor` | `minigame_shiver` |
| `nodes-country_canada_indoor.json` | `country_canada_indoor` | `minigame_sweat` |
| `nodes-country_dubai_outdoor.json` | `country_dubai_outdoor` | `minigame_sweat` |
| `nodes-country_dubai_indoor.json` | `country_dubai_indoor` | `minigame_shiver` |
| `nodes-country_egypt_outdoor.json` | `country_egypt_outdoor` | `minigame_sweat` |
| `nodes-country_egypt_indoor.json` | `country_egypt_indoor` | `minigame_shiver` |

- [ ] **Step 4: worldmap + ending 노드**

`nodes-worldmap.json`:

```json
{
  "scene": "worldmap",
  "startNode": "korea",
  "nodes": [
    { "id": "korea",   "x": 900, "y": 400, "type": "walk", "label": "🇰🇷 한국" },
    { "id": "finland", "x": 700, "y": 200, "type": "walk", "label": "🇫🇮 핀란드" },
    { "id": "canada",  "x": 300, "y": 250, "type": "walk", "label": "🇨🇦 캐나다" },
    { "id": "dubai",   "x": 800, "y": 500, "type": "walk", "label": "🇦🇪 두바이" },
    { "id": "egypt",   "x": 750, "y": 450, "type": "walk", "label": "🇪🇬 이집트" }
  ]
}
```

`nodes-ending.json`:

```json
{
  "scene": "ending",
  "startNode": "entry",
  "nodes": [
    { "id": "entry",   "x": 200, "y": 600, "type": "walk",    "label": "교실 복귀" },
    { "id": "podium",  "x": 640, "y": 400, "type": "trigger", "label": "발표 위치", "action": "ending_card" }
  ]
}
```

- [ ] **Step 5: 검증 — JSON 파싱 테스트**

`C:\Users\user\agent\thermoregulation\tests\game\nodes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../public/data');

const SCENES = [
  'classroom',
  'airport_start', 'airport_finland', 'airport_canada', 'airport_dubai', 'airport_egypt',
  'country_finland_outdoor', 'country_finland_indoor',
  'country_canada_outdoor', 'country_canada_indoor',
  'country_dubai_outdoor', 'country_dubai_indoor',
  'country_egypt_outdoor', 'country_egypt_indoor',
  'worldmap', 'ending',
];

describe('scene node JSON', () => {
  SCENES.forEach(scene => {
    it(`${scene} 파일이 존재하고 유효한 JSON이다`, () => {
      const filepath = path.join(DATA_DIR, `nodes-${scene}.json`);
      expect(fs.existsSync(filepath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      expect(content.scene).toBe(scene);
      expect(content.startNode).toBeTruthy();
      expect(Array.isArray(content.nodes)).toBe(true);
      expect(content.nodes.length).toBeGreaterThan(0);
    });
  });
});
```

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test nodes
}
```

**Expected**: 16 passed.

- [ ] **Step 6: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(data): 16개 씬 노드 좌표 JSON 템플릿 (admin에서 추후 편집)"
}
```

---

## Phase 2: 상태 관리 시스템

### Task 2.1: Zustand 스토어 + Phase 머신

**Files:**
- Create: `store/gameStore.ts`
- Create: `tests/store/gameStore.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\store\gameStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { TEMP_INITIAL } from '@/game/config';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('초기 상태가 올바르다', () => {
    const s = useGameStore.getState();
    expect(s.phase).toBe('title');
    expect(s.nickname).toBe('');
    expect(s.currentTemp).toBe(TEMP_INITIAL);
    expect(s.inSafeZoneTicks).toBe(0);
    expect(s.totalTicks).toBe(0);
    expect(s.chosenCold).toBeNull();
    expect(s.chosenHot).toBeNull();
    expect(s.actualCold).toBeNull();
    expect(s.actualHot).toBeNull();
    expect(s.completedCountries).toEqual([]);
    expect(s.airportQuizFirstCorrect).toBe(0);
    expect(s.airportQuizAttemptedIds).toEqual([]);
  });

  it('setPhase로 phase 전환', () => {
    useGameStore.getState().setPhase('classroom_intro');
    expect(useGameStore.getState().phase).toBe('classroom_intro');
  });

  it('setNickname 저장', () => {
    useGameStore.getState().setNickname('태형');
    expect(useGameStore.getState().nickname).toBe('태형');
  });

  it('adjustTemp는 누적', () => {
    useGameStore.getState().adjustTemp(0.3);
    expect(useGameStore.getState().currentTemp).toBeCloseTo(TEMP_INITIAL + 0.3, 5);
    useGameStore.getState().adjustTemp(-0.5);
    expect(useGameStore.getState().currentTemp).toBeCloseTo(TEMP_INITIAL - 0.2, 5);
  });

  it('chooseCold / chooseHot 저장', () => {
    useGameStore.getState().chooseCold('finland');
    expect(useGameStore.getState().chosenCold).toBe('finland');
    useGameStore.getState().chooseHot('egypt');
    expect(useGameStore.getState().chosenHot).toBe('egypt');
  });

  it('setActualCountries 저장', () => {
    useGameStore.getState().setActualCountries('canada', 'dubai');
    expect(useGameStore.getState().actualCold).toBe('canada');
    expect(useGameStore.getState().actualHot).toBe('dubai');
  });

  it('completeCountry는 중복 없이 누적', () => {
    useGameStore.getState().completeCountry('finland');
    useGameStore.getState().completeCountry('finland');
    useGameStore.getState().completeCountry('egypt');
    expect(useGameStore.getState().completedCountries).toEqual(['finland', 'egypt']);
  });

  it('recordTick은 적정 범위에서만 inSafeZone 증가', () => {
    const s = useGameStore.getState();
    s.recordTick(); // currentTemp = 36.5 (적정)
    expect(useGameStore.getState().inSafeZoneTicks).toBe(1);
    expect(useGameStore.getState().totalTicks).toBe(1);

    useGameStore.getState().adjustTemp(2); // 38.5 → 고체온
    useGameStore.getState().recordTick();
    expect(useGameStore.getState().inSafeZoneTicks).toBe(1); // 증가 안 함
    expect(useGameStore.getState().totalTicks).toBe(2);
  });

  it('recordQuizAttempt — 첫 시도 정답 시 firstCorrect 증가', () => {
    const s = useGameStore.getState();
    s.recordQuizAttempt('c1', true);
    expect(useGameStore.getState().airportQuizFirstCorrect).toBe(1);
    expect(useGameStore.getState().airportQuizAttemptedIds).toContain('c1');
  });

  it('recordQuizAttempt — 첫 시도 오답이면 firstCorrect 변화 없음', () => {
    const s = useGameStore.getState();
    s.recordQuizAttempt('c1', false);
    expect(useGameStore.getState().airportQuizFirstCorrect).toBe(0);
    expect(useGameStore.getState().airportQuizAttemptedIds).toContain('c1');
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test gameStore
}
```

**Expected**: FAIL "Cannot find module '@/store/gameStore'".

- [ ] **Step 3: gameStore.ts 작성**

`C:\Users\user\agent\thermoregulation\store\gameStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Phase, Country, VesselState,
} from '@/game/types';
import { TEMP_INITIAL, TEMP_SAFE_MIN, TEMP_SAFE_MAX } from '@/game/config';

export interface GameState {
  // 식별
  nickname: string;

  // 진행 상태
  phase: Phase;
  chosenCold: Country | null;
  chosenHot: Country | null;
  actualCold: Country | null;
  actualHot: Country | null;
  completedCountries: Country[];

  // 체온 시스템
  currentTemp: number;
  inSafeZoneTicks: number;
  totalTicks: number;

  // 보조 인디케이터
  vesselState: VesselState;
  sweatLevel: number;        // 0~100
  thyroxineLevel: number;    // 0~100

  // 퀴즈
  airportQuizAttemptedIds: string[];   // 출제된 적 있는 문제 ID (모든 공항 합산)
  airportQuizFirstCorrect: number;     // 첫 시도에 정답 맞춘 수
  airportQuizTotalAttempts: number;    // 공항 퀴즈 총 시도 수 (오답 포함)

  // 위치 (저장/복원)
  characterPos: { x: number; y: number };

  // 액션
  setPhase: (p: Phase) => void;
  setNickname: (n: string) => void;
  chooseCold: (c: Country) => void;
  chooseHot: (c: Country) => void;
  setActualCountries: (cold: Country, hot: Country) => void;
  completeCountry: (c: Country) => void;
  adjustTemp: (delta: number) => void;
  setVesselState: (v: VesselState) => void;
  setSweatLevel: (n: number) => void;
  setThyroxineLevel: (n: number) => void;
  recordTick: () => void;
  recordQuizAttempt: (questionId: string, wasFirstAttempt: boolean) => void;
  setCharacterPos: (x: number, y: number) => void;
  reset: () => void;
}

const initialState: Omit<GameState,
  | 'setPhase' | 'setNickname' | 'chooseCold' | 'chooseHot' | 'setActualCountries'
  | 'completeCountry' | 'adjustTemp' | 'setVesselState' | 'setSweatLevel'
  | 'setThyroxineLevel' | 'recordTick' | 'recordQuizAttempt' | 'setCharacterPos'
  | 'reset'
> = {
  nickname: '',
  phase: 'title',
  chosenCold: null,
  chosenHot: null,
  actualCold: null,
  actualHot: null,
  completedCountries: [],
  currentTemp: TEMP_INITIAL,
  inSafeZoneTicks: 0,
  totalTicks: 0,
  vesselState: 'normal',
  sweatLevel: 0,
  thyroxineLevel: 0,
  airportQuizAttemptedIds: [],
  airportQuizFirstCorrect: 0,
  airportQuizTotalAttempts: 0,
  characterPos: { x: 640, y: 700 },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setNickname: (nickname) => set({ nickname }),
      chooseCold: (chosenCold) => set({ chosenCold }),
      chooseHot: (chosenHot) => set({ chosenHot }),
      setActualCountries: (actualCold, actualHot) => set({ actualCold, actualHot }),

      completeCountry: (c) => set((s) => ({
        completedCountries: s.completedCountries.includes(c)
          ? s.completedCountries
          : [...s.completedCountries, c],
      })),

      adjustTemp: (delta) => set((s) => ({
        currentTemp: Math.max(33, Math.min(40, s.currentTemp + delta)),
      })),

      setVesselState: (vesselState) => set({ vesselState }),
      setSweatLevel: (sweatLevel) => set({ sweatLevel: Math.max(0, Math.min(100, sweatLevel)) }),
      setThyroxineLevel: (thyroxineLevel) => set({ thyroxineLevel: Math.max(0, Math.min(100, thyroxineLevel)) }),

      recordTick: () => set((s) => {
        const inSafe = s.currentTemp >= TEMP_SAFE_MIN && s.currentTemp <= TEMP_SAFE_MAX;
        return {
          totalTicks: s.totalTicks + 1,
          inSafeZoneTicks: s.inSafeZoneTicks + (inSafe ? 1 : 0),
        };
      }),

      recordQuizAttempt: (questionId, wasFirstAttempt) => set((s) => {
        const alreadyAttempted = s.airportQuizAttemptedIds.includes(questionId);
        return {
          airportQuizAttemptedIds: alreadyAttempted
            ? s.airportQuizAttemptedIds
            : [...s.airportQuizAttemptedIds, questionId],
          airportQuizTotalAttempts: s.airportQuizTotalAttempts + 1,
          airportQuizFirstCorrect: wasFirstAttempt
            ? s.airportQuizFirstCorrect + 1
            : s.airportQuizFirstCorrect,
        };
      }),

      setCharacterPos: (x, y) => set({ characterPos: { x, y } }),

      reset: () => set(initialState),
    }),
    {
      name: 'thermoregulation-game',
      partialize: (state) => {
        // 함수 제외하고 상태값만 persist
        const { setPhase: _1, setNickname: _2, chooseCold: _3, chooseHot: _4,
          setActualCountries: _5, completeCountry: _6, adjustTemp: _7,
          setVesselState: _8, setSweatLevel: _9, setThyroxineLevel: _10,
          recordTick: _11, recordQuizAttempt: _12, setCharacterPos: _13, reset: _14,
          ...persistable } = state;
        return persistable;
      },
    }
  )
);
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test gameStore
}
```

**Expected**: 10 passed.

- [ ] **Step 5: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(store): Zustand 게임 스토어 + persist + Phase 머신"
}
```

---

### Task 2.2: temperatureSystem (환경 변화율 + 액션 효과 + 위험 회복)

**Files:**
- Create: `game/systems/temperatureSystem.ts`
- Create: `tests/game/temperatureSystem.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\game\temperatureSystem.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  computeEnvironmentDelta,
  isInDangerZone,
  isInSafeZone,
  computeAutoRecoveryDelta,
} from '@/game/systems/temperatureSystem';

describe('temperatureSystem', () => {
  describe('computeEnvironmentDelta', () => {
    it('cold_outdoor에서 1초당 -0.05℃', () => {
      expect(computeEnvironmentDelta('cold_outdoor', 1000)).toBeCloseTo(-0.05, 5);
    });

    it('cold_indoor(사우나)에서 1초당 +0.08℃', () => {
      expect(computeEnvironmentDelta('cold_indoor', 1000)).toBeCloseTo(0.08, 5);
    });

    it('hot_outdoor에서 1초당 +0.05℃', () => {
      expect(computeEnvironmentDelta('hot_outdoor', 1000)).toBeCloseTo(0.05, 5);
    });

    it('hot_indoor(스키두바이)에서 1초당 -0.04℃', () => {
      expect(computeEnvironmentDelta('hot_indoor', 1000)).toBeCloseTo(-0.04, 5);
    });

    it('neutral 환경에서는 변화 없음', () => {
      expect(computeEnvironmentDelta('neutral', 5000)).toBe(0);
    });

    it('500ms는 1초의 절반 변화', () => {
      expect(computeEnvironmentDelta('cold_outdoor', 500)).toBeCloseTo(-0.025, 5);
    });
  });

  describe('isInSafeZone / isInDangerZone', () => {
    it('36.5는 적정', () => {
      expect(isInSafeZone(36.5)).toBe(true);
      expect(isInDangerZone(36.5)).toBe(false);
    });

    it('35.5 정확히는 적정 경계 포함', () => {
      expect(isInSafeZone(35.5)).toBe(true);
    });

    it('35.4는 저체온 위험', () => {
      expect(isInSafeZone(35.4)).toBe(false);
      expect(isInDangerZone(35.4)).toBe(true);
    });

    it('37.6은 고체온 위험', () => {
      expect(isInSafeZone(37.6)).toBe(false);
      expect(isInDangerZone(37.6)).toBe(true);
    });
  });

  describe('computeAutoRecoveryDelta', () => {
    it('저체온일 때 양수 회복', () => {
      const delta = computeAutoRecoveryDelta(34.8);
      expect(delta).toBeGreaterThan(0);
    });

    it('고체온일 때 음수 회복', () => {
      const delta = computeAutoRecoveryDelta(38.2);
      expect(delta).toBeLessThan(0);
    });

    it('적정 범위에서는 회복 0', () => {
      expect(computeAutoRecoveryDelta(36.5)).toBe(0);
    });
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test temperatureSystem
}
```

**Expected**: FAIL.

- [ ] **Step 3: temperatureSystem.ts 작성**

`C:\Users\user\agent\thermoregulation\game\systems\temperatureSystem.ts`:

```typescript
import type { EnvironmentType } from '@/game/types';
import {
  ENV_TEMP_DELTA_PER_SEC,
  TEMP_SAFE_MIN, TEMP_SAFE_MAX,
  DANGER_AUTO_RECOVERY_DELTA,
} from '@/game/config';

/**
 * 환경에 의한 체온 변화량 계산 (deltaMs 동안).
 */
export function computeEnvironmentDelta(env: EnvironmentType, deltaMs: number): number {
  const ratePerSec = ENV_TEMP_DELTA_PER_SEC[env];
  return (ratePerSec * deltaMs) / 1000;
}

/**
 * 적정 녹색대 안에 있는가? (경계 포함)
 */
export function isInSafeZone(temp: number): boolean {
  return temp >= TEMP_SAFE_MIN && temp <= TEMP_SAFE_MAX;
}

/**
 * 위험 범위(저체온 또는 고체온)인가?
 */
export function isInDangerZone(temp: number): boolean {
  return !isInSafeZone(temp);
}

/**
 * 자동 회복 시 적용할 체온 변화량. 적정 범위 쪽으로 일정량 회복.
 */
export function computeAutoRecoveryDelta(temp: number): number {
  if (temp < TEMP_SAFE_MIN) return DANGER_AUTO_RECOVERY_DELTA;
  if (temp > TEMP_SAFE_MAX) return -DANGER_AUTO_RECOVERY_DELTA;
  return 0;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test temperatureSystem
}
```

**Expected**: All passed.

- [ ] **Step 5: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(systems): temperatureSystem (환경 변화율·안전대·자동회복)"
}
```

---

### Task 2.3: quizSystem (정답까지 반복 출제 + 첫 시도 추적)

**Files:**
- Create: `game/systems/quizSystem.ts`
- Create: `tests/game/quizSystem.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\game\quizSystem.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { startAirportQuiz, evaluateAnswer } from '@/game/systems/quizSystem';

describe('quizSystem', () => {
  it('startAirportQuiz는 attemptedIds에 없는 문제 반환', () => {
    const result = startAirportQuiz([]);
    expect(result).not.toBeNull();
    expect(result!.choices).toHaveLength(4);
  });

  it('startAirportQuiz — 모든 문제 제외 시 null', () => {
    const allIds = ['c1','c2','c3','c4','c5','h1','h2','h3','h4','h5','n1','n2','n3','n4','n5'];
    const result = startAirportQuiz(allIds);
    expect(result).toBeNull();
  });

  it('evaluateAnswer — 정답이면 correct=true', () => {
    const q = startAirportQuiz([])!;
    const result = evaluateAnswer(q, q.answerIndex);
    expect(result.correct).toBe(true);
    expect(result.explanation).toBe(q.explanation);
  });

  it('evaluateAnswer — 오답이면 correct=false', () => {
    const q = startAirportQuiz([])!;
    const wrongIdx = (q.answerIndex + 1) % 4;
    const result = evaluateAnswer(q, wrongIdx);
    expect(result.correct).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test quizSystem
}
```

**Expected**: FAIL.

- [ ] **Step 3: quizSystem.ts 작성**

`C:\Users\user\agent\thermoregulation\game\systems\quizSystem.ts`:

```typescript
import type { QuizQuestion } from '@/game/types';
import { drawQuiz } from '@/game/data/quizPool';

export interface QuizEvaluation {
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

/**
 * 공항 퀴즈 출제: attemptedIds에 없는 문제 1개를 무작위 반환.
 * 더 출제할 문제가 없으면 null (이론상 풀이 다 떨어진 경우, 학생이 너무 많이 틀린 케이스).
 */
export function startAirportQuiz(attemptedIds: string[]): QuizQuestion | null {
  return drawQuiz(attemptedIds);
}

/**
 * 학생 답안 채점.
 */
export function evaluateAnswer(q: QuizQuestion, chosenIndex: number): QuizEvaluation {
  return {
    correct: chosenIndex === q.answerIndex,
    correctIndex: q.answerIndex,
    explanation: q.explanation,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test quizSystem
}
```

**Expected**: 4 passed.

- [ ] **Step 5: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(systems): quizSystem (출제·채점 헬퍼)"
}
```

---

### Task 2.4: scoreSystem (별점 계산)

**Files:**
- Create: `game/systems/scoreSystem.ts`
- Create: `tests/game/scoreSystem.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\game\scoreSystem.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeStars, getEndingMessage } from '@/game/systems/scoreSystem';

describe('scoreSystem', () => {
  it('체온 유지 80%+ AND 퀴즈 첫시도 100% → 3성', () => {
    expect(computeStars({ tempRetentionPct: 85, quizFirstTryPct: 100 })).toBe(3);
  });

  it('체온 유지 60%+ OR 퀴즈 첫시도 66%+ → 2성', () => {
    expect(computeStars({ tempRetentionPct: 60, quizFirstTryPct: 0 })).toBe(2);
    expect(computeStars({ tempRetentionPct: 0, quizFirstTryPct: 66.7 })).toBe(2);
  });

  it('둘 다 못 채우면 1성', () => {
    expect(computeStars({ tempRetentionPct: 30, quizFirstTryPct: 30 })).toBe(1);
  });

  it('최소 1성 (모든 학생 격려)', () => {
    expect(computeStars({ tempRetentionPct: 0, quizFirstTryPct: 0 })).toBe(1);
  });

  it('3성/2성/1성에 맞는 격려 메시지', () => {
    expect(getEndingMessage(3)).toContain('달인');
    expect(getEndingMessage(2)).toContain('능숙');
    expect(getEndingMessage(1)).toContain('노력');
  });
});
```

- [ ] **Step 2: 실패 확인 + 구현 + 통과 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test scoreSystem
}
```

`C:\Users\user\agent\thermoregulation\game\systems\scoreSystem.ts`:

```typescript
export interface ScoreInput {
  tempRetentionPct: number;   // 0~100
  quizFirstTryPct: number;    // 0~100
}

/**
 * 별점 산출 (스펙 §6.5). 초기값, 실제 플레이 후 튜닝 가능.
 */
export function computeStars(input: ScoreInput): 1 | 2 | 3 {
  const { tempRetentionPct, quizFirstTryPct } = input;
  if (tempRetentionPct >= 80 && quizFirstTryPct >= 100) return 3;
  if (tempRetentionPct >= 60 || quizFirstTryPct >= 66) return 2;
  return 1;
}

export function getEndingMessage(stars: 1 | 2 | 3): string {
  if (stars === 3) return '체온 유지의 달인! 항상성의 의미를 정확히 이해했어요.';
  if (stars === 2) return '체온 조절에 능숙하네요. 신경과 호르몬의 협동을 잘 활용했어요.';
  return '체온 조절은 어렵지만, 우리 몸은 끝까지 노력했어요. 다시 한 번 도전해 봐요!';
}
```

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test scoreSystem
}
```

**Expected**: 5 passed.

- [ ] **Step 3: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(systems): scoreSystem (별점·결말 메시지)"
}
```

---

### Task 2.5: useNodes 훅 (씬 노드 JSON 로드)

**Files:**
- Create: `hooks/useNodes.ts`
- Create: `tests/hooks/useNodes.test.tsx`

- [ ] **Step 1: 훅 작성 (간단해서 테스트 없이 진행)**

`C:\Users\user\agent\thermoregulation\hooks\useNodes.ts`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { SceneNodes } from '@/game/types';

/**
 * public/data/nodes-<scene>.json을 비동기 로드.
 * Phaser Scene 외부(React)에서 admin 모드 등에 사용.
 */
export function useNodes(sceneName: string): SceneNodes | null {
  const [data, setData] = useState<SceneNodes | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/data/nodes-${sceneName}.json`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => console.error(`useNodes(${sceneName}) failed:`, err));
    return () => { cancelled = true; };
  }, [sceneName]);
  return data;
}
```

- [ ] **Step 2: typecheck**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

**Expected**: 오류 없음.

- [ ] **Step 3: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(hooks): useNodes (씬 노드 JSON 비동기 로드)"
}
```

---

## Phase 3: Phaser 씬

### Task 3.1: BootScene (자산 프리로드 + placeholder 이미지)

**배경:** 사용자가 실제 도트 자산을 만들기 전, 개발은 placeholder(단색 사각형 / Phaser Graphics)로 진행한다. BootScene은 실제 PNG가 있으면 로드하고 없으면 우아하게 fallback.

**Files:**
- Create: `game/scenes/BootScene.ts`
- Create: `game/asset-manifest.ts`

- [ ] **Step 1: 자산 매니페스트 작성 (실제 파일 경로, 없어도 fallback)**

`C:\Users\user\agent\thermoregulation\game\asset-manifest.ts`:

```typescript
export interface AssetEntry {
  key: string;
  path: string;        // /assets/... — public 디렉토리 기준
  type: 'image' | 'spritesheet';
  frameConfig?: { frameWidth: number; frameHeight: number };
}

// 모든 자산은 사용자가 도트로 직접 제작 예정. 파일이 없으면 BootScene이
// placeholder 색사각형을 generateTexture로 대체.
export const BACKGROUNDS: AssetEntry[] = [
  { key: 'bg_classroom',                 path: '/assets/backgrounds/classroom.png',                 type: 'image' },
  { key: 'bg_airport_start',             path: '/assets/backgrounds/airport_start.png',             type: 'image' },
  { key: 'bg_airport_finland',           path: '/assets/backgrounds/airport_finland.png',           type: 'image' },
  { key: 'bg_airport_canada',            path: '/assets/backgrounds/airport_canada.png',            type: 'image' },
  { key: 'bg_airport_dubai',             path: '/assets/backgrounds/airport_dubai.png',             type: 'image' },
  { key: 'bg_airport_egypt',             path: '/assets/backgrounds/airport_egypt.png',             type: 'image' },
  { key: 'bg_worldmap',                  path: '/assets/backgrounds/worldmap.png',                  type: 'image' },
  { key: 'bg_country_finland_outdoor',   path: '/assets/backgrounds/country_finland_outdoor.png',   type: 'image' },
  { key: 'bg_country_finland_indoor',    path: '/assets/backgrounds/country_finland_indoor.png',    type: 'image' },
  { key: 'bg_country_canada_outdoor',    path: '/assets/backgrounds/country_canada_outdoor.png',    type: 'image' },
  { key: 'bg_country_canada_indoor',     path: '/assets/backgrounds/country_canada_indoor.png',     type: 'image' },
  { key: 'bg_country_dubai_outdoor',     path: '/assets/backgrounds/country_dubai_outdoor.png',     type: 'image' },
  { key: 'bg_country_dubai_indoor',      path: '/assets/backgrounds/country_dubai_indoor.png',      type: 'image' },
  { key: 'bg_country_egypt_outdoor',     path: '/assets/backgrounds/country_egypt_outdoor.png',     type: 'image' },
  { key: 'bg_country_egypt_indoor',      path: '/assets/backgrounds/country_egypt_indoor.png',      type: 'image' },
  { key: 'bg_ending',                    path: '/assets/backgrounds/ending.png',                    type: 'image' },
];

export const SPRITES: AssetEntry[] = [
  { key: 'player_idle',       path: '/assets/sprites/player_idle.png',       type: 'image' },
  { key: 'player_walk_down',  path: '/assets/sprites/player_walk_down.png',  type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
  { key: 'player_walk_left',  path: '/assets/sprites/player_walk_left.png',  type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
  { key: 'player_walk_right', path: '/assets/sprites/player_walk_right.png', type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
  { key: 'player_walk_up',    path: '/assets/sprites/player_walk_up.png',    type: 'spritesheet', frameConfig: { frameWidth: 110, frameHeight: 186 } },
];

// Placeholder 색상 (자산 없을 때 fallback)
export const PLACEHOLDER_BG_COLORS: Record<string, number> = {
  bg_classroom:               0xfff4dc,
  bg_airport_start:           0xe0e8f4,
  bg_airport_finland:         0xd4e4f4,
  bg_airport_canada:          0xd4f4dc,
  bg_airport_dubai:           0xf4d4a0,
  bg_airport_egypt:           0xf4dca0,
  bg_worldmap:                0xc0d4e8,
  bg_country_finland_outdoor: 0xb6dcff,
  bg_country_finland_indoor:  0xf4c477,
  bg_country_canada_outdoor:  0xa0b8d4,
  bg_country_canada_indoor:   0xc8a878,
  bg_country_dubai_outdoor:   0xffd28a,
  bg_country_dubai_indoor:    0xb6e0ff,
  bg_country_egypt_outdoor:   0xffc880,
  bg_country_egypt_indoor:    0xc0c0d4,
  bg_ending:                  0xfff4dc,
};
```

- [ ] **Step 2: BootScene 작성**

`C:\Users\user\agent\thermoregulation\game\scenes\BootScene.ts`:

```typescript
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
    this.scene.start('TitleScene');
  }
}
```

- [ ] **Step 3: typecheck**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

**Expected**: 오류 없음 (TitleScene는 다음 task에서 만들지만 typecheck는 string 참조라 통과).

- [ ] **Step 4: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(scenes): BootScene + 자산 매니페스트 + placeholder fallback"
}
```

---

### Task 3.2: BaseGameScene (노드 로딩 + L자 경로 이동 공통 로직)

**배경:** TitleScene 제외한 모든 게임 씬은 공통 패턴을 따른다 — 배경 1장 + 캐릭터 sprite + 노드 JSON + L자 이동. 이를 BaseGameScene으로 추상화.

**Files:**
- Create: `game/scenes/BaseGameScene.ts`

- [ ] **Step 1: BaseGameScene 작성**

`C:\Users\user\agent\thermoregulation\game\scenes\BaseGameScene.ts`:

```typescript
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
```

- [ ] **Step 2: typecheck**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

**Expected**: 오류 없음.

- [ ] **Step 3: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(scenes): BaseGameScene (노드 로딩 + L자 경로 이동)"
}
```

---

### Task 3.3: TitleScene + ClassroomScene + GameContainer (Phaser 마운트)

**배경:** 한 번에 묶어서 첫 플레이 가능한 상태(닉네임 → 교실 도착)까지 만든다. React 오버레이는 별도, 여기서는 Phaser 측 트리거만 한다.

**Files:**
- Create: `game/scenes/TitleScene.ts`
- Create: `game/scenes/ClassroomScene.ts`
- Create: `game/scenes/AirportScene.ts`
- Create: `game/scenes/WorldMapScene.ts`
- Create: `game/scenes/CountryScene.ts`
- Create: `game/scenes/EndingScene.ts`
- Create: `game/phaserConfig.ts`
- Create: `components/GameContainer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: TitleScene**

`C:\Users\user\agent\thermoregulation\game\scenes\TitleScene.ts`:

```typescript
import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config';
import { useGameStore } from '@/store/gameStore';

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

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
    // store의 nickname이 비어있는 동안은 phase = 'title' 유지.
    // React 오버레이가 닉네임 입력 후 setPhase('classroom_intro') 호출.

    const unsub = useGameStore.subscribe((s, prev) => {
      if (prev.phase === 'title' && s.phase === 'classroom_intro') {
        this.scene.start('ClassroomScene');
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
  }
}
```

- [ ] **Step 2: ClassroomScene**

`C:\Users\user\agent\thermoregulation\game\scenes\ClassroomScene.ts`:

```typescript
import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

export class ClassroomScene extends BaseGameScene {
  constructor() {
    super({ sceneKey: 'classroom', backgroundKey: 'bg_classroom', nodesUrl: '/data/nodes-classroom.json' });
  }

  protected onSceneReady() {
    // 도입 멘트는 React 오버레이가 띄움. phase = classroom_intro → classroom_choose_cold
    const unsub = useGameStore.subscribe((s, prev) => {
      // 학급회의 종료(classroom_depart) 시 출구 노드로 자동 이동
      if (prev.phase !== 'classroom_depart' && s.phase === 'classroom_depart') {
        const exitNode = this.findNode('depart');
        if (exitNode) this.moveToNode(exitNode);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
  }

  protected onNodeArrive(node: NodeConfig) {
    const { phase, setPhase } = useGameStore.getState();
    if (node.id === 'choose' && phase === 'classroom_intro') {
      setPhase('classroom_choose_cold');
    } else if (node.id === 'depart' && phase === 'classroom_depart') {
      setPhase('airport_start');
      this.scene.start('AirportScene', { airportKey: 'airport_start' });
    }
  }
}
```

- [ ] **Step 3: AirportScene**

`C:\Users\user\agent\thermoregulation\game\scenes\AirportScene.ts`:

```typescript
import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig, Country } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

interface AirportInit {
  airportKey: 'airport_start' | `airport_${Country}`;
}

export class AirportScene extends BaseGameScene {
  private airportKey: AirportInit['airportKey'];

  constructor() {
    // 기본값은 출발국, init() 호출 시 변경
    super({ sceneKey: 'AirportScene', backgroundKey: 'bg_airport_start', nodesUrl: '/data/nodes-airport_start.json' });
    this.airportKey = 'airport_start';
  }

  init(data: AirportInit) {
    this.airportKey = data.airportKey;
    // 동적으로 backgroundKey / nodesUrl 변경
    this.init_.backgroundKey = `bg_${data.airportKey}`;
    this.init_.nodesUrl = `/data/nodes-${data.airportKey}.json`;
  }

  protected onNodeArrive(node: NodeConfig) {
    const store = useGameStore.getState();
    if (node.type === 'trigger' && node.action === 'airport_quiz') {
      // React QuizModal이 phase 변화를 감지해서 띄움.
      // 통과(정답) 시 React가 setPhase로 다음 단계로.
    } else if (node.type === 'exit' && node.action === 'next_phase') {
      // 어느 공항이었는지에 따라 다음 phase 결정
      const nextPhase = this.computeNextPhase();
      if (nextPhase) {
        store.setPhase(nextPhase);
        this.scene.start('WorldMapScene');
      }
    }
  }

  private computeNextPhase() {
    const { phase, actualCold, actualHot } = useGameStore.getState();
    switch (phase) {
      case 'airport_start': return 'worldmap_to_1';
      case 'airport_1':     return 'worldmap_to_2';
      case 'airport_2':     return 'worldmap_to_home';
      default: return null;
    }
  }
}
```

- [ ] **Step 4: WorldMapScene (비행기 컷씬)**

`C:\Users\user\agent\thermoregulation\game\scenes\WorldMapScene.ts`:

```typescript
import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HUD_WIDTH } from '@/game/config';
import { useGameStore } from '@/store/gameStore';
import type { SceneNodes, Country } from '@/game/types';

export class WorldMapScene extends Phaser.Scene {
  private nodesData: SceneNodes | null = null;

  constructor() { super({ key: 'WorldMapScene' }); }

  preload() {
    this.load.json('nodes_worldmap', '/data/nodes-worldmap.json');
  }

  create() {
    const gameAreaW = GAME_WIDTH - HUD_WIDTH;
    this.add.image(0, 0, 'bg_worldmap').setOrigin(0, 0).setDisplaySize(gameAreaW, GAME_HEIGHT);

    this.nodesData = this.cache.json.get('nodes_worldmap') as SceneNodes;

    const { phase, actualCold, actualHot } = useGameStore.getState();
    let from: Country | 'korea' = 'korea';
    let to: Country | 'korea' = 'korea';

    if (phase === 'worldmap_to_1') {
      from = 'korea'; to = actualCold ?? 'korea';
    } else if (phase === 'worldmap_to_2') {
      from = actualCold ?? 'korea'; to = actualHot ?? 'korea';
    } else if (phase === 'worldmap_to_home') {
      from = actualHot ?? 'korea'; to = 'korea';
    }

    const fromNode = this.nodesData?.nodes.find(n => n.id === from);
    const toNode = this.nodesData?.nodes.find(n => n.id === to);

    if (!fromNode || !toNode) {
      console.error('[WorldMapScene] from/to node missing', { from, to });
      this.advanceAfterCutscene();
      return;
    }

    // 비행기 아이콘 (placeholder: 흰 삼각형)
    const plane = this.add.text(fromNode.x, fromNode.y, '✈️', { fontSize: '48px' }).setOrigin(0.5, 0.5);

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    plane.setRotation(Math.atan2(dy, dx));

    this.tweens.add({
      targets: plane,
      x: toNode.x,
      y: toNode.y,
      duration: 2500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.time.delayedCall(500, () => this.advanceAfterCutscene());
      },
    });

    this.add.text(gameAreaW / 2, 40, `${fromNode.label} → ${toNode.label}`, {
      fontFamily: 'Pretendard, system-ui',
      fontSize: '26px',
      color: '#1a3a5a',
      backgroundColor: '#ffffffcc',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 0.5);
  }

  private advanceAfterCutscene() {
    const { phase, setPhase, actualCold, actualHot } = useGameStore.getState();

    if (phase === 'worldmap_to_1') {
      setPhase('country_1_arrived');
      this.scene.start('CountryScene', { country: actualCold!, slot: 1 });
    } else if (phase === 'worldmap_to_2') {
      setPhase('country_2_arrived');
      this.scene.start('CountryScene', { country: actualHot!, slot: 2 });
    } else if (phase === 'worldmap_to_home') {
      setPhase('ending');
      this.scene.start('EndingScene');
    }
  }
}
```

- [ ] **Step 5: CountryScene (4국 공통, outdoor/indoor 노드 전환)**

`C:\Users\user\agent\thermoregulation\game\scenes\CountryScene.ts`:

```typescript
import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig, Country } from '@/game/types';
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

  constructor() {
    super({
      sceneKey: 'CountryScene',
      backgroundKey: 'bg_country_finland_outdoor',
      nodesUrl: '/data/nodes-country_finland_outdoor.json',
    });
  }

  init(data: CountryInit) {
    this.country = data.country;
    this.slot = data.slot;
    this.area = data.area ?? 'outdoor';
    this.init_.backgroundKey = `bg_country_${this.country}_${this.area}`;
    this.init_.nodesUrl = `/data/nodes-country_${this.country}_${this.area}.json`;
  }

  protected onNodeArrive(node: NodeConfig) {
    const store = useGameStore.getState();

    if (node.type === 'trigger' && node.action?.startsWith('minigame_')) {
      // React MinigameModal이 phase + node.action을 보고 띄움
      const phase = this.slot === 1
        ? (this.area === 'outdoor' ? 'country_1_outdoor' : 'country_1_indoor')
        : (this.area === 'outdoor' ? 'country_2_outdoor' : 'country_2_indoor');
      store.setPhase(phase);
    } else if (node.type === 'exit' && node.action === 'next_phase') {
      if (this.area === 'outdoor') {
        // outdoor → indoor 전환 (같은 국가)
        this.scene.restart({ country: this.country, slot: this.slot, area: 'indoor' });
      } else {
        // indoor 완료 → 공항으로
        store.completeCountry(this.country);
        if (this.slot === 1) {
          store.setPhase('airport_1');
          this.scene.start('AirportScene', { airportKey: `airport_${this.country}` });
        } else {
          store.setPhase('airport_2');
          this.scene.start('AirportScene', { airportKey: `airport_${this.country}` });
        }
      }
    }
  }
}
```

- [ ] **Step 6: EndingScene**

`C:\Users\user\agent\thermoregulation\game\scenes\EndingScene.ts`:

```typescript
import { BaseGameScene } from './BaseGameScene';
import type { NodeConfig } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

export class EndingScene extends BaseGameScene {
  constructor() {
    super({ sceneKey: 'EndingScene', backgroundKey: 'bg_ending', nodesUrl: '/data/nodes-ending.json' });
  }

  protected onSceneReady() {
    useGameStore.getState().setPhase('ending');
  }

  protected onNodeArrive(node: NodeConfig) {
    if (node.id === 'podium' && node.action === 'ending_card') {
      // React EndingCard가 phase = 'ending' 인데 podium 도착했음을 감지 (별도 이벤트 발행)
      // 여기선 단순히 phase 유지. React가 카드 표시.
      // (마지막 노드 도달 사실은 별도 store 플래그로 표시 가능 — 단순화 위해 phase 유지)
    }
  }
}
```

- [ ] **Step 7: phaserConfig.ts**

`C:\Users\user\agent\thermoregulation\game\phaserConfig.ts`:

```typescript
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
```

- [ ] **Step 8: GameContainer 컴포넌트**

`C:\Users\user\agent\thermoregulation\components\GameContainer.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      // SSR 회피를 위해 Phaser 동적 임포트
      const Phaser = (await import('phaser')).default;
      const { makePhaserConfig } = await import('@/game/phaserConfig');
      if (cancelled || !containerRef.current) return;
      const config = makePhaserConfig(containerRef.current);
      gameRef.current = new Phaser.Game(config);
    })();

    return () => {
      cancelled = true;
      // @ts-expect-error Phaser.Game 타입은 동적 임포트라 추론 불가
      gameRef.current?.destroy?.(true);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

- [ ] **Step 9: app/page.tsx 갱신**

`C:\Users\user\agent\thermoregulation\app\page.tsx`:

```tsx
import { GameContainer } from '@/components/GameContainer';

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-black">
      <GameContainer />
    </main>
  );
}
```

- [ ] **Step 10: typecheck + dev 서버 수동 검증**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm dev
}
```

Chrome으로 `http://localhost:3000` 열기. Expected:
- TitleScene placeholder (파란 배경 + 제목)
- (닉네임 입력 React 오버레이가 없으므로 여기서 멈춤 — 다음 task에서 추가)

Ctrl+C로 종료.

- [ ] **Step 11: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(scenes): 7개 씬 (Title/Classroom/Airport/WorldMap/Country/Ending) + Phaser 마운트"
}
```

---

## Phase 4: React 오버레이

### Task 4.1: UIOverlay 라우터 + HUDBar (체온 막대 + 보조 인디케이터 + 토스트)

**Files:**
- Create: `components/UIOverlay.tsx`
- Create: `components/overlays/HUDBar.tsx`
- Create: `components/overlays/Toast.tsx`
- Create: `tests/components/HUDBar.test.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: HUDBar 테스트 작성**

`C:\Users\user\agent\thermoregulation\tests\components\HUDBar.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HUDBar } from '@/components/overlays/HUDBar';
import { useGameStore } from '@/store/gameStore';

describe('HUDBar', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('체온 수치를 표시한다', () => {
    render(<HUDBar />);
    expect(screen.getByText(/36\.5℃/)).toBeInTheDocument();
  });

  it('적정 범위에서는 "GOOD" 라벨', () => {
    render(<HUDBar />);
    expect(screen.getByText(/적정/i)).toBeInTheDocument();
  });

  it('저체온 진입 시 라벨 변경', () => {
    useGameStore.getState().adjustTemp(-2);  // 34.5
    render(<HUDBar />);
    expect(screen.getByText(/저체온/i)).toBeInTheDocument();
  });

  it('고체온 진입 시 라벨 변경', () => {
    useGameStore.getState().adjustTemp(+2);  // 38.5
    render(<HUDBar />);
    expect(screen.getByText(/고체온/i)).toBeInTheDocument();
  });

  it('혈관/땀/티록신 보조 인디케이터 라벨', () => {
    render(<HUDBar />);
    expect(screen.getByText('혈관')).toBeInTheDocument();
    expect(screen.getByText('땀')).toBeInTheDocument();
    expect(screen.getByText('티록신')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test HUDBar
}
```

**Expected**: FAIL.

- [ ] **Step 3: HUDBar.tsx 작성**

`C:\Users\user\agent\thermoregulation\components\overlays\HUDBar.tsx`:

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { TEMP_SAFE_MIN, TEMP_SAFE_MAX, TEMP_DANGER_LOW, TEMP_DANGER_HIGH } from '@/game/config';

function tempToPercent(temp: number): number {
  const total = TEMP_DANGER_HIGH - TEMP_DANGER_LOW;
  return ((TEMP_DANGER_HIGH - temp) / total) * 100;
}

function tempStatusLabel(temp: number): { label: string; color: string } {
  if (temp < TEMP_SAFE_MIN) return { label: '저체온 진입!', color: '#1c4e8c' };
  if (temp > TEMP_SAFE_MAX) return { label: '고체온 진입!', color: '#a02717' };
  return { label: '적정 (GOOD)', color: '#1a7a3a' };
}

export function HUDBar() {
  const temp = useGameStore(s => s.currentTemp);
  const vessel = useGameStore(s => s.vesselState);
  const sweat = useGameStore(s => s.sweatLevel);
  const thyroxine = useGameStore(s => s.thyroxineLevel);

  const status = tempStatusLabel(temp);
  const markerTopPct = tempToPercent(temp);

  return (
    <aside className="fixed right-0 top-0 h-screen w-[110px] bg-white/95 border-l border-black/10 p-2 flex flex-col gap-2 font-sans text-[12px]">
      <div className="text-center font-bold text-slate-800 pb-1 border-b border-black/5">내 몸 상태</div>

      {/* 체온 막대 */}
      <div className="flex gap-1 items-stretch h-[260px] px-0.5 relative">
        <div className="relative w-[22px] rounded-md border border-black/15"
             style={{
               background: `linear-gradient(180deg,
                 #c0392b 0%, #c0392b 22%,
                 #2ecc71 24%, #2ecc71 56%,
                 #4a90e2 58%, #4a90e2 100%)`
             }}>
          {/* 슬라이더 마커 */}
          <div className="absolute -left-2 -translate-y-1/2 w-0 h-0"
               style={{
                 top: `${markerTopPct}%`,
                 borderTop: '6px solid transparent',
                 borderBottom: '6px solid transparent',
                 borderLeft: '10px solid #1a1a1a',
               }} />
        </div>
        <div className="flex flex-col justify-between text-[10px] text-slate-600 leading-none">
          <span>40 —</span>
          <span>38 —</span>
          <span>37.5</span>
          <span>36.5</span>
          <span>35.5</span>
          <span>35 —</span>
          <span>33 —</span>
        </div>
      </div>

      {/* 수치 readout */}
      <div className="text-center py-1 font-bold" style={{ color: status.color }}>
        {temp.toFixed(1)}℃
        <span className="block text-[10px] font-medium text-slate-600">{status.label}</span>
      </div>

      {/* 보조 인디케이터 */}
      <div className="flex flex-col gap-1 pt-1 border-t border-black/5">
        <div className="flex items-center gap-1 bg-slate-50 rounded px-1.5 py-1">
          <span className="text-base">🩸</span>
          <span className="flex-1 text-slate-700">혈관</span>
          <span className="font-semibold text-slate-800">
            {vessel === 'constricted' ? '▼ 수축' : vessel === 'dilated' ? '▲ 확장' : '— 정상'}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 rounded px-1.5 py-1">
          <span className="text-base">💧</span>
          <span className="flex-1 text-slate-700">땀</span>
          <span className="w-7 h-1 bg-slate-200 rounded overflow-hidden">
            <span className="block h-full bg-sky-500" style={{ width: `${sweat}%` }} />
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 rounded px-1.5 py-1">
          <span className="text-base">⚗️</span>
          <span className="flex-1 text-slate-700">티록신</span>
          <span className="w-7 h-1 bg-slate-200 rounded overflow-hidden">
            <span className="block h-full bg-purple-500" style={{ width: `${thyroxine}%` }} />
          </span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Toast.tsx 작성**

`C:\Users\user\agent\thermoregulation\components\overlays\Toast.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

/**
 * 토스트는 store의 currentToast 문자열을 표시. 2.5초 후 자동 사라짐.
 */
export function Toast() {
  const message = useGameStore(s => (s as unknown as { currentToast?: string }).currentToast);
  const [show, setShow] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (message && message.length > 0) {
      setText(message);
      setShow(true);
      const t = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (!show) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-3 py-1.5 rounded-full text-sm shadow-md">
      {text}
    </div>
  );
}
```

추가로 store에 `currentToast` 와 setter 가 필요하다. 다음 단계에서 추가.

- [ ] **Step 5: gameStore에 토스트 필드 추가**

`store/gameStore.ts`의 `GameState` 인터페이스와 `initialState`, 액션에 다음을 추가:

```typescript
// GameState 인터페이스에 추가
currentToast: string;
showToast: (message: string) => void;
```

`initialState`에 추가:

```typescript
currentToast: '',
```

액션 구현 (store 함수 객체 안에 추가):

```typescript
showToast: (currentToast) => {
  set({ currentToast });
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      const cur = (useGameStore.getState() as { currentToast: string }).currentToast;
      if (cur === currentToast) set({ currentToast: '' });
    }
  }, 2500);
},
```

`reset`의 `set(initialState)`는 그대로 — `currentToast`도 초기화됨.

`partialize`에서도 함수 배열에 `showToast` 추가:

```typescript
const { ..., showToast: _15, ...persistable } = state;
```

- [ ] **Step 6: UIOverlay 라우터**

`C:\Users\user\agent\thermoregulation\components\UIOverlay.tsx`:

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { HUDBar } from '@/components/overlays/HUDBar';
import { Toast } from '@/components/overlays/Toast';

const HUD_HIDDEN_PHASES = new Set([
  'title', 'classroom_intro', 'classroom_choose_cold', 'classroom_choose_hot',
  'classroom_rps_cold', 'classroom_rps_hot', 'classroom_depart',
  'worldmap_to_1', 'worldmap_to_2', 'worldmap_to_home',
  'ending',
]);

export function UIOverlay() {
  const phase = useGameStore(s => s.phase);
  const showHud = !HUD_HIDDEN_PHASES.has(phase);

  return (
    <>
      {showHud && <HUDBar />}
      <Toast />
      {/* TitleNicknameModal·ClassroomChoice·RPSModal·QuizModal·MinigameModal·EndingCard 등은 다음 task들에서 추가 */}
    </>
  );
}
```

- [ ] **Step 7: app/page.tsx에 UIOverlay 추가**

`C:\Users\user\agent\thermoregulation\app\page.tsx`:

```tsx
import { GameContainer } from '@/components/GameContainer';
import { UIOverlay } from '@/components/UIOverlay';

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-black relative">
      <GameContainer />
      <UIOverlay />
    </main>
  );
}
```

- [ ] **Step 8: 테스트 통과 확인 + typecheck**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test HUDBar
}
```

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

**Expected**: 모든 테스트 통과, 타입 오류 없음.

- [ ] **Step 9: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(overlays): HUDBar(체온 막대+보조 인디케이터) + Toast + UIOverlay 라우터"
}
```

---

### Task 4.2: TitleNicknameModal + ClassroomChoice + RPSModal

**Files:**
- Create: `components/overlays/TitleNicknameModal.tsx`
- Create: `components/overlays/ClassroomChoice.tsx`
- Create: `components/overlays/RPSModal.tsx`
- Modify: `components/UIOverlay.tsx`

- [ ] **Step 1: TitleNicknameModal**

`C:\Users\user\agent\thermoregulation\components\overlays\TitleNicknameModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export function TitleNicknameModal() {
  const phase = useGameStore(s => s.phase);
  const setNickname = useGameStore(s => s.setNickname);
  const setPhase = useGameStore(s => s.setPhase);
  const [value, setValue] = useState('');

  if (phase !== 'title') return null;

  const handleStart = () => {
    const trimmed = value.trim();
    if (trimmed.length < 1) return;
    setNickname(trimmed);
    setPhase('classroom_intro');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/30">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[360px] flex flex-col gap-3">
        <h2 className="text-xl font-bold text-slate-800">이름을 입력해주세요</h2>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
          maxLength={10}
          placeholder="예) 태형"
          className="border border-slate-300 rounded px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
          autoFocus
        />
        <button
          onClick={handleStart}
          disabled={value.trim().length < 1}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded py-2 font-semibold"
        >
          수학여행 시작
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ClassroomChoice**

`C:\Users\user\agent\thermoregulation\components\overlays\ClassroomChoice.tsx`:

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { COUNTRIES, getCountriesByGroup } from '@/game/data/countries';
import type { Country } from '@/game/types';

export function ClassroomChoice() {
  const phase = useGameStore(s => s.phase);
  const chooseCold = useGameStore(s => s.chooseCold);
  const chooseHot = useGameStore(s => s.chooseHot);
  const setPhase = useGameStore(s => s.setPhase);

  if (phase === 'classroom_intro') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
        <div className="bg-white rounded-xl p-6 shadow-lg w-[420px] flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-800">학급 회의가 시작됐어요</h2>
          <p className="text-slate-700">우리 반은 이번 수학여행에서 추운 나라 1곳과 더운 나라 1곳을 다녀오기로 했어요. 어디로 가고 싶은지 골라봅시다.</p>
          <button
            onClick={() => setPhase('classroom_choose_cold')}
            className="bg-sky-600 hover:bg-sky-700 text-white rounded py-2 font-semibold mt-2"
          >
            네, 시작할게요
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'classroom_choose_cold' || phase === 'classroom_choose_hot') {
    const group = phase === 'classroom_choose_cold' ? 'cold' : 'hot';
    const choices = getCountriesByGroup(group);
    const title = group === 'cold' ? '추운 나라 선택' : '더운 나라 선택';

    const onPick = (c: Country) => {
      if (group === 'cold') {
        chooseCold(c);
        setPhase('classroom_rps_cold');
      } else {
        chooseHot(c);
        setPhase('classroom_rps_hot');
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
        <div className="bg-white rounded-xl p-6 shadow-lg w-[420px] flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-slate-700">두 곳 중 가고 싶은 곳을 골라봐요.</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {choices.map(c => (
              <button
                key={c.id}
                onClick={() => onPick(c.id)}
                className="border border-slate-300 hover:border-sky-500 rounded-lg p-3 flex flex-col items-center gap-2 transition"
              >
                <span className="text-4xl">{c.flagEmoji}</span>
                <span className="text-sm text-slate-800 font-semibold text-center">{c.displayName.replace(c.flagEmoji + ' ', '')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 3: RPSModal — 가위바위보**

`C:\Users\user\agent\thermoregulation\components\overlays\RPSModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getCountriesByGroup, getCountryById } from '@/game/data/countries';
import type { Country, RPSChoice, RPSResult } from '@/game/types';

function judge(player: RPSChoice, npc: RPSChoice): RPSResult {
  if (player === npc) return 'draw';
  if (
    (player === 'rock' && npc === 'scissors') ||
    (player === 'paper' && npc === 'rock') ||
    (player === 'scissors' && npc === 'paper')
  ) return 'win';
  return 'lose';
}

const CHOICES: { id: RPSChoice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '✊', label: '바위' },
  { id: 'paper', emoji: '✋', label: '보' },
  { id: 'scissors', emoji: '✌️', label: '가위' },
];

export function RPSModal() {
  const phase = useGameStore(s => s.phase);
  const chosenCold = useGameStore(s => s.chosenCold);
  const chosenHot = useGameStore(s => s.chosenHot);
  const setPhase = useGameStore(s => s.setPhase);
  const setActualCountries = useGameStore(s => s.setActualCountries);
  const [npcChoice, setNpcChoice] = useState<RPSChoice | null>(null);
  const [result, setResult] = useState<RPSResult | null>(null);

  if (phase !== 'classroom_rps_cold' && phase !== 'classroom_rps_hot') return null;

  const group = phase === 'classroom_rps_cold' ? 'cold' : 'hot';
  const chosen = group === 'cold' ? chosenCold : chosenHot;
  if (!chosen) return null;

  // NPC가 고른 나라 = 같은 group에서 학생이 안 고른 나라
  const npcCountry: Country = getCountriesByGroup(group).find(c => c.id !== chosen)!.id;
  const npcCountryCfg = getCountryById(npcCountry)!;

  const play = (player: RPSChoice) => {
    const npc = CHOICES[Math.floor(Math.random() * 3)].id;
    const r = judge(player, npc);
    setNpcChoice(npc);
    setResult(r);
  };

  const proceed = () => {
    if (!result) return;
    // 무승부면 다시
    if (result === 'draw') {
      setNpcChoice(null);
      setResult(null);
      return;
    }
    const winnerCountry: Country = result === 'win' ? chosen : npcCountry;

    if (group === 'cold') {
      // 일단 임시 저장 (actualCold 만), 더 단계에서 actualHot도 함께 갱신
      setActualCountries(winnerCountry, useGameStore.getState().actualHot ?? winnerCountry);
      setPhase('classroom_choose_hot');
    } else {
      // 두 결과를 모두 합쳐 actualCountries 설정
      const finalCold = useGameStore.getState().actualCold!;
      setActualCountries(finalCold, winnerCountry);
      setPhase('classroom_depart');
    }
    setNpcChoice(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[460px] flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          {npcCountryCfg.rpsNpcName}와의 가위바위보 — {group === 'cold' ? '추운 나라' : '더운 나라'} 결정
        </h2>
        <p className="text-slate-700 text-sm">
          {npcCountryCfg.rpsNpcName}: "나는 {npcCountryCfg.displayName} 가고 싶어! 가위바위보로 정하자!"
        </p>

        {!result ? (
          <div className="grid grid-cols-3 gap-3 mt-2">
            {CHOICES.map(c => (
              <button
                key={c.id}
                onClick={() => play(c.id)}
                className="border border-slate-300 hover:border-sky-500 rounded-lg p-4 flex flex-col items-center gap-1 transition"
              >
                <span className="text-4xl">{c.emoji}</span>
                <span className="text-sm font-semibold text-slate-800">{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mt-2">
            <p className="text-slate-700">{npcCountryCfg.rpsNpcName}: {CHOICES.find(c => c.id === npcChoice)!.emoji}</p>
            <p className="text-2xl font-bold" style={{ color: result === 'win' ? '#1a7a3a' : result === 'lose' ? '#a02717' : '#5a6c7d' }}>
              {result === 'win' ? '🎉 이겼다!' : result === 'lose' ? '😢 졌다…' : '😅 비겼다, 다시!'}
            </p>
            <button onClick={proceed} className="bg-sky-600 hover:bg-sky-700 text-white rounded py-2 px-6 font-semibold">
              {result === 'draw' ? '다시 하기' : '다음 단계로'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: UIOverlay에 모달들 추가**

`components/UIOverlay.tsx` 갱신 — `<Toast />` 다음 줄에 다음 4줄 추가:

```tsx
<TitleNicknameModal />
<ClassroomChoice />
<RPSModal />
```

상단 import 추가:

```tsx
import { TitleNicknameModal } from '@/components/overlays/TitleNicknameModal';
import { ClassroomChoice } from '@/components/overlays/ClassroomChoice';
import { RPSModal } from '@/components/overlays/RPSModal';
```

또한 `RPSModal` 도착 후 `classroom_depart` 진입 시 ClassroomScene이 출구로 이동시키게 했지만, depart phase 진입 시 React에서도 짧은 출발 멘트 보여주는 게 좋다. ClassroomChoice를 확장:

`ClassroomChoice.tsx`의 함수 끝(`return null` 직전)에 추가:

```tsx
  if (phase === 'classroom_depart') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
        <div className="bg-white rounded-xl p-6 shadow-lg w-[420px] flex flex-col gap-3">
          <h2 className="text-lg font-bold text-slate-800">출발합시다!</h2>
          <p className="text-slate-700">가방을 챙기고 공항으로 떠나요.</p>
          <button
            onClick={() => {
              /* ClassroomScene이 phase 변화 감지 시 출구로 이동시킴 */
              /* 여기선 단순히 모달 닫기 효과를 위해 의도적으로 다시 한 번 setPhase 같은 값으로 호출하지 않음. */
              /* 사용자 클릭이 트리거이므로 store에 직접 신호 보내기: */
              useGameStore.setState({ phase: 'classroom_depart' });
              // 단, 이미 같은 값이라 effective change 없음. 대신 빠른 길:
              /* ClassroomScene이 출구 도착하면 setPhase('airport_start')하므로 여기서 끝. */
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white rounded py-2 font-semibold"
          >
            확인
          </button>
        </div>
      </div>
    );
  }
```

> **주의:** classroom_depart phase에서 사용자가 확인을 누르면 ClassroomScene이 캐릭터를 출구로 자동 이동시키고, 도착 시 `airport_start`로 phase 전환한다. 모달 자체는 phase 변화로 자동으로 사라진다.

이를 더 깔끔하게 하려면 `pendingClassroomDepartAck` 같은 store 플래그를 추가할 수 있지만, MVP에서는 모달의 닫힘이 충분히 시각적 신호다. ClassroomScene이 `classroom_depart` phase 진입 → 자동으로 출구로 이동하면서 모달 사라지게 하기 위해, ClassroomChoice를 다시 단순화:

```tsx
  if (phase === 'classroom_depart') {
    // ClassroomScene이 즉시 출구로 이동시키므로 모달 불필요. 단순한 토스트성 안내만:
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white px-3 py-1.5 rounded-full text-sm">
        🎒 가방 챙기고 공항으로!
      </div>
    );
  }
```

이 두 가지 중 한 가지를 선택해서 위 코드를 갱신 (간소한 토스트 권장).

- [ ] **Step 5: typecheck + dev 수동 검증**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
  pnpm dev
}
```

브라우저에서:
1. 닉네임 입력 → 수학여행 시작 클릭 → 교실 placeholder 화면
2. 도입 멘트 → 추 선택 → 가위바위보 (3번 중 하나 클릭) → 결과 → 다음
3. 더 선택 → 가위바위보 → 결과 → 출발 토스트
4. 캐릭터가 공항 출구로 자동 이동 (BaseGameScene이 처리) → AirportScene placeholder 보임

- [ ] **Step 6: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(overlays): TitleNickname + ClassroomChoice + RPSModal"
}
```

---

### Task 4.3: QuizModal (공항 퀴즈 게이트)

**Files:**
- Create: `components/overlays/QuizModal.tsx`
- Modify: `components/UIOverlay.tsx`

- [ ] **Step 1: QuizModal**

`C:\Users\user\agent\thermoregulation\components\overlays\QuizModal.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { startAirportQuiz, evaluateAnswer } from '@/game/systems/quizSystem';
import type { QuizQuestion } from '@/game/types';

const AIRPORT_QUIZ_PHASES = new Set(['airport_start', 'airport_1', 'airport_2']);

export function QuizModal() {
  const phase = useGameStore(s => s.phase);
  const setPhase = useGameStore(s => s.setPhase);
  const attemptedIds = useGameStore(s => s.airportQuizAttemptedIds);
  const recordQuizAttempt = useGameStore(s => s.recordQuizAttempt);
  const showToast = useGameStore(s => s.showToast);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<QuizQuestion | null>(null);
  const [showExplanation, setShowExplanation] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [firstAttemptForThisAirport, setFirstAttemptForThisAirport] = useState(true);

  // 캐릭터가 공항의 trigger 노드에 도착하면 modal을 띄움. BaseGameScene이 setPhase로 phase를
  // 유지하지만 noopo 별도의 트리거가 필요. 단순화: QuizModal은 phase가 airport_* 일 동안 항상 표시.
  // (실제 공항 도착 시점은 BaseGameScene이 setPhase로 처리)

  useEffect(() => {
    if (AIRPORT_QUIZ_PHASES.has(phase) && !open) {
      const q = startAirportQuiz(attemptedIds);
      if (q) {
        setCurrent(q);
        setOpen(true);
        setFirstAttemptForThisAirport(true);
      } else {
        // 풀이 다 떨어졌으면 통과 처리
        advance();
      }
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !current) return null;

  const choose = (idx: number) => {
    const result = evaluateAnswer(current, idx);
    recordQuizAttempt(current.id, result.correct && firstAttemptForThisAirport);
    setShowExplanation(result);
    if (result.correct) {
      // 1.5초 후 모달 닫고 phase 진행
      setTimeout(() => {
        setOpen(false);
        setShowExplanation(null);
        advance();
      }, 1800);
    } else {
      // 1.5초 후 새 문제 (정답까지 반복)
      setTimeout(() => {
        setShowExplanation(null);
        setFirstAttemptForThisAirport(false);
        const nextQ = startAirportQuiz([...attemptedIds, current.id]);
        if (nextQ) {
          setCurrent(nextQ);
        } else {
          // 풀 고갈 → 강제 통과
          showToast('문제 은행이 다 떨어졌어요. 통과!');
          setOpen(false);
          advance();
        }
      }, 1800);
    }
  };

  const advance = () => {
    // 공항 퀴즈 통과 → AirportScene의 exit 노드로 phase 신호. 사실은 AirportScene이
    // 학생이 exit 노드로 다음 클릭해서 진행하게 두는 편이 자연스럽지만, MVP 자동화:
    showToast('비행기표를 받았어요! 탑승 게이트로 이동합니다.');
    // 다음 phase는 AirportScene이 computeNextPhase로 결정. 직접 트리거:
    if (phase === 'airport_start') setPhase('worldmap_to_1');
    else if (phase === 'airport_1') setPhase('worldmap_to_2');
    else if (phase === 'airport_2') setPhase('worldmap_to_home');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[520px] flex flex-col gap-3">
        <div className="flex justify-between text-xs text-slate-500">
          <span>✈️ 탑승 게이트 퀴즈</span>
          <span>정답을 맞춰야 비행기표가 발급돼요</span>
        </div>
        <h2 className="text-lg font-bold text-slate-800">{current.question}</h2>

        <div className="grid grid-cols-1 gap-2">
          {current.choices.map((c, idx) => {
            const disabled = !!showExplanation;
            const isAnswer = showExplanation && idx === current.answerIndex;
            const isWrong = showExplanation && !showExplanation.correct && idx !== current.answerIndex && showExplanation;
            return (
              <button
                key={idx}
                disabled={disabled}
                onClick={() => choose(idx)}
                className={`border rounded-lg px-3 py-2 text-left transition ${
                  disabled
                    ? isAnswer ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'
                    : 'border-slate-300 hover:border-sky-500 text-slate-800'
                }`}
              >
                <span className="font-semibold mr-2">{idx + 1}.</span>
                <span>{c}</span>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className={`mt-2 p-2 rounded text-sm ${showExplanation.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {showExplanation.correct ? showExplanation.explanation : '다시 한 번 풀어볼까요? 다음 문제로 갈게요.'}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: UIOverlay에 QuizModal 추가**

```tsx
import { QuizModal } from '@/components/overlays/QuizModal';
// JSX 안에:
<QuizModal />
```

- [ ] **Step 3: typecheck + dev 수동 검증**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

Chrome에서 공항 진입 시 퀴즈 모달이 뜨고, 정답 시 비행기 컷씬으로 자동 진행되는지 확인.

- [ ] **Step 4: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(overlays): QuizModal (공항 퀴즈 게이트, 정답까지 반복 출제)"
}
```

---

### Task 4.4: MinigameModal (떨림 리듬 + 땀 닦기 탭) + 체온 tick 루프

**Files:**
- Create: `components/overlays/MinigameModal.tsx`
- Create: `components/overlays/TempTickRunner.tsx` (체온 자동 변화 + 위험 시 자동회복 트리거)
- Modify: `components/UIOverlay.tsx`

- [ ] **Step 1: TempTickRunner — 환경 변화율 + 위험 자동 회복**

`C:\Users\user\agent\thermoregulation\components\overlays\TempTickRunner.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  computeEnvironmentDelta,
  isInDangerZone,
  computeAutoRecoveryDelta,
} from '@/game/systems/temperatureSystem';
import { TEMP_TICK_MS, DANGER_AUTO_RECOVERY_DELAY_MS } from '@/game/config';
import { getCountryById } from '@/game/data/countries';
import type { Phase, EnvironmentType } from '@/game/types';

function phaseToEnv(phase: Phase, actualCold: string | null, actualHot: string | null): EnvironmentType {
  if (phase === 'country_1_outdoor' && actualCold) return getCountryById(actualCold as 'finland' | 'canada' | 'dubai' | 'egypt')!.outdoorEnv;
  if (phase === 'country_1_indoor' && actualCold) return getCountryById(actualCold as 'finland' | 'canada' | 'dubai' | 'egypt')!.indoorEnv;
  if (phase === 'country_2_outdoor' && actualHot) return getCountryById(actualHot as 'finland' | 'canada' | 'dubai' | 'egypt')!.outdoorEnv;
  if (phase === 'country_2_indoor' && actualHot) return getCountryById(actualHot as 'finland' | 'canada' | 'dubai' | 'egypt')!.indoorEnv;
  return 'neutral';
}

export function TempTickRunner() {
  const dangerEnteredAtRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = useGameStore.getState();
      const env = phaseToEnv(s.phase, s.actualCold, s.actualHot);

      // 환경 변화 적용
      const envDelta = computeEnvironmentDelta(env, TEMP_TICK_MS);
      if (envDelta !== 0) s.adjustTemp(envDelta);

      // 위험 범위 자동 회복 트리거
      const now = Date.now();
      if (isInDangerZone(s.currentTemp)) {
        if (dangerEnteredAtRef.current === null) {
          dangerEnteredAtRef.current = now;
          if (s.currentTemp < 35.5) s.showToast('🥶 어지러움! 따뜻한 곳을 찾아야 해요');
          else                       s.showToast('🥵 너무 더워! 시원한 곳을 찾아야 해요');
        } else if (now - dangerEnteredAtRef.current >= DANGER_AUTO_RECOVERY_DELAY_MS) {
          const recover = computeAutoRecoveryDelta(s.currentTemp);
          if (recover !== 0) {
            s.adjustTemp(recover);
            s.showToast('💪 NPC 도움으로 체온 회복 중…');
            dangerEnteredAtRef.current = now;
          }
        }
      } else {
        dangerEnteredAtRef.current = null;
      }

      // 보조 인디케이터 갱신 (간소화)
      if (env === 'cold_outdoor' || env === 'hot_indoor') {
        s.setVesselState('constricted');
        s.setThyroxineLevel(Math.min(s.thyroxineLevel + 0.5, 100));
        s.setSweatLevel(Math.max(s.sweatLevel - 1, 0));
      } else if (env === 'hot_outdoor' || env === 'cold_indoor') {
        s.setVesselState('dilated');
        s.setSweatLevel(Math.min(s.sweatLevel + 1, 100));
        s.setThyroxineLevel(Math.max(s.thyroxineLevel - 0.3, 0));
      } else {
        s.setVesselState('normal');
      }

      // 유지 점수 기록 (게임 진행 중 phase에서만)
      const activePhases: Phase[] = ['country_1_outdoor', 'country_1_indoor', 'country_2_outdoor', 'country_2_indoor'];
      if (activePhases.includes(s.phase)) {
        s.recordTick();
      }
    }, TEMP_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}
```

- [ ] **Step 2: MinigameModal — 떨림 리듬 + 땀 닦기 탭**

`C:\Users\user\agent\thermoregulation\components\overlays\MinigameModal.tsx`:

```tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MINIGAME_SUCCESS_DELTA } from '@/game/config';

const COUNTRY_PHASES = new Set([
  'country_1_outdoor', 'country_1_indoor',
  'country_2_outdoor', 'country_2_indoor',
]);

type MinigameKind = 'shiver' | 'sweat';

export function MinigameModal() {
  const phase = useGameStore(s => s.phase);
  const adjustTemp = useGameStore(s => s.adjustTemp);
  const showToast = useGameStore(s => s.showToast);

  const [active, setActive] = useState(false);
  const [kind, setKind] = useState<MinigameKind>('shiver');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // phase 변화에 따라 미니게임 자동 시작 (간소화: phase 진입하면 한 번 띄움)
  useEffect(() => {
    if (!COUNTRY_PHASES.has(phase)) return;
    // 환경에 맞춰 미니게임 종류 결정
    const isShiver = phase === 'country_1_outdoor' || phase === 'country_2_indoor';
    setKind(isShiver ? 'shiver' : 'sweat');
    setScore(0);
    setTimeLeft(8);
    setActive(true);
  }, [phase]);

  // 타이머
  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active]);

  const tap = () => {
    if (!active) return;
    setScore(s => s + 1);
  };

  const finish = () => {
    setActive(false);
    const success = score >= 10;
    if (success) {
      const isCooling = kind === 'sweat'; // 땀 닦기 = 더위 → 식힘
      adjustTemp(isCooling ? -MINIGAME_SUCCESS_DELTA : +MINIGAME_SUCCESS_DELTA);
      showToast(kind === 'shiver' ? '💪 떨림으로 열 발생! 체온 회복' : '💧 땀 발산! 체온 회복');
    } else {
      showToast('아쉽! 다음 단계로 갑니다');
    }
  };

  if (!active) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/40">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[520px] flex flex-col gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          {kind === 'shiver' ? '🥶 떨림 리듬 — 추위 반응!' : '💦 땀 닦기 — 더위 반응!'}
        </h2>
        <p className="text-sm text-slate-600">
          {kind === 'shiver'
            ? '아래 버튼을 빠르게 두드려서 떨림으로 열을 만들어요. 10번 이상 두드리면 체온 회복.'
            : '아래 버튼을 빠르게 두드려서 땀을 발산해요. 10번 이상 두드리면 체온 회복.'}
        </p>

        <button
          onClick={tap}
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xl font-bold rounded-lg py-8 select-none"
        >
          {kind === 'shiver' ? '🥶 떨림!' : '💧 닦기!'}
        </button>

        <div className="flex justify-between text-sm">
          <span className="text-slate-600">탭 횟수: <strong className="text-slate-900">{score}</strong></span>
          <span className="text-slate-600">남은 시간: <strong className="text-slate-900">{timeLeft}초</strong></span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded overflow-hidden">
          <div className="h-full bg-sky-500" style={{ width: `${Math.min((score/10)*100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
```

> **주의:** 미니게임이 종료(finish) 된 후, CountryScene이 캐릭터를 exit 노드로 자동 이동시키는 게 더 자연스럽다. 단순화 방식: 미니게임 모달 종료 시 React에서 setPhase는 따로 안 한다. 학생이 화면의 exit 노드(다음 location)를 클릭해서 진행. 만약 자동 진행을 원하면 finish()에 다음 단계 phase 전환 추가:

```tsx
const finish = () => {
  setActive(false);
  // ...기존 score/toast 로직
  // 자동 진행 (선택적):
  const { phase, setPhase } = useGameStore.getState();
  if (phase === 'country_1_outdoor') setPhase('country_1_indoor');
  else if (phase === 'country_1_indoor') setPhase('airport_1');
  // 등...
};
```

이 자동 진행 패턴은 학생이 화면을 적극적으로 클릭해야 하는 흐름과 충돌할 수 있다. MVP에서는 자동 진행 OFF, 미니게임 후 학생이 exit 노드 클릭으로 진행 (학습 자기 페이스 유지).

- [ ] **Step 3: UIOverlay에 추가**

```tsx
import { MinigameModal } from '@/components/overlays/MinigameModal';
import { TempTickRunner } from '@/components/overlays/TempTickRunner';
// JSX:
<TempTickRunner />
<MinigameModal />
```

- [ ] **Step 4: typecheck + dev 수동 검증**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

Chrome에서:
1. 야외 location 진입 → 미니게임 모달 자동 표시 + HUD 체온 막대가 환경에 따라 움직임
2. 탭 미니게임 진행 → 종료 시 토스트 표시
3. exit 노드 클릭하여 indoor로 이동 → 반대 환경 미니게임

- [ ] **Step 5: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(overlays): MinigameModal(떨림/땀닦기) + TempTickRunner(환경 변화+자동회복)"
}
```

---

### Task 4.5: EndingCard (별점 평가 + 항상성 일반화 멘트)

**Files:**
- Create: `components/overlays/EndingCard.tsx`
- Modify: `components/UIOverlay.tsx`

- [ ] **Step 1: EndingCard**

`C:\Users\user\agent\thermoregulation\components\overlays\EndingCard.tsx`:

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { computeStars, getEndingMessage } from '@/game/systems/scoreSystem';

export function EndingCard() {
  const phase = useGameStore(s => s.phase);
  const nickname = useGameStore(s => s.nickname);
  const inSafe = useGameStore(s => s.inSafeZoneTicks);
  const total = useGameStore(s => s.totalTicks);
  const firstCorrect = useGameStore(s => s.airportQuizFirstCorrect);
  const totalAttempts = useGameStore(s => s.airportQuizTotalAttempts);
  const reset = useGameStore(s => s.reset);

  if (phase !== 'ending') return null;

  const tempRetentionPct = total > 0 ? (inSafe / total) * 100 : 0;
  // 첫시도 정답률: 3공항 모두 도전했다고 가정하면 분모 3
  const quizFirstTryPct = (firstCorrect / 3) * 100;

  const stars = computeStars({ tempRetentionPct, quizFirstTryPct });
  const message = getEndingMessage(stars);

  const starRow = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/50">
      <div className="bg-white rounded-2xl p-8 shadow-xl w-[560px] flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-800 text-center">수학여행 끝!</h1>
        <p className="text-center text-slate-600 text-sm">{nickname}의 결과</p>

        <div className="text-5xl text-center my-2 tracking-widest">{starRow}</div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded p-3">
            <div className="text-slate-500">🌡️ 체온 유지율</div>
            <div className="text-2xl font-bold text-slate-800">{tempRetentionPct.toFixed(0)}%</div>
          </div>
          <div className="bg-slate-50 rounded p-3">
            <div className="text-slate-500">✈️ 공항 퀴즈 첫 시도</div>
            <div className="text-2xl font-bold text-slate-800">{firstCorrect}/3 ({quizFirstTryPct.toFixed(0)}%)</div>
          </div>
        </div>

        <p className="text-slate-800 mt-2">{message}</p>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-slate-700">
          💡 <strong>오늘 배운 것:</strong> 우리 몸은 추워도 더워도 일정한 체온을 유지하려 해요. 이걸 <strong>항상성</strong>이라고 해요.
          체온뿐 아니라 <strong>혈당량</strong>·<strong>수분량</strong>도 같은 원리로 일정하게 유지된답니다.
        </div>

        <button
          onClick={reset}
          className="bg-sky-600 hover:bg-sky-700 text-white rounded py-2 font-semibold mt-2"
        >
          처음부터 다시 하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: UIOverlay에 추가**

```tsx
import { EndingCard } from '@/components/overlays/EndingCard';
// JSX:
<EndingCard />
```

- [ ] **Step 3: typecheck + dev 수동 검증**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

전체 플레이를 끝까지 진행 → 결말 카드 등장 확인.

- [ ] **Step 4: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(overlays): EndingCard (별점 + 항상성 일반화 멘트)"
}
```

---

## Phase 5: Admin v1 (시각 좌표 편집기)

### Task 5.1: Admin API 라우트 (좌표 저장)

**배경:** `/admin?scene=country_finland_outdoor` 페이지에서 노드를 드래그하면 즉시 `public/data/nodes-<scene>.json`에 저장된다. dev 모드에서만 활성화.

**Files:**
- Create: `app/api/nodes/route.ts`

- [ ] **Step 1: API 라우트 작성**

`C:\Users\user\agent\thermoregulation\app\api\nodes\route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_SCENES = new Set([
  'classroom', 'airport_start', 'airport_finland', 'airport_canada',
  'airport_dubai', 'airport_egypt', 'worldmap', 'ending',
  'country_finland_outdoor', 'country_finland_indoor',
  'country_canada_outdoor', 'country_canada_indoor',
  'country_dubai_outdoor', 'country_dubai_indoor',
  'country_egypt_outdoor', 'country_egypt_indoor',
]);

export async function POST(req: NextRequest) {
  // dev에서만 허용
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Admin API disabled in production' }, { status: 403 });
  }

  const body = await req.json();
  const { scene, payload } = body;

  if (!scene || typeof scene !== 'string' || !ALLOWED_SCENES.has(scene)) {
    return NextResponse.json({ error: 'invalid scene' }, { status: 400 });
  }

  if (!payload || !Array.isArray(payload.nodes)) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const filepath = path.resolve(process.cwd(), 'public', 'data', `nodes-${scene}.json`);
  await fs.writeFile(filepath, JSON.stringify(payload, null, 2), 'utf-8');

  return NextResponse.json({ ok: true, file: `nodes-${scene}.json` });
}
```

- [ ] **Step 2: 수동 검증 — curl 또는 PowerShell로 테스트**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm dev
}
```

다른 터미널에서:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  $body = @{
    scene = 'classroom'
    payload = @{
      scene = 'classroom'
      startNode = 'entry'
      nodes = @(
        @{ id = 'entry'; x = 640; y = 700; type = 'walk'; label = '교실 입구' }
        @{ id = 'choose'; x = 640; y = 400; type = 'trigger'; label = '학급회의'; action = 'classroom_choose_cold' }
        @{ id = 'depart'; x = 1100; y = 700; type = 'exit'; label = '교실 출구'; action = 'airport_start' }
      )
    }
  } | ConvertTo-Json -Depth 5
  Invoke-RestMethod -Uri 'http://localhost:3000/api/nodes' -Method Post -Body $body -ContentType 'application/json'
}
```

**Expected**: `{ok: true, file: "nodes-classroom.json"}` 반환 + `public/data/nodes-classroom.json` 파일이 갱신됨.

- [ ] **Step 3: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(admin): /api/nodes 좌표 저장 라우트 (dev 전용)"
}
```

---

### Task 5.2: Admin 페이지 (드래그 편집기)

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Admin 페이지 작성**

`C:\Users\user\agent\thermoregulation\app\admin\page.tsx`:

```tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import type { SceneNodes, NodeConfig } from '@/game/types';

const SCENES = [
  'classroom', 'airport_start',
  'airport_finland', 'airport_canada', 'airport_dubai', 'airport_egypt',
  'worldmap', 'ending',
  'country_finland_outdoor', 'country_finland_indoor',
  'country_canada_outdoor', 'country_canada_indoor',
  'country_dubai_outdoor', 'country_dubai_indoor',
  'country_egypt_outdoor', 'country_egypt_indoor',
];

const BG_KEYS_BY_SCENE: Record<string, string> = SCENES.reduce((acc, s) => ({
  ...acc, [s]: `/assets/backgrounds/${s}.png`
}), {});

export default function AdminPage() {
  const [scene, setScene] = useState('classroom');
  const [data, setData] = useState<SceneNodes | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/data/nodes-${scene}.json`)
      .then(r => r.json())
      .then(setData);
  }, [scene]);

  const save = async () => {
    if (!data) return;
    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, payload: data }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      alert('저장 실패: ' + (await res.text()));
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !data || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1280 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (800 / rect.height));
    setData({
      ...data,
      nodes: data.nodes.map(n => n.id === dragging ? { ...n, x, y } : n),
    });
  };

  if (!data) return <div className="p-8 text-white">Loading…</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-bold">노드 좌표 편집기</h1>
        <select
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded px-2 py-1"
        >
          {SCENES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={save} className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded">
          저장
        </button>
        {saved && <span className="text-green-400">✅ 저장 완료</span>}
      </header>

      <div
        ref={wrapRef}
        className="relative border border-slate-600 mx-auto"
        style={{ width: '100%', maxWidth: 1280, aspectRatio: '16 / 10' }}
        onMouseMove={onMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        {/* 배경 — 자산이 없으면 placeholder */}
        <img
          src={BG_KEYS_BY_SCENE[scene]}
          alt=""
          className="absolute inset-0 w-full h-full object-fill"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-slate-200/40" />

        {/* 노드 */}
        {data.nodes.map(n => (
          <div
            key={n.id}
            onMouseDown={(e) => { e.preventDefault(); setDragging(n.id); }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
            style={{ left: `${(n.x / 1280) * 100}%`, top: `${(n.y / 800) * 100}%` }}
          >
            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-md ${
              n.type === 'trigger' ? 'bg-yellow-400' :
              n.type === 'exit' ? 'bg-green-400' : 'bg-slate-400'
            }`} />
            <div className="text-xs bg-black/70 text-white px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
              {n.id} ({n.x}, {n.y})
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-400 mx-auto">
        노드를 드래그해서 위치 조정 후 "저장" 클릭. 노란 = trigger, 녹색 = exit, 회색 = walk.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: dev 수동 검증**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm dev
}
```

Chrome에서 `http://localhost:3000/admin` 열기. 씬 선택 → 노드 드래그 → 저장 → 게임 새로고침 시 새 좌표가 반영되는지 확인.

- [ ] **Step 3: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "feat(admin): /admin 시각 노드 편집기 (드래그→저장)"
}
```

---

## Phase 6: 통합 + 최종 검증

### Task 6.1: 통합 시나리오 테스트 — 한 사이클 완주

**Files:**
- Create: `tests/integration/full-flow.test.ts`

- [ ] **Step 1: 통합 시나리오 테스트**

`C:\Users\user\agent\thermoregulation\tests\integration\full-flow.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { computeStars } from '@/game/systems/scoreSystem';

describe('전체 게임 플로우 한 사이클', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('타이틀 → 학급회의 → RPS → 공항 → 1국 → 2국 → 결말까지 phase가 일관되게 전환된다', () => {
    const store = useGameStore.getState();

    // 1. 닉네임 입력
    store.setNickname('태형');
    expect(useGameStore.getState().nickname).toBe('태형');

    // 2. 학급회의 진입
    store.setPhase('classroom_intro');
    store.setPhase('classroom_choose_cold');
    store.chooseCold('finland');
    store.setPhase('classroom_rps_cold');
    // 가위바위보 결과 — 승 가정
    store.setActualCountries('finland', 'finland'); // 임시
    store.setPhase('classroom_choose_hot');
    store.chooseHot('egypt');
    store.setPhase('classroom_rps_hot');
    store.setActualCountries('finland', 'egypt');
    store.setPhase('classroom_depart');

    // 3. 출발국 공항
    store.setPhase('airport_start');
    store.recordQuizAttempt('c1', true);  // 첫 시도 정답
    store.setPhase('worldmap_to_1');

    // 4. 1국 도착 및 진행
    store.setPhase('country_1_arrived');
    store.setPhase('country_1_outdoor');
    // 환경 변화 시뮬레이션 — 30틱 진행 (15초 분량)
    for (let i = 0; i < 30; i++) store.recordTick();
    store.setPhase('country_1_indoor');
    for (let i = 0; i < 30; i++) store.recordTick();
    store.completeCountry('finland');

    // 5. 1국 공항
    store.setPhase('airport_1');
    store.recordQuizAttempt('h1', true);
    store.setPhase('worldmap_to_2');

    // 6. 2국 진행
    store.setPhase('country_2_arrived');
    store.setPhase('country_2_outdoor');
    for (let i = 0; i < 30; i++) store.recordTick();
    store.setPhase('country_2_indoor');
    for (let i = 0; i < 30; i++) store.recordTick();
    store.completeCountry('egypt');

    // 7. 2국 공항 → 결말
    store.setPhase('airport_2');
    store.recordQuizAttempt('n1', true);
    store.setPhase('worldmap_to_home');
    store.setPhase('ending');

    // 검증
    const final = useGameStore.getState();
    expect(final.phase).toBe('ending');
    expect(final.completedCountries.sort()).toEqual(['egypt', 'finland']);
    expect(final.airportQuizFirstCorrect).toBe(3);
    expect(final.totalTicks).toBe(120);
    expect(final.inSafeZoneTicks).toBe(120);  // 환경 효과 안 적용했으므로 항상 적정

    const stars = computeStars({
      tempRetentionPct: (final.inSafeZoneTicks / final.totalTicks) * 100,
      quizFirstTryPct: (final.airportQuizFirstCorrect / 3) * 100,
    });
    expect(stars).toBe(3);
  });

  it('체온이 위험 범위 진입 → 적정 복귀 시 유지율 계산 정확', () => {
    const store = useGameStore.getState();
    store.setPhase('country_1_outdoor');

    // 50틱 적정
    for (let i = 0; i < 50; i++) store.recordTick();

    // 위험 진입
    store.adjustTemp(-2.0);  // 34.5℃
    for (let i = 0; i < 50; i++) store.recordTick();

    expect(useGameStore.getState().inSafeZoneTicks).toBe(50);
    expect(useGameStore.getState().totalTicks).toBe(100);
  });
});
```

- [ ] **Step 2: 테스트 실행**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test full-flow
}
```

**Expected**: 2 passed.

- [ ] **Step 3: 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "test: 전체 플로우 통합 테스트 (한 사이클 완주)"
}
```

---

### Task 6.2: 빌드 + 수동 종합 검증

**Files:** (수정 없음, 검증만)

- [ ] **Step 1: 전체 테스트 실행**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm test
}
```

**Expected**: 모든 테스트 통과.

- [ ] **Step 2: typecheck**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm typecheck
}
```

**Expected**: 오류 없음.

- [ ] **Step 3: lint**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm lint
}
```

**Expected**: 오류 없음 (warning 약간 허용).

- [ ] **Step 4: production 빌드**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm build
}
```

**Expected**: `✓ Compiled successfully` 메시지, 에러 없음.

- [ ] **Step 5: 수동 종합 검증 (체크리스트)**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  pnpm dev
}
```

Chrome에서 `http://localhost:3000` 열고 다음 체크리스트 모두 통과 확인:

- [ ] 닉네임 입력 후 시작 버튼 클릭 시 교실 화면으로 전환
- [ ] 학급회의 도입 멘트 모달 → 추 선택 화면 (핀란드/캐나다 2지선다)
- [ ] 추 선택 후 RPSModal → 가위바위보 (이기면 본인 선택, 지면 NPC 선택, 무승부면 재시도)
- [ ] 더 선택 + 가위바위보 동일 동작
- [ ] 출발 안내 토스트 → 캐릭터가 자동으로 교실 출구로 이동 → 출발국 공항 화면
- [ ] 공항 trigger 노드 도착 → 퀴즈 모달 자동 표시
- [ ] 정답 입력 시 해설 1.5초 → 자동 다음 단계
- [ ] 오답 입력 시 해설 → 다른 문항 자동 출제
- [ ] 비행기 컷씬 (월드맵 위 ✈️ 이동) 자동 진행
- [ ] 1국 야외 진입 → HUD 우측 막대 표시 + 환경에 따라 슬라이더 움직임
- [ ] 야외 trigger 노드 도착 → 미니게임 모달 (떨림 또는 땀 닦기) 자동 표시
- [ ] 탭 미니게임 종료 → 토스트 + 체온 회복
- [ ] exit 노드 클릭 → 실내(패러독스) 전환 → 반대 환경 미니게임
- [ ] 실내 exit 노드 → 공항 → 퀴즈 → 비행기 컷씬 → 2국 동일 반복
- [ ] 2국 완료 후 귀환 컷씬 → 결말 카드 (별점 + 체온 유지율 + 항상성 일반화 멘트)
- [ ] "처음부터 다시 하기" 클릭 → 초기화 확인 (localStorage clear)
- [ ] HUD가 게임 진행 phase에서만 표시되고 결말 등에서는 숨김
- [ ] 한글 줄바꿈이 음절 단위로 끊기지 않음 (모든 모달 본문)
- [ ] `/admin` 페이지에서 노드 드래그 → 저장 → 게임 새로고침 시 반영
- [ ] localStorage 새로고침 후 마지막 phase로 복원

- [ ] **Step 6: 최종 커밋**

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -Command {
  Set-Location C:\Users\user\agent\thermoregulation
  git add -A
  git commit -m "chore: MVP 검증 완료 — Phase 1~6 한 사이클 완주 가능" --allow-empty
}
```

---

## 부록 A: Phase 2 / Polish 항목 (별도 계획 예정)

본 계획은 스펙 §13.1의 **MVP 13개 항목**만 포함한다. 다음 항목은 MVP 검증 후 별도 계획으로 처리:

### Phase 2 — 국가별 문화 미니 이벤트 (스펙 §13.2)
- 🇫🇮 핀란드 야외: 오로라 관측 미니 이벤트
- 🇨🇦 캐나다 야외: 메이플 시럽 따기 (리듬)
- 🇦🇪 두바이 야외: 부르즈 칼리파 풍경 또는 낙타 타기
- 🇪🇬 이집트 야외: 피라미드/스핑크스 퍼즐 (사용자 원안)

### Polish — 시간 여유 시 (스펙 §13.3)
- 효과음/BGM (snug-hormone-game audio 자산 재사용)
- 결말 평가 디테일 (체온 유지율 그래프, 등급별 멘트 차별화)
- 출국/입국 짧은 컷씬
- 보너스 자율 방문 모드 (안 갔던 2국 추가)
- NPC 대화 확장

이 항목들은 MVP가 학생에게 검증된 후, 실제 수업 피드백을 반영해 우선순위를 재조정해서 작성한다.

---

## 부록 B: 자산 체크리스트 (사용자 직접 제작)

코드 구현 전후 어느 시점이든 다음 자산이 `public/assets/` 에 들어오면 BootScene이 자동 인식:

### 배경 도트 일러스트 (1280×800 PNG) — 15장
- `public/assets/backgrounds/classroom.png`
- `public/assets/backgrounds/airport_start.png`
- `public/assets/backgrounds/airport_finland.png`
- `public/assets/backgrounds/airport_canada.png`
- `public/assets/backgrounds/airport_dubai.png`
- `public/assets/backgrounds/airport_egypt.png`
- `public/assets/backgrounds/worldmap.png`
- `public/assets/backgrounds/country_finland_outdoor.png`
- `public/assets/backgrounds/country_finland_indoor.png`
- `public/assets/backgrounds/country_canada_outdoor.png`
- `public/assets/backgrounds/country_canada_indoor.png`
- `public/assets/backgrounds/country_dubai_outdoor.png`
- `public/assets/backgrounds/country_dubai_indoor.png`
- `public/assets/backgrounds/country_egypt_outdoor.png`
- `public/assets/backgrounds/country_egypt_indoor.png`
- `public/assets/backgrounds/ending.png`

### 플레이어 sprite (~110×186 PNG)
- `public/assets/sprites/player_idle.png` (1프레임)
- `public/assets/sprites/player_walk_down.png` (5프레임 스프라이트시트, 가로 550×186)
- `public/assets/sprites/player_walk_up.png` (5프레임)
- `public/assets/sprites/player_walk_left.png` (5프레임)
- `public/assets/sprites/player_walk_right.png` (5프레임)

자산이 없는 동안은 BootScene이 색사각형 + 라벨로 placeholder 표시. 자산을 추가하면 자동 로드.

---

## 부록 C: 참고 문서

- 디자인 스펙: [docs/superpowers/specs/2026-05-12-thermoregulation-design.md](../specs/2026-05-12-thermoregulation-design.md)
- 브레인스토밍 결정 히스토리: [docs/brainstorm-progress.md](../../brainstorm-progress.md)
- 교과서 분석: [docs/textbook-summary.md](../../textbook-summary.md)
- HUD mockup: [docs/brainstorm-mockups/q5-hud-v2-bar.html](../../brainstorm-mockups/q5-hud-v2-bar.html)
- 자매 프로젝트 베이스라인:
  - `../snug-hormone-game/docs/superpowers/specs/2026-05-02-hormone-design.md`
  - `../snug-hormone-game/docs/superpowers/plans/2026-05-02-hormone-implementation.md`




