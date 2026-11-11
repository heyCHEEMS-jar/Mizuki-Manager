import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Routes, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SidebarMenu from './components/SidebarMenu'
import { Button, Dialog, Sheet } from './components/ui'
import { managerList } from './configs/manager-config'
import { usePolling } from './hooks/usePolling'
import { createRoute } from './routes/create-route'
import routes, { routePaths } from './routes/routes'
import { checkSession } from './services/auth'
import { refreshToken, SESSION_CONFLICT_EVENT } from './utils/request'
import { redirectToLogin } from './utils/util'

const isDashboardPath = (path: string) => routePaths.some(routePath => routePath === path || path.startsWith(`${routePath}/`))

export default function App() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(288)
  const [sessionError, setSessionError] = useState('')
  const { pathname } = useLocation()
  const showDashboard = isDashboardPath(pathname)
  const currentPage = managerList.find(item => item.path === pathname || pathname.startsWith(`${item.path}/`))

  const sessionPolling = usePolling(
    () => {
      checkSession().catch(err => {
        if (err.code === 403) {
          setSessionError(t('app.sessionExpired'))
        } else if (err.code === 601) {
          sessionPolling.stop()
        }
      })
    },
    15000,
    { immediate: true }
  )

  useEffect(() => {
    const handleSessionConflict = () => {
      setSessionError(t('app.sessionExpired'))
    }
    window.addEventListener(SESSION_CONFLICT_EVENT, handleSessionConflict)
    return () => window.removeEventListener(SESSION_CONFLICT_EVENT, handleSessionConflict)
  }, [t])

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) refreshToken()
  }, [])

  useEffect(() => {
    if (showDashboard) sessionPolling.start()
    else sessionPolling.stop()
  }, [showDashboard])

  const routeContent = <Routes>{createRoute(routes)}</Routes>
  if (!showDashboard) return <div className="min-h-screen">{routeContent}</div>

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-[1600px] bg-background shadow-sm">
        <aside className="sticky top-0 hidden h-screen shrink-0 border-r bg-card md:block" style={{ width: sidebarWidth }}>
          <SidebarMenu />
          <div
            className="absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize hover:bg-primary/40"
            onPointerDown={event => {
              event.preventDefault()
              const startX = event.clientX
              const startWidth = sidebarWidth
              const resize = (moveEvent: PointerEvent) => setSidebarWidth(Math.min(384, Math.max(224, startWidth + moveEvent.clientX - startX)))
              const stop = () => {
                window.removeEventListener('pointermove', resize)
                window.removeEventListener('pointerup', stop)
              }
              window.addEventListener('pointermove', resize)
              window.addEventListener('pointerup', stop)
            }}
          />
        </aside>

        <div className="min-w-0 flex-1 bg-muted/20">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur md:hidden">
            <Button variant="ghost" size="small" className="size-9 px-0" aria-label={t('app.openNavigation')} onClick={() => setMenuOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{currentPage ? t(currentPage.titleKey) : 'Mizuki Manager'}</div>
              <div className="truncate text-[11px] text-muted-foreground">{currentPage ? t(currentPage.subtitleKey) : t('app.blogManager')}</div>
            </div>
          </header>
          <main className="min-h-[calc(100vh-3.5rem)] min-w-0 md:min-h-screen">{routeContent}</main>
        </div>
      </div>

      <Dialog
        title={t('app.sessionConflict')}
        open={Boolean(sessionError)}
        confirmLabel={t('common.confirm')}
        dismissLabel={t('common.close')}
        closeOnOutside={false}
        onSubmit={redirectToLogin}
        onCancel={() => {
          sessionPolling.stop()
          setSessionError('')
        }}
        width={420}
      >
        <p className="text-sm text-muted-foreground">{sessionError}</p>
      </Dialog>

      <Sheet title={t('app.navigation')} side="left" open={menuOpen} onClose={() => setMenuOpen(false)} width={288} bodyClassName="p-0">
        <SidebarMenu showBrand={false} onNavigate={() => setMenuOpen(false)} />
      </Sheet>
    </div>
  )
}
