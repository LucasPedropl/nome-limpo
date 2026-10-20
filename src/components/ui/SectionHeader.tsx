import { cn } from '@/lib/cn'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  titleId?: string
  description?: string
  alignment?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  alignment = 'left',
  className,
}: SectionHeaderProps) {
  const isCenter = alignment === 'center'

  return (
    <div className={cn('max-w-3xl', isCenter && 'mx-auto text-center', className)}>
      {eyebrow && (
        <span className="eyebrow inline-block mb-3.5">
          {eyebrow}
        </span>
      )}
      <h2
        id={titleId}
        className={cn(
          'font-wide text-2xl font-black text-cream sm:text-3xl md:text-4xl lg:text-[2.65rem] leading-tight sm:leading-[1.2] tracking-tight',
          'text-balance'
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn(
          'mt-4 text-base sm:text-lg leading-relaxed sm:leading-loose text-cream-dim/90 font-normal',
          isCenter && 'max-w-2xl mx-auto'
        )}>
          {description}
        </p>
      )}
    </div>
  )
}
