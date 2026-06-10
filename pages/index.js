import Link from 'next/link'
import { useTheme } from '../components/ThemeProvider'

const features = [
  { icon: '🔗', title: '友链管理', desc: '在线编辑 link.yml，添加、修改、删除友链' },
  { icon: '📊', title: '状态检测', desc: '自动检测每个友链的可访问性，区分正常与异常' },
  { icon: '🔄', title: '拖拽排序', desc: '可视化拖拽调整友链顺序，所见即所得' },
  { icon: '☁️', title: '自动部署', desc: 'GitHub Actions 定时检测 + 提交结果，无需手动干预' },
  { icon: '🎨', title: 'Butterfly 集成', desc: '生成的 JSON 可直接用于 Butterfly 主题友链页' },
  { icon: '🌙', title: '深色模式', desc: '支持明暗主题切换，夜间使用更舒适' },
]

export default function Home() {
  const { dark, toggle } = useTheme()

  return (
    <div className={`landing-page ${dark ? 'dark' : ''}`}>
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="nav-brand">🔗 Butterfly Link Check</div>
          <div className="nav-links">
            <a href="#features">功能</a>
            <a href="#usage">使用</a>
            <button onClick={toggle} className="icon-btn-sm theme-btn" aria-label="切换主题">
              {dark ? '☀️' : '🌙'}
            </button>
            <Link href="/admin" className="nav-btn">管理后台</Link>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Butterfly <span className="highlight">友链检测</span></h1>
          <p className="hero-desc">
            自动检测 Butterfly 主题友链的可访问性，可视化编辑排序，
            一键部署至 Vercel，与 GitHub Actions 深度集成。
          </p>
          <div className="hero-actions">
            <Link href="/admin" className="btn-primary">
              进入管理后台 →
            </Link>
            <a href="https://butterfly.js.org" target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Butterfly 主题
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <h2 className="section-title">核心功能</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="usage" className="usage-section">
        <h2 className="section-title">快速开始</h2>
        <div className="usage-steps">
          <div className="step">
            <span className="step-num">1</span>
            <div>
              <h3>Fork 项目</h3>
              <p>Fork 本项目并在 GitHub 中配置 PAT_TOKEN 和 Actions Secrets</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <div>
              <h3>部署到 Vercel</h3>
              <p>连接 GitHub 仓库，配置 AUTH_USERNAME、AUTH_PASSWORD、GITHUB_TOKEN 等环境变量</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <div>
              <h3>管理友链</h3>
              <p>通过管理后台在线编辑友链数据，拖拽调整顺序，自动保存到 GitHub</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">4</span>
            <div>
              <h3>集成到 Butterfly</h3>
              <p>将生成的 check_links.json 地址填入 Butterfly 友链设置页面</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Butterfly Link Check — 开源友链管理工具</p>
        <div className="footer-links">
          <a href="https://github.com/shangskr/butterfly-link-check" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="footer-sep">·</span>
          <Link href="/admin">管理后台</Link>
        </div>
      </footer>
    </div>
  )
}
