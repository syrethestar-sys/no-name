export type CrtBoxSize = {
  /** Width, height and depth, in percent of the TV's width. */
  w: number;
  h: number;
  d: number;
  /** Where its centre sits, relative to the TV's centre. Depth: negative is further back. */
  x?: number;
  y?: number;
  z?: number;
};

/**
 * One block of a CSS-3D TV: front, back, top and two sides (the bottom is never seen). The look
 * of each face is in crt-tv.css. Children are drawn on the front face.
 */
export function CrtBox({
  size,
  className = '',
  children,
}: {
  size: CrtBoxSize;
  className?: string;
  children?: React.ReactNode;
}) {
  const style = {
    '--bw': `${size.w}cqw`,
    '--bh': `${size.h}cqw`,
    '--bd': `${size.d}cqw`,
    '--ox': `${size.x ?? 0}cqw`,
    '--oy': `${size.y ?? 0}cqw`,
    '--oz': `${size.z ?? 0}cqw`,
  } as React.CSSProperties;

  return (
    <div className={`crt-box ${className}`} style={style}>
      <div className="crt-f-front">{children}</div>
      <div className="crt-f-back" />
      <div className="crt-f-top" />
      <div className="crt-f-left" />
      <div className="crt-f-right" />
    </div>
  );
}
