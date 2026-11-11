import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { ArrowLeft, Edit3, ExternalLink, Eye, FilePlus2, FileText, FileUp, LoaderCircle, RefreshCw, Save, Search, Trash2 } from 'lucide-react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader, PageLoading, PageSection } from '../components/Page'
import { Button, ConfirmDialog, Input, Pagination, Upload } from '../components/ui'
import { usePostContentDB } from '../hooks/usePostContentDB'
import { notify } from '../lib/notify'
import { createPost, deletePost, getAllPosts, getPostContent, renamePost, updatePost, uploadPostFile } from '../services/post'
import { debounce, throttle } from '../utils/util'

const today = new Date().toISOString().split('T')[0]
const POST_FRONT_MATTER = [
  '---',
  'title: 标题',
  `published: ${today}`,
  'pinned: 是否置顶(true/false)',
  'description: 介绍',
  'tags: [标签1, 标签2, 标签3...]',
  'category: 分类',
  'licenseName: "CC BY 4.0"',
  'author: 作者',
  'sourceLink: "来源链接"',
  'draft: 是否为草稿(true/false)',
  `date: ${today}`,
  'image: "封面图片链接"',
  '---',
  '',
  '# 未命名文章',
  ''
].join('\n')

function PostList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<string[]>([])
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [pageTotal, setPageTotal] = useState(0)
  const [keyword, setKeyword] = useState('')

  const getPosts = async (num: number, size: number) => {
    try {
      setLoading(true)
      const res = await getAllPosts(num, size)
      if (res.success) {
        setPosts(res.data?.posts || [])
        setPageTotal(res.data?.total || 0)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const removePost = async (filename: string) => {
    try {
      setLoading(true)
      const res = await deletePost(filename)
      if (res.success) {
        notify.success('删除成功')
        const remainTotal = res.data?.total || 0
        const newPageNum = Math.min(Math.max(1, Math.ceil(remainTotal / pageSize)), pageNum)
        setPageNum(newPageNum)
        await getPosts(newPageNum, pageSize)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const uploadPost = async (file: File) => {
    try {
      setLoading(true)
      const res = await uploadPostFile(file)
      if (res.success) {
        notify.success('上传成功')
        await getPosts(pageNum, pageSize)
      }
    } catch {
    } finally {
      setLoading(false)
    }
    return false
  }

  const onPageChange = async (num: number, size: number) => {
    setPageNum(num)
    setPageSize(size)
    await getPosts(num, size)
  }

  useEffect(() => {
    getPosts(1, 12)
  }, [])

  const filteredPosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return normalizedKeyword ? posts.filter(post => post.toLowerCase().includes(normalizedKeyword)) : posts
  }, [posts, keyword])

  return (
    <Page>
      <PageHeader
        eyebrow="Content"
        title="文章管理"
        description="创建、上传和维护博客 Markdown 文章。"
        actions={
          <>
            <Upload beforeUpload={uploadPost} accept=".md" disabled={loading}>
              <Button icon={<FileUp className="size-4" />} disabled={loading}>
                上传文章
              </Button>
            </Upload>
            <Button variant="default" icon={<FilePlus2 className="size-4" />} disabled={loading} onClick={() => navigate('/post/edit/new')}>
              新建文章
            </Button>
          </>
        }
      />

      <PageSection bodyClassName="p-0">
        <div className="border-b p-4">
          <Input
            value={keyword}
            onChange={event => setKeyword(event.target.value)}
            prefix={<Search className="size-4" />}
            placeholder="搜索当前页文章"
            allowClear
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <PageLoading label="正在加载文章..." />
        ) : filteredPosts.length ? (
          <div className="divide-y">
            {filteredPosts.map(filename => (
              <div key={filename} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/35 sm:px-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
                <Link to={`/post/view/${filename}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary hover:underline">
                  {filename.replace('.md', '')}
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="small"
                    className="size-8 px-0"
                    title="编辑"
                    aria-label={`编辑 ${filename}`}
                    onClick={() => navigate(`/post/edit/${filename}`)}
                  >
                    <Edit3 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    className="hidden size-8 px-0 sm:inline-flex"
                    title="查看"
                    aria-label={`查看 ${filename}`}
                    onClick={() => navigate(`/post/view/${filename}`)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="small"
                        className="size-8 px-0 text-destructive hover:bg-destructive/10"
                        title="删除"
                        aria-label={`删除 ${filename}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    }
                    title="删除文章？"
                    description={`“${filename}”删除后无法恢复。`}
                    confirmLabel="删除"
                    variant="destructive"
                    onConfirm={() => removePost(filename)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
            <FileText className="size-10 opacity-40" />
            <p>{keyword ? '当前页没有匹配的文章' : '暂无文章'}</p>
          </div>
        )}

        <div className="border-t px-4 py-5">
          <Pagination
            current={pageNum}
            pageSize={pageSize}
            total={pageTotal}
            pageSizeOptions={[12, 24]}
            showSizeChanger
            showQuickJumper
            showTotal={total => <span className="mr-2 text-xs text-muted-foreground">共 {total} 篇</span>}
            onChange={onPageChange}
          />
        </div>
      </PageSection>
    </Page>
  )
}

interface PostEditorProps {
  isEditing?: boolean
}

function PostEditor({ isEditing = false }: PostEditorProps) {
  const navigate = useNavigate()
  const { filename = 'new' } = useParams()
  const [content, setContent] = useState(POST_FRONT_MATTER)
  const [loading, setLoading] = useState(false)
  const [showReload, setShowReload] = useState(false)
  const db = usePostContentDB()
  const isNewRef = useRef(filename === 'new')
  const cacheKeyRef = useRef(isNewRef.current ? 'new' : filename)
  const filenameRef = useRef(filename)
  const isEditingRef = useRef(isEditing)

  const getContent = useCallback(async () => {
    if (isNewRef.current) return
    try {
      setLoading(true)
      const res = await getPostContent(filenameRef.current)
      if (res.data) setContent(res.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  const restoreDraft = useCallback(async (id: number | string) => {
    await db.saveCache(id, POST_FRONT_MATTER)
  }, [])

  const reloadContent = useCallback(async () => {
    if (isNewRef.current) {
      setContent(POST_FRONT_MATTER)
      await restoreDraft(cacheKeyRef.current)
    } else {
      await getContent()
      await db.clearCache(cacheKeyRef.current)
    }
    setShowReload(false)
  }, [getContent, restoreDraft])

  const updateEditFilename = useCallback(
    (newFilename: string) => {
      navigate(`/post/edit/${newFilename}`, { replace: true })
      isNewRef.current = false
      cacheKeyRef.current = newFilename
      filenameRef.current = newFilename
    },
    [navigate]
  )

  const handleSave = useCallback(async () => {
    if (loading || !isEditingRef.current) return
    try {
      setLoading(true)
      if (isNewRef.current) {
        const title =
          content
            .match(/^#\s+(.+)$/m)?.[1]
            .trim()
            .replace(/[\\/:*?"<>|]/g, '_') || '未命名文章'
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_')
        const res = await createPost(`${title}_${timestamp}.md`, content)
        if (res.success) {
          await restoreDraft('new')
          const createdFilename = res.data?.filename
          if (!createdFilename) throw new Error('未从响应中获取到创建的文件名')
          updateEditFilename(createdFilename)
          notify.success('创建成功')
        }
      } else {
        const res = await updatePost(filenameRef.current, content)
        if (res.success) {
          await db.clearCache(cacheKeyRef.current)
          notify.success('保存成功')
        }
      }
      setShowReload(false)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [content, loading, restoreDraft, updateEditFilename])
  const throttledSave = useMemo(() => throttle(handleSave, 2000, { immediate: true }), [handleSave])

  const saveDraft = useCallback(async (nextContent: string) => {
    if (!isEditingRef.current) return
    await db.saveCache(cacheKeyRef.current, nextContent)
    setShowReload(true)
  }, [])
  const debouncedSaveDraft = useMemo(() => debounce(saveDraft, 500), [saveDraft])

  const handleRename = async () => {
    try {
      setLoading(true)
      const newName = prompt('输入新名称')
      if (newName === null) return
      if (!newName.trim()) {
        notify.warning('新名称不能为空')
        return
      }
      const res = await renamePost(filenameRef.current, newName.trim())
      if (res.success) {
        const renamedFilename = res.data?.filename
        if (!renamedFilename) throw new Error('未从响应中获取到重命名后的新文件名')
        updateEditFilename(renamedFilename)
        notify.success('重命名成功')
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const onChange = (value?: string) => {
    const nextContent = value ?? ''
    setContent(nextContent)
    debouncedSaveDraft(nextContent)
  }

  useEffect(() => {
    db.getCache(cacheKeyRef.current).then(draft => {
      if (!draft) {
        getContent()
        return
      }
      if (isNewRef.current) {
        setContent(draft)
        if (draft !== POST_FRONT_MATTER) setShowReload(true)
      } else if (draft === POST_FRONT_MATTER || !isEditingRef.current) {
        getContent()
      } else {
        setContent(draft)
        setShowReload(true)
      }
    })
  }, [])

  const pageTitle = isNewRef.current ? '新建文章' : `${isEditingRef.current ? '编辑' : '查看'}文章`

  return (
    <Page>
      <PageHeader
        eyebrow="Post"
        title={pageTitle}
        description={isNewRef.current ? '从默认模板开始编写新的 Markdown 文章。' : filenameRef.current.replace('.md', '')}
        actions={
          <>
            <Button icon={<ArrowLeft className="size-4" />} onClick={() => navigate('/post')}>
              返回列表
            </Button>
            {isEditingRef.current && (
              <>
                <a
                  href="https://docs.mizuki.mysqil.com/press/file/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-primary hover:bg-primary/10"
                >
                  编写帮助
                  <ExternalLink className="size-3.5" />
                </a>
                {!isNewRef.current && (
                  <Button disabled={loading} onClick={handleRename}>
                    重命名
                  </Button>
                )}
                {showReload && (
                  <ConfirmDialog
                    trigger={
                      <Button icon={<RefreshCw className="size-4" />} disabled={loading}>
                        {isNewRef.current ? '恢复默认' : '重载内容'}
                      </Button>
                    }
                    title={isNewRef.current ? '恢复默认内容？' : '重载服务器内容？'}
                    description="当前本地草稿将被覆盖。"
                    onConfirm={reloadContent}
                  />
                )}
                <Button variant="default" icon={<Save className="size-4" />} loading={loading} onClick={throttledSave}>
                  保存
                </Button>
              </>
            )}
          </>
        }
      />

      <PageSection
        title="Markdown 文档"
        description={isEditingRef.current && showReload ? '本地草稿尚未同步到服务器' : filenameRef.current}
        bodyClassName="relative p-0"
      >
        <MDEditor
          value={content}
          onChange={onChange}
          preview={isEditingRef.current ? 'live' : 'preview'}
          hideToolbar={!isEditingRef.current}
          visibleDragbar={isEditingRef.current}
          readOnly={!isEditingRef.current}
          placeholder={isEditingRef.current ? POST_FRONT_MATTER : '还没有任何内容哦~'}
          disabled={loading}
          height="calc(100vh - 18rem)"
          minHeight={420}
          className="min-h-[calc(100vh-18rem)] rounded-none! shadow-none!"
        />
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-[1px]">
            <LoaderCircle className="size-7 animate-spin text-primary" />
          </div>
        )}
      </PageSection>
    </Page>
  )
}

export default function Post() {
  return (
    <Routes>
      <Route path="/" element={<PostList />} />
      <Route path="/edit/:filename" element={<PostEditor isEditing />} />
      <Route path="/view/:filename" element={<PostEditor />} />
    </Routes>
  )
}
