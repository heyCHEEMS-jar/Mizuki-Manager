import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { CircleAlert, CircleStop, Rocket, Trash2, X } from 'lucide-react'
import { Page, PageHeader, PageSection } from '../components/Page'
import { Button, ConfirmDialog } from '../components/ui'
import { notify } from '../lib/notify'
import { deployProjectSSE, stopDeployProcess, syncDeployStatus } from '../services/builder'
import { useBuilderLogDB } from '../hooks/useBuilderLogDB'
import type { AnsiLogChunk, AnsiLogWorkerResponse, AnsiLogWorkerRequest } from '../utils/ansi-log'

export default function Builder() {
	const logDB = useBuilderLogDB()
	const [loading, setLoading] = useState(false)
	const [hasLog, setHasLog] = useState(false)
	const [showNotice, setShowNotice] = useState(true)
	const logContainerRef = useRef<HTMLDivElement>(null)
	const logEndRef = useRef<HTMLDivElement>(null)
	const chunkElementsRef = useRef(new Map<number, HTMLSpanElement>())
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
		workerRef.current?.postMessage({ type: 'append', log } satisfies AnsiLogWorkerRequest)
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
			workerRef.current?.postMessage({ type: 'replace', log } satisfies AnsiLogWorkerRequest)
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
				if (data?.message) appendLog(data.message)
				setLoading(false)
			},
			onError: (err: any) => {
				appendLog(err?.message || `\n[Error] ${err}\n`)
				setLoading(false)
				console.error(err)
			}
		}),
		[appendLog, replaceLog]
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
		if (res) notify.success('已清空日志缓存')
		else notify.error('清空失败')
	}

	// 取消部署
	const cancelDeploy = async () => {
		try {
			setLoading(true)
			ctrlRef.current?.abort()
			const res = await stopDeployProcess()
			if (res.success) {
				notify.success('已停止部署')
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

		const createChunkElement = (chunk: AnsiLogChunk) => {
			const element = document.createElement('span')
			element.innerHTML = chunk.html
			chunkElementsRef.current.set(chunk.id, element)
			return element
		}

		worker.onmessage = ({ data }: MessageEvent<AnsiLogWorkerResponse>) => {
			const container = logContainerRef.current
			if (!container) return

			if (data.type === 'replace') {
				const fragment = document.createDocumentFragment()
				chunkElementsRef.current.clear()
				data.chunks.forEach((chunk) => fragment.append(createChunkElement(chunk)))
				container.replaceChildren(fragment)
				setHasLog(data.chunks.length > 0)
				if (data.chunks.length) scheduleScroll()
				return
			}

			data.chunks.forEach((chunk) => {
				const element = chunkElementsRef.current.get(chunk.id)
				if (element) element.innerHTML = chunk.html
				else container.append(createChunkElement(chunk))
			})
			if (data.chunks.length) {
				setHasLog(true)
				scheduleScroll()
			}
		}

		void logDB
			.getCache()
			.catch((err) => {
				console.error('读取构建日志缓存失败', err)
				return ''
			})
			.then((savedLog) => {
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
			chunkElementsRef.current.clear()
		}
	}, [logDB.getCache, logDB.saveCache, replaceLog, scheduleScroll, sseCallback])

	return (
		<Page className="flex min-h-screen flex-col">
			<PageHeader
				eyebrow="Deployment"
				title="构建部署"
				description="构建项目并将最新资源同步到生产环境。"
				actions={
					<>
						{hasLog && (
							<ConfirmDialog
								trigger={<Button icon={<Trash2 className="size-4" />} disabled={loading}>清空日志</Button>}
								title="清空构建日志？"
								description="本地保存的构建日志将被永久清除。"
								variant="destructive"
								onConfirm={clearLogCache}
							/>
						)}
						<ConfirmDialog
							trigger={<Button variant="destructive" icon={<CircleStop className="size-4" />}>终止进程</Button>}
							title="终止部署进程？"
							description="如遇执行异常，可终止当前进程后重新部署。"
							confirmLabel="终止"
							variant="destructive"
							onConfirm={cancelDeploy}
						/>
						<ConfirmDialog
							trigger={<Button variant="default" icon={<Rocket className="size-4" />} loading={loading}>一键部署</Button>}
							title="开始部署？"
							description="项目将重新构建并同步资源，通常需要几十秒。"
							confirmLabel="开始部署"
							onConfirm={handleDeploy}
						/>
					</>
				}
			/>

			{showNotice && (
				<div className="relative flex gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 pr-10 text-sm text-blue-900">
					<CircleAlert className="mt-0.5 size-4 shrink-0" />
					<p>构建并同步资源时，请勿刷新或切换页面，以免丢失实时日志。</p>
					<button type="button" className="absolute right-3 top-2.5 rounded p-0.5 opacity-60 hover:opacity-100" aria-label="关闭提示" onClick={() => setShowNotice(false)}>
						<X className="size-4" />
					</button>
				</div>
			)}

			<PageSection
				title="构建日志"
				description={loading ? '部署正在执行，日志将实时更新' : hasLog ? '最近一次构建的输出记录' : '尚未执行构建任务'}
				className="flex min-h-0 flex-1 flex-col"
				bodyClassName="min-h-0 flex-1 p-0"
			>
				<div className="h-[calc(100vh-20rem)] min-h-96 overflow-y-auto bg-zinc-950" hidden={!hasLog}>
					<div ref={logContainerRef} className="min-h-full whitespace-pre-wrap break-all p-5 font-mono text-sm leading-6 text-zinc-300" />
					<div ref={logEndRef} />
				</div>
				{!hasLog && (
					<div className="flex min-h-96 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
						<span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><Rocket className="size-6" /></span>
						<div>
							<p className="font-medium text-foreground">暂无构建日志</p>
							<p className="mt-1">点击“一键部署”开始构建。</p>
						</div>
					</div>
				)}
			</PageSection>
		</Page>
	)
}
