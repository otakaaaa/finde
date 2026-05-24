interface FindeLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'inverse'
  className?: string
}

const FONT_SIZES: Record<NonNullable<FindeLogoProps['size']>, number> = {
  sm: 18,
  md: 24,
  lg: 32,
}

export const FindeLogo = ({
  size = 'md',
  variant = 'default',
  className,
}: FindeLogoProps) => {
  const fontSize = FONT_SIZES[size]
  const color = variant === 'inverse' ? '#ffffff' : 'currentColor'

  return (
    <span
      className={`inline-flex select-none font-logo ${className ?? ''}`}
      style={{
        fontSize,
        letterSpacing: '0.08em',
        lineHeight: 1,
        color,
      }}
      aria-label="FINDE"
    >
      FINDE
    </span>
  )
}
