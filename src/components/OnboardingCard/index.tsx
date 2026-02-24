"use client";

import type { CardComponentProps } from "onborda";

export default function OnboardingCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="relative w-80 rounded-2xl border border-white/12 bg-[#0f1118]/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-5 text-white">
      {/* Arrow pointer */}
      {arrow}

      {/* Step progress */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? "w-4 bg-rose-400"
                  : i < currentStep
                  ? "w-1.5 bg-white/40"
                  : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Title */}
      <div className="mb-2 flex items-center gap-2">
        {step.icon && <span className="text-xl leading-none">{step.icon}</span>}
        <h3 className="text-base font-semibold text-white">{step.title}</h3>
      </div>

      {/* Content */}
      <div className="mb-5 text-sm leading-relaxed text-white/65">{step.content}</div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        {!isFirst ? (
          <button
            onClick={prevStep}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 transition hover:border-white/25 hover:text-white/90"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={nextStep}
          className="rounded-xl bg-rose-500/90 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-500 active:scale-95"
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
