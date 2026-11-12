/** Page title in the getlayers style: mono eyebrow, large light gradient title, quiet subline. */
export function PageHeading({
  eyebrow,
  title,
  children,
  size = 'large',
}: {
  eyebrow?: React.ReactNode;
  title: string;
  /** The subline under the title. */
  children?: React.ReactNode;
  /** `large` for gallery pages, `small` for forms. */
  size?: 'large' | 'small';
}) {
  const titleSize = size === 'large' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl';

  return (
    <div>
      {eyebrow && <p className="font-mono text-xs text-muted-foreground">{eyebrow}</p>}
      <h1
        className={`mt-2 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text pb-1 font-light tracking-tight text-transparent ${titleSize}`}
      >
        {title}
      </h1>
      {children && <p className="mt-2 text-muted-foreground">{children}</p>}
    </div>
  );
}
