import { useCallback, useEffect, useMemo, useState } from 'react'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import MDEditor from '@uiw/react-md-editor'
import { FileUp, Info, LoaderCircle, RefreshCw, Save } from 'lucide-react'
import { Page, PageHeader, PageSection } from '../components/Page'
import { Button, ConfirmDialog, Upload } from '../components/ui'
import { useAboutContentDB } from '../hooks/useAboutContentDB'
import { notify } from '../lib/notify'
import { getAboutContent, replaceAboutFile, updateAboutContent } from '../services/about'
import { debounce, throttle } from '../utils/util'

export default function About() {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReload, setShowReload] = useState(false)
  const db = useAboutContentDB()

  const getContent = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getAboutContent()
      if (res.data) setContent(res.data)
      else throw new Error('未从响应中获取到 About 内容')
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    db.getCache().then(draft => {
      if (draft) {
        setContent(draft)
        setShowReload(true)
      } else {
        getContent()
      }
    })
  }, [])

  const reloadContent = useCallback(async () => {
    await getContent()
    await db.clearCache()
    setShowReload(false)
  }, [getContent])

  const handleUpdate = useCallback(async () => {
    if (loading) return
    try {
      setLoading(true)
      const res = await updateAboutContent(content)
      if (res.success) {
        notify.success(i18n.t('notifications.saveSuccess'))
        await reloadContent()
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [content, loading, reloadContent])
  const throttledUpdate = useMemo(() => throttle(handleUpdate, 2000, { immediate: true }), [handleUpdate])

  const handleReplace = async (file: File) => {
    if (loading) return
    try {
      setLoading(true)
      const res = await replaceAboutFile(file)
      if (res.success) {
        notify.success(i18n.t('notifications.replaceSuccess'))
        await reloadContent()
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = useCallback(async (nextContent: string) => {
    if (!nextContent) return
    await db.saveCache(nextContent)
    setShowReload(true)
  }, [])
  const debouncedSaveDraft = useMemo(() => debounce(saveDraft, 500), [saveDraft])

  return (
    <Page>
      <PageHeader
        eyebrow="Content"
        title={t('pages.about.title')}
        description={t('pages.about.description')}
        actions={
          <>
            <Upload beforeUpload={handleReplace} accept=".md" disabled={loading}>
              <Button icon={<FileUp className="size-4" />} disabled={loading}>
                {t('pages.about.add')}
              </Button>
            </Upload>
            {showReload && (
              <ConfirmDialog
                trigger={
                  <Button icon={<RefreshCw className="size-4" />} disabled={loading}>
                    {t('fields.reloadContent')}
                  </Button>
                }
                title={t('fields.abandonDraftTitle')}
                description={t('fields.abandonDraftDescription')}
                onConfirm={reloadContent}
              />
            )}
            <Button variant="default" icon={<Save className="size-4" />} loading={loading} onClick={throttledUpdate}>
              {t('common.save')}
            </Button>
          </>
        }
      />

      <PageSection
        title={
          <span className="flex items-center gap-2">
            <Info className="size-4 text-primary" />
            {t('fields.markdownDocument')}
          </span>
        }
        description={showReload ? t('fields.draftUnsynced') : t('fields.synced')}
        bodyClassName="relative p-0"
      >
        <MDEditor
          value={content}
          onChange={value => {
            const nextContent = value ?? ''
            setContent(nextContent)
            debouncedSaveDraft(nextContent)
          }}
          preview="live"
          visibleDragbar
          placeholder={t('pages.about.title')}
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
