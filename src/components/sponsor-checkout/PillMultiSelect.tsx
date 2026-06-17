"use client";

type PillMultiSelectProps = {
  label: string;
  description?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function PillMultiSelect({
  label,
  description,
  options,
  value,
  onChange,
}: PillMultiSelectProps) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-cream/90">{label}</p>
      {description && (
        <p className="mt-1 text-xs text-cream/55">{description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                selected
                  ? "border-gold bg-gold text-ink shadow-md shadow-gold/20 scale-[1.02]"
                  : "border-gold/25 bg-black/30 text-cream/75 hover:border-gold/50 hover:bg-gold/5"
              }`}
              aria-pressed={selected}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
