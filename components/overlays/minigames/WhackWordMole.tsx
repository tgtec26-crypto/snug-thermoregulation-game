'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { MinigameResult } from '../MinigameModal';

/**
 * 사우나(추1 실내) — 단어 두더지.
 * 더운 환경에서 적절한 반응(더위 반응)만 클릭. 추위 반응 클릭 시 페널티.
 *
 * 좋은 단어 (클릭 → +1, 체온 ↓)
 * - 땀 분비
 * - 혈관 확장
 * - 티록신 감소
 *
 * 나쁜 단어 (클릭 → -1, 체온 ↑)
 * - 혈관 수축
 * - 근육 떨림
 * - 티록신 증가
 */

const GOOD_WORDS = ['땀 분비', '혈관 확장', '티록신 감소'] as const;
const BAD_WORDS = ['혈관 수축', '근육 떨림', '티록신 증가'] as const;
const ALL_WORDS = [...GOOD_WORDS, ...BAD_WORDS];

const GAME_DURATION_SEC = 30;
const SPAWN_INTERVAL_MS = 750;
const POP_DURATION_MS = 1400;
const HOLES = 6;
const SUCCESS_SCORE = 10;

interface Mole {
  id: number;
  hole: number;       // 0~5
  word: string;
  isGood: boolean;
  spawnedAt: number;  // performance.now()
  state: 'pending' | 'hit' | 'missed';
}

interface Props {
  onFinish: (result: MinigameResult) => void;
}

export function WhackWordMole({ onFinish }: Props) {
  const adjustTemp = useGameStore(s => s.adjustTemp);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC);
  const timeLeftRef = useRef(GAME_DURATION_SEC);
  const [moles, setMoles] = useState<Mole[]>([]);
  const molesRef = useRef<Mole[]>([]);
  const idCounterRef = useRef(0);
  const finishedRef = useRef(false);

  const [flash, setFlash] = useState<{ hole: number; good: boolean; key: number } | null>(null);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    const success = scoreRef.current >= SUCCESS_SCORE;
    setTimeout(() => onFinish({ success, score: scoreRef.current }), 800);
  }, [onFinish]);

  // 게임 타이머
  useEffect(() => {
    if (!started || finished) return;
    const tickId = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(tickId);
        finish();
      }
    }, 1000);
    return () => clearInterval(tickId);
  }, [started, finished, finish]);

  // 두더지 스폰
  useEffect(() => {
    if (!started || finished) return;
    const spawnId = setInterval(() => {
      const occupiedHoles = new Set(molesRef.current.filter(m => m.state === 'pending').map(m => m.hole));
      const freeHoles: number[] = [];
      for (let i = 0; i < HOLES; i++) if (!occupiedHoles.has(i)) freeHoles.push(i);
      if (freeHoles.length === 0) return;
      const hole = freeHoles[Math.floor(Math.random() * freeHoles.length)];
      const word = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
      const isGood = (GOOD_WORDS as readonly string[]).includes(word);
      const m: Mole = {
        id: ++idCounterRef.current,
        hole,
        word,
        isGood,
        spawnedAt: performance.now(),
        state: 'pending',
      };
      molesRef.current = [...molesRef.current, m];
      setMoles([...molesRef.current]);
    }, SPAWN_INTERVAL_MS);
    return () => clearInterval(spawnId);
  }, [started, finished]);

  // 두더지 만료 처리 (POP_DURATION_MS 지나면 자동 사라짐)
  useEffect(() => {
    if (!started || finished) return;
    const expireId = setInterval(() => {
      const now = performance.now();
      let changed = false;
      molesRef.current = molesRef.current.filter(m => {
        if (m.state === 'hit') return false;
        if (now - m.spawnedAt > POP_DURATION_MS) {
          changed = true;
          return false;
        }
        return true;
      });
      if (changed) setMoles([...molesRef.current]);
    }, 100);
    return () => clearInterval(expireId);
  }, [started, finished]);

  const whack = (m: Mole) => {
    if (m.state !== 'pending' || finished) return;
    m.state = 'hit';
    if (m.isGood) {
      scoreRef.current = Math.min(99, scoreRef.current + 1);
      adjustTemp(-0.05);  // 사우나 = 더운 환경, 더위 반응 정답 → 체온 ↓
    } else {
      scoreRef.current = Math.max(-99, scoreRef.current - 1);
      adjustTemp(+0.08);  // 추위 반응 오답 → 더위 가중
    }
    setScore(scoreRef.current);
    setFlash({ hole: m.hole, good: m.isGood, key: Date.now() });
    molesRef.current = molesRef.current.filter(x => x.id !== m.id);
    setMoles([...molesRef.current]);
  };

  // flash 자동 fade
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(id);
  }, [flash]);

  const handleStart = () => {
    if (started) return;
    setStarted(true);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
      <div
        className="relative bg-gradient-to-b from-amber-900 to-rose-900 border-4 border-amber-300 rounded-2xl shadow-2xl"
        style={{ width: 720, padding: 24 }}
      >
        {/* HUD */}
        <div className="flex justify-between items-center mb-3 text-white font-mono">
          <div>
            <div className="text-xs text-amber-200">점수</div>
            <div className="text-3xl font-bold" style={{ color: score >= SUCCESS_SCORE ? '#fde047' : '#fff' }}>
              {score} / {SUCCESS_SCORE}
            </div>
          </div>
          <div className="text-center text-amber-100 font-bold text-lg">🧖 사우나 — 더위 반응만 클릭!</div>
          <div className="text-right">
            <div className="text-xs text-amber-200">남은 시간</div>
            <div className="text-3xl font-bold text-emerald-300">{timeLeft}s</div>
          </div>
        </div>

        {/* 안내 */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-mono">
          <div className="bg-green-800/70 text-green-200 rounded p-2 border border-green-400/40">
            ⭕ 클릭: <strong className="text-white">{GOOD_WORDS.join(' · ')}</strong>
          </div>
          <div className="bg-red-800/70 text-red-200 rounded p-2 border border-red-400/40">
            ❌ 클릭 금지: <strong className="text-white">{BAD_WORDS.join(' · ')}</strong>
          </div>
        </div>

        {/* 두더지 구멍 6개 (2×3) */}
        <div
          className="grid grid-cols-3 gap-3"
          style={{ gridTemplateRows: 'repeat(2, 1fr)' }}
        >
          {Array.from({ length: HOLES }, (_, hole) => {
            const m = moles.find(mm => mm.hole === hole && mm.state === 'pending');
            const isFlashing = flash?.hole === hole;
            return (
              <div
                key={hole}
                className="relative flex items-center justify-center rounded-xl bg-amber-950/60 border-2 border-amber-700"
                style={{
                  height: 110,
                  boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.6)',
                }}
              >
                {/* 두더지 단어 */}
                {m && (
                  <button
                    onClick={() => whack(m)}
                    className={`relative px-4 py-2 rounded-lg font-bold text-white border-2 transition-transform active:scale-95 cursor-pointer ${
                      m.isGood
                        ? 'bg-rose-500 border-rose-200 hover:bg-rose-400'
                        : 'bg-sky-600 border-sky-200 hover:bg-sky-500'
                    }`}
                    style={{
                      animation: 'mole-pop 0.2s ease-out',
                      fontSize: 18,
                      whiteSpace: 'nowrap',
                      wordBreak: 'keep-all',
                    }}
                  >
                    {m.word}
                  </button>
                )}
                {/* hit 플래시 */}
                {isFlashing && (
                  <div
                    key={flash?.key}
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: flash?.good ? 'rgba(34,197,94,0.7)' : 'rgba(220,38,38,0.7)',
                      animation: 'mole-flash 0.4s ease-out forwards',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* 시작 / 완료 오버레이 */}
        {!started && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2">🧖 사우나 두더지!</h2>
            <p className="text-sm text-amber-200 mb-1">사우나는 <strong>더운 환경</strong>이에요.</p>
            <p className="text-sm text-amber-200 mb-4">
              <span className="text-rose-300">더위 반응(분홍)</span>만 클릭하고,
              <span className="text-sky-300"> 추위 반응(파랑)</span>은 클릭하지 마세요.
            </p>
            <button
              onClick={handleStart}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-full shadow-xl text-lg"
            >
              시작
            </button>
          </div>
        )}
        {finished && (
          <div className="absolute inset-0 bg-black/85 rounded-2xl flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2">{score >= SUCCESS_SCORE ? '🎉 잘했어요!' : '⏰ 시간 종료'}</h2>
            <p className="text-lg mb-1">최종 점수 <span className="text-amber-300 font-bold">{score}</span></p>
            <p className="text-sm text-slate-300">다음 단계로 진행…</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes mole-pop {
          0%   { transform: translateY(20px) scale(0.7); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes mole-flash {
          0%   { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
