import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { useAuth } from './AuthProvider'
import ConfirmModal from './ConfirmModal'

const VIEWS = [
  { key: 'editor', label: '文件编辑' },
  { key: 'sort', label: '可视化排序' },
  { key: 'dashboard', label: '检测状态' },
]

export default function DashboardLayout({ children }) {
  const [activeView, setActiveView] = useState('editor')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const { dark, toggle } = useTheme()
  const { logout } = useAuth()

  const toggleSidebar = () => setSidebarOpen(prev => !prev)

  const handleViewChange = useCallback((key) => {
    setActiveView(key)
  }, [])

  return (
    <div className={`dashboard ${dark ? 'dark' : ''}`}>
      <header className="topbar">
        <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
        <Link href="/" className="topbar-brand">友链管理</Link>
        <div className="topbar-actions">
          <nav className="view-tabs">
            {VIEWS.map(v => (
              <button
                key={v.key}
                className={`view-tab ${activeView === v.key ? 'active' : ''}`}
                onClick={() => handleViewChange(v.key)}
              >
                {v.label}
              </button>
            ))}
          </nav>

          <select
            className="view-select"
            value={activeView}
            onChange={e => handleViewChange(e.target.value)}
          >
            {VIEWS.map(v => (
              <option key={v.key} value={v.key}>{v.label}</option>
            ))}
          </select>

          <button onClick={toggle} className="icon-btn" aria-label="切换主题">
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setShowLogout(true)} className="logout-btn" title="退出登录">
            退出
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        {children({ activeView, sidebarOpen, toggleSidebar })}
      </div>

      <ConfirmModal
        open={showLogout}
        title="退出登录"
        message="确定要退出管理后台吗？"
        confirmText="退出"
        cancelText="取消"
        onConfirm={() => { setShowLogout(false); logout() }}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  )
}
