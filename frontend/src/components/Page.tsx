import React from 'react'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export const Page = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8', className)} {...props} />
)

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
}

export const PageHeader = ({ title, description, eyebrow, actions, className, ...props }: PageHeaderProps) => (
  <header className={cn('flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between', className)} {...props}>
    <div className="min-w-0 max-w-2xl">
      {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</div>}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
)

interface PageSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  bodyClassName?: string
}

export const PageSection = ({ title, description, actions, bodyClassName, className, children, ...props }: PageSectionProps) => (
  <section className={cn('overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...props}>
    {(title || description || actions) && (
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title && <h2 className="font-semibold">{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={cn('p-5', bodyClassName)}>{children}</div>
  </section>
)

export const PageLoading = ({ label }: { label?: string }) => {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <LoaderCircle className="size-6 animate-spin text-primary" />
      <span>{label || t('common.loading')}</span>
    </div>
  )
}
