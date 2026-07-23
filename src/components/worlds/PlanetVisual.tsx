type PlanetVisualProps = {
  src: string
  alt: string
  variant: 'map' | 'chapter'
  className?: string
}

export function PlanetVisual({
  src,
  alt,
  variant,
  className = '',
}: PlanetVisualProps) {
  return (
    <div
      className={`planet-visual planet-visual--${variant} ${className}`.trim()}
      data-planet-variant={variant}
    >
      <img src={src} alt={alt} draggable={false} />
    </div>
  )
}
