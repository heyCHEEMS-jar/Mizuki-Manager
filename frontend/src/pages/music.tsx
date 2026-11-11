import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import { Disc3, FileAudio, FileUp, Image as ImageIcon, Pencil, Play } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import { Button, Checkbox, Form, FormField, Image, Input, NumberInput, Dialog, Pagination, Upload, useForm, useFormWatch } from '../components/ui'
import { audioAccept, imageAccept } from '../configs/upload-config'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getMusicConfig, uploadCoverFile, uploadMusicFile, writeMusicConfig } from '../services/music'
import { cn } from '../lib/utils'
import { throttle } from '../utils/util'

interface Song {
  id: number | string
  title: string
  artist: string
  cover: string
  url: string
  duration: number
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
}

export default function Music() {
  const { t } = useTranslation()
  const form = useForm()
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>()
  const collection = usePagedCollection<Song>()
  const coverUrlValue = useFormWatch('cover', form)
  const musicUrlValue = useFormWatch('url', form)

  const getConfig = useCallback(async (page: number, pageSize: number) => {
    try {
      setLoading(true)
      const res = await getMusicConfig()
      if (res.success) collection.setItems(res.data?.LOCAL_PLAYLIST || [], page, pageSize)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const openEditDialog = (event: MouseEvent | undefined, index: number) => {
    event?.stopPropagation()
    setEditingIndex(index)
    form.reset()
    form.setValues(index === -1 ? { id: Date.now() } : collection.pageItems[index])
    setIsDialogOpen(true)
  }

  const updateList = useCallback(
    async (items: Song[], successMessage: string, page: number, pageSize: number) => {
      try {
        setLoading(true)
        const res = await writeMusicConfig({ LOCAL_PLAYLIST: items })
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

  const uploadCover = async (file: File) => {
    try {
      setLoading(true)
      const res = await uploadCoverFile(file)
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

  const uploadMusic = async (file: File) => {
    try {
      setLoading(true)
      const res = await uploadMusicFile(file)
      if (res.success) {
        notify.success(i18n.t('notifications.uploadSuccess'))
        form.setValues({ url: res.data?.[0]?.publicPath || '' })
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
      const items = [...collection.items]
      if (editingIndex === -1) {
        items.unshift(values)
      } else {
        const realIndex = items.findIndex(item => item.id === collection.pageItems[editingIndex].id)
        if (realIndex !== -1) items[realIndex] = values
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

  const removeSongs = async () => {
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
      <PageHeader eyebrow="Playlist" title={t('pages.music.title')} description={t('pages.music.description')} />
      <CollectionControls
        itemCount={collection.pageItems.length}
        selectedCount={collection.selected.size}
        allSelected={collection.allSelected}
        partiallySelected={collection.partiallySelected}
        loading={loading}
        addLabel={t('pages.music.add')}
        deleteTitle={t('pages.music.deleteTitle')}
        deleteDescription={t('fields.deleteMusicDescription')}
        onSelectAll={collection.selectAll}
        onDelete={removeSongs}
        onAdd={() => openEditDialog(undefined, -1)}
      />

      {loading && !collection.pageItems.length ? (
        <PageLoading />
      ) : collection.pageItems.length ? (
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
          {collection.pageItems.map((item, index) => {
            const selected = collection.selected.has(index)
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
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <ImageIcon className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  )}
                  <Checkbox
                    className="absolute right-3 top-3 rounded bg-background/85 p-1"
                    checked={selected}
                    onCheckedChange={checked => collection.setItemSelected(index, checked)}
                  />
                  <span className="absolute bottom-3 right-3 rounded-md bg-black/65 px-2 py-1 text-xs text-white backdrop-blur">
                    {formatDuration(item.duration)}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="truncate font-semibold">{item.title}</h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{item.artist}</p>
                  <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary"
                      aria-label={`播放 ${item.title}`}
                      onClick={event => event.stopPropagation()}
                    >
                      <Play className="size-4" />
                    </a>
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
          <Disc3 className="size-10 opacity-40" />
          <p>{t('fields.emptyMusic')}</p>
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
        title={editingIndex === -1 ? t('fields.addSong') : t('fields.editSong')}
        open={isDialogOpen}
        onSubmit={throttledSave}
        onCancel={() => setIsDialogOpen(false)}
        width={600}
        confirmLabel={t('common.save')}
        closeOnOutside={false}
      >
        <Form form={form}>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField name="title" label={t('fields.songName')} rules={[{ required: true }]} className="sm:col-span-2">
              <Input placeholder={t('fields.songName')} />
            </FormField>
            <FormField name="artist" label={t('fields.artist')} rules={[{ required: true }]}>
              <Input placeholder={t('fields.artist')} />
            </FormField>
            <FormField name="duration" label={t('fields.duration')} rules={[{ required: true }]}>
              <NumberInput min={1} placeholder={t('fields.duration')} />
            </FormField>
          </div>

          <div className="flex items-start gap-3">
            <FormField name="cover" label={t('fields.songCover')} rules={[{ required: true }]} className="min-w-0 flex-1">
              <Input prefix={<ImageIcon className="size-4" />} placeholder={t('fields.imageUrl')} />
            </FormField>
            <Upload beforeUpload={uploadCover} accept={imageAccept} disabled={loading}>
              <Button className="mt-6" icon={<FileUp className="size-4" />} loading={loading}>
                {t('fields.uploadCover')}
              </Button>
            </Upload>
          </div>
          {coverUrlValue && (
            <Image src={coverUrlValue} alt={t('fields.musicPreview')} className="mb-4 h-24 w-full rounded-lg border object-contain" />
          )}

          <div className="flex items-start gap-3">
            <FormField name="url" label={t('fields.audioFile')} rules={[{ required: true }]} className="min-w-0 flex-1">
              <Input prefix={<FileAudio className="size-4" />} placeholder={t('fields.audioFile')} />
            </FormField>
            <Upload beforeUpload={uploadMusic} accept={audioAccept} disabled={loading}>
              <Button className="mt-6" icon={<FileUp className="size-4" />} loading={loading}>
                {t('fields.uploadAudio')}
              </Button>
            </Upload>
          </div>
          {musicUrlValue && <audio controls src={musicUrlValue} className="w-full" />}
        </Form>
      </Dialog>
    </Page>
  )
}
