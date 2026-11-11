import React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './core'

interface DialogProps {
  open?: boolean
  onCancel?: () => void
  onSubmit?: () => void | Promise<void>
  title?: React.ReactNode
  children?: React.ReactNode
  width?: number | string
  confirmLabel?: string
  dismissLabel?: string
  closeOnOutside?: boolean
  className?: string
  footer?: React.ReactNode | null
}

export const Dialog = ({
  open,
  onCancel,
  onSubmit,
  title,
  children,
  width = 640,
  confirmLabel = '确定',
  dismissLabel = '取消',
  closeOnOutside = true,
  className,
  footer
}: DialogProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={next => !next && onCancel?.()}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-1000 bg-black/50 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-1001 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:zoom-in-95',
          className
        )}
        style={{ maxWidth: width }}
        onPointerDownOutside={event => !closeOnOutside && event.preventDefault()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <button type="button" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="关闭">
              <X className="size-4" />
            </button>
          </DialogPrimitive.Close>
        </div>
        <DialogPrimitive.Description className="sr-only">{typeof title === 'string' ? title : '编辑内容'}</DialogPrimitive.Description>
        {children}
        {footer !== null && (
          <div className="mt-6 flex justify-end gap-2">
            {footer || (
              <>
                <Button onClick={onCancel}>{dismissLabel}</Button>
                <Button variant="default" onClick={onSubmit}>
                  {confirmLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)

interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  onConfirm?: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

export const ConfirmDialog = ({
  trigger,
  title,
  description,
  onConfirm,
  confirmLabel = '确定',
  cancelLabel = '取消',
  variant = 'default'
}: ConfirmDialogProps) => (
  <AlertDialogPrimitive.Root>
    <AlertDialogPrimitive.Trigger asChild>
      <span className="inline-flex">{trigger}</span>
    </AlertDialogPrimitive.Trigger>
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-1100 bg-black/45" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-1101 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
        <AlertDialogPrimitive.Title className="font-semibold">{title}</AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className={cn('mt-2 text-sm text-muted-foreground', !description && 'sr-only')}>
          {description || '请确认是否继续此操作'}
        </AlertDialogPrimitive.Description>
        <div className="mt-6 flex justify-end gap-2">
          <AlertDialogPrimitive.Cancel asChild>
            <Button>{cancelLabel}</Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button variant={variant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  </AlertDialogPrimitive.Root>
)

interface SheetProps {
  open?: boolean
  onClose?: () => void
  title?: React.ReactNode
  children?: React.ReactNode
  side?: 'left' | 'right'
  width?: number | string
  className?: string
  bodyClassName?: string
}

export const Sheet = ({ open, onClose, title, children, side = 'left', width = 320, className, bodyClassName }: SheetProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={next => !next && onClose?.()}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-1000 bg-black/45" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-1001 flex max-w-[95vw] flex-col border bg-background shadow-xl outline-none data-[state=open]:animate-in',
          side === 'left' ? 'left-0 border-r data-[state=open]:slide-in-from-left' : 'right-0 border-l data-[state=open]:slide-in-from-right',
          className
        )}
        style={{ width }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <DialogPrimitive.Title className="font-semibold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <button type="button" className="rounded p-1 hover:bg-accent" aria-label="关闭">
              <X className="size-4" />
            </button>
          </DialogPrimitive.Close>
        </div>
        <DialogPrimitive.Description className="sr-only">{typeof title === 'string' ? title : '侧边面板'}</DialogPrimitive.Description>
        <div className={cn('min-h-0 flex-1 overflow-y-auto p-4', bodyClassName)}>{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)

export interface AccordionProps {
  items?: Array<{ key: React.Key; label: React.ReactNode; children: React.ReactNode }>
  className?: string
}

export const Accordion = ({ items = [], className }: AccordionProps) => (
  <div className={cn('space-y-3', className)}>
    {items.map(item => (
      <CollapsiblePrimitive.Root key={item.key} className="rounded-xl border bg-card">
        <CollapsiblePrimitive.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left font-medium [&[data-state=open]>svg]:rotate-180">
          {item.label}
          <ChevronDown className="size-4 transition-transform" />
        </CollapsiblePrimitive.Trigger>
        <CollapsiblePrimitive.Content className="border-t p-4 data-[state=open]:animate-in data-[state=closed]:animate-out">
          {item.children}
        </CollapsiblePrimitive.Content>
      </CollapsiblePrimitive.Root>
    ))}
  </div>
)
