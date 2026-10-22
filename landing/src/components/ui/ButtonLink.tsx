import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'signal' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ButtonLink({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none text-center cursor-pointer disabled:pointer-events-none disabled:opacity-50'

  const sizeClasses = {
    sm: 'rounded-lg px-3.5 py-1.5 text-xs',
    md: 'rounded-xl px-5 py-2.5 text-sm',
    lg: 'rounded-xl px-7 py-3.5 text-base shadow-lg',
  }[size]

  const variantClasses = {
    primary:
      'bg-brand text-ink font-bold hover:bg-brand-light shadow-[0_12px_28px_-10px_hsl(var(--brand)/0.6)] active:scale-[0.98]',
    secondary:
      'bg-ink-raised text-cream hover:bg-line border border-line active:scale-[0.98]',
    ghost:
      'text-cream-dim hover:text-cream hover:bg-ink-raised active:scale-[0.98]',
    signal:
      'bg-signal text-ink font-bold hover:brightness-110 shadow-[0_12px_28px_-10px_hsl(var(--signal)/0.5)] active:scale-[0.98]',
    outline:
      'border-2 border-brand/50 text-brand-light hover:bg-brand/10 active:scale-[0.98]',
  }[variant]

  return (
    <a className={cn(baseClasses, sizeClasses, variantClasses, className)} {...props}>
      {children}
    </a>
  )
}
