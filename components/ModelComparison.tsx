'use client';

// ===== MODEL COMPARISON VIEW =====
// Compare translations from different AI models.

import React, { useState } from 'react';

interface ModelResult {
  model: string;
  translation: string;
  time: number;
  cost: number;
}

interface ModelComparisonProps {
  code: string;
  results: ModelResult[];
  isLoading?: boolean;
}

export function ModelComparison({ code: _code, results, isLoading }: ModelComparisonProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(
    results.slice(0, 2).map(r => r.model)
  );
  
  const toggleModel = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model].slice(-2) // Max 2 for comparison
    );
  };
  
  const selected = results.filter(r => selectedModels.includes(r.model));
  
  return (
    <div className="space-y-4">
      {/* Model selector */}
      <div className="flex flex-wrap gap-2">
        {results.map(result => (
          <button
            key={result.model}
            onClick={() => toggleModel(result.model)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedModels.includes(result.model)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {result.model}
          </button>
        ))}
      </div>
      
      {/* Comparison grid */}
      <div className={`grid gap-4 ${selected.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {selected.map(result => (
          <div key={result.model} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-white">{result.model}</h3>
              <div className="text-xs text-gray-400">
                {result.time}ms • {result.cost} credits
              </div>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {result.translation}
            </div>
          </div>
        ))}
      </div>
      
      {isLoading && (
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2" />
          Comparing models...
        </div>
      )}
    </div>
  );
}

export default ModelComparison;
