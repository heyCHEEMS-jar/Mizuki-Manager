import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Box, ExternalLink, FileUp, Pencil } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import { Button, Checkbox, Form, FormField, Image, Input, Dialog, Pagination, Textarea, Upload, useForm, useFormWatch } from '../components/ui'
import { imageAccept } from '../configs/upload-config'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getDeviceConfig, uploadDeviceImages, writeDeviceConfig } from '../services/device'
import { cn } from '../lib/utils'
import { throttle } from '../utils/util'

interface DeviceItem {
	name: string
	image: string
	specs: string
	description: string
	link: string
	category?: string
}

interface DeviceData {
	devicesData: Record<string, DeviceItem[]>
}

const DEFAULT_CATEGORY = 'Other'

export default function Device() {
	const form = useForm()
	const [loading, setLoading] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const collection = usePagedCollection<DeviceItem>()
	const imageValue = useFormWatch('image', form)

	const getConfig = useCallback(async (page: number, pageSize: number) => {
		try {
			setLoading(true)
			const res = await getDeviceConfig()
			if (res.success) {
				const grouped = (res.data as DeviceData)?.devicesData || {}
				const items = Object.entries(grouped).flatMap(([category, devices]) => devices.map((device) => ({ ...device, category })))
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
		if (index !== -1) form.setValues(collection.pageItems[index])
		setIsDialogOpen(true)
	}

	const updateList = useCallback(async (items: DeviceItem[], successMessage: string, page: number, pageSize: number) => {
		try {
			setLoading(true)
			let devicesData: Record<string, DeviceItem[]> = {}
			items.forEach(({ category = DEFAULT_CATEGORY, ...device }) => {
				if (!devicesData[category]) devicesData[category] = []
				devicesData[category].push(device)
			})
			if (DEFAULT_CATEGORY in devicesData) {
				const { [DEFAULT_CATEGORY]: defaultDevices, ...otherDevices } = devicesData
				devicesData = { ...otherDevices, [DEFAULT_CATEGORY]: defaultDevices }
			}
			const res = await writeDeviceConfig({ devicesData })
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
			const items = [...collection.items]
			if (editingIndex === -1) {
				items.unshift(values)
			} else {
				const realIndex = items.indexOf(collection.pageItems[editingIndex])
				if (realIndex !== -1) items[realIndex] = values
			}
			await updateList(items, editingIndex === -1 ? '添加成功' : '修改成功', collection.page, collection.pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [collection.items, collection.page, collection.pageItems, collection.pageSize, editingIndex, form, updateList])
	const throttledSave = useMemo(() => throttle(handleSave, 2000, { immediate: true }), [handleSave])

	const uploadCover = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadDeviceImages([file])
			if (res.success) {
				notify.success('上传成功')
				form.setValues({ image: res.data?.[0]?.publicPath || '' })
			}
		} catch {
		} finally {
			setLoading(false)
		}
		return false
	}

	const removeDevices = async () => {
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
			<PageHeader eyebrow="Inventory" title="设备清单" description="管理数码设备、规格信息与产品链接。" />
			<CollectionControls
				itemCount={collection.pageItems.length}
				selectedCount={collection.selected.size}
				allSelected={collection.allSelected}
				partiallySelected={collection.partiallySelected}
				loading={loading}
				addLabel="添加设备"
				deleteTitle="删除选中的设备？"
				deleteDescription="所选设备将从配置中移除。"
				onSelectAll={collection.selectAll}
				onDelete={removeDevices}
				onAdd={() => openEditDialog(undefined, -1)}
			/>

			{loading && !collection.pageItems.length ? (
				<PageLoading label="正在加载设备..." />
			) : collection.pageItems.length ? (
				<div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
					{collection.pageItems.map((item, index) => {
						const selected = collection.selected.has(index)
						return (
							<article
								key={`${item.category}-${item.name}-${index}`}
								className={cn('group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', selected && 'border-primary ring-2 ring-primary/15')}
								role="button"
								tabIndex={0}
								onClick={() => collection.toggleItem(index)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
								}}
							>
								<div className="relative aspect-[4/3] overflow-hidden bg-muted">
									{item.image ? <Image src={item.image} alt={item.name} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <Box className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />}
									<span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-xs text-white backdrop-blur">{item.category || DEFAULT_CATEGORY}</span>
									<Checkbox className="absolute right-3 top-3 rounded bg-background/85 p-1" checked={selected} onCheckedChange={(checked) => collection.setItemSelected(index, checked)} />
								</div>
								<div className="p-4">
									<h2 className="truncate font-semibold">{item.name}</h2>
									<p className="mt-1 truncate text-sm text-muted-foreground">{item.specs}</p>
									<p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.description}</p>
									<div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
										<a href={item.link} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary" aria-label={`访问 ${item.name}`} onClick={(event) => event.stopPropagation()}>
											<ExternalLink className="size-4" />
										</a>
										<Button variant="ghost" size="small" className="size-8 px-0" aria-label={`编辑 ${item.name}`} onClick={(event) => openEditDialog(event, index)}><Pencil className="size-4" /></Button>
									</div>
								</div>
							</article>
						)
					})}
				</div>
			) : (
				<div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
					<Box className="size-10 opacity-40" />
					<p>暂无设备数据</p>
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
				title={editingIndex === -1 ? '添加设备' : '编辑设备'}
				open={isDialogOpen}
				onSubmit={throttledSave}
				onCancel={() => setIsDialogOpen(false)}
				width={640}
				confirmLabel="保存"
				closeOnOutside={false}
			>
				<Form form={form}>
					<div className="grid gap-x-4 md:grid-cols-3">
						<FormField name="name" label="设备名称" rules={[{ required: true }]} className="md:col-span-2">
							<Input placeholder="输入设备名称" />
						</FormField>
						<FormField name="category" label={`分类（默认 ${DEFAULT_CATEGORY}）`}>
							<Input placeholder="如：OnePlus" />
						</FormField>
					</div>
					<FormField name="specs" label="规格配置" rules={[{ required: true }]}>
						<Input placeholder="如：Gray / 16G + 1TB" />
					</FormField>
					<div className="flex items-start gap-3">
						<FormField name="image" label="设备图片" rules={[{ required: true }]} className="min-w-0 flex-1">
							<Input placeholder="输入图片外链" />
						</FormField>
						<Upload beforeUpload={uploadCover} accept={imageAccept} disabled={loading}>
							<Button className="mt-6" icon={<FileUp className="size-4" />} loading={loading}>上传</Button>
						</Upload>
					</div>
					{imageValue && <Image src={imageValue} alt="设备图片预览" className="mb-4 h-24 w-full rounded-lg border object-contain" />}
					<FormField name="link" label="产品链接" rules={[{ required: true }]}>
						<Input prefix={<ExternalLink className="size-4" />} placeholder="输入跳转外链" />
					</FormField>
					<FormField name="description" label="详细描述" rules={[{ required: true }]}>
						<Textarea placeholder="输入详细描述" rows={3} />
					</FormField>
				</Form>
			</Dialog>
		</Page>
	)
}
