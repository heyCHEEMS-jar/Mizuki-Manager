import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { BookOpen, FileUp, MapPin, Pencil, Smile, X } from 'lucide-react'
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
  Textarea,
  Upload,
  useForm,
  useFormWatch
} from '../components/ui'
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
  const { t } = useTranslation()
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

  const updateList = useCallback(
    async (items: DiaryItem[], successMessage: string, page: number, pageSize: number) => {
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
    },
    [getConfig]
  )

  const handleSave = useCallback(async () => {
    if (editingIndex === undefined) return
    try {
      const values = await form.validate()
      const item = { ...values, date: values.date.toISOString() }
      const items = [...collection.items]
      if (editingIndex !== -1) {
        const realIndex = items.findIndex(entry => entry.id === collection.pageItems[editingIndex].id)
        if (realIndex !== -1) items.splice(realIndex, 1)
      }
      items.unshift(item)
      await updateList(
        items,
        editingIndex === -1 ? i18n.t('notifications.recordSuccess') : i18n.t('notifications.editSuccess'),
        collection.page,
        collection.pageSize
      )
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
        notify.success(i18n.t('notifications.uploadSuccess'))
      }
    } catch {
    } finally {
      setLoading(false)
    }
    return false
  }

  const removeDiary = async () => {
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
      <PageHeader eyebrow="Journal" title={t('pages.diary.title')} description={t('pages.diary.description')} />
      <CollectionControls
        itemCount={collection.pageItems.length}
        selectedCount={collection.selected.size}
        allSelected={collection.allSelected}
        partiallySelected={collection.partiallySelected}
        loading={loading}
        addLabel={t('pages.diary.add')}
        deleteTitle={t('pages.diary.deleteTitle')}
        deleteDescription={t('fields.deleteDiaryDescription')}
        onSelectAll={collection.selectAll}
        onDelete={removeDiary}
        onAdd={() => openEditDialog(undefined, -1)}
      />

      {loading && !collection.pageItems.length ? (
        <PageLoading />
      ) : collection.pageItems.length ? (
        <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', loading && 'pointer-events-none opacity-60')}>
          {collection.pageItems.map((item, index) => {
            const selected = collection.selected.has(index)
            return (
              <article
                key={item.id}
                className={cn(
                  'relative flex min-h-72 cursor-pointer flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                  selected && 'border-primary ring-2 ring-primary/15'
                )}
                role="button"
                tabIndex={0}
                onClick={() => collection.toggleItem(index)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
                }}
              >
                <div className="flex items-center justify-between gap-3 pr-8">
                  <time className="text-xs font-medium text-muted-foreground">{dayjs(item.date).format('YYYY-MM-DD HH:mm')}</time>
                  <Checkbox
                    className="absolute right-4 top-4"
                    checked={selected}
                    onCheckedChange={checked => collection.setItemSelected(index, checked)}
                  />
                </div>
                <p className="mt-4 line-clamp-5 flex-1 whitespace-pre-wrap text-sm leading-6">{item.content}</p>
                {item.images?.length ? (
                  <div className="mt-4 flex gap-2 overflow-hidden" onClick={event => event.stopPropagation()}>
                    {item.images.slice(0, 4).map((image, imageIndex) => (
                      <Image key={`${image}-${imageIndex}`} src={image} alt={t('fields.diaryImage')} className="size-14 rounded-md object-cover" />
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-3 text-xs">
                  {item.mood && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-orange-700">
                      <Smile className="size-3" />
                      {item.mood}
                    </span>
                  )}
                  {item.location && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                      <MapPin className="size-3" />
                      {item.location}
                    </span>
                  )}
                  {item.tags?.map(tag => (
                    <span key={tag} className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="small"
                  className="absolute bottom-3 right-3 size-8 px-0"
                  aria-label={t('fields.editDiary')}
                  onClick={event => openEditDialog(event, index)}
                >
                  <Pencil className="size-4" />
                </Button>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
          <BookOpen className="size-10 opacity-40" />
          <p>{t('fields.emptyDiary')}</p>
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
        title={editingIndex === -1 ? t('fields.addDiary') : t('fields.editDiary')}
        open={isDialogOpen}
        onSubmit={throttledSave}
        onCancel={() => setIsDialogOpen(false)}
        width={640}
        confirmLabel={t('common.save')}
        closeOnOutside={false}
      >
        <Form form={form}>
          <div className="grid gap-x-4 md:grid-cols-2">
            <FormField name="date" label={t('fields.time')} rules={[{ required: true }]}>
              <DatePicker showTime />
            </FormField>
            <FormField name="mood" label={t('fields.mood')}>
              <Input prefix={<Smile className="size-4" />} placeholder={t('fields.mood')} />
            </FormField>
          </div>
          <FormField name="content" label={t('fields.content')} rules={[{ required: true }]}>
            <Textarea placeholder={t('fields.content')} rows={8} />
          </FormField>
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium">{t('fields.images')}</div>
            <div className="flex flex-wrap items-center gap-2">
              <Upload beforeUpload={handleUpload} accept={imageAccept} multiple disabled={loading}>
                <Button icon={<FileUp className="size-4" />} loading={loading}>
                  {t('fields.uploadImages')}
                </Button>
              </Upload>
              {imagesValue.map((url: string, index: number) => (
                <div key={`${url}-${index}`} className="relative">
                  <Image src={url} alt={t('fields.diaryPreview')} className="size-16 rounded-md border object-cover" />
                  <button
                    type="button"
                    className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-destructive text-white shadow"
                    aria-label={t('common.remove')}
                    onClick={() => form.setValues({ images: imagesValue.filter((_: string, itemIndex: number) => itemIndex !== index) })}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-x-4 md:grid-cols-2">
            <FormField name="location" label={t('fields.place')}>
              <Input prefix={<MapPin className="size-4" />} placeholder={t('fields.place')} />
            </FormField>
            <FormField name="tags" label={t('fields.tags')}>
              <Select mode="tags" placeholder={t('fields.tags')} />
            </FormField>
          </div>
        </Form>
      </Dialog>
    </Page>
  )
}
