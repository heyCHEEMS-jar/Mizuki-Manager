import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Icon } from '@iconify/react'
import { Code2, ExternalLink, Pencil, Wrench } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import { Button, Checkbox, ColorPicker, Form, FormField, Input, NumberInput, Dialog, Pagination, Progress, Select, Textarea, useForm, useFormWatch } from '../components/ui'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getSkillConfig, writeSkillConfig } from '../services/skill'
import { cn } from '../lib/utils'
import { throttle } from '../utils/util'

interface SkillItem {
	id: string
	name: string
	description: string
	icon: string
	category: 'frontend' | 'backend' | 'database' | 'tools' | 'other'
	level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
	experience: { years: number; months: number }
	projects?: string[]
	certifications?: string[]
	color?: string
}

const levelMap = {
	beginner: { label: '初级', percent: 25 },
	intermediate: { label: '中级', percent: 50 },
	advanced: { label: '高级', percent: 75 },
	expert: { label: '专家', percent: 100 }
}

const categoryMap = {
	frontend: '前端',
	backend: '后端',
	database: '数据库',
	tools: '工具',
	other: '其他'
}

const categoryOptions = [
	{ label: '前端开发', value: 'frontend' },
	{ label: '后端开发', value: 'backend' },
	{ label: '数据库', value: 'database' },
	{ label: '开发工具', value: 'tools' },
	{ label: '其他', value: 'other' }
]

const levelOptions = [
	{ label: '初级', value: 'beginner' },
	{ label: '中级', value: 'intermediate' },
	{ label: '高级', value: 'advanced' },
	{ label: '专家', value: 'expert' }
]

const getExperienceText = ({ years, months }: SkillItem['experience']) => {
	const parts = []
	if (years > 0) parts.push(`${years}年`)
	if (months > 0) parts.push(`${months}个月`)
	return parts.join('') || '不足1个月'
}

export default function Skill() {
	const form = useForm()
	const [loading, setLoading] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const collection = usePagedCollection<SkillItem>()
	const iconValue = useFormWatch('icon', form)

	const getConfig = useCallback(async (page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await getSkillConfig()
			if (res.success) {
				const data: SkillItem[] = res.data?.skillsData || []
				const grouped = data.reduce<Record<string, SkillItem[]>>((groups, skill) => {
					;(groups[skill.category] ||= []).push(skill)
					return groups
				}, {})
				const items = Object.values(grouped).flatMap((skills) =>
					skills.sort((a, b) => b.experience.years * 12 + b.experience.months - (a.experience.years * 12 + a.experience.months))
				)
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
			form.setValues({ id: `skill-${Date.now()}`, category: 'frontend', level: 'beginner', experienceYears: 0, experienceMonths: 0, projects: [], certifications: [], color: '#1890ff' })
		} else {
			const item = collection.pageItems[index]
			form.setValues({ ...item, experienceYears: item.experience.years, experienceMonths: item.experience.months })
		}
		setIsDialogOpen(true)
	}

	const updateList = useCallback(async (items: SkillItem[], successMessage: string, page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await writeSkillConfig({ skillsData: items })
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
			const item: SkillItem = {
				id: values.id,
				name: values.name,
				description: values.description,
				icon: values.icon,
				category: values.category,
				level: values.level,
				experience: { years: values.experienceYears || 0, months: values.experienceMonths || 0 },
				projects: [],
				certifications: values.certifications || [],
				color: values.color
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

	const removeSkills = async () => {
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
			<PageHeader eyebrow="Expertise" title="技能管理" description="展示技术栈、熟练程度、经验和相关认证。" />
			<CollectionControls
				itemCount={collection.pageItems.length}
				selectedCount={collection.selected.size}
				allSelected={collection.allSelected}
				partiallySelected={collection.partiallySelected}
				loading={loading}
				addLabel="添加技能"
				deleteTitle="删除选中的技能？"
				deleteDescription="所选技能将从展示列表中移除。"
				onSelectAll={collection.selectAll}
				onDelete={removeSkills}
				onAdd={() => openEditDialog(undefined, -1)}
			/>

			{loading && !collection.pageItems.length ? (
				<PageLoading label="正在加载技能..." />
			) : collection.pageItems.length ? (
				<div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
					{collection.pageItems.map((item, index) => {
						const selected = collection.selected.has(index)
						const color = item.color || '#1890ff'
						return (
							<article
								key={item.id}
								className={cn('relative flex min-h-64 cursor-pointer flex-col rounded-xl border border-t-4 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', selected && 'ring-2 ring-primary/20')}
								style={{ borderTopColor: color }}
								role="button"
								tabIndex={0}
								onClick={() => collection.toggleItem(index)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
								}}
							>
								<Checkbox className="absolute right-4 top-4" checked={selected} onCheckedChange={(checked) => collection.setItemSelected(index, checked)} />
								<div className="flex items-center gap-3 pr-8">
									<span className="grid size-11 place-items-center rounded-xl bg-muted" style={{ color }}>
										{item.icon ? <Icon icon={item.icon} width={28} height={28} /> : <Code2 className="size-6" />}
									</span>
									<div className="min-w-0">
										<h2 className="truncate font-semibold">{item.name}</h2>
										<span className="mt-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{categoryMap[item.category]}</span>
									</div>
								</div>
								<p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.description}</p>
								<div className="mt-4">
									<div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">经验</span><span>{getExperienceText(item.experience)}</span></div>
									<Progress percent={levelMap[item.level].percent} strokeColor={color} format={() => levelMap[item.level].label} />
								</div>
								<div className="mt-4 flex min-h-6 flex-wrap gap-1.5">
									{item.certifications?.slice(0, 3).map((certificate) => <span key={certificate} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">#{certificate}</span>)}
								</div>
								<Button variant="ghost" size="small" className="absolute bottom-3 right-3 size-8 px-0" aria-label={`编辑 ${item.name}`} onClick={(event) => openEditDialog(event, index)}><Pencil className="size-4" /></Button>
							</article>
						)
					})}
				</div>
			) : (
				<div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
					<Wrench className="size-10 opacity-40" />
					<p>快来添加你的第一个技能</p>
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
				title={editingIndex === -1 ? '新增技能' : '编辑技能'}
				open={isDialogOpen}
				onSubmit={throttledSave}
				onCancel={() => setIsDialogOpen(false)}
				width={640}
				confirmLabel="保存"
				closeOnOutside={false}
			>
				<Form form={form} initialValues={{ category: 'frontend', level: 'beginner', experienceYears: 0, experienceMonths: 0, color: '#1890ff' }}>
					<div className="grid gap-x-4 md:grid-cols-2">
						<FormField name="name" label="技能名称" rules={[{ required: true }]}><Input placeholder="例如：React" /></FormField>
						<FormField name="category" label="技能分类" rules={[{ required: true }]}><Select options={categoryOptions} /></FormField>
						<FormField name="level" label="技能等级" rules={[{ required: true }]}><Select options={levelOptions} /></FormField>
						<FormField name="color" label="主题颜色"><ColorPicker className="h-9 w-full" /></FormField>
					</div>
					<FormField name="description" label="技能描述" rules={[{ required: true }]}><Textarea rows={3} placeholder="描述一下技能要点..." /></FormField>
					<FormField
						name="icon"
						label={<span className="inline-flex items-center gap-2">图标<a href={process.env.ICONIFY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">访问 Iconify<ExternalLink className="size-3" /></a></span>}
						rules={[{ required: true }]}
					>
						<Input placeholder="例如：logos:javascript" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : undefined} />
					</FormField>
					<div className="grid gap-x-4 md:grid-cols-2">
						<FormField name="experienceYears" label="经验年限" rules={[{ required: true }]}><NumberInput min={0} max={100} placeholder="年" /></FormField>
						<FormField name="experienceMonths" label="经验月数" rules={[{ required: true }]}><NumberInput min={0} max={11} placeholder="月" /></FormField>
					</div>
					<FormField name="certifications" label="奖项证书"><Select mode="tags" placeholder="输入竞赛奖项或证书名称" /></FormField>
				</Form>
			</Dialog>
		</Page>
	)
}
