'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { startAirportQuiz, evaluateAnswer } from '@/game/systems/quizSystem';
import type { QuizQuestion, Phase } from '@/game/types';

const AIRPORT_QUIZ_PHASES = new Set<Phase>(['airport_start', 'airport_1', 'airport_2']);

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

  // phase가 airport_* 가 되면 modal 자동으로 띄움.
  useEffect(() => {
    if (AIRPORT_QUIZ_PHASES.has(phase) && !open) {
      const q = startAirportQuiz(attemptedIds);
      if (q) {
        setCurrent(q);
        setOpen(true);
        setFirstAttemptForThisAirport(true);
      } else {
        // 풀이 다 떨어졌으면 통과 처리 (drama 보존: 사유 토스트 명시)
        showToast('문제 은행이 다 떨어졌어요. 통과!');
        advance();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!open || !current) return null;

  const choose = (idx: number) => {
    const result = evaluateAnswer(current, idx);
    recordQuizAttempt(current.id, result.correct && firstAttemptForThisAirport);
    setShowExplanation(result);
    if (result.correct) {
      // 1.8초 후 모달 닫고 phase 진행
      setTimeout(() => {
        setOpen(false);
        setShowExplanation(null);
        advance();
      }, 1800);
    } else {
      // 1.8초 후 새 문제 (정답까지 반복)
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
    showToast('비행기표를 받았어요! 비행기를 타고 출발해요.');
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
