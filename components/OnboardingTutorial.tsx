// ===== ONBOARDING TUTORIAL COMPONENT =====
// First-time user tutorial overlay.

"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Code, Zap, Settings, CreditCard } from "lucide-react";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tutorialSteps: Step[] = [
  {
    title: "Welcome to Code Translator!",
    description: "This app translates code into plain English, line by line. Perfect for understanding unfamiliar codebases or learning programming concepts.",
    icon: <Code className="w-8 h-8" />,
  },
  {
    title: "Paste Your Code",
    description: "Paste any code snippet on the left side. The app supports many languages including TypeScript, Python, Rust, Go, and more.",
    icon: <Code className="w-8 h-8" />,
  },
  {
    title: "Automatic Translation",
    description: "By default, translation happens automatically as you type. You can also use manual mode by clicking the Auto/Manual toggle.",
    icon: <Zap className="w-8 h-8" />,
  },
  {
    title: "Payment Options",
    description: "Use credits (included free) or bring your own API key (BYOK) for unlimited translations. Configure this in Settings.",
    icon: <CreditCard className="w-8 h-8" />,
  },
  {
    title: "Customize Your Experience",
    description: "Choose from multiple AI models, toggle dark mode, and configure other settings to personalize your experience.",
    icon: <Settings className="w-8 h-8" />,
  },
];

const STORAGE_KEY = "code-translator-onboarding-complete";

export function OnboardingTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay showing to let the app load first
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={handleComplete}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-blue-500/10 text-blue-500">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {tutorialSteps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-blue-500"
                    : i < currentStep
                    ? "bg-blue-300"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${currentStep === 0
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reset onboarding (for testing)
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
