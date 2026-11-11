import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import i18n from '@/i18n'
import { Button, Select } from './core'

interface PaginationProps {
  current?: number
  pageSize?: number
  total?: number
  onChange?: (page: number, pageSize: number) => void
  pageSizeOptions?: Array<number | string>
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: (total: number) => React.ReactNode
  className?: string
}

export const Pagination = ({
  current = 1,
  pageSize = 10,
  total = 0,
  onChange,
  pageSizeOptions = [10, 20, 50],
  showSizeChanger,
  showQuickJumper,
  showTotal,
  className
}: PaginationProps) => {
  const { t } = useTranslation()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const [jumpPage, setJumpPage] = useState('')
  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, index) => {
    const start = Math.max(1, Math.min(current - 2, pages - 4))
    return start + index
  })

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2 text-sm', className)}>
      {showTotal?.(total)}
      <Button
        size="small"
        disabled={current <= 1}
        icon={<ChevronLeft className="size-4" />}
        onClick={() => onChange?.(current - 1, pageSize)}
        aria-label={t('common.previous')}
      />
      {visiblePages.map(page => (
        <Button key={page} size="small" variant={page === current ? 'default' : 'outline'} onClick={() => onChange?.(page, pageSize)}>
          {page}
        </Button>
      ))}
      <Button
        size="small"
        disabled={current >= pages}
        icon={<ChevronRight className="size-4" />}
        onClick={() => onChange?.(current + 1, pageSize)}
        aria-label={t('common.next')}
      />
      {showSizeChanger && (
        <div className="min-w-32">
          <Select
            value={pageSize}
            options={pageSizeOptions.map(size => ({ label: t('common.perPage', { count: size }), value: Number(size) }))}
            onChange={size => onChange?.(1, Number(size))}
          />
        </div>
      )}
      {showQuickJumper && (
        <label className="flex items-center gap-1 text-muted-foreground">
          {t('common.jumpTo')}
          <input
            type="number"
            min={1}
            max={pages}
            value={jumpPage}
            className="h-8 w-14 rounded border border-input bg-background px-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
            onChange={event => setJumpPage(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && jumpPage) onChange?.(Math.max(1, Math.min(pages, Number(jumpPage))), pageSize)
            }}
          />
          {t('common.page')}
        </label>
      )}
    </div>
  )
}

export const Divider = ({
  className,
  children,
  orientation: _orientation,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }) => (
  <div
    className={cn(
      'my-4 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
      className
    )}
    {...props}
  >
    {typeof children === 'string' ? i18n.t(`labels.${children}`, { defaultValue: children }) : children}
  </div>
)
