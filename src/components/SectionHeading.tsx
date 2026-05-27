type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl text-cream sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg text-cream/70">{subtitle}</p>
      )}
    </div>
  );
}
