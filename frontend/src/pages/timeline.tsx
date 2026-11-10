import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Icon } from '@iconify/react'
import dayjs from 'dayjs'
import { BriefcaseBusiness, ExternalLink, GraduationCap, Landmark, MapPin, Pencil, Trash2, Trophy, Users } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import { Button, Checkbox, ColorPicker, DatePicker, Form, FormField, FormList, Input, Dialog, Pagination, Select, Switch, Textarea, useForm, useFormWatch } from '../components/ui'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getTimelineConfig, writeTimelineConfig } from '../services/timeline'
import { cn } from '../lib/utils'
import { throttle } from '../utils/util'

interface TimelineItem {
	id: string
	title: string
	description: string
	type: 'education' | 'work' | 'project' | 'achievement'
	startDate: string
	endDate?: string
	location?: string
	organization?: string
	position?: string
	skills?: string[]
	achievements?: string[]
	links?: Array<{ name: string; url: string; type: 'website' | 'certificate' | 'project' | 'other' }>
	icon?: string
	color?: string
	featured?: boolean
}

const typeMap = {
	education: { label: '教育经历', color: '#3b82f6', icon: GraduationCap },
	work: { label: '工作经历', color: '#22c55e', icon: BriefcaseBusiness },
	project: { label: '项目经历', color: '#8b5cf6', icon: Landmark },
	achievement: { label: '成就荣誉', color: '#f97316', icon: Trophy }
}

const typeOptions = Object.entries(typeMap).map(([value, item]) => ({ label: item.label, value }))
const linkTypeOptions = [
	{ label: '网站', value: 'website' },
	{ label: '证书', value: 'certificate' },
	{ label: '项目', value: 'project' },
	{ label: '其他', value: 'other' }
]

const formatDate = (date?: string) => date ? dayjs(date).format('YYYY年MM月') : ''

export default function Timeline() {
	const form = useForm()
	const [loading, setLoading] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const collection = usePagedCollection<TimelineItem>()
	const iconValue = useFormWatch('icon', form)

	const getConfig = useCallback(async (page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await getTimelineConfig()
			if (res.success) {
				const items: TimelineItem[] = [...(res.data?.timelineData || [])].sort((a, b) => {
					if (!a.endDate && b.endDate) return -1
					if (a.endDate && !b.endDate) return 1
					return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
				})
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
		if (index === -1) {
			form.setValues({ id: `timeline-${Date.now()}`, type: 'education', skills: [], achievements: [], links: [], featured: false, color: '#1890ff' })
		} else {
			const item = collection.pageItems[index]
			form.setValues({
				...item,
				startDate: item.startDate ? dayjs(item.startDate) : undefined,
				endDate: item.endDate ? dayjs(item.endDate) : undefined,
				links: item.links || []
			})
		}
		setIsDialogOpen(true)
	}

	const updateList = useCallback(async (items: TimelineItem[], successMessage: string, page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await writeTimelineConfig({ timelineData: items })
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
			const item: TimelineItem = {
				id: values.id,
				title: values.title,
				description: values.description,
				type: values.type,
				startDate: values.startDate?.format('YYYY-MM-DD') || '',
				endDate: values.endDate?.format('YYYY-MM-DD') || '',
				location: values.location,
				organization: values.organization,
				position: values.position,
				skills: values.skills || [],
				achievements: values.achievements || [],
				links: values.links || [],
				icon: values.icon,
				color: values.color,
				featured: values.featured || false
			}
			const items = [...collection.items]
			if (editingIndex === -1) {
				items.unshift(item)
			} else {
				const realIndex = items.findIndex((entry) => entry.id === collection.pageItems[editingIndex].id)
				if (realIndex !== -1) items[realIndex] = item
			}
			await updateList(items, editingIndex === -1 ? '添加成功' : '修改成功', collection.page, collection.pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [collection.items, collection.page, collection.pageItems, collection.pageSize, editingIndex, form, updateList])
	const throttledSave = useMemo(() => throttle(handleSave, 2000, { immediate: true }), [handleSave])

	const removeTimelineItems = async () => {
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
			<PageHeader eyebrow="Milestones" title="时间线管理" description="维护成长经历、重要里程碑和相关成果。" />
			<CollectionControls
				itemCount={collection.pageItems.length}
				selectedCount={collection.selected.size}
				allSelected={collection.allSelected}
				partiallySelected={collection.partiallySelected}
				loading={loading}
				addLabel="添加条目"
				deleteTitle="删除选中的时间线条目？"
				deleteDescription="所选经历将从时间线中移除。"
				onSelectAll={collection.selectAll}
				onDelete={removeTimelineItems}
				onAdd={() => openEditDialog(undefined, -1)}
			/>

			{loading && !collection.pageItems.length ? (
				<PageLoading label="正在加载时间线..." />
			) : collection.pageItems.length ? (
				<div className={cn('relative space-y-4 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-border sm:before:left-5', loading && 'pointer-events-none opacity-60')}>
					{collection.pageItems.map((item, index) => {
						const selected = collection.selected.has(index)
						const meta = typeMap[item.type]
						const TimelineIcon = meta.icon
						const color = item.color || meta.color
						return (
							<div key={item.id} className="relative pl-10 sm:pl-12">
								<span className="absolute left-0 top-5 z-10 grid size-8 place-items-center rounded-full border-4 border-background text-white sm:left-1" style={{ backgroundColor: color }}>
									{item.icon ? <Icon icon={item.icon} width={15} height={15} /> : <TimelineIcon className="size-3.5" />}
								</span>
								<article
									className={cn('relative cursor-pointer rounded-xl border border-l-4 bg-card p-5 shadow-sm transition-all hover:shadow-md', selected && 'ring-2 ring-primary/20')}
									style={{ borderLeftColor: color }}
									role="button"
									tabIndex={0}
									onClick={() => collection.toggleItem(index)}
									onKeyDown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
									}}
								>
									<Checkbox className="absolute right-4 top-4" checked={selected} onCheckedChange={(checked) => collection.setItemSelected(index, checked)} />
									<div className="flex flex-wrap items-center gap-2 pr-8">
										<span className="rounded-md px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: color }}>{meta.label}</span>
										{item.featured && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700">精选</span>}
										{!item.endDate && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">当前状态</span>}
									</div>
									<h2 className="mt-3 text-lg font-semibold">{item.title}</h2>
									<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
										{item.organization && <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{item.organization}</span>}
										{item.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{item.location}{item.position ? ` · ${item.position}` : ''}</span>}
									</div>
									<time className="mt-2 block text-xs font-medium text-muted-foreground">{formatDate(item.startDate)} – {item.endDate ? formatDate(item.endDate) : '至今'}</time>
									<p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
									{item.achievements?.length ? <div className="mt-4 flex flex-wrap gap-1.5">{item.achievements.map((achievement) => <span key={achievement} className="rounded-md bg-muted px-2 py-1 text-xs">• {achievement}</span>)}</div> : null}
									{item.skills?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{item.skills.map((skill) => <span key={skill} className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">{skill}</span>)}</div> : null}
									{item.links?.length ? (
										<div className="mt-3 flex flex-wrap gap-2">
											{item.links.map((link, linkIndex) => <a key={`${link.url}-${linkIndex}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md text-xs text-primary hover:underline" onClick={(event) => event.stopPropagation()}><ExternalLink className="size-3" />{link.name}</a>)}
										</div>
									) : null}
									<Button variant="ghost" size="small" className="absolute bottom-3 right-3 size-8 px-0" aria-label={`编辑 ${item.title}`} onClick={(event) => openEditDialog(event, index)}><Pencil className="size-4" /></Button>
								</article>
							</div>
						)
					})}
				</div>
			) : (
				<div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
					<Landmark className="size-10 opacity-40" />
					<p>快来添加你的第一段经历</p>
				</div>
			)}

			{collection.items.length > 0 && (
				<Pagination
					current={collection.page}
					pageSize={collection.pageSize}
					total={collection.items.length}
					pageSizeOptions={[12, 24]}
					showQuickJumper
					showSizeChanger
					onChange={collection.changePage}
				/>
			)}

			<Dialog
				title={editingIndex === -1 ? '添加时间线条目' : '编辑时间线条目'}
				open={isDialogOpen}
				onSubmit={throttledSave}
				onCancel={() => setIsDialogOpen(false)}
				width={760}
				confirmLabel="保存"
				closeOnOutside={false}
			>
				<Form form={form} initialValues={{ type: 'education', featured: false, color: '#1890ff' }}>
					<div className="grid gap-x-4 md:grid-cols-12">
						<FormField name="title" label="标题" rules={[{ required: true }]} className="md:col-span-7"><Input placeholder="输入标题" /></FormField>
						<FormField name="type" label="类型" rules={[{ required: true }]} className="md:col-span-3"><Select options={typeOptions} /></FormField>
						<FormField name="featured" label="是否精选" valueKey="checked" className="md:col-span-2"><Switch /></FormField>
						<FormField name="organization" label="组织 / 机构" className="md:col-span-7"><Input placeholder="例如：某大学 / 某公司" /></FormField>
						<FormField name="location" label="地点" className="md:col-span-3"><Input placeholder="例如：北京" /></FormField>
						<FormField name="color" label="主题颜色" className="md:col-span-2"><ColorPicker className="h-9 w-full" /></FormField>
						<FormField name="startDate" label="开始日期" rules={[{ required: true }]} className="md:col-span-6"><DatePicker /></FormField>
						<FormField name="endDate" label="结束日期" className="md:col-span-6"><DatePicker placeholder="留空表示至今" /></FormField>
						<FormField name="position" label="职位 / 角色" className="md:col-span-6"><Input placeholder="例如：前端开发实习生" /></FormField>
						<FormField
							name="icon"
							label={<span className="inline-flex items-center gap-2">图标<a href={process.env.ICONIFY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">访问 Iconify<ExternalLink className="size-3" /></a></span>}
							className="md:col-span-6"
						>
							<Input placeholder="例如：material-symbols:school" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : undefined} />
						</FormField>
					</div>
					<FormField name="description" label="描述" rules={[{ required: true }]}><Textarea rows={3} placeholder="详细描述这段经历..." /></FormField>
					<FormField name="achievements" label="成就荣誉"><Select mode="tags" placeholder="输入经历收获后按回车" /></FormField>
					<FormField name="skills" label="技术栈"><Select mode="tags" placeholder="输入技术栈后按回车" /></FormField>
					<div className="mb-2 text-sm font-medium">相关链接</div>
					<FormList name="links">
						{(fields, { add, remove }) => (
							<div className="space-y-2">
								{fields.map((field) => (
									<div key={field.key} className="grid items-start gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_2fr_8rem_auto]">
										<FormField name={[field.name, 'name']} rules={[{ required: true, message: '请输入名称' }]} className="mb-0"><Input placeholder="名称" /></FormField>
										<FormField name={[field.name, 'url']} rules={[{ required: true, message: '请输入链接地址' }]} className="mb-0"><Input placeholder="链接地址" /></FormField>
										<FormField name={[field.name, 'type']} rules={[{ required: true, message: '请选择类型' }]} className="mb-0"><Select options={linkTypeOptions} /></FormField>
										<Button variant="ghost" className="size-9 px-0 text-destructive hover:bg-destructive/10" aria-label="删除链接" onClick={() => remove(field.name)}><Trash2 className="size-4" /></Button>
									</div>
								))}
								<Button variant="outline" block className="border-dashed" onClick={() => add({ type: 'other' })}>添加链接</Button>
							</div>
						)}
					</FormList>
				</Form>
			</Dialog>
		</Page>
	)
}
