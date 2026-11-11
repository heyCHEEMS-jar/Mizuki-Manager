import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import i18n from '../i18n'
import { useTranslation } from 'react-i18next'
import { CircleAlert, CircleStop, Rocket, Trash2, X } from 'lucide-react'
import { Page, PageHeader, PageSection } from '../components/Page'
import { Button, ConfirmDialog } from '../components/ui'
import { notify } from '../lib/notify'
import { deployProjectSSE, stopDeployProcess, syncDeployStatus } from '../services/builder'
import { useBuilderLogDB } from '../hooks/useBuilderLogDB'
import type { LogWorkerResponse } from '../utils/ansi-log.worker'

export default function Builder() {
  const { t } = useTranslation()
  const logDB = useBuilderLogDB()
  const [loading, setLoading] = useState(false)
  const [hasLog, setHasLog] = useState(false)
  const [showNotice, setShowNotice] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)
  const ctrlRef = useRef<AbortController>(new AbortController())
  const workerRef = useRef<Worker | null>(null)
  const pendingLogRef = useRef('')
  const rawLogRef = useRef('')
  const frameRef = useRef<number | null>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const initedRef = useRef(false)

  const scrollToBottom = useCallback(() => {
    logEndRef.current?.scrollIntoView()
  }, [])

  const scheduleScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null
      scrollToBottom()
    })
  }, [scrollToBottom])

  const saveLatestLog = useCallback(() => {
    saveTimerRef.current = null
    void logDB.saveCache(rawLogRef.current)
  }, [logDB.saveCache])

  const scheduleSave = useCallback(() => {
    if (!initedRef.current || saveTimerRef.current !== null) return
    saveTimerRef.current = window.setTimeout(saveLatestLog, 1000)
  }, [saveLatestLog])

  const flushPendingLog = useCallback(() => {
    frameRef.current = null
    const log = pendingLogRef.current
    pendingLogRef.current = ''
    if (!log) return

    rawLogRef.current += log
    workerRef.current?.postMessage({ type: 'append', log })
    scheduleSave()
  }, [scheduleSave])

  const appendLog = useCallback(
    (log: string) => {
      if (!log) return
      pendingLogRef.current += log
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(flushPendingLog)
    },
    [flushPendingLog]
  )

  const replaceLog = useCallback(
    (log: string, save = true) => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      pendingLogRef.current = ''
      rawLogRef.current = log
      workerRef.current?.postMessage({ type: 'replace', log })
      if (save) scheduleSave()
    },
    [scheduleSave]
  )

  const sseCallback = useMemo(
    () => ({
      onMessage: (data: any) => {
        setLoading(true)
        const newLog = data?.log || ''
        if (data?.isHistory) replaceLog(newLog)
        else appendLog(newLog)
      },
      onDone: (data: any) => {
        if (data?.message) appendLog(data.message === '无运行中的任务' ? t('fields.noRunningTask') : data.message)
        setLoading(false)
      },
      onError: (err: any) => {
        appendLog(err?.message || `\n[Error] ${err}\n`)
        setLoading(false)
        console.error(err)
      }
    }),
    [appendLog, replaceLog, t]
  )

  // 启动部署
  const handleDeploy = () => {
    if (loading) return
    ctrlRef.current?.abort()
    deployProjectSSE(sseCallback, ctrlRef)
  }

  // 清除日志数据库
  const clearLogCache = async () => {
    replaceLog('', false)
    const res = await logDB.clearCache()
    if (res) notify.success(i18n.t('notifications.clearLogSuccess'))
    else notify.error(i18n.t('notifications.clearFailed'))
  }

  // 取消部署
  const cancelDeploy = async () => {
    try {
      setLoading(true)
      ctrlRef.current?.abort()
      const res = await stopDeployProcess()
      if (res.success) {
        notify.success(i18n.t('notifications.deployStopped'))
        appendLog('\n[System] 已终止部署子进程\n')
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  // 初始化日志转换线程和服务器状态
  useEffect(() => {
    const worker = new Worker(new URL('../utils/ansi-log.worker.ts', import.meta.url))
    let active = true
    workerRef.current = worker
    initedRef.current = false

    worker.onmessage = ({ data }: MessageEvent<LogWorkerResponse>) => {
      const container = logContainerRef.current
      if (!container) return

      if (data.type === 'replace') container.innerHTML = data.html
      else container.insertAdjacentHTML('beforeend', data.html)

      if (data.type === 'replace') setHasLog(Boolean(data.html))
      else if (data.html) setHasLog(true)
      if (data.html) scheduleScroll()
    }

    void logDB
      .getCache()
      .catch(err => {
        console.error('读取构建日志缓存失败', err)
        return ''
      })
      .then(savedLog => {
        if (!active) return
        replaceLog(savedLog, false)
        initedRef.current = true
        ctrlRef.current?.abort()
        syncDeployStatus(sseCallback, ctrlRef)
      })

    return () => {
      active = false
      ctrlRef.current?.abort()
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current)
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current)
      if (initedRef.current) void logDB.saveCache(rawLogRef.current + pendingLogRef.current)
      worker.terminate()
      workerRef.current = null
    }
  }, [logDB.getCache, logDB.saveCache, replaceLog, scheduleScroll, sseCallback])

  return (
    <Page className="flex min-h-screen flex-col">
      <PageHeader
        eyebrow="Deployment"
        title={t('pages.builder.title')}
        description={t('pages.builder.description')}
        actions={
          <>
            {hasLog && (
              <ConfirmDialog
                trigger={
                  <Button icon={<Trash2 className="size-4" />} disabled={loading}>
                    {t('common.clearLogs')}
                  </Button>
                }
                title={t('fields.clearBuildTitle')}
                description={t('fields.clearBuildDescription')}
                variant="destructive"
                onConfirm={clearLogCache}
              />
            )}
            <ConfirmDialog
              trigger={
                <Button variant="destructive" icon={<CircleStop className="size-4" />}>
                  {t('common.stopProcess')}
                </Button>
              }
              title={t('fields.stopDeployTitle')}
              description={t('fields.stopDeployDescription')}
              confirmLabel={t('common.stop')}
              variant="destructive"
              onConfirm={cancelDeploy}
            />
            <ConfirmDialog
              trigger={
                <Button variant="default" icon={<Rocket className="size-4" />} loading={loading}>
                  {t('common.deploy')}
                </Button>
              }
              title={t('fields.startBuildTitle')}
              description={t('fields.startBuildDescription')}
              confirmLabel={t('common.startDeploy')}
              onConfirm={handleDeploy}
            />
          </>
        }
      />

      {showNotice && (
        <div className="relative flex gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 pr-10 text-sm text-blue-900">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{t('fields.buildNotice')}</p>
          <button
            type="button"
            className="absolute right-3 top-2.5 rounded p-0.5 opacity-60 hover:opacity-100"
            aria-label={t('fields.closeNotice')}
            onClick={() => setShowNotice(false)}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <PageSection
        title={t('fields.buildLog')}
        description={loading ? t('fields.runningLog') : hasLog ? t('fields.latestLog') : t('fields.noBuildTask')}
        className="flex min-h-0 flex-1 flex-col"
        bodyClassName="min-h-0 flex-1 p-0"
      >
        <div className="h-[calc(100vh-20rem)] min-h-96 overflow-y-auto bg-zinc-950" hidden={!hasLog}>
          <div ref={logContainerRef} className="min-h-full whitespace-pre-wrap break-all p-5 font-mono text-sm leading-6 text-zinc-300" />
          <div ref={logEndRef} />
        </div>
        {!hasLog && (
          <div className="flex min-h-96 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Rocket className="size-6" />
            </span>
            <div>
              <p className="font-medium text-foreground">{t('fields.noBuildLog')}</p>
              <p className="mt-1">{t('fields.deployHint')}</p>
            </div>
          </div>
        )}
      </PageSection>
    </Page>
  )
}
