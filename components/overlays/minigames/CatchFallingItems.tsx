'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { MinigameResult } from '../MinigameModal';

/**
 * 사막(더2 야외) — 떨어지는 아이템 받기.
 * 좌우 이동 (←→ 또는 A/D)으로 좋은 아이템(시원함)은 받고 나쁜 아이템(더위)은 피한다.
 *
 * 좋은 아이템: 💧 물 / 🍉 수박 / 🧊 얼음 — +1, 체온 ↓
 * 나쁜 아이템: ☀️ 햇볕 / 🔥 불 / 🌶️ 매운고추 — -1, 체온 ↑
 */

const GAME_DURATION_SEC = 30;
const SUCCESS_SCORE = 8;
const FIELD_W = 720;
const FIELD_H = 480;
const PLAYER_W = 80;
const PLAYER_H = 64;
const ITEM_SIZE = 44;
const FALL_SPEED = 220;        // px/sec
const SPAWN_INTERVAL_MS = 650;
const MOVE_SPEED = 480;        // px/sec

const GOOD_ITEMS = ['💧', '🍉', '🧊'] as const;
const BAD_ITEMS  = ['☀️', '🔥', '🌶️'] as const;

interface Item {
  id: number;
  x: number;
  y: number;
  emoji: string;
  good: boolean;
}

interface Props {
  onFinish: (result: MinigameResult) => void;
}

export function CatchFallingItems({ onFinish }: Props) {
  const adjustTemp = useGameStore(s => s.adjustTemp);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC);
  const timeLeftRef = useRef(GAME_DURATION_SEC);

  const playerXRef = useRef(FIELD_W / 2);
  const [playerX, setPlayerX] = useState(FIELD_W / 2);

  const itemsRef = useRef<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const itemIdRef = useRef(0);

  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const lastFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const [flash, setFlash] = useState<{ good: boolean; key: number } | null>(null);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const success = scoreRef.current >= SUCCESS_SCORE;
    setTimeout(() => onFinish({ success, score: scoreRef.current }), 800);
  }, [onFinish]);

  // 타이머
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(id);
        finish();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [started, finished, finish]);

  // 키 입력
  useEffect(() => {
    if (!started || finished) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { keysRef.current.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { keysRef.current.right = true; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [started, finished]);

  // 아이템 스폰
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      const goodChance = 0.55;
      const isGood = Math.random() < goodChance;
      const pool = isGood ? GOOD_ITEMS : BAD_ITEMS;
      const emoji = pool[Math.floor(Math.random() * pool.length)];
      const item: Item = {
        id: ++itemIdRef.current,
        x: Math.random() * (FIELD_W - ITEM_SIZE) + ITEM_SIZE / 2,
        y: -ITEM_SIZE,
        emoji,
        good: isGood,
      };
      itemsRef.current = [...itemsRef.current, item];
    }, SPAWN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [started, finished]);

  // 게임 루프 (RAF)
  useEffect(() => {
    if (!started || finished) return;
    lastFrameRef.current = performance.now();
    const loop = (now: number) => {
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      // 플레이어 이동
      let nx = playerXRef.current;
      if (keysRef.current.left) nx -= MOVE_SPEED * dt;
      if (keysRef.current.right) nx += MOVE_SPEED * dt;
      nx = Math.max(PLAYER_W / 2, Math.min(FIELD_W - PLAYER_W / 2, nx));
      playerXRef.current = nx;
      setPlayerX(nx);

      // 아이템 낙하 + 충돌 판정
      const playerTop = FIELD_H - PLAYER_H;
      const newItems: Item[] = [];
      let caughtGood = 0, caughtBad = 0;
      for (const it of itemsRef.current) {
        const ny = it.y + FALL_SPEED * dt;
        // 충돌: 아이템 중심이 플레이어 위쪽 사각형에 들어옴
        if (ny > playerTop && Math.abs(it.x - playerXRef.current) < PLAYER_W / 2 + ITEM_SIZE / 2 - 8) {
          if (it.good) caughtGood++; else caughtBad++;
          continue;  // 아이템 소멸
        }
        // 화면 아래로 빠짐
        if (ny > FIELD_H + ITEM_SIZE) continue;
        newItems.push({ ...it, y: ny });
      }
      itemsRef.current = newItems;
      setItems(newItems);

      if (caughtGood > 0) {
        scoreRef.current += caughtGood;
        setScore(scoreRef.current);
        adjustTemp(-0.1 * caughtGood);  // 사막 = 더운 환경, 좋은 아이템 → 체온 ↓
        setFlash({ good: true, key: now });
      }
      if (caughtBad > 0) {
        scoreRef.current = Math.max(0, scoreRef.current - caughtBad);
        setScore(scoreRef.current);
        adjustTemp(+0.15 * caughtBad);  // 나쁜 아이템 → 체온 ↑
        setFlash({ good: false, key: now });
      }

      if (!finishedRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started, finished, adjustTemp]);

  // 사막 자동 체온 상승 (더운 환경)
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => adjustTemp(+0.04), 250);   // +0.16℃/sec
    return () => clearInterval(id);
  }, [started, finished, adjustTemp]);

  // flash fade
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 250);
    return () => clearTimeout(id);
  }, [flash]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6">
      <div
        className="relative bg-gradient-to-b from-yellow-700 via-orange-600 to-amber-800 border-4 border-yellow-300 rounded-2xl shadow-2xl"
        style={{ width: FIELD_W + 48, padding: 24 }}
      >
        {/* HUD */}
        <div className="flex justify-between items-center mb-3 text-white font-mono">
          <div>
            <div className="text-xs text-yellow-200">잡은 개수</div>
            <div className="text-3xl font-bold" style={{ color: score >= SUCCESS_SCORE ? '#fde047' : '#fff' }}>
              {score} / {SUCCESS_SCORE}
            </div>
          </div>
          <div className="text-center text-yellow-100 font-bold text-lg">🏜️ 사막 — 시원한 것만 받아요!</div>
          <div className="text-right">
            <div className="text-xs text-yellow-200">남은 시간</div>
            <div className="text-3xl font-bold text-emerald-300">{timeLeft}s</div>
          </div>
        </div>

        {/* 안내 */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-mono">
          <div className="bg-cyan-900/60 text-cyan-200 rounded p-2 border border-cyan-400/40">
            ⭕ 받아야 함: <strong className="text-white">{GOOD_ITEMS.join(' ')}</strong>
          </div>
          <div className="bg-red-900/60 text-red-200 rounded p-2 border border-red-400/40">
            ❌ 피해야 함: <strong className="text-white">{BAD_ITEMS.join(' ')}</strong>
          </div>
        </div>

        {/* 게임 필드 */}
        <div
          className="relative overflow-hidden rounded-lg"
          style={{
            width: FIELD_W,
            height: FIELD_H,
            background: 'linear-gradient(180deg, #fde68a 0%, #fbbf24 60%, #b45309 100%)',
            border: '3px solid #92400e',
          }}
        >
          {/* 떨어지는 아이템 */}
          {items.map(it => (
            <div
              key={it.id}
              style={{
                position: 'absolute',
                left: it.x - ITEM_SIZE / 2,
                top: it.y - ITEM_SIZE / 2,
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                fontSize: ITEM_SIZE - 6,
                textAlign: 'center',
                lineHeight: `${ITEM_SIZE}px`,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {it.emoji}
            </div>
          ))}

          {/* 플레이어 (바구니) */}
          <div
            style={{
              position: 'absolute',
              left: playerX - PLAYER_W / 2,
              top: FIELD_H - PLAYER_H,
              width: PLAYER_W,
              height: PLAYER_H,
              background: 'linear-gradient(180deg, #fef3c7 0%, #f59e0b 100%)',
              border: '3px solid #78350f',
              borderRadius: '50% 50% 8px 8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              fontSize: 30,
              textAlign: 'center',
              lineHeight: `${PLAYER_H}px`,
              transition: 'transform 60ms ease-out',
              pointerEvents: 'none',
            }}
          >
            🧺
          </div>

          {/* 캐치 플래시 */}
          {flash && (
            <div
              key={flash.key}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: flash.good ? 'rgba(34,197,94,0.25)' : 'rgba(220,38,38,0.3)',
                animation: 'catch-flash 0.25s ease-out forwards',
              }}
            />
          )}
        </div>

        {/* 컨트롤 안내 */}
        <p className="mt-2 text-center text-yellow-100 text-xs font-mono">← → 또는 A/D 로 이동</p>

        {/* 시작/완료 오버레이 */}
        {!started && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2">🏜️ 사막의 더위!</h2>
            <p className="text-sm text-yellow-200 mb-4">
              체온이 빠르게 오르고 있어요. 시원한 아이템을 모아 체온을 식혀요!
            </p>
            <button
              onClick={() => setStarted(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-full shadow-xl text-lg"
            >
              시작 (←/→ 또는 A/D)
            </button>
          </div>
        )}
        {finished && (
          <div className="absolute inset-0 bg-black/85 rounded-2xl flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2">{score >= SUCCESS_SCORE ? '🎉 잘했어요!' : '⏰ 시간 종료'}</h2>
            <p className="text-lg mb-1">잡은 아이템 <span className="text-amber-300 font-bold">{score}</span></p>
            <p className="text-sm text-slate-300">다음 단계로 진행…</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes catch-flash {
          0%   { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
