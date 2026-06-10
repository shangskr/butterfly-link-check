import { useState } from 'react'

export default function Sidebar({ files, activeFile, onFileSelect, onToggle, isOpen }) {
  const [checkedFile, setCheckedFile] = useState(null)

  const handleClick = async (file) => {
    setCheckedFile(file.name)
    try {
      const token = sessionStorage.getItem('auth_token')
      const res = await fetch(`/api/file?name=${file.name}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onFileSelect(file.name, data.content, data.sha)
      if (window.innerWidth <= 768) onToggle()
    } catch (err) {
      alert('加载失败: ' + err.message)
    } finally {
      setCheckedFile(null)
    }
  }

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} onClick={onToggle} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h3>文件列表</h3>
        <ul>
          {files.map(f => (
            <li
              key={f.name}
              className={activeFile === f.name ? 'active' : ''}
              onClick={() => handleClick(f)}
            >
              <span className="file-icon">{f.icon}</span>
              <div className="file-info">
                <span className="file-name">{f.label}</span>
                <span className="file-desc">{f.description}</span>
              </div>
              {checkedFile === f.name && <span className="file-loading" />}
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
