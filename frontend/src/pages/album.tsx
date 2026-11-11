import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Copy, FileImage, FileUp, Folder, FolderOpen, FolderPlus, Pencil, Settings2, Trash2 } from 'lucide-react'
import { Page, PageHeader, PageLoading } from '../components/Page'
import {
  Button,
  Checkbox,
  ConfirmDialog,
  DatePicker,
  Sheet,
  Form,
  FormField,
  FormList,
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
import { notify } from '../lib/notify'
import {
  createFolder,
  deleteFiles,
  deleteFolder,
  getFolderFiles,
  getFolders,
  getInfo,
  renameFolder,
  updateInfo,
  uploadAlbumFiles
} from '../services/album'
import { cn } from '../lib/utils'
import { formatTime, throttle } from '../utils/util'

type AlbumMode = 'external' | ''

interface PhotoItem {
  src: string
  alt?: string
}

interface AlbumInfo {
  mode?: AlbumMode
  hidden?: boolean
  title?: string
  description?: string
  date?: string
  location?: string
  tags?: string[]
  layout?: 'grid' | 'masonry'
  columns?: number
  cover?: string
  photos?: PhotoItem[]
}

interface FolderItem {
  folderName: string
  folderPath: string
}

interface FileItem {
  filename: string
  filePath: string
  url: string
}

const toPublicUrl = (url: string) => new URL(url, window.location.origin).href

export default function Album() {
  const form = useForm()
  const currentMode: AlbumMode = useFormWatch('mode', form)
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [curFolderPath, setCurFolderPath] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set())
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [pageTotal, setPageTotal] = useState(0)
  const currentFolder = folders.find(folder => folder.folderPath === curFolderPath)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify.success('已复制到剪切板')
    } catch {
      notify.error('复制失败')
    }
  }

  const setFileChecked = (filePath: string, checked: boolean) => {
    setCheckedPaths(current => {
      const next = new Set(current)
      if (checked) next.add(filePath)
      else next.delete(filePath)
      return next
    })
  }

  const toggleFile = (filePath: string) => {
    setCheckedPaths(current => {
      const next = new Set(current)
      if (next.has(filePath)) next.delete(filePath)
      else next.add(filePath)
      return next
    })
  }

  const getAllFolders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getFolders()
      if (res.data) setFolders(res.data)
      else throw new Error('未从响应中获取到文件夹列表')
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllFiles = useCallback(async (folderPath: string, page: number, size: number) => {
    if (!folderPath) return
    try {
      setLoading(true)
      const res = await getFolderFiles(folderPath, page, size)
      const data = res.data || {}
      setFiles(data.files || [])
      setPageTotal(data.total ?? 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const selectFolder = useCallback(
    async (folderPath: string) => {
      if (!folderPath) return
      setCurFolderPath(folderPath)
      setCheckedPaths(new Set())
      setPageNum(1)
      setPageSize(12)
      setSheetOpen(false)
      await getAllFiles(folderPath, 1, 12)
    },
    [getAllFiles]
  )

  const addFolder = async () => {
    try {
      setLoading(true)
      const folderName = prompt('输入创建的目录名称')
      if (folderName === null) return
      if (!folderName.trim()) {
        notify.warning('目录名称不能为空')
        return
      }
      const res = await createFolder(folderName.trim())
      if (res.success) {
        notify.success('创建成功')
        await getAllFolders()
        if (res.data?.folderPath) await selectFolder(res.data.folderPath)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const uploadFiles = async (file: File, fileList: File[]) => {
    if (file !== fileList[fileList.length - 1]) return false
    try {
      setLoading(true)
      const res = await uploadAlbumFiles(curFolderPath, fileList)
      if (res.success) notify.success('上传成功')
    } catch {
    } finally {
      await getAllFiles(curFolderPath, pageNum, pageSize)
      setLoading(false)
    }
    return false
  }

  const removeFiles = async () => {
    const paths = [...checkedPaths]
    const page = Math.min(pageNum, Math.max(1, Math.ceil((pageTotal - paths.length) / pageSize)))
    try {
      setLoading(true)
      const res = await deleteFiles(paths)
      if (res.success) {
        notify.success('删除成功')
        setCheckedPaths(new Set())
      }
    } catch {
    } finally {
      setPageNum(page)
      await getAllFiles(curFolderPath, page, pageSize)
      setLoading(false)
    }
  }

  const modifyFolderName = async () => {
    if (loading) return
    const newName = renameName.trim()
    if (!newName) {
      notify.warning('新名称不能为空')
      return
    }
    if (newName === currentFolder?.folderName) {
      setRenameDialogOpen(false)
      return
    }
    try {
      setLoading(true)
      const res = await renameFolder(curFolderPath, newName)
      if (res.success) {
        notify.success('重命名成功')
        setRenameDialogOpen(false)
        await getAllFolders()
        if (res.data?.folderPath) await selectFolder(res.data.folderPath)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const removeFolder = async () => {
    try {
      setLoading(true)
      const res = await deleteFolder(curFolderPath)
      if (res.success) {
        notify.success('删除成功')
        setCurFolderPath('')
        setFiles([])
        setPageTotal(0)
        await getAllFolders()
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const getInfoContent = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getInfo(curFolderPath)
      if (res.success) {
        const data = JSON.parse(res.data) || {}
        form.setValues({
          mode: data.mode || '',
          hidden: data.hidden || false,
          title: data.title || '',
          description: data.description || '',
          date: dayjs(data.date || formatTime(new Date())),
          location: data.location || '',
          tags: data.tags || [],
          layout: data.layout || 'grid',
          columns: data.columns || 3,
          cover: data.cover || '',
          photos: data.photos || [{ src: '', alt: '' }]
        })
        setIsDialogOpen(true)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [curFolderPath, form])

  const saveInfoContent = useCallback(async () => {
    try {
      setLoading(true)
      const values = await form.validate()
      const payload: AlbumInfo = {
        ...values,
        date: values.date?.format('YYYY-MM-DD') || '',
        photos: values.photos?.filter((photo: PhotoItem) => photo.src)
      }
      const res = await updateInfo(curFolderPath, JSON.stringify(payload, null, 2))
      if (res.success) {
        notify.success('保存成功')
        setIsDialogOpen(false)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [curFolderPath, form])
  const throttledSave = useMemo(() => throttle(saveInfoContent, 2000, { immediate: true }), [saveInfoContent])

  const onPageChange = async (page: number, size: number) => {
    setPageNum(page)
    setPageSize(size)
    setCheckedPaths(new Set())
    await getAllFiles(curFolderPath, page, size)
  }

  useEffect(() => {
    getAllFolders()
  }, [])

  const renderFolderList = () => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-3">
        <Button variant="outline" block className="border-dashed" icon={<FolderPlus className="size-4" />} loading={loading} onClick={addFolder}>
          新建目录
        </Button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2" aria-label="相册目录">
        {folders.map(folder => (
          <button
            key={folder.folderPath}
            type="button"
            className={cn(
              'flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors hover:bg-accent',
              curFolderPath === folder.folderPath && 'bg-primary/10 font-medium text-primary'
            )}
            onClick={() => selectFolder(folder.folderPath)}
          >
            <Folder className="size-4 shrink-0" />
            <span className="truncate">{folder.folderName}</span>
          </button>
        ))}
        {!folders.length && <p className="px-3 py-8 text-center text-xs text-muted-foreground">暂无相册目录</p>}
      </nav>
    </div>
  )

  return (
    <Page className="max-w-none">
      <PageHeader
        eyebrow="Gallery"
        title={currentFolder?.folderName || '相册管理'}
        description={currentFolder ? '管理当前相册中的图片与展示配置。' : '选择或创建相册目录后开始管理图片。'}
        actions={
          <>
            <Button className="lg:hidden" icon={<FolderOpen className="size-4" />} onClick={() => setSheetOpen(true)}>
              目录
            </Button>
            {curFolderPath && (
              <>
                <Button
                  icon={<Pencil className="size-4" />}
                  disabled={loading}
                  onClick={() => {
                    setRenameName(currentFolder?.folderName || '')
                    setRenameDialogOpen(true)
                  }}
                >
                  重命名
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive" icon={<Trash2 className="size-4" />} disabled={loading}>
                      删除相册
                    </Button>
                  }
                  title="删除整个相册？"
                  description="目录、图片和配置都会被删除，此操作无法撤回。"
                  confirmLabel="删除相册"
                  variant="destructive"
                  onConfirm={removeFolder}
                />
                <Button icon={<Settings2 className="size-4" />} loading={loading} onClick={getInfoContent}>
                  配置
                </Button>
                <Upload beforeUpload={uploadFiles} multiple accept={imageAccept} disabled={loading}>
                  <Button variant="default" icon={<FileUp className="size-4" />} loading={loading}>
                    上传图片
                  </Button>
                </Upload>
              </>
            )}
          </>
        }
      />

      <div className="grid min-h-[calc(100vh-12rem)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden overflow-hidden rounded-xl border bg-card shadow-sm lg:block">{renderFolderList()}</aside>
        <section className="min-w-0 space-y-4">
          {curFolderPath && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <FileImage className="mt-0.5 size-4 shrink-0" />
              <p>
                本地模式下相册内必须存在一个名为{' '}
                <button type="button" className="font-mono font-semibold underline" onClick={() => copy('cover.jpg')}>
                  cover.jpg
                </button>{' '}
                的封面图片。
              </p>
            </div>
          )}

          {curFolderPath && files.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
              <Checkbox
                checked={checkedPaths.size === files.length}
                indeterminate={checkedPaths.size > 0 && checkedPaths.size < files.length}
                onCheckedChange={checked => setCheckedPaths(checked ? new Set(files.map(file => file.filePath)) : new Set())}
              >
                全选
              </Checkbox>
              {checkedPaths.size > 0 && (
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive" size="small" icon={<Trash2 className="size-4" />} loading={loading}>
                      删除 {checkedPaths.size} 项
                    </Button>
                  }
                  title="删除选中的图片？"
                  description="所选图片将从相册目录中永久删除。"
                  confirmLabel="删除"
                  variant="destructive"
                  onConfirm={removeFiles}
                />
              )}
            </div>
          )}

          {loading && curFolderPath && !files.length ? (
            <PageLoading label="正在加载相册图片..." />
          ) : curFolderPath && files.length ? (
            <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4', loading && 'pointer-events-none opacity-60')}>
              {files.map(file => {
                const selected = checkedPaths.has(file.filePath)
                const publicUrl = toPublicUrl(file.url)
                return (
                  <article
                    key={file.filePath}
                    className={cn(
                      'group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                      selected && 'border-primary ring-2 ring-primary/15'
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleFile(file.filePath)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') toggleFile(file.filePath)
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted" onClick={event => event.stopPropagation()}>
                      <Image
                        src={file.url}
                        alt={file.filename}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {file.filename === 'cover.jpg' && (
                        <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
                          封面
                        </span>
                      )}
                      <Checkbox
                        className="absolute right-2 top-2 rounded bg-background/85 p-1"
                        checked={selected}
                        onCheckedChange={checked => setFileChecked(file.filePath, checked)}
                      />
                    </div>
                    <div className="p-3">
                      <h2 className="truncate text-sm font-medium" title={file.filename}>
                        {file.filename}
                      </h2>
                      <button
                        type="button"
                        className="mt-1 flex max-w-full items-center gap-1 text-left text-xs text-muted-foreground hover:text-primary"
                        title={publicUrl}
                        onClick={event => {
                          event.stopPropagation()
                          copy(publicUrl)
                        }}
                      >
                        <Copy className="size-3 shrink-0" />
                        <span className="truncate">{publicUrl}</span>
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
              {curFolderPath ? <FileImage className="size-10 opacity-40" /> : <FolderOpen className="size-10 opacity-40" />}
              <p>{curFolderPath ? '当前相册还没有图片' : '先选择相册目录'}</p>
            </div>
          )}

          {curFolderPath && pageTotal > 0 && (
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={pageTotal}
              pageSizeOptions={[12, 24, 48, 96]}
              showQuickJumper
              showSizeChanger
              onChange={onPageChange}
            />
          )}
        </section>
      </div>

      <Sheet title="相册目录" side="left" width={288} open={sheetOpen} onClose={() => setSheetOpen(false)} bodyClassName="p-0">
        {renderFolderList()}
      </Sheet>

      <Dialog
        title="重命名相册"
        open={renameDialogOpen}
        onSubmit={modifyFolderName}
        onCancel={() => setRenameDialogOpen(false)}
        width={420}
        confirmLabel="保存"
      >
        <Input
          autoFocus
          value={renameName}
          placeholder="输入相册名称"
          onChange={event => setRenameName(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') modifyFolderName()
          }}
        />
      </Dialog>

      <Dialog
        title="编辑相册配置"
        open={isDialogOpen}
        onSubmit={throttledSave}
        onCancel={() => setIsDialogOpen(false)}
        width={currentMode === 'external' ? 800 : 640}
        confirmLabel="保存"
        closeOnOutside={false}
      >
        <Form form={form}>
          <div className="grid gap-x-4 md:grid-cols-12">
            <FormField name="mode" label="模式" className="md:col-span-4">
              <Select
                options={[
                  { value: '', label: '本地模式' },
                  { value: 'external', label: '外链模式' }
                ]}
              />
            </FormField>
            <FormField name="hidden" label="隐藏相册" valueKey="checked" className="md:col-span-3">
              <Switch checkedChildren="隐藏" unCheckedChildren="显示" />
            </FormField>
            <FormField name="title" label="相册标题" className="md:col-span-5">
              <Input placeholder="输入相册标题" />
            </FormField>
          </div>
          <FormField name="description" label="相册描述">
            <Textarea placeholder="输入相册描述" rows={3} showCount />
          </FormField>
          <div className="grid gap-x-4 md:grid-cols-2">
            <FormField name="date" label="创建日期">
              <DatePicker />
            </FormField>
            <FormField name="location" label="拍摄地点">
              <Input placeholder="输入拍摄地点" />
            </FormField>
            <FormField name="tags" label="标签">
              <Select mode="tags" placeholder="输入标签" tokenSeparators={[',', ';', '，', '；']} />
            </FormField>
            <div className="grid grid-cols-2 gap-x-4">
              <FormField name="layout" label="布局方式">
                <Select
                  options={[
                    { value: 'grid', label: '网格布局' },
                    { value: 'masonry', label: '瀑布流布局' }
                  ]}
                />
              </FormField>
              <FormField name="columns" label="列数">
                <Select options={[1, 2, 3, 4].map(value => ({ value, label: `${value} 列` }))} />
              </FormField>
            </div>
          </div>

          {currentMode === 'external' && (
            <>
              <FormField name="cover" label="封面图片链接" rules={[{ required: true }]}>
                <Input placeholder="输入封面图片 URL" />
              </FormField>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-medium">相册图片列表</div>
              </div>
              <FormList name="photos">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map(({ key, name }, index) => (
                      <FormField key={key} unstyled observe>
                        {({ getValue }) => {
                          const src = getValue(['photos', name, 'src'])
                          const alt = getValue(['photos', name, 'alt'])
                          return (
                            <div className="rounded-xl border bg-muted/20 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-medium">图片 {index + 1}</span>
                                {fields.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    className="size-8 px-0 text-destructive hover:bg-destructive/10"
                                    aria-label="删除图片"
                                    onClick={() => remove(name)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                )}
                              </div>
                              <div className={cn('grid gap-3', src && 'sm:grid-cols-[1fr_9rem]')}>
                                <div>
                                  <FormField name={[name, 'src']} label="图片链接" rules={[{ required: index > 0 }]}>
                                    <Input placeholder="输入图片 URL" />
                                  </FormField>
                                  <FormField name={[name, 'alt']} label="图片描述" className="mb-0">
                                    <Input placeholder="输入图片描述" />
                                  </FormField>
                                </div>
                                {src && <Image src={src} alt={alt || '图片预览'} className="h-32 w-full rounded-lg border object-cover" />}
                              </div>
                            </div>
                          )
                        }}
                      </FormField>
                    ))}
                    <Button variant="outline" block className="border-dashed" onClick={() => add({ src: '', alt: '' })}>
                      添加图片
                    </Button>
                  </div>
                )}
              </FormList>
            </>
          )}
        </Form>
      </Dialog>
    </Page>
  )
}
