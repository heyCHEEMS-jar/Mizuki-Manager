import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import dayjs from 'dayjs'
import { BookOpen, FileUp, MapPin, Pencil, Smile, X } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import { Button, Checkbox, DatePicker, Form, FormField, Image, Input, Dialog, Pagination, Select, Textarea, Upload, useForm, useFormWatch } from '../components/ui'
import { imageAccept } from '../configs/upload-config'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getDiaryConfig, uploadDiaryImages, writeDiaryConfig } from '../services/diary'
import { cn } from '../lib/utils'
import { throttle } from '../utils/util'

interface DiaryItem {
	id: number
	content: string
	date: string
	images?: string[]
	location?: string
	mood?: string
	tags?: string[]
}

export default function Diary() {
	const form = useForm()
	const [loading, setLoading] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const collection = usePagedCollection<DiaryItem>()
	const imagesValue = useFormWatch('images', form) || []

	const getConfig = useCallback(async (page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await getDiaryConfig()
			if (res.success) {
				const items = [...(res.data?.diaryData || [])].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
				collection.setItems(items, page, pageSize)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	const openEditDialog = (event: MouseEvent | undefined, index: number) => {
		event?.stopPropagation()
		setEditingIndex(index)
		form.reset()
		if (index === -1) form.setValues({ date: dayjs(), id: Date.now(), images: [] })
		else {
			const item = collection.pageItems[index]
			form.setValues({ ...item, date: dayjs(item.date), images: item.images || [] })
		}
		setIsDialogOpen(true)
	}

	const updateList = useCallback(async (items: DiaryItem[], successMessage: string, page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await writeDiaryConfig({ diaryData: items })
			if (res.success) {
				notify.success(successMessage)
				setIsDialogOpen(false)
				await getConfig(page, pageSize)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [getConfig])

	const handleSave = useCallback(async () => {
		if (editingIndex === undefined) return
		try {
			const values = await form.validate()
			const item = { ...values, date: values.date.toISOString() }
			const items = [...collection.items]
			if (editingIndex !== -1) {
				const realIndex = items.findIndex((entry) => entry.id === collection.pageItems[editingIndex].id)
				if (realIndex !== -1) items.splice(realIndex, 1)
			}
			items.unshift(item)
			await updateList(items, editingIndex === -1 ? '记录成功' : '修改成功', collection.page, collection.pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [collection.items, collection.page, collection.pageItems, collection.pageSize, editingIndex, form, updateList])
	const throttledSave = useMemo(() => throttle(handleSave, 2000, { immediate: true }), [handleSave])

	const handleUpload = async (file: File, fileList: File[]) => {
		if (file !== fileList[fileList.length - 1]) return false
		try {
			setLoading(true)
			const res = await uploadDiaryImages(fileList)
			if (res.success) {
				const newImages = res.data?.map((item: any) => item.publicPath) || []
				form.setValues({ images: [...imagesValue, ...newImages] })
				notify.success('上传成功')
			}
		} catch {
		} finally {
			setLoading(false)
		}
		return false
	}

	const removeDiary = async () => {
		const removeIds = new Set(collection.selectedItems.map((item) => item.id))
		const items = collection.items.filter((item) => !removeIds.has(item.id))
		const page = Math.min(collection.page, Math.max(1, Math.ceil(items.length / collection.pageSize)))
		await updateList(items, '删除成功', page, collection.pageSize)
	}

	useEffect(() => {
		getConfig(1, 12)
	}, [])

	return (
		<Page>
			<PageHeader eyebrow="Journal" title="日记管理" description="记录生活片段、心情、地点和影像。" />
			<CollectionControls
				itemCount={collection.pageItems.length}
				selectedCount={collection.selected.size}
				allSelected={collection.allSelected}
				partiallySelected={collection.partiallySelected}
				loading={loading}
				addLabel="写日记"
				deleteTitle="删除选中的日记？"
				deleteDescription="所选记录将从日记配置中移除。"
				onSelectAll={collection.selectAll}
				onDelete={removeDiary}
				onAdd={() => openEditDialog(undefined, -1)}
			/>

			{loading && !collection.pageItems.length ? (
				<PageLoading label="正在加载日记..." />
			) : collection.pageItems.length ? (
				<div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', loading && 'pointer-events-none opacity-60')}>
					{collection.pageItems.map((item, index) => {
						const selected = collection.selected.has(index)
						return (
							<article
								key={item.id}
								className={cn('relative flex min-h-72 cursor-pointer flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', selected && 'border-primary ring-2 ring-primary/15')}
								role="button"
								tabIndex={0}
								onClick={() => collection.toggleItem(index)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
								}}
							>
								<div className="flex items-center justify-between gap-3 pr-8">
									<time className="text-xs font-medium text-muted-foreground">{dayjs(item.date).format('YYYY-MM-DD HH:mm')}</time>
									<Checkbox className="absolute right-4 top-4" checked={selected} onCheckedChange={(checked) => collection.setItemSelected(index, checked)} />
								</div>
								<p className="mt-4 line-clamp-5 flex-1 whitespace-pre-wrap text-sm leading-6">{item.content}</p>
								{item.images?.length ? (
									<div className="mt-4 flex gap-2 overflow-hidden" onClick={(event) => event.stopPropagation()}>
										{item.images.slice(0, 4).map((image, imageIndex) => <Image key={`${image}-${imageIndex}`} src={image} alt="日记图片" className="size-14 rounded-md object-cover" />)}
									</div>
								) : null}
								<div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-3 text-xs">
									{item.mood && <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-orange-700"><Smile className="size-3" />{item.mood}</span>}
									{item.location && <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700"><MapPin className="size-3" />{item.location}</span>}
									{item.tags?.map((tag) => <span key={tag} className="rounded-md bg-muted px-2 py-1 text-muted-foreground">#{tag}</span>)}
								</div>
								<Button variant="ghost" size="small" className="absolute bottom-3 right-3 size-8 px-0" aria-label="编辑日记" onClick={(event) => openEditDialog(event, index)}><Pencil className="size-4" /></Button>
							</article>
						)
					})}
				</div>
			) : (
				<div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
					<BookOpen className="size-10 opacity-40" />
					<p>目前还没有记录</p>
				</div>
			)}

			{collection.items.length > 0 && (
				<Pagination
					current={collection.page}
					pageSize={collection.pageSize}
					total={collection.items.length}
					pageSizeOptions={[12, 24, 48, 96]}
					showQuickJumper
					showSizeChanger
					onChange={collection.changePage}
				/>
			)}

			<Dialog
				title={editingIndex === -1 ? '添加日记' : '修改日记'}
				open={isDialogOpen}
				onSubmit={throttledSave}
				onCancel={() => setIsDialogOpen(false)}
				width={640}
				confirmLabel="保存"
				closeOnOutside={false}
			>
				<Form form={form}>
					<div className="grid gap-x-4 md:grid-cols-2">
						<FormField name="date" label="时间" rules={[{ required: true }]}>
							<DatePicker showTime />
						</FormField>
						<FormField name="mood" label="心情">
							<Input prefix={<Smile className="size-4" />} placeholder="现在的状态" />
						</FormField>
					</div>
					<FormField name="content" label="正文" rules={[{ required: true }]}>
						<Textarea placeholder="此刻在想什么..." rows={8} />
					</FormField>
					<div className="mb-4">
						<div className="mb-2 text-sm font-medium">图片</div>
						<div className="flex flex-wrap items-center gap-2">
							<Upload beforeUpload={handleUpload} accept={imageAccept} multiple disabled={loading}>
								<Button icon={<FileUp className="size-4" />} loading={loading}>上传图片</Button>
							</Upload>
							{imagesValue.map((url: string, index: number) => (
								<div key={`${url}-${index}`} className="relative">
									<Image src={url} alt="日记图片预览" className="size-16 rounded-md border object-cover" />
									<button type="button" className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-destructive text-white shadow" aria-label="移除图片" onClick={() => form.setValues({ images: imagesValue.filter((_: string, itemIndex: number) => itemIndex !== index) })}>
										<X className="size-3" />
									</button>
								</div>
							))}
						</div>
					</div>
					<div className="grid gap-x-4 md:grid-cols-2">
						<FormField name="location" label="地点">
							<Input prefix={<MapPin className="size-4" />} placeholder="在哪里？" />
						</FormField>
						<FormField name="tags" label="标签">
							<Select mode="tags" placeholder="输入标签后按回车" />
						</FormField>
					</div>
				</Form>
			</Dialog>
		</Page>
	)
}
