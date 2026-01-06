'use client';

// ===== STEP-BY-STEP WALKTHROUGH =====
// Walk through code explanation step by step.

import React, { useState } from 'react';

interface WalkthroughStep {
  line: number;
  code: string;
  explanation: string;
}

interface WalkthroughProps {
  steps: WalkthroughStep[];
  onStepChange?: (step: number) => void;
}

export function Walkthrough({ steps, onStepChange }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const goTo = (step: number) => {
    const newStep = Math.max(0, Math.min(steps.length - 1, step));
    setCurrentStep(newStep);
    onStepChange?.(newStep);
  };
  
  if (steps.length === 0) return null;
  
  const step = steps[currentStep];
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-gray-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      {/* Step content */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-400">
            Step {currentStep + 1} of {steps.length} • Line {step.line}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goTo(currentStep - 1)}
              disabled={currentStep === 0}
              className="p-1 rounded hover:bg-gray-700 disabled:opacity-30"
            >
              ←
            </button>
            <button
              onClick={() => goTo(currentStep + 1)}
              disabled={currentStep === steps.length - 1}
              className="p-1 rounded hover:bg-gray-700 disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
        
        <pre className="p-3 bg-gray-900 rounded text-sm font-mono text-gray-300 mb-3 overflow-x-auto">
          {step.code}
        </pre>
        
        <p className="text-gray-300">{step.explanation}</p>
      </div>
      
      {/* Step dots */}
      <div className="flex justify-center gap-1 pb-3">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentStep ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default Walkthrough;
