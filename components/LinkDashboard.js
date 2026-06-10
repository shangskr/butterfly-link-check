import { useState, useEffect } from 'react'

export default function LinkDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/check_links.json')
      .then(r => {
        if (!r.ok) throw new Error('检测结果尚未生成')
        return r.json()
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="main-content">
        <div className="loading-screen">加载检测结果...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>暂无检测结果</h3>
          <p>请在 GitHub Actions 中运行链接检测后刷新</p>
        </div>
      </main>
    )
  }

  const allLinks = data.flatMap(s => s.link_list || [])
  const accessible = allLinks.filter(l => l.status === '正常')
  const inaccessible = allLinks.filter(l => l.status !== '正常')

  return (
    <main className="main-content">
      <div className="dashboard-header">
        <h3>友链检测概览</h3>
        <div className="stats-row">
          <div className="stat-card ok">
            <span className="stat-num">{accessible.length}</span>
            <span className="stat-label">正常</span>
          </div>
          <div className="stat-card err">
            <span className="stat-num">{inaccessible.length}</span>
            <span className="stat-label">异常</span>
          </div>
          <div className="stat-card total">
            <span className="stat-num">{allLinks.length}</span>
            <span className="stat-label">总计</span>
          </div>
        </div>
      </div>

      <div className="link-sections">
        {data.map((section, i) => (
          <div key={i} className="link-section">
            <div className="section-header">
              <h4>{section.class_name}</h4>
              {section.class_desc && <span className="section-desc">{section.class_desc}</span>}
              <span className="section-count">{section.link_list.length} 个链接</span>
            </div>
            <div className="link-grid">
              {section.link_list.map((item, j) => (
                <a
                  key={j}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`link-card ${item.status === '正常' ? 'status-ok' : 'status-err'}`}
                >
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="link-avatar"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23e2e8f0" width="64" height="64"/><text x="32" y="40" text-anchor="middle" fill="%23999" font-size="24">?</text></svg>' }}
                  />
                  <div className="link-info">
                    <span className="link-name">{item.name}</span>
                    <span className="link-desc">{item.descr}</span>
                  </div>
                  <span className={`link-status-badge ${item.status === '正常' ? 'badge-ok' : 'badge-err'}`}>
                    {item.status}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
