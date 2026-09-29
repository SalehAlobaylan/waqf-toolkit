/**
 * Waqf Toolkit brand mark — the eight-point rosette.
 *
 * The geometry here is measured from the master artwork in `docs/logos`, not
 * eyeballed: one arm is a bezier chain (root → widest point → waist → tangent
 * into the tip) unioned with a tip circle, then instanced eight times. These
 * numbers are the logo. If one changes, all three marks and every raster in
 * `public/` have to change with it — re-run `pnpm brand` afterwards.
 *
 * Colours resolve to the `--color-brand-*` tokens in `app.css`.
 */

const ARM_PATH = [
  'M0 -1.93',
  'C9.23 -2 10.2 -4.64 14.05 -4.64',
  'C17.9 -4.64 20.02 -2.18 22.9 -2.18',
  'C23.8 -2.18 25.57 -2.6 26.9 -4.3',
  'L26.9 4.3',
  'C25.57 2.6 23.8 2.18 22.9 2.18',
  'C17.9 4.64 20.02 2.18 14.05 4.64',
  'C10.2 4.64 9.23 2 0 1.93',
  'Z',
].join(' ')

const TIP_CX = 33.58
const TIP_R = 8.06
const DOT_R = 11.18
const TILE_R = 22.5

const ARM_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

type RosetteProps = {
  className?: string
  /** Arm colour. */
  arms?: string
  /** Centre dot colour. */
  dot?: string
  /** Paint a rounded tile behind the rosette. Omit on dark surfaces. */
  tile?: string
  'aria-label'?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

function Rosette({
  className,
  arms = 'var(--color-brand-olive)',
  dot = 'var(--color-brand-cream)',
  tile,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}: RosetteProps) {
  // The mark carries no information the adjacent wordmark does not, so every
  // use in the app hides it. Labelled rendering is supported for standalone
  // use (print, exported cards) where there is no adjacent text.
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : (ariaLabel ?? 'Waqf Toolkit')}
      aria-hidden={ariaHidden}
    >
      {tile ? <rect width="100" height="100" rx={TILE_R} fill={tile} /> : null}
      <g fill={arms} transform="translate(50 50)">
        {ARM_ANGLES.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <circle cx={TIP_CX} r={TIP_R} />
            <path d={ARM_PATH} />
          </g>
        ))}
      </g>
      <circle cx="50" cy="50" r={DOT_R} fill={dot} />
    </svg>
  )
}

/** Full lockup: forest tile carrying the olive rosette. Light surfaces only. */
export function MarkTile(props: RosetteProps) {
  return (
    <Rosette
      arms="var(--color-brand-olive)"
      dot="var(--color-brand-cream)"
      tile="var(--color-brand-forest)"
      {...props}
    />
  )
}

/** Knockout: no tile, olive rosette sitting straight on a dark surface. The
 *  centre dot stays cream so it reads against the ground. */
export function MarkKnockout(props: RosetteProps) {
  return (
    <Rosette arms="var(--color-brand-olive)" dot="var(--color-brand-cream)" {...props} />
  )
}
