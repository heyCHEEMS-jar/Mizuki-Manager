import React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { ImageOff, User, X } from 'lucide-react'
import { Toaster as SonnerToaster } from 'sonner'
import { cn } from '@/lib/utils'

export const Toaster = () => <SonnerToaster richColors position="top-center" closeButton />

const EmptyRoot = ({ description = '暂无数据', className, image: _image }: { description?: React.ReactNode; className?: string; image?: React.ReactNode }) => (
	<div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground', className)}>
		<ImageOff className="size-10 opacity-50" />
		<div>{description}</div>
	</div>
)

type EmptyComponent = typeof EmptyRoot & { PRESENTED_IMAGE_SIMPLE: React.ReactNode }
export const Empty = Object.assign(EmptyRoot, { PRESENTED_IMAGE_SIMPLE: null }) as EmptyComponent

export const Badge = ({ children, className, closable, onClose, ...props }: React.HTMLAttributes<HTMLSpanElement> & { closable?: boolean; onClose?: () => void }) => (
	<span className={cn('inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground', className)} {...props}>
		{children}
		{closable && <button type="button" className="ml-0.5 opacity-60 hover:opacity-100" aria-label="移除" onClick={onClose}>×</button>}
	</span>
)

export const Progress = ({ percent = 0, strokeColor, format, className }: { percent?: number; strokeColor?: string; format?: (value: number) => React.ReactNode; className?: string }) => {
	const value = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0
	return (
		<div className={cn('flex items-center gap-3', className)}>
			<ProgressPrimitive.Root value={value} className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
				<ProgressPrimitive.Indicator className="h-full rounded-full bg-primary transition-transform" style={{ transform: `translateX(-${100 - value}%)`, backgroundColor: strokeColor }} />
			</ProgressPrimitive.Root>
			<div className="shrink-0 text-xs text-muted-foreground">{format ? format(value) : `${value}%`}</div>
		</div>
	)
}

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> {
	width?: number | string
	height?: number | string
	preview?: boolean
}

export const Image = ({ width, height, className, style, preview = true, onClick, ...props }: ImageProps) => {
	const [open, setOpen] = React.useState(false)
	const image = (
		<img
			className={cn('max-w-full', preview && 'cursor-zoom-in', className)}
			style={{ width, height, ...style }}
			onClick={(event) => {
				event.stopPropagation()
				onClick?.(event)
				if (preview) setOpen(true)
			}}
			{...props}
		/>
	)
	if (!preview) return image

	return (
		<>
			{image}
			<DialogPrimitive.Root open={open} onOpenChange={setOpen}>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-1200 bg-black/80" />
					<DialogPrimitive.Content className="fixed inset-4 z-1201 grid place-items-center outline-none">
						<DialogPrimitive.Title className="sr-only">图片预览</DialogPrimitive.Title>
						<DialogPrimitive.Description className="sr-only">查看原始图片</DialogPrimitive.Description>
						<img src={props.src} alt={props.alt || '预览图片'} className="max-h-full max-w-full object-contain" />
						<DialogPrimitive.Close className="fixed right-5 top-5 rounded-full bg-black/60 p-2 text-white hover:bg-black/80" aria-label="关闭预览"><X className="size-5" /></DialogPrimitive.Close>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</>
	)
}

export const Avatar = ({ src, icon, size = 40, shape = 'circle', className }: { src?: string; icon?: React.ReactNode; size?: number; shape?: 'circle' | 'square'; className?: string }) => (
	<AvatarPrimitive.Root className={cn('relative inline-flex shrink-0 overflow-hidden border bg-muted', shape === 'circle' ? 'rounded-full' : 'rounded-md', className)} style={{ width: size, height: size }}>
		<AvatarPrimitive.Image src={src} className="size-full object-cover" />
		<AvatarPrimitive.Fallback className="grid size-full place-items-center text-muted-foreground">{icon || <User className="size-1/2" />}</AvatarPrimitive.Fallback>
	</AvatarPrimitive.Root>
)
