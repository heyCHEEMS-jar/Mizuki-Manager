import React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { ImageOff, RotateCcw, User, X, ZoomIn, ZoomOut } from 'lucide-react'
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

const MIN_PREVIEW_SCALE = 0.25
const MAX_PREVIEW_SCALE = 5
const PREVIEW_SCALE_STEP = 0.25

const ZoomablePreview = ({ src, alt }: { src?: string; alt?: string }) => {
	const [scale, setScale] = React.useState(1)
	const [offset, setOffset] = React.useState({ x: 0, y: 0 })
	const drag = React.useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null)

	const changeScale = (amount: number) => {
		setScale((current) => Math.min(MAX_PREVIEW_SCALE, Math.max(MIN_PREVIEW_SCALE, current + amount)))
	}
	const reset = () => {
		setScale(1)
		setOffset({ x: 0, y: 0 })
	}
	const stopDragging = (event: React.PointerEvent<HTMLImageElement>) => {
		if (drag.current?.pointerId !== event.pointerId) return
		drag.current = null
		if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
	}

	React.useEffect(() => {
		if (scale <= 1) setOffset({ x: 0, y: 0 })
	}, [scale])

	return (
		<div
			className="relative size-full overflow-hidden"
			onWheel={(event) => {
				event.preventDefault()
				changeScale(event.deltaY < 0 ? PREVIEW_SCALE_STEP : -PREVIEW_SCALE_STEP)
			}}
		>
			<div className="absolute inset-x-0 bottom-16 top-0 flex items-center justify-center overflow-hidden">
				<img
					src={src}
					alt={alt || '预览图片'}
					draggable={false}
					className={cn('max-h-full max-w-full select-none object-contain', scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in')}
					style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`, touchAction: 'none' }}
					onDoubleClick={reset}
					onPointerDown={(event) => {
						if (scale <= 1 || event.button !== 0) return
						drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
						event.currentTarget.setPointerCapture(event.pointerId)
					}}
					onPointerMove={(event) => {
						if (drag.current?.pointerId !== event.pointerId) return
						setOffset({ x: drag.current.offsetX + event.clientX - drag.current.x, y: drag.current.offsetY + event.clientY - drag.current.y })
					}}
					onPointerUp={stopDragging}
					onPointerCancel={stopDragging}
				/>
			</div>
			<div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/65 p-1.5 text-white shadow-lg">
				<button type="button" className="rounded-full p-2 hover:bg-white/15 disabled:opacity-40" disabled={scale <= MIN_PREVIEW_SCALE} aria-label="缩小图片" onClick={() => changeScale(-PREVIEW_SCALE_STEP)}><ZoomOut className="size-4" /></button>
				<span className="w-14 text-center text-xs tabular-nums">{Math.round(scale * 100)}%</span>
				<button type="button" className="rounded-full p-2 hover:bg-white/15 disabled:opacity-40" disabled={scale >= MAX_PREVIEW_SCALE} aria-label="放大图片" onClick={() => changeScale(PREVIEW_SCALE_STEP)}><ZoomIn className="size-4" /></button>
				<button type="button" className="rounded-full p-2 hover:bg-white/15" aria-label="还原图片" onClick={reset}><RotateCcw className="size-4" /></button>
			</div>
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
						<ZoomablePreview src={props.src} alt={props.alt} />
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
