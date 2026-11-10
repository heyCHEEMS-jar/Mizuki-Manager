import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import dayjs from 'dayjs'
import { ExternalLink, FileUp, Image as ImageIcon, Pencil, PlayCircle, Star } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import { Button, Checkbox, DatePicker, Form, FormField, Image, Input, NumberInput, Dialog, Pagination, Progress, Select, Textarea, Upload, useForm, useFormWatch } from '../components/ui'
import { imageAccept } from '../configs/upload-config'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getAnimeConfig, uploadAnimeImages, writeAnimeConfig } from '../services/anime'
import { cn } from '../lib/utils'
import { compareMonth, throttle } from '../utils/util'

const statusOptions = [
	{ label: '在看', value: 'watching' },
	{ label: '看过', value: 'completed' },
	{ label: '想看', value: 'planned' }
]

interface AnimeItem {
	title: string
	status: 'watching' | 'completed' | 'planned'
	rating: number
	cover: string
	description: string
	episodes: string
	year: string
	genre: string[]
	studio: string
	link: string
	progress: number
	totalEpisodes: number
	startDate: string
	endDate?: string
}

const statusLabel = (status: AnimeItem['status']) => statusOptions.find((option) => option.value === status)?.label || status

export default function Anime() {
	const form = useForm()
	const [loading, setLoading] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const collection = usePagedCollection<AnimeItem>()
	const coverValue = useFormWatch('cover', form)

	const getConfig = useCallback(async (page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await getAnimeConfig()
			if (res.success) collection.setItems(res.data?.localAnimeList || [], page, pageSize)
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	const openEditDialog = (event: MouseEvent | undefined, index: number) => {
		event?.stopPropagation()
		setEditingIndex(index)
		form.reset()
		if (index !== -1) {
			const item = collection.pageItems[index]
			form.setValues({
				...item,
				year: item.year ? dayjs(item.year) : undefined,
				startDate: item.startDate ? dayjs(item.startDate) : undefined,
				endDate: item.endDate ? dayjs(item.endDate) : undefined
			})
		}
		setIsDialogOpen(true)
	}

	const updateList = useCallback(async (items: AnimeItem[], successMessage: string, page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await writeAnimeConfig({ localAnimeList: items })
			if (res.success) {
				if (successMessage) notify.success(successMessage)
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
			setLoading(true)
			const values = await form.validate()
			const items = [...collection.items]
			if (editingIndex !== -1) {
				const realIndex = items.indexOf(collection.pageItems[editingIndex])
				if (realIndex === -1) return
				items.splice(realIndex, 1)
			}
			items.unshift({
				...values,
				year: values.year?.format('YYYY') || '',
				startDate: values.startDate?.format('YYYY-MM') || '',
				endDate: values.endDate?.format('YYYY-MM') || '',
				episodes: `${values.totalEpisodes} episodes`
			})
			await updateList(items, editingIndex === -1 ? '添加成功' : '修改成功', collection.page, collection.pageSize)
		} catch {
		} finally {
			setLoading(false)
		}
	}, [collection.items, collection.page, collection.pageItems, collection.pageSize, editingIndex, form, updateList])
	const throttledSave = useMemo(() => throttle(handleSave, 2000, { immediate: true }), [handleSave])

	const uploadCover = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadAnimeImages([file])
			if (res.success) {
				notify.success('上传成功')
				form.setValues({ cover: res.data?.[0]?.publicPath || '' })
			}
		} catch {
		} finally {
			setLoading(false)
		}
		return false
	}

	const removeAnime = async () => {
		const removeItems = new Set(collection.selectedItems)
		const items = collection.items.filter((item) => !removeItems.has(item))
		const page = Math.min(collection.page, Math.max(1, Math.ceil(items.length / collection.pageSize)))
		await updateList(items, '删除成功', page, collection.pageSize)
	}

	useEffect(() => {
		getConfig(1, 12)
	}, [])

	return (
		<Page>
			<PageHeader eyebrow="Watchlist" title="追番记录" description="维护观看状态、进度、评分与番剧资料。" />
			<CollectionControls
				itemCount={collection.pageItems.length}
				selectedCount={collection.selected.size}
				allSelected={collection.allSelected}
				partiallySelected={collection.partiallySelected}
				loading={loading}
				addLabel="添加追番"
				deleteTitle="删除选中的追番记录？"
				deleteDescription="所选记录将从追番配置中移除。"
				onSelectAll={collection.selectAll}
				onDelete={removeAnime}
				onAdd={() => openEditDialog(undefined, -1)}
			/>

			{loading && !collection.pageItems.length ? (
				<PageLoading label="正在加载追番记录..." />
			) : collection.pageItems.length ? (
				<div className={cn('grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
					{collection.pageItems.map((anime, index) => {
						const selected = collection.selected.has(index)
						const percent = anime.totalEpisodes ? Math.round((anime.progress / anime.totalEpisodes) * 100) : 0
						return (
							<article
								key={`${anime.title}-${anime.year}-${index}`}
								className={cn('group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', selected && 'border-primary ring-2 ring-primary/15')}
								role="button"
								tabIndex={0}
								onClick={() => collection.toggleItem(index)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
								}}
							>
								<div className="relative aspect-3/4 overflow-hidden bg-muted">
									{anime.cover ? <Image src={anime.cover} alt={anime.title} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <ImageIcon className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />}
									<span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-xs text-white backdrop-blur">{anime.year}</span>
									<Checkbox className="absolute right-3 top-3 rounded bg-background/85 p-1" checked={selected} onCheckedChange={(checked) => collection.setItemSelected(index, checked)} />
								</div>
								<div className="p-4">
									<h2 className="truncate font-semibold">{anime.title}</h2>
									<p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{anime.description}</p>
									<div className="mt-3 flex items-center justify-between text-xs">
										<span className="inline-flex items-center gap-1 font-medium"><Star className="size-3.5 fill-amber-400 text-amber-400" />{Number(anime.rating || 0).toFixed(1)}</span>
										<span className="text-muted-foreground">{statusLabel(anime.status)}</span>
									</div>
									<Progress percent={percent} className="mt-2" strokeColor={anime.status === 'completed' ? '#22c55e' : undefined} />
									<div className="mt-4 flex justify-end gap-1 border-t pt-3">
										<a href={anime.link} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary" aria-label={`观看 ${anime.title}`} onClick={(event) => event.stopPropagation()}><ExternalLink className="size-4" /></a>
										<Button variant="ghost" size="small" className="size-8 px-0" aria-label={`编辑 ${anime.title}`} onClick={(event) => openEditDialog(event, index)}><Pencil className="size-4" /></Button>
									</div>
								</div>
							</article>
						)
					})}
				</div>
			) : (
				<div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
					<PlayCircle className="size-10 opacity-40" />
					<p>快来开启你的追番生涯</p>
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
				title={editingIndex === -1 ? '添加追番' : '编辑番剧'}
				open={isDialogOpen}
				onSubmit={throttledSave}
				onCancel={() => setIsDialogOpen(false)}
				width={680}
				confirmLabel="保存"
				closeOnOutside={false}
			>
				<Form form={form}>
					<FormField name="title" label="番剧标题" rules={[{ required: true }]}>
						<Input placeholder="输入番剧标题" />
					</FormField>
					<div className="grid gap-x-4 md:grid-cols-3">
						<FormField name="year" label="发布年份" rules={[{ required: true }]}>
							<DatePicker picker="year" />
						</FormField>
						<FormField name="studio" label="制作公司" rules={[{ required: true }]} className="md:col-span-2">
							<Input placeholder="例如：CloverWorks" />
						</FormField>
					</div>
					<div className="flex items-start gap-3">
						<FormField name="cover" label="封面图片" rules={[{ required: true }]} className="min-w-0 flex-1">
							<Input placeholder="输入图片外链" />
						</FormField>
						<Upload beforeUpload={uploadCover} accept={imageAccept} disabled={loading}>
							<Button className="mt-6" icon={<FileUp className="size-4" />} loading={loading}>上传</Button>
						</Upload>
					</div>
					{coverValue && <Image src={coverValue} alt="番剧封面预览" className="mb-4 h-28 w-full rounded-lg border object-contain" />}
					<FormField name="link" label="观看链接" rules={[{ required: true }]}>
						<Input prefix={<ExternalLink className="size-4" />} placeholder="输入观看链接" />
					</FormField>
					<FormField name="description" label="番剧描述" rules={[{ required: true }]}>
						<Textarea placeholder="输入番剧描述" rows={3} />
					</FormField>
					<FormField name="genre" label="番剧类型" rules={[{ required: true }]}>
						<Select mode="tags" placeholder="输入标签后按回车" tokenSeparators={[',', '，']} />
					</FormField>
					<div className="grid gap-x-4 sm:grid-cols-2 md:grid-cols-4">
						<FormField name="rating" label="评分（0–10）" rules={[{ required: true }]}>
							<NumberInput min={0} max={10} placeholder="评分" />
						</FormField>
						<FormField
							name="progress"
							label="观看集数"
							rules={[
								{ required: true },
								{
									validator(_, value) {
										if (value > (form.getValue('totalEpisodes') || 0)) return Promise.reject(new Error('不能超过总集数'))
									}
								}
							]}
						>
							<NumberInput min={0} placeholder="已看集数" />
						</FormField>
						<FormField name="totalEpisodes" label="总集数" rules={[{ required: true }]}>
							<NumberInput min={0} placeholder="总集数" />
						</FormField>
						<FormField name="status" label="观看状态" rules={[{ required: true }]}>
							<Select placeholder="选择状态" options={statusOptions} />
						</FormField>
					</div>
					<div className="grid gap-x-4 md:grid-cols-2">
						<FormField
							name="startDate"
							label="开始日期"
							rules={[
								{ required: true },
								{
									validator(_, value) {
										const endDate = form.getValue('endDate')?.format('YYYY-MM')
										if (!endDate) return
										const comparison = compareMonth(value.format('YYYY-MM'), endDate)
										if (comparison !== undefined && comparison > 0) return Promise.reject(new Error('不能超过结束日期'))
									}
								}
							]}
						>
							<DatePicker picker="month" />
						</FormField>
						<FormField name="endDate" label="结束日期">
							<DatePicker picker="month" />
						</FormField>
					</div>
				</Form>
			</Dialog>
		</Page>
	)
}
