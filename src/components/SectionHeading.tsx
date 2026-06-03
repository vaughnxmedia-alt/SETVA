type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "dark",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  const titleClass = tone === "light" ? "text-black" : "text-cream";
  const subtitleClass = tone === "light" ? "text-black/70" : "text-cream/70";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          {eyebrow}
        </p>
      )}
      <h2 className={`font-display text-3xl sm:text-4xl ${titleClass}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg ${subtitleClass}`}>{subtitle}</p>
      )}
    </div>
  );
}
