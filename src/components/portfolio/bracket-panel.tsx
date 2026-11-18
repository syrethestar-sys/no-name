import type { PanelContent } from '@/lib/portfolio-content';

const corner = 'absolute size-3 border-pf-accent';

/** A small text panel marked by four mint corner brackets, like the viewfinder's focus frame. */
export function BracketPanel({ title, lines }: PanelContent) {
  return (
    <section aria-label={title} className="relative p-5">
      <span aria-hidden className={`${corner} top-0 left-0 border-t border-l`} />
      <span aria-hidden className={`${corner} top-0 right-0 border-t border-r`} />
      <span aria-hidden className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span aria-hidden className={`${corner} right-0 bottom-0 border-r border-b`} />
      <h2 className="font-mono text-xs uppercase text-pf-ink-muted">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
