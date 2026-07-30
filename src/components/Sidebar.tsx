/**
 * Sidebar – Desktop (collapsible) + Mobile (vaul bottom drawer)
 * Fully translated via react-i18next
 * RTL-aware via Tailwind logical properties
 */
import { Drawer } from 'vaul'
import { useTranslation } from 'react-i18next'
import {
  Plane, Hotel, FileText, CreditCard,
  LayoutDashboard, ChevronRight, LogOut,
  Menu, X
} from 'lucide-react'

// NAV_ITEMS – icons are static, labels translated in render
export const NAV_IDS = ['dashboard', 'flights', 'hotels', 'visa', 'payments'] as const
export type NavId = typeof NAV_IDS[number]

const NAV_ICONS: Record<NavId, React.ElementType> = {
  dashboard: LayoutDashboard,
  flights:   Plane,
  hotels:    Hotel,
  visa:      FileText,
  payments:  CreditCard,
}

interface SidebarProps {
  activeTab: NavId | string
  onTabChange: (id: string) => void
  email: string
  onSignOut: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

// ── Shared NavItem ────────────────────────────────────────────
function NavItem({
  id, label, icon: Icon, active, collapsed, onClick,
}: {
  id: string; label: string; icon: React.ElementType
  active: boolean; collapsed: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-150
        ${active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-start">{label}</span>
          {active && <ChevronRight className="h-4 w-4 opacity-60 rtl:rotate-180" />}
        </>
      )}
    </button>
  )
}

// ── Desktop Sidebar ───────────────────────────────────────────
export function DesktopSidebar({
  activeTab, onTabChange, email, onSignOut, collapsed, onToggleCollapse,
}: SidebarProps) {
  const { t } = useTranslation()

  return (
    <aside
      className={`
        hidden md:flex flex-col bg-gray-900 text-white shrink-0
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-700 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Plane className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="ms-3 font-semibold text-sm whitespace-nowrap">{t('app.name')}</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="ms-auto p-1.5 rounded-md hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_IDS.map(id => (
          <NavItem
            key={id}
            id={id}
            label={t(`nav.${id}`)}
            icon={NAV_ICONS[id]}
            active={activeTab === id}
            collapsed={collapsed}
            onClick={() => onTabChange(id)}
          />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-700 p-3 shrink-0">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold uppercase select-none">
            {email?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-white">{email}</p>
              <p className="text-xs text-gray-400">{t('app.agent')}</p>
            </div>
          )}
          <button
            onClick={onSignOut}
            title={t('nav.signOut')}
            className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Mobile Bottom Tab Bar ─────────────────────────────────────
export function MobileTabBar({
  activeTab, onTabChange, onOpenDrawer,
}: {
  activeTab: string
  onTabChange: (id: string) => void
  onOpenDrawer: () => void
}) {
  const { t } = useTranslation()
  const visibleIds = NAV_IDS.slice(0, 4)

  return (
    <nav className="md:hidden fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {visibleIds.map(id => {
          const Icon = NAV_ICONS[id]
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg
                transition-colors text-xs font-medium
                ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
              <span>{t(`nav.${id}`)}</span>
            </button>
          )
        })}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg
            text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span>{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  )
}

// ── Mobile Vaul Drawer ────────────────────────────────────────
export function MobileDrawer({
  open, onClose, activeTab, onTabChange, email, onSignOut,
}: {
  open: boolean; onClose: () => void
  activeTab: string; onTabChange: (id: string) => void
  email: string; onSignOut: () => void
}) {
  const { t } = useTranslation()
  const handleNav = (id: string) => { onTabChange(id); onClose() }

  return (
    <Drawer.Root open={open} onOpenChange={v => !v && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 start-0 end-0 z-50 flex flex-col rounded-t-2xl bg-gray-900 text-white max-h-[85vh]">

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-600" />
          </div>

          {/* Header */}
          <div className="flex items-center px-5 py-3 border-b border-gray-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shrink-0">
              <Plane className="h-4 w-4" />
            </div>
            <span className="ms-3 font-semibold">{t('app.name')}</span>
            <button onClick={onClose} className="ms-auto p-1.5 rounded-md hover:bg-gray-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {NAV_IDS.map(id => {
              const Icon = NAV_ICONS[id]
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => handleNav(id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium
                    transition-all
                    ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-start">{t(`nav.${id}`)}</span>
                  {active && <ChevronRight className="h-4 w-4 opacity-60 rtl:rotate-180 shrink-0" />}
                </button>
              )
            })}
          </nav>

          {/* User */}
          <div className="border-t border-gray-700 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold uppercase">
                {email?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{email}</p>
                <p className="text-xs text-gray-400">{t('app.agent')}</p>
              </div>
              <button
                onClick={() => { onSignOut(); onClose() }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-red-600/20 text-gray-400 hover:text-red-400 text-sm transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('nav.signOut')}</span>
              </button>
            </div>
          </div>

          <div className="h-safe-bottom bg-gray-900" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
