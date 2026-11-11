import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Pencil, UserRound, Users } from 'lucide-react'
import { CollectionControls } from '../components/CollectionControls'
import { Page, PageHeader, PageLoading } from '../components/Page'
import { Avatar, Button, Checkbox, Form, FormField, Input, Dialog, Pagination, Select, Textarea, useForm, useFormWatch } from '../components/ui'
import { usePagedCollection } from '../hooks/usePagedCollection'
import { notify } from '../lib/notify'
import { getFriendConfig, writeFriendConfig } from '../services/friend'
import { cn } from '../lib/utils'
import { throttle } from '../utils/util'

export interface FriendItem {
  id: number
  title: string
  imgurl: string
  desc: string
  siteurl: string
  tags: string[]
}

export default function Friend() {
  const { t } = useTranslation()
  const form = useForm()
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>()
  const collection = usePagedCollection<FriendItem>()
  const imgUrlValue = useFormWatch('imgurl', form)

  const getConfig = useCallback(async (page: number, pageSize: number) => {
    try {
      setLoading(true)
      const res = await getFriendConfig()
      if (res.success) collection.setItems(res.data?.friendsData || [], page, pageSize)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const openEditDialog = (event: MouseEvent | undefined, index: number) => {
    event?.stopPropagation()
    setEditingIndex(index)
    form.reset()
    form.setValues(index === -1 ? { id: Date.now(), tags: [] } : collection.pageItems[index])
    setIsDialogOpen(true)
  }

  const updateList = useCallback(
    async (items: FriendItem[], successMessage: string, page: number, pageSize: number) => {
      try {
        setLoading(true)
        const res = await writeFriendConfig({ friendsData: items })
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

  const removeFriends = async () => {
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
      <PageHeader eyebrow="Links" title={t('pages.friend.title')} description={t('pages.friend.description')} />
      <CollectionControls
        itemCount={collection.pageItems.length}
        selectedCount={collection.selected.size}
        allSelected={collection.allSelected}
        partiallySelected={collection.partiallySelected}
        loading={loading}
        addLabel={t('pages.friend.add')}
        deleteTitle={t('pages.friend.deleteTitle')}
        deleteDescription={t('fields.deleteFriendDescription')}
        onSelectAll={collection.selectAll}
        onDelete={removeFriends}
        onAdd={() => openEditDialog(undefined, -1)}
      />

      {loading && !collection.pageItems.length ? (
        <PageLoading label="正在加载友链..." />
      ) : collection.pageItems.length ? (
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
          {collection.pageItems.map((item, index) => {
            const selected = collection.selected.has(index)
            return (
              <article
                key={item.id}
                className={cn(
                  'group relative flex min-h-52 cursor-pointer flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                  selected && 'border-primary ring-2 ring-primary/15'
                )}
                role="button"
                tabIndex={0}
                onClick={() => collection.toggleItem(index)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') collection.toggleItem(index)
                }}
              >
                <Checkbox
                  className="absolute right-4 top-4"
                  checked={selected}
                  onCheckedChange={checked => collection.setItemSelected(index, checked)}
                />
                <div className="flex items-start gap-3 pr-8">
                  <Avatar src={item.imgurl} size={48} icon={<UserRound className="size-5" />} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{item.title}</h2>
                    <a
                      href={item.siteurl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={event => event.stopPropagation()}
                    >
                      {t('fields.visitSite')}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                <div className="mt-4 flex min-h-6 flex-wrap items-center gap-1.5">
                  {item.tags?.map(tag => (
                    <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      #{tag}
                    </span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="small"
                  className="absolute bottom-3 right-3 size-8 px-0 opacity-70 hover:opacity-100"
                  aria-label={`编辑 ${item.title}`}
                  onClick={event => openEditDialog(event, index)}
                >
                  <Pencil className="size-4" />
                </Button>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-center text-sm text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p>{t('fields.emptyFriends')}</p>
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
        title={editingIndex === -1 ? t('fields.addFriend') : t('fields.editFriend')}
        open={isDialogOpen}
        onSubmit={throttledSave}
        onCancel={() => setIsDialogOpen(false)}
        width={600}
        confirmLabel={t('common.save')}
        closeOnOutside={false}
      >
        <Form form={form}>
          <div className="grid gap-x-4 md:grid-cols-2">
            <FormField name="title" label={t('fields.siteName')} rules={[{ required: true }]}>
              <Input placeholder={t('fields.siteName')} />
            </FormField>
            <FormField name="siteurl" label={t('fields.siteUrl')} rules={[{ required: true }]}>
              <Input prefix={<ExternalLink className="size-4" />} placeholder={t('fields.siteUrl')} />
            </FormField>
          </div>
          <div className="flex items-start gap-3">
            <FormField name="imgurl" label={t('fields.iconUrl')} rules={[{ required: true }]} className="min-w-0 flex-1">
              <Input placeholder={t('fields.iconUrl')} />
            </FormField>
            {imgUrlValue && <Avatar shape="square" src={imgUrlValue} className="mt-6" />}
          </div>
          <FormField name="desc" label={t('fields.siteDescription')} rules={[{ required: true }]}>
            <Textarea placeholder={t('fields.siteDescription')} rows={3} />
          </FormField>
          <FormField name="tags" label={t('fields.tags')}>
            <Select mode="tags" placeholder={t('fields.tags')} />
          </FormField>
        </Form>
      </Dialog>
    </Page>
  )
}
