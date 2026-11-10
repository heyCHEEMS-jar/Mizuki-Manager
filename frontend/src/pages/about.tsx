import { useCallback, useEffect, useMemo, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { FileUp, Info, LoaderCircle, RefreshCw, Save } from 'lucide-react'
import { Page, PageHeader, PageSection } from '../components/Page'
import { Button, ConfirmDialog, Upload } from '../components/ui'
import { useAboutContentDB } from '../hooks/useAboutContentDB'
import { notify } from '../lib/notify'
import { getAboutContent, replaceAboutFile, updateAboutContent } from '../services/about'
import { debounce, throttle } from '../utils/util'

export default function About() {
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
		db.getCache().then((draft) => {
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
				notify.success('保存成功')
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
				notify.success('替换成功')
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
				title="关于页面"
				description="编辑网站关于页面使用的 Markdown 文档。输入内容会自动保存为本地草稿。"
				actions={
					<>
						<Upload beforeUpload={handleReplace} accept=".md" disabled={loading}>
							<Button icon={<FileUp className="size-4" />} disabled={loading}>上传文档</Button>
						</Upload>
						{showReload && (
							<ConfirmDialog
								trigger={<Button icon={<RefreshCw className="size-4" />} disabled={loading}>重载内容</Button>}
								title="放弃当前草稿？"
								description="当前本地草稿将被服务器上的文档替换。"
								onConfirm={reloadContent}
							/>
						)}
						<Button variant="default" icon={<Save className="size-4" />} loading={loading} onClick={throttledUpdate}>保存</Button>
					</>
				}
			/>

			<PageSection
				title={<span className="flex items-center gap-2"><Info className="size-4 text-primary" />Markdown 文档</span>}
				description={showReload ? '本地草稿尚未同步到服务器' : '当前内容已与服务器同步'}
				bodyClassName="relative p-0"
			>
				<MDEditor
					value={content}
					onChange={(value) => {
						const nextContent = value ?? ''
						setContent(nextContent)
						debouncedSaveDraft(nextContent)
					}}
					preview="live"
					visibleDragbar
					placeholder="输入关于内容"
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
