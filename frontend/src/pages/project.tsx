import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Code2, FileUp, FolderKanban, FolderGit2, Image as ImageIcon, Pencil, Rocket, Star } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  FormField,
  Image,
  Input,
  Dialog,
  Pagination,
  Select,
  Switch,
  Textarea,
  Upload,
  useForm,
  useFormWatch
} from '../components/ui'
import { imageAccept } from '../configs/upload-config'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getProjectConfig, uploadProjectImages, writeProjectConfig } from '../services/project'
import { cn } from '../lib/utils'
import { throttle } from '../utils/util'

interface ProjectItem {
  id: string
  title: string
  description: string
  image: string
  category: 'web' | 'mobile' | 'desktop' | 'other'
  techStack: string[]
  status: 'completed' | 'in-progress' | 'planned'
  liveDemo?: string
  sourceCode?: string
  startDate: string
  endDate?: string
  featured?: boolean
  tags?: string[]
  visitUrl?: string
}

const categoryOptions = [
  { label: '网页应用', value: 'web' },
  { label: '移动应用', value: 'mobile' },
  { label: '桌面应用', value: 'desktop' },
  { label: '其他', value: 'other' }
]

const statusOptions = [
  { label: '已完成', value: 'completed' },
  { label: '进行中', value: 'in-progress' },
  { label: '计划中', value: 'planned' }
]

const statusStyle = {
  completed: 'bg-emerald-50 text-emerald-700',
  'in-progress': 'bg-amber-50 text-amber-700',
  planned: 'bg-muted text-muted-foreground'
}

export default function Project() {
  const { t } = useTranslation()
  const form = useForm()
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>()
  const collection = usePagedCollection<ProjectItem>()
  const imageUrlValue = useFormWatch('image', form)

  const getConfig = useCallback(async (page: number, pageSize: number) => {
    try {
      setLoading(true)
      const res = await getProjectConfig()
      if (res.success) collection.setItems(res.data?.projectsData || [], page, pageSize)
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
      form.setValues({ id: `project-${Date.now()}`, techStack: [], tags: [], status: 'planned', category: 'web', featured: false })
    } else {
      const item = collection.pageItems[index]
      form.setValues({
        ...item,
        startDate: item.startDate ? dayjs(item.startDate) : undefined,
        endDate: item.endDate ? dayjs(item.endDate) : undefined
      })
    }
    setIsDialogOpen(true)
  }

  const updateList = useCallback(
    async (items: ProjectItem[], successMessage: string, page: number, pageSize: number) => {
      try {
        setLoading(true)
        const res = await writeProjectConfig({ projectsData: items })
        if (res.success) {
          notify.success(successMessage)
          setIsDialogOpen(false)
          await getConfig(page, pageSize)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    },
    [getConfig]
  )

  const handleUpload = async (file: File) => {
    try {
      setLoading(true)
      const res = await uploadProjectImages([file])
      if (res.success) {
        notify.success(i18n.t('notifications.uploadSuccess'))
        form.setValues({ image: res.data?.[0]?.publicPath || '' })
      }
    } catch {
    } finally {
      setLoading(false)
    }
    return false
  }

  const handleSave = useCallback(async () => {
    if (editingIndex === undefined) return
    try {
      const values = await form.validate()
      const item = {
        ...values,
        liveDemo: values.visitUrl,
        startDate: values.startDate?.format('YYYY-MM-DD') || '',
        endDate: values.endDate?.format('YYYY-MM-DD') || ''
      }
      const items = [...collection.items]
      if (editingIndex === -1) {
        items.unshift(item)
      } else {
        const realIndex = items.findIndex(entry => entry.id === collection.pageItems[editingIndex].id)
        if (realIndex !== -1) items[realIndex] = item
      }
      await updateList(
        items,
        editingIndex === -1 ? i18n.t('notifications.addSuccess') : i18n.t('notifications.editSuccess'),
        collection.page,
        collection.pageSize
      )
    } catch (err) {
      console.error(err)
    }
  }, [collection.items, collection.page, collection.pageItems, collection.pageSize, editingIndex, form, updateList])
  const throttledSave = useMemo(() => throttle(handleSave, 2000, { immediate: true }), [handleSave])

  const removeProjects = async () => {
    const removeIds = new Set(collection.selectedItems.map(item => item.id))
    const items = collection.items.filter(item => !removeIds.has(item.id))
    const page = Math.min(collection.page, Math.max(1, Math.ceil(items.length / collection.pageSize)))
    await updateList(items, i18n.t('notifications.deleteSuccess'), page, collection.pageSize)
  }

  useEffect(() => {
    getConfig(1, 12)
  }, [])

  return (
    <Page>
      <PageHeader eyebrow="Portfolio" title={t('pages.project.title')} description={t('pages.project.description')} />
      <CollectionControls
        itemCount={collection.pageItems.length}
        selectedCount={collection.selected.size}
        allSelected={collection.allSelected}
        partiallySelected={collection.partiallySelected}
        loading={loading}
        addLabel={t('pages.project.add')}
        deleteTitle={t('pages.project.deleteTitle')}
        deleteDescription={t('fields.deleteProjectDescription')}
        onSelectAll={collection.selectAll}
        onDelete={removeProjects}
        onAdd={() => openEditDialog(undefined, -1)}
      />

      {loading && !collection.pageItems.length ? (
        <PageLoading />
      ) : collection.pageItems.length ? (
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
          {collection.pageItems.map((item, index) => {
            const selected = collection.selected.has(index)
            const visitUrl = item.visitUrl || item.liveDemo
            return (
              <article
                key={item.id}
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                  selected && 'border-primary ring-2 ring-primary/15'
                )}
                role="button"
                tabIndex={0}
                onClick={() => collection.toggleItem(index)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
                }}
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <ImageIcon className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  )}
                  {item.featured && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      <Star className="size-3 fill-current" />
                      {t('fields.featured')}
                    </span>
                  )}
                  <Checkbox
                    className="absolute right-3 top-3 rounded bg-background/85 p-1"
                    checked={selected}
                    onCheckedChange={checked => collection.setItemSelected(index, checked)}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 truncate font-semibold">{item.title}</h2>
                    <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[11px]', statusStyle[item.status])}>
                      {statusOptions.find(option => option.value === item.status)?.label}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.description}</p>
                  <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
                    {item.techStack?.slice(0, 4).map(tech => (
                      <span key={tech} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                    {item.sourceCode && (
                      <a
                        href={item.sourceCode}
                        target="_blank"
                        rel="noreferrer"
                        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={`查看 ${item.title} 源码`}
                        onClick={event => event.stopPropagation()}
                      >
                        <FolderGit2 className="size-4" />
                      </a>
                    )}
                    {visitUrl && (
                      <a
                        href={visitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary"
                        aria-label={`访问 ${item.title}`}
                        onClick={event => event.stopPropagation()}
                      >
                        <Rocket className="size-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="small"
                      className="size-8 px-0"
                      aria-label={`编辑 ${item.title}`}
                      onClick={event => openEditDialog(event, index)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
          <FolderKanban className="size-10 opacity-40" />
          <p>{t('fields.emptyProject')}</p>
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
        title={editingIndex === -1 ? t('fields.addProject') : t('fields.editProject')}
        open={isDialogOpen}
        onSubmit={throttledSave}
        onCancel={() => setIsDialogOpen(false)}
        width={800}
        confirmLabel={t('common.save')}
        closeOnOutside={false}
      >
        <Form form={form} initialValues={{ featured: false }}>
          <div className="grid gap-x-4 md:grid-cols-2">
            <FormField name="title" label={t('fields.projectName')} rules={[{ required: true }]}>
              <Input placeholder={t('fields.projectName')} />
            </FormField>
            <FormField name="category" label={t('fields.category')} rules={[{ required: true }]}>
              <Select options={categoryOptions} />
            </FormField>
          </div>
          <FormField name="description" label={t('fields.projectDescription')} rules={[{ required: true }]}>
            <Textarea rows={3} placeholder={t('fields.projectDescription')} />
          </FormField>
          <div className="flex items-start gap-3">
            <FormField name="image" label={t('fields.projectImage')} rules={[{ required: true }]} className="min-w-0 flex-1">
              <Input placeholder={t('fields.imageUrl')} />
            </FormField>
            <Upload beforeUpload={handleUpload} accept={imageAccept} disabled={loading}>
              <Button className="mt-6" icon={<FileUp className="size-4" />} loading={loading}>
                {t('common.upload')}
              </Button>
            </Upload>
          </div>
          {imageUrlValue && (
            <Image src={imageUrlValue} alt={t('fields.projectPreview')} className="mb-4 h-28 w-full rounded-lg border object-contain" />
          )}
          <div className="grid gap-x-4 md:grid-cols-2">
            <FormField name="status" label={t('fields.projectStatus')}>
              <Select options={statusOptions} />
            </FormField>
            <FormField name="visitUrl" label={t('fields.previewUrl')}>
              <Input prefix={<Rocket className="size-4" />} placeholder={t('fields.previewUrl')} />
            </FormField>
            <FormField name="sourceCode" label={t('fields.sourceUrl')}>
              <Input prefix={<FolderGit2 className="size-4" />} placeholder="GitHub Repo URL" />
            </FormField>
            <FormField name="startDate" label={t('fields.startDate')} rules={[{ required: true }]}>
              <DatePicker />
            </FormField>
            <FormField name="endDate" label={t('fields.endDate')}>
              <DatePicker />
            </FormField>
            <FormField name="featured" label={t('fields.featured')} valueKey="checked">
              <Switch />
            </FormField>
          </div>
          <FormField name="techStack" label={t('fields.techStack')}>
            <Select mode="tags" prefix={<Code2 className="size-4" />} placeholder={t('fields.techStack')} />
          </FormField>
          <FormField name="tags" label={t('fields.tags')}>
            <Select mode="tags" placeholder={t('fields.tags')} />
          </FormField>
        </Form>
      </Dialog>
    </Page>
  )
}
