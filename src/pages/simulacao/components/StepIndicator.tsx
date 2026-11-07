interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const labels = ['Seus Dados', 'Contato', 'Perfil'];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="flex items-center">
        {labels.map((label, i) => {
          const num = i + 1;
          const completed = num < currentStep;
          const active = num === currentStep;

          return (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 min-w-[60px] sm:min-w-[80px]">
                <div
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : completed
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  {completed ? (
                    <i className="ri-check-line text-xs text-emerald-400" />
                  ) : (
                    <span
                      className={`text-xs font-bold ${active ? 'text-emerald-400' : 'text-white/30'}`}
                    >
                      {num}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium transition-colors duration-300 ${
                    active ? 'text-white' : completed ? 'text-white/50' : 'text-white/25'
                  }`}
                >
                  {label}
                </span>
              </div>
              {num < labels.length && (
                <div className="w-6 sm:w-10 h-[1px] mx-1 sm:mx-2 bg-white/10 relative overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                      completed ? 'w-full bg-emerald-500/50' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}