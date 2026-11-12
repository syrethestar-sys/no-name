/** Page title in the viewfinder style: mono eyebrow, tall condensed title, quiet subline. */
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
  const titleSize = size === 'large' ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-5xl';

  return (
    <div>
      {eyebrow && <p className="font-mono text-xs text-muted-foreground">{eyebrow}</p>}
      <h1 className={`display-title mt-2 pb-1 ${titleSize}`}>{title}</h1>
      {children && <p className="mt-2 text-muted-foreground">{children}</p>}
    </div>
  );
}
