import { NavLink } from 'react-router-dom'
import { managerList } from '../configs/manager-config'
import { cn } from '../lib/utils'

interface Props {
  onNavigate?: () => void
  showBrand?: boolean
}

export default function SidebarMenu({ onNavigate, showBrand = true }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {showBrand && (
        <NavLink to="/index" className="flex h-20 shrink-0 items-center gap-3 border-b px-5" onClick={onNavigate}>
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">M</span>
          <span className="min-w-0">
            <span className="block truncate font-semibold tracking-tight">Mizuki Manager</span>
            <span className="block text-xs text-muted-foreground">博客内容管理</span>
          </span>
        </NavLink>
      )}

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3" aria-label="功能导航">
        {managerList.map(({ title, subtitle, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary'
              )
            }
          >
            <Icon className="size-4.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{title}</span>
            <span className="text-[11px] text-muted-foreground group-hover:text-current group-hover:opacity-70">{subtitle}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
