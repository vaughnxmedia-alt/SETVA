import type { MagazineBlock } from "@/lib/magazine";

export function MagazineArticleBody({ blocks }: { blocks: MagazineBlock[] }) {
  return (
    <div className="space-y-5 text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2
              key={`${block.text}-${index}`}
              className="pt-4 font-display text-2xl text-white sm:text-3xl"
            >
              {block.text}
            </h2>
          );
        }

        return (
          <p key={`${block.text.slice(0, 24)}-${index}`} className="text-white/88">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
