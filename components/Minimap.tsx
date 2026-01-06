'use client';

// ===== MINIMAP PREVIEW =====
// Monaco-style minimap for code overview.

import React, { useRef, useEffect } from 'react';

interface MinimapProps {
  code: string;
  highlightedLines?: number[];
  currentLine?: number;
  onClick?: (line: number) => void;
  height?: number;
}

export function Minimap({ code, highlightedLines = [], currentLine, onClick, height = 200 }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lines = code.split('\n');
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const lineHeight = Math.max(1, height / lines.length);
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    lines.forEach((line, i) => {
      const y = i * lineHeight;
      const width = Math.min(line.length * 0.5, canvas.width);
      
      if (highlightedLines.includes(i + 1)) {
        ctx.fillStyle = '#3b82f6';
      } else if (currentLine === i + 1) {
        ctx.fillStyle = '#fbbf24';
      } else {
        ctx.fillStyle = '#4b5563';
      }
      
      ctx.fillRect(2, y, width, Math.max(lineHeight - 1, 1));
    });
  }, [code, highlightedLines, currentLine, height, lines.length]);
  
  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !onClick) return;
    
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const line = Math.floor((y / height) * lines.length) + 1;
    onClick(line);
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={60}
      height={height}
      onClick={handleClick}
      className="cursor-pointer border-l border-gray-700"
    />
  );
}

export default Minimap;
