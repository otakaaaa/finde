interface FukunaviLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'inverse'
  className?: string
}

const FONT_SIZES: Record<NonNullable<FukunaviLogoProps['size']>, number> = {
  sm: 18,
  md: 24,
  lg: 32,
}

/** F-1 stacked wordmark: FUKU / NAVI (Bebas Neue) */
export const FukunaviLogo = ({
  size = 'md',
  variant = 'default',
  className,
}: FukunaviLogoProps) => {
  const fontSize = FONT_SIZES[size]
  const color = variant === 'inverse' ? '#ffffff' : 'currentColor'

  return (
    <span
      className={`inline-flex select-none flex-col font-logo ${className ?? ''}`}
      style={{
        fontSize,
        letterSpacing: '0.04em',
        lineHeight: 0.82,
        color,
      }}
      aria-label="フクナビ"
    >
      <span>FUKU</span>
      <span style={{ paddingLeft: 2 }}>NAVI</span>
    </span>
  )
}
