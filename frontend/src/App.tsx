import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Routes, useLocation } from 'react-router-dom'
import SidebarMenu from './components/SidebarMenu'
import { Button, Sheet } from './components/ui'
import { managerList } from './configs/manager-config'
import { usePolling } from './hooks/usePolling'
import { createRoute } from './routes/create-route'
import routes, { routePaths } from './routes/routes'
import { checkSession } from './services/auth'
import { refreshToken } from './utils/request'
import { redirectToLogin } from './utils/util'

const isDashboardPath = (path: string) => routePaths.some((routePath) => routePath === path || path.startsWith(`${routePath}/`))

export default function App() {
	const [menuOpen, setMenuOpen] = useState(false)
	const { pathname } = useLocation()
	const showDashboard = isDashboardPath(pathname)
	const currentPage = managerList.find((item) => item.path === pathname || pathname.startsWith(`${item.path}/`))

	const sessionPolling = usePolling(
		() => {
			checkSession().catch(async (err) => {
				if (err.code === 403) {
					alert(err.message || '当前会话已失效，请重新登录')
					await redirectToLogin()
				} else if (err.code === 601) {
					sessionPolling.stop()
				}
			})
		},
		60000,
		{ immediate: true }
	)

	useEffect(() => {
		const token = localStorage.getItem('token') || sessionStorage.getItem('token')
		if (token) refreshToken()
	}, [])

	useEffect(() => {
		if (showDashboard) sessionPolling.start()
		else sessionPolling.stop()
	}, [pathname])

	const routeContent = <Routes>{createRoute(routes)}</Routes>
	if (!showDashboard) return <div className="min-h-screen">{routeContent}</div>

	return (
		<div className="min-h-screen bg-muted/40">
			<div className="mx-auto flex min-h-screen max-w-[1600px] bg-background shadow-sm">
				<aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-card md:block">
					<SidebarMenu />
				</aside>

				<div className="min-w-0 flex-1 bg-muted/20">
					<header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur md:hidden">
						<Button variant="ghost" size="small" className="size-9 px-0" aria-label="打开功能导航" onClick={() => setMenuOpen(true)}>
							<Menu className="size-5" />
						</Button>
						<div className="min-w-0">
							<div className="truncate text-sm font-semibold">{currentPage?.title || 'Mizuki Manager'}</div>
							<div className="truncate text-[11px] text-muted-foreground">{currentPage?.subtitle || '博客内容管理'}</div>
						</div>
					</header>
					<main className="min-h-[calc(100vh-3.5rem)] min-w-0 md:min-h-screen">{routeContent}</main>
				</div>
			</div>

			<Sheet
				title="功能导航"
				side="left"
				open={menuOpen}
				onClose={() => setMenuOpen(false)}
				width={288}
				bodyClassName="p-0"
			>
				<SidebarMenu showBrand={false} onNavigate={() => setMenuOpen(false)} />
			</Sheet>
		</div>
	)
}
