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

  it('적정 범위에서는 "적정" 라벨', () => {
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
