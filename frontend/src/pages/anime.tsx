import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { ExternalLink, FileUp, Image as ImageIcon, Pencil, PlayCircle, Star } from 'lucide-react'
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
  NumberInput,
  Dialog,
  Pagination,
  Progress,
  Select,
  Textarea,
  Upload,
  useForm,
  useFormWatch
} from '../components/ui'
import { imageAccept } from '../configs/upload-config'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getAnimeConfig, uploadAnimeImages, writeAnimeConfig } from '../services/anime'
import { cn } from '../lib/utils'
import { compareMonth, throttle } from '../utils/util'

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

export default function Anime() {
  const { t } = useTranslation()
  const statusOptions = [
    { label: t('fields.watching'), value: 'watching' },
    { label: t('fields.completed'), value: 'completed' },
    { label: t('fields.planned'), value: 'planned' }
  ]
  const statusLabel = (status: AnimeItem['status']) => statusOptions.find(option => option.value === status)?.label || status
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

  const updateList = useCallback(
    async (items: AnimeItem[], successMessage: string, page: number, pageSize: number) => {
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
    },
    [getConfig]
  )

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
      await updateList(
        items,
        editingIndex === -1 ? i18n.t('notifications.addSuccess') : i18n.t('notifications.editSuccess'),
        collection.page,
        collection.pageSize
      )
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
        notify.success(i18n.t('notifications.uploadSuccess'))
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
    const items = collection.items.filter(item => !removeItems.has(item))
    const page = Math.min(collection.page, Math.max(1, Math.ceil(items.length / collection.pageSize)))
    await updateList(items, i18n.t('notifications.deleteSuccess'), page, collection.pageSize)
  }

  useEffect(() => {
    getConfig(1, 12)
  }, [])

  return (
    <Page>
      <PageHeader eyebrow="Watchlist" title={t('pages.anime.title')} description={t('pages.anime.description')} />
      <CollectionControls
        itemCount={collection.pageItems.length}
        selectedCount={collection.selected.size}
        allSelected={collection.allSelected}
        partiallySelected={collection.partiallySelected}
        loading={loading}
        addLabel={t('pages.anime.add')}
        deleteTitle={t('pages.anime.deleteTitle')}
        deleteDescription={t('fields.deleteAnimeDescription')}
        onSelectAll={collection.selectAll}
        onDelete={removeAnime}
        onAdd={() => openEditDialog(undefined, -1)}
      />

      {loading && !collection.pageItems.length ? (
        <PageLoading />
      ) : collection.pageItems.length ? (
        <div className={cn('grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
          {collection.pageItems.map((anime, index) => {
            const selected = collection.selected.has(index)
            const percent = anime.totalEpisodes ? Math.round((anime.progress / anime.totalEpisodes) * 100) : 0
            return (
              <article
                key={`${anime.title}-${anime.year}-${index}`}
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
                <div className="relative aspect-3/4 overflow-hidden bg-muted">
                  {anime.cover ? (
                    <Image
                      src={anime.cover}
                      alt={anime.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <ImageIcon className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  )}
                  <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-xs text-white backdrop-blur">{anime.year}</span>
                  <Checkbox
                    className="absolute right-3 top-3 rounded bg-background/85 p-1"
                    checked={selected}
                    onCheckedChange={checked => collection.setItemSelected(index, checked)}
                  />
                </div>
                <div className="p-4">
                  <h2 className="truncate font-semibold">{anime.title}</h2>
                  <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{anime.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {Number(anime.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">{statusLabel(anime.status)}</span>
                  </div>
                  <Progress percent={percent} className="mt-2" strokeColor={anime.status === 'completed' ? '#22c55e' : undefined} />
                  <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                    <a
                      href={anime.link}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary"
                      aria-label={`观看 ${anime.title}`}
                      onClick={event => event.stopPropagation()}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="small"
                      className="size-8 px-0"
                      aria-label={`编辑 ${anime.title}`}
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
          <PlayCircle className="size-10 opacity-40" />
          <p>{t('fields.emptyAnime')}</p>
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
        title={editingIndex === -1 ? t('fields.addAnime') : t('fields.editAnime')}
        open={isDialogOpen}
        onSubmit={throttledSave}
        onCancel={() => setIsDialogOpen(false)}
        width={680}
        confirmLabel={t('common.save')}
        closeOnOutside={false}
      >
        <Form form={form}>
          <FormField name="title" label={t('fields.animeTitle')} rules={[{ required: true }]}>
            <Input placeholder={t('fields.animeTitle')} />
          </FormField>
          <div className="grid gap-x-4 md:grid-cols-3">
            <FormField name="year" label={t('fields.year')} rules={[{ required: true }]}>
              <DatePicker picker="year" />
            </FormField>
            <FormField name="studio" label={t('fields.studio')} rules={[{ required: true }]} className="md:col-span-2">
              <Input placeholder={t('fields.studio')} />
            </FormField>
          </div>
          <div className="flex items-start gap-3">
            <FormField name="cover" label={t('fields.cover')} rules={[{ required: true }]} className="min-w-0 flex-1">
              <Input placeholder={t('fields.imageUrl')} />
            </FormField>
            <Upload beforeUpload={uploadCover} accept={imageAccept} disabled={loading}>
              <Button className="mt-6" icon={<FileUp className="size-4" />} loading={loading}>
                {t('common.upload')}
              </Button>
            </Upload>
          </div>
          {coverValue && <Image src={coverValue} alt={t('fields.animeCoverPreview')} className="mb-4 h-28 w-full rounded-lg border object-contain" />}
          <FormField name="link" label={t('fields.watchLink')} rules={[{ required: true }]}>
            <Input prefix={<ExternalLink className="size-4" />} placeholder={t('fields.watchLink')} />
          </FormField>
          <FormField name="description" label={t('fields.animeDescription')} rules={[{ required: true }]}>
            <Textarea placeholder={t('fields.animeDescription')} rows={3} />
          </FormField>
          <FormField name="genre" label={t('fields.genre')} rules={[{ required: true }]}>
            <Select mode="tags" placeholder={t('fields.genre')} tokenSeparators={[',', '，']} />
          </FormField>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="rating" label={t('fields.rating')} rules={[{ required: true }]}>
              <NumberInput min={0} max={10} placeholder={t('fields.rating')} />
            </FormField>
            <FormField
              name="progress"
              label={t('fields.progress')}
              rules={[
                { required: true },
                {
                  validator(_, value) {
                    if (value > (form.getValue('totalEpisodes') || 0)) return Promise.reject(new Error('不能超过总集数'))
                  }
                }
              ]}
            >
              <NumberInput min={0} placeholder={t('fields.progress')} />
            </FormField>
            <FormField name="totalEpisodes" label={t('fields.totalEpisodes')} rules={[{ required: true }]}>
              <NumberInput min={0} placeholder={t('fields.totalEpisodes')} />
            </FormField>
            <FormField name="status" label={t('fields.watchStatus')} rules={[{ required: true }]}>
              <Select placeholder={t('fields.watchStatus')} options={statusOptions} />
            </FormField>
          </div>
          <div className="grid gap-x-4 md:grid-cols-2">
            <FormField
              name="startDate"
              label={t('fields.startDate')}
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
            <FormField name="endDate" label={t('fields.endDate')}>
              <DatePicker picker="month" />
            </FormField>
          </div>
        </Form>
      </Dialog>
    </Page>
  )
}
