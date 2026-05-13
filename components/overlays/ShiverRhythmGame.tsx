'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import {
  TWINKLE_CHART, TWINKLE_BPM, SONG_DURATION_SEC,
  beatsToSeconds, type ChartNote,
} from '@/game/audio/twinkleChart';

const LANE_COUNT = 4;
const FALL_DURATION_SEC = 1.6;     // 노트가 화면 위에서 hit-zone까지 내려오는 시간
const HIT_WINDOW_SEC = 0.18;       // 판정 허용 오차 (±)
const PERFECT_WINDOW_SEC = 0.08;   // 퍼펙트 판정
const COMBO_FOR_SHIVER = 5;        // 연속 N회 → 떨림 성공

const LANE_COLORS = ['#22d3ee', '#f472b6', '#facc15', '#34d399']; // cyan, pink, yellow, green
const LANE_KEYS = ['1', '2', '3', '4'];

type LiveNote = ChartNote & {
  id: string;
  hitTimeSec: number;   // 노트가 hit-zone에 닿아야 하는 절대 시각 (song time)
  state: 'pending' | 'hit' | 'miss';
};

interface Props {
  onFinish: (result: { hits: number; misses: number; shiverPops: number }) => void;
  onShiverSuccess: () => void;  // 콤보 N회 달성
  onMiss: () => void;           // 매 미스
}

export function ShiverRhythmGame({ onFinish, onShiverSuccess, onMiss }: Props) {
  const [notes, setNotes] = useState<LiveNote[]>([]);
  const [combo, setCombo] = useState(0);
  const [shiverPops, setShiverPops] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; key: number; lane: number } | null>(null);
  const [songTime, setSongTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const notesRef = useRef<LiveNote[]>([]);
  const comboRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const shiverPopsRef = useRef(0);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const finishedRef = useRef(false);

  // 노트 사전 빌드
  useEffect(() => {
    const built: LiveNote[] = TWINKLE_CHART.map((n, i) => ({
      ...n,
      id: `n${i}`,
      hitTimeSec: beatsToSeconds(n.t),
      state: 'pending',
    }));
    setNotes(built);
    notesRef.current = built;
  }, []);

  // 게임 시작 — Tone.start()는 사용자 제스처가 필요해서 버튼 클릭으로 트리거
  const handleStart = useCallback(async () => {
    if (started) return;
    await Tone.start();

    // 8-bit 느낌의 square 신스
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square8' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 },
      volume: -12,
    }).toDestination();
    synthRef.current = synth;

    // 멜로디 예약 (Tone.Transport 대신 직접 setTimeout 스케줄링 — 단순함)
    const t0 = performance.now() / 1000;
    startedAtRef.current = t0;
    TWINKLE_CHART.forEach(n => {
      const delayMs = beatsToSeconds(n.t) * 1000;
      setTimeout(() => {
        if (synthRef.current && !finishedRef.current) {
          synthRef.current.triggerAttackRelease(n.pitch, beatsToSeconds(n.dur));
        }
      }, delayMs);
    });

    setStarted(true);
  }, [started]);

  // 게임 루프 (requestAnimationFrame)
  useEffect(() => {
    if (!started || finished) return;

    const tick = () => {
      const now = performance.now() / 1000;
      const t = now - startedAtRef.current;
      setSongTime(t);

      // 놓친 노트 처리
      let missedAny = false;
      for (const note of notesRef.current) {
        if (note.state === 'pending' && t > note.hitTimeSec + HIT_WINDOW_SEC) {
          note.state = 'miss';
          missedAny = true;
          missesRef.current += 1;
          comboRef.current = 0;
          setCombo(0);
          onMiss();
        }
      }
      if (missedAny) {
        setNotes([...notesRef.current]);
      }

      // 곡 종료
      if (t > SONG_DURATION_SEC + 0.5) {
        finishedRef.current = true;
        setFinished(true);
        onFinish({
          hits: hitsRef.current,
          misses: missesRef.current,
          shiverPops: shiverPopsRef.current,
        });
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started, finished, onFinish, onMiss]);

  // 키 입력
  useEffect(() => {
    if (!started || finished) return;

    const handleKey = (e: KeyboardEvent) => {
      const laneIdx = LANE_KEYS.indexOf(e.key);
      if (laneIdx < 0) return;
      e.preventDefault();
      tryHit(laneIdx);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, finished]);

  const tryHit = (lane: number) => {
    const now = performance.now() / 1000 - startedAtRef.current;
    // 해당 레인의 가장 가까운 pending 노트
    let best: LiveNote | null = null;
    let bestDelta = Infinity;
    for (const n of notesRef.current) {
      if (n.lane !== lane || n.state !== 'pending') continue;
      const delta = Math.abs(n.hitTimeSec - now);
      if (delta < bestDelta && delta <= HIT_WINDOW_SEC) {
        bestDelta = delta;
        best = n;
      }
    }
    if (!best) {
      // 빈 입력 = 미스
      missesRef.current += 1;
      comboRef.current = 0;
      setCombo(0);
      setFeedback({ text: '아우 추워...', key: Date.now(), lane });
      onMiss();
      return;
    }
    best.state = 'hit';
    hitsRef.current += 1;
    comboRef.current += 1;
    setCombo(comboRef.current);
    setNotes([...notesRef.current]);

    const isPerfect = bestDelta <= PERFECT_WINDOW_SEC;
    setFeedback({ text: isPerfect ? 'PERFECT' : 'GOOD', key: Date.now(), lane });

    if (comboRef.current > 0 && comboRef.current % COMBO_FOR_SHIVER === 0) {
      shiverPopsRef.current += 1;
      setShiverPops(shiverPopsRef.current);
      onShiverSuccess();
    }
  };

  // 피드백 텍스트 자동 fade
  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(null), 600);
    return () => clearTimeout(id);
  }, [feedback]);

  // 언마운트 정리
  useEffect(() => {
    return () => {
      finishedRef.current = true;
      if (synthRef.current) {
        synthRef.current.releaseAll();
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0c2a4e 0%, #050a18 100%)',
        imageRendering: 'pixelated' as const,
      }}
    >
      <div
        className="relative"
        style={{
          width: 560,
          height: 640,
          background: '#000',
          border: '6px solid #fbbf24',
          borderRadius: 8,
          boxShadow: '0 0 0 4px #1e293b, 0 8px 32px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.8)',
          padding: 16,
          imageRendering: 'pixelated' as const,
        }}
      >
        {/* 상단 HUD: 콤보 + 떨림 성공 카운터 + 진행률 */}
        <div className="flex justify-between items-center mb-3 text-white font-mono">
          <div className="flex flex-col">
            <span className="text-xs text-slate-300">COMBO</span>
            <span
              className="text-3xl font-bold"
              style={{
                color: combo >= COMBO_FOR_SHIVER ? '#fde047' : '#fff',
                textShadow: combo >= COMBO_FOR_SHIVER ? '0 0 12px #fbbf24' : 'none',
              }}
            >
              {combo}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-300">🥶 떨림 성공</span>
            <span className="text-2xl font-bold text-cyan-300">×{shiverPops}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-300">진행</span>
            <span className="text-xl font-bold text-emerald-300">
              {Math.min(100, Math.floor((songTime / SONG_DURATION_SEC) * 100))}%
            </span>
          </div>
        </div>

        {/* 4 lane 영역 */}
        <div
          className="relative"
          style={{
            width: '100%',
            height: 480,
            background: 'linear-gradient(180deg, rgba(2,6,23,0.9) 0%, rgba(15,23,42,0.95) 100%)',
            border: '3px solid #334155',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* 레인 구분선 */}
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: `${(i / LANE_COUNT) * 100}%`,
                width: 2,
                background: 'rgba(100, 116, 139, 0.4)',
              }}
            />
          ))}

          {/* hit-zone */}
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: 8,
              height: 32,
              background: 'linear-gradient(180deg, rgba(251,191,36,0.0) 0%, rgba(251,191,36,0.35) 50%, rgba(251,191,36,0.0) 100%)',
              borderTop: '2px solid #fbbf24',
              borderBottom: '2px solid #fbbf24',
            }}
          />

          {/* 노트 렌더 (게임 시작 전에는 숨김) */}
          {started && notes.map(n => {
            if (n.state !== 'pending') return null;
            const laneArea = 480 - 40;  // hit zone 위까지의 높이
            const timeUntilHit = n.hitTimeSec - songTime;
            // timeUntilHit == FALL_DURATION_SEC → y=0 (top), timeUntilHit == 0 → y=laneArea (hit zone)
            const progress = 1 - (timeUntilHit / FALL_DURATION_SEC);
            if (progress < -0.05 || progress > 1.1) return null;
            const y = progress * laneArea;
            const laneWidth = 100 / LANE_COUNT;
            return (
              <div
                key={n.id}
                style={{
                  position: 'absolute',
                  left: `${n.lane * laneWidth}%`,
                  top: y,
                  width: `${laneWidth}%`,
                  height: 26,
                  padding: '0 4px',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: LANE_COLORS[n.lane],
                    border: '2px solid #fff',
                    borderRadius: 2,
                    boxShadow: `inset 0 -4px 0 rgba(0,0,0,0.3), inset 0 4px 0 rgba(255,255,255,0.5), 0 0 8px ${LANE_COLORS[n.lane]}`,
                    imageRendering: 'pixelated' as const,
                  }}
                />
              </div>
            );
          })}

          {/* 피드백 텍스트 */}
          {feedback && (
            <div
              key={feedback.key}
              style={{
                position: 'absolute',
                left: `${(feedback.lane + 0.5) * (100 / LANE_COUNT)}%`,
                bottom: 60,
                transform: 'translateX(-50%)',
                color:
                  feedback.text === 'PERFECT' ? '#fde047' :
                  feedback.text === 'GOOD' ? '#86efac' : '#f87171',
                fontFamily: 'monospace',
                fontWeight: 900,
                fontSize: feedback.text === '아우 추워...' ? 20 : 28,
                textShadow: '2px 2px 0 #000, 0 0 12px currentColor',
                animation: 'rhythm-feedback 0.6s ease-out forwards',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* 키 라벨 */}
        <div className="flex mt-2" style={{ height: 48 }}>
          {LANE_KEYS.map((k, i) => (
            <div
              key={k}
              className="flex-1 flex items-center justify-center font-mono font-bold text-white"
              style={{
                margin: '0 2px',
                background: '#1e293b',
                border: `2px solid ${LANE_COLORS[i]}`,
                borderRadius: 4,
                boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.4), 0 0 6px ${LANE_COLORS[i]}`,
                fontSize: 20,
              }}
            >
              {k}
            </div>
          ))}
        </div>

        {/* 시작 오버레이 */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <h2 className="text-3xl font-bold text-white mb-2 font-mono">🥶 떨림 리듬</h2>
            <p className="text-slate-300 text-sm mb-1">1·2·3·4 키로 박자에 맞춰 노트를 쳐 떨림으로 열을 내요!</p>
            <p className="text-cyan-300 text-xs mb-6">5번 연속 성공 → 떨림 성공! 체온 ↑</p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-md font-mono text-lg"
              style={{ boxShadow: '0 4px 0 #b45309, 0 0 16px rgba(251,191,36,0.6)' }}
            >
              START
            </button>
          </div>
        )}

        {/* 종료 오버레이 */}
        {finished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }}>
            <h2 className="text-3xl font-bold text-cyan-300 mb-3 font-mono">🥶 떨림 완료!</h2>
            <p className="text-white text-lg mb-1">떨림 성공 <span className="text-amber-300 font-bold">×{shiverPops}</span></p>
            <p className="text-slate-400 text-sm">
              명중 {hitsRef.current} · 놓침 {missesRef.current}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes rhythm-feedback {
          0% { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.8); }
          20% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(1); }
        }
      `}</style>
    </div>
  );
}
