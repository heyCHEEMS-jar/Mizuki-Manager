import { useEffect, useState } from 'react'
import { LogOut, MonitorCog, Palette } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Page, PageHeader, PageLoading, PageSection } from '../components/Page'
import { Button, ColorPicker, ConfirmDialog } from '../components/ui'
import { managerList } from '../configs/manager-config'
import { defaultTheme, themes } from '../configs/style-config'
import { cn } from '../lib/utils'
import { applyThemeColor } from '../lib/theme'
import { getSystemInfo } from '../services/system'
import { formatBytes, formatUptime, redirectToLogin } from '../utils/util'

interface SystemInfo {
	hostname?: string
	platform?: string
	arch?: string
	type?: string
	release?: string
	cpus?: unknown[]
	totalMemory?: number
	freeMemory?: number
	uptime?: number
	loadAvg?: number[]
}

const themeColors = [defaultTheme, ...themes]

const SystemMetric = ({ label, value }: { label: string; value: React.ReactNode }) => (
	<div className="min-w-0 rounded-lg border bg-muted/25 px-4 py-3">
		<dt className="text-xs font-medium text-muted-foreground">{label}</dt>
		<dd className="mt-1 truncate text-sm font-semibold" title={typeof value === 'string' ? value : undefined}>{value}</dd>
	</div>
)

export default function Index() {
	const [color, setColor] = useState(() => localStorage.getItem('color_rgb') || defaultTheme)
	const [systemInfo, setSystemInfo] = useState<SystemInfo>()

	useEffect(() => {
		let active = true
		const loadSystemInfo = async () => {
			try {
				const res = await getSystemInfo()
				if (active) setSystemInfo(res.data)
			} catch {
			}
		}

		loadSystemInfo()
		const timer = window.setInterval(loadSystemInfo, 30000)
		return () => {
			active = false
			window.clearInterval(timer)
		}
	}, [])

	const updateColor = (nextColor: string) => {
		setColor(nextColor)
		localStorage.setItem('color_rgb', nextColor)
		applyThemeColor(nextColor)
	}

	const metrics = systemInfo
		? [
				{ label: '主机名', value: systemInfo.hostname || '-' },
				{ label: '平台', value: systemInfo.platform || '-' },
				{ label: '架构', value: systemInfo.arch || '-' },
				{ label: '系统版本', value: `${systemInfo.type ?? ''} ${systemInfo.release ?? ''}`.trim() || '-' },
				{ label: 'CPU 核心数', value: systemInfo.cpus?.length ?? '-' },
				{ label: '总内存', value: formatBytes(systemInfo.totalMemory) },
				{ label: '空闲内存', value: formatBytes(systemInfo.freeMemory) },
				{ label: '运行时间', value: formatUptime(systemInfo.uptime) },
				{ label: '系统负载', value: systemInfo.loadAvg?.map((value) => value.toFixed(2)).join(' / ') || '-' }
			]
		: []

	return (
		<Page>
			<PageHeader
				eyebrow="Dashboard"
				title="Mizuki Manager"
				description="管理博客内容、媒体资源、构建任务与站点配置。"
				actions={
					<>
						<div className="flex items-center gap-1.5 rounded-lg border bg-card p-1.5" role="group" aria-label="主题颜色">
							<Palette className="mx-1 size-4 text-muted-foreground" />
							<div className="hidden items-center gap-1 sm:flex">
								{themeColors.map((theme) => (
									<button
										key={theme}
										type="button"
										className={cn('size-5 rounded-full border-2 border-background shadow-sm ring-offset-1 transition-transform hover:scale-110', color === theme && 'ring-2 ring-foreground/50')}
										style={{ backgroundColor: theme }}
										title={`切换主题色 ${theme}`}
										onClick={() => updateColor(theme)}
									/>
								))}
							</div>
							<ColorPicker value={color} onChange={updateColor} aria-label="自定义主题颜色" title="自定义主题颜色" />
						</div>
						<ConfirmDialog
							trigger={<Button variant="ghost" className="text-destructive hover:bg-destructive/10" icon={<LogOut className="size-4" />}>退出登录</Button>}
							title="退出登录？"
							description="当前设备上的登录状态将被清除。"
							confirmLabel="退出"
							variant="destructive"
							onConfirm={redirectToLogin}
						/>
					</>
				}
			/>

			<section aria-labelledby="manager-title">
				<div className="mb-4">
					<h2 id="manager-title" className="text-lg font-semibold">管理功能</h2>
					<p className="mt-1 text-sm text-muted-foreground">选择需要维护的内容模块。</p>
				</div>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{managerList.filter((item) => !item.hideFromHome).map(({ title, subtitle, icon: Icon, path }) => (
						<Link
							key={path}
							to={path}
							className="group flex min-h-32 flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
								<Icon className="size-5" aria-hidden="true" />
							</span>
							<span className="mt-4 min-w-0">
								<span className="block truncate text-sm font-semibold">{title}</span>
								<span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
							</span>
						</Link>
					))}
				</div>
			</section>

			<PageSection
				title={<span className="flex items-center gap-2"><MonitorCog className="size-4 text-primary" />服务器状态</span>}
				description="系统信息每 30 秒自动更新。"
				bodyClassName="p-4 sm:p-5"
			>
				{systemInfo ? (
					<dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{metrics.map((metric) => <SystemMetric key={metric.label} {...metric} />)}
					</dl>
				) : (
					<PageLoading label="正在获取服务器信息..." />
				)}
			</PageSection>
		</Page>
	)
}
