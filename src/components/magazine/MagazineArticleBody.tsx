type MagazineArticleBodyProps = {
  nomineeBioHtml: string;
  pullQuote: string;
  articleBodyHtml: string;
};

export function MagazineArticleBody({
  nomineeBioHtml,
  pullQuote,
  articleBodyHtml,
}: MagazineArticleBodyProps) {
  return (
    <div className="space-y-6">
      {nomineeBioHtml ? (
        <div
          className="magazine-rich-content"
          dangerouslySetInnerHTML={{ __html: nomineeBioHtml }}
        />
      ) : null}

      {pullQuote ? (
        <h2 className="magazine-pull-quote border-t border-white/10 pt-6">{pullQuote}</h2>
      ) : null}

      {articleBodyHtml ? (
        <div
          className="magazine-rich-content"
          dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
        />
      ) : null}
    </div>
  );
}
