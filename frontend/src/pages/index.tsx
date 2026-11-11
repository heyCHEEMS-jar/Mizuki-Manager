import { useEffect, useState } from 'react'
import { LogOut, MonitorCog, Palette } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
    <dd className="mt-1 truncate text-sm font-semibold" title={typeof value === 'string' ? value : undefined}>
      {value}
    </dd>
  </div>
)

export default function Index() {
  const { t } = useTranslation()
  const [color, setColor] = useState(() => localStorage.getItem('color_rgb') || defaultTheme)
  const [systemInfo, setSystemInfo] = useState<SystemInfo>()

  useEffect(() => {
    let active = true
    const loadSystemInfo = async () => {
      try {
        const res = await getSystemInfo()
        if (active) setSystemInfo(res.data)
      } catch {}
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
        { label: t('dashboard.hostname'), value: systemInfo.hostname || '-' },
        { label: t('dashboard.platform'), value: systemInfo.platform || '-' },
        { label: t('dashboard.architecture'), value: systemInfo.arch || '-' },
        { label: t('dashboard.release'), value: `${systemInfo.type ?? ''} ${systemInfo.release ?? ''}`.trim() || '-' },
        { label: t('dashboard.cpu'), value: systemInfo.cpus?.length ?? '-' },
        { label: t('dashboard.totalMemory'), value: formatBytes(systemInfo.totalMemory) },
        { label: t('dashboard.freeMemory'), value: formatBytes(systemInfo.freeMemory) },
        { label: t('dashboard.uptime'), value: formatUptime(systemInfo.uptime) },
        { label: t('dashboard.load'), value: systemInfo.loadAvg?.map(value => value.toFixed(2)).join(' / ') || '-' }
      ]
    : []

  return (
    <Page>
      <PageHeader
        eyebrow="Dashboard"
        title="Mizuki Manager"
        description={t('dashboard.description')}
        actions={
          <>
            <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1.5" role="group" aria-label={t('dashboard.theme')}>
              <Palette className="mx-1 size-4 text-muted-foreground" />
              <div className="hidden items-center gap-1 sm:flex">
                {themeColors.map(theme => (
                  <button
                    key={theme}
                    type="button"
                    className={cn(
                      'size-5 rounded-full border-2 border-background shadow-sm ring-offset-1 transition-transform hover:scale-110',
                      color === theme && 'ring-2 ring-foreground/50'
                    )}
                    style={{ backgroundColor: theme }}
                    title={t('dashboard.switchTheme', { theme })}
                    onClick={() => updateColor(theme)}
                  />
                ))}
              </div>
              <ColorPicker value={color} onChange={updateColor} aria-label={t('dashboard.customTheme')} title={t('dashboard.customTheme')} />
            </div>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10" icon={<LogOut className="size-4" />}>
                  {t('dashboard.logout')}
                </Button>
              }
              title={t('dashboard.logoutTitle')}
              description={t('dashboard.logoutDescription')}
              confirmLabel={t('dashboard.exit')}
              variant="destructive"
              onConfirm={redirectToLogin}
            />
          </>
        }
      />

      <section aria-labelledby="manager-title">
        <div className="mb-4">
          <h2 id="manager-title" className="text-lg font-semibold">
            {t('dashboard.features')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.featureDescription')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {managerList
            .filter(item => !item.hideFromHome)
            .map(({ titleKey, subtitleKey, icon: Icon, path }) => (
              <Link
                key={path}
                to={path}
                className="group flex min-h-32 flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="mt-4 min-w-0">
                  <span className="block truncate text-sm font-semibold">{t(titleKey)}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{t(subtitleKey)}</span>
                </span>
              </Link>
            ))}
        </div>
      </section>

      <PageSection
        title={
          <span className="flex items-center gap-2">
            <MonitorCog className="size-4 text-primary" />
            {t('dashboard.server')}
          </span>
        }
        description={t('dashboard.serverDescription')}
        bodyClassName="p-4 sm:p-5"
      >
        {systemInfo ? (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map(metric => (
              <SystemMetric key={metric.label} {...metric} />
            ))}
          </dl>
        ) : (
          <PageLoading label={t('dashboard.loadingServer')} />
        )}
      </PageSection>
    </Page>
  )
}
