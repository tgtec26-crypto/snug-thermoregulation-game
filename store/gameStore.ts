import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : ({
              length: 0,
              clear: () => {},
              getItem: () => null,
              key: () => null,
              removeItem: () => {},
              setItem: () => {},
            } satisfies Storage)
      ),
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
