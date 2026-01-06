// ===== SUCCESS CELEBRATION COMPONENT =====
// Celebrate successful actions with confetti.

"use client";

import { useState, useEffect } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

interface CelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

export function SuccessCelebration({ show, onComplete }: CelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!show) {
      setPieces([]);
      return;
    }

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.3,
    }));

    setPieces(newPieces);

    // Clean up after animation
    const timeout = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [show, onComplete]);

  if (!show || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Hook for triggering celebrations
export function useCelebration() {
  const [showCelebration, setShowCelebration] = useState(false);

  const celebrate = () => {
    setShowCelebration(true);
  };

  const clear = () => {
    setShowCelebration(false);
  };

  return {
    showCelebration,
    celebrate,
    clear,
    CelebrationComponent: () => (
      <SuccessCelebration show={showCelebration} onComplete={clear} />
    ),
  };
}
