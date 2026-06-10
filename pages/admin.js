import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import LoginForm from '../components/LoginForm'
import DashboardLayout from '../components/DashboardLayout'
import Sidebar from '../components/Sidebar'
import FileEditor from '../components/FileEditor'
import LinkSorter from '../components/LinkSorter'
import LinkDashboard from '../components/LinkDashboard'
import { AVAILABLE_FILES } from '../lib/github'

function getToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('auth_token')
}

async function apiFetch(url, options = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 401) {
    sessionStorage.removeItem('auth_token')
    window.location.reload()
    throw new Error('未授权')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export default function Admin() {
  const { isAuthenticated, loading, login } = useAuth()
  const [fileContent, setFileContent] = useState('')
  const [fileSha, setFileSha] = useState('')
  const [activeFile, setActiveFile] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)

  const loadFile = useCallback(async (fileName) => {
    setFileLoading(true)
    setActiveFile(fileName)
    try {
      const data = await apiFetch(`/api/file?name=${fileName}`)
      setFileContent(data.content)
      setFileSha(data.sha)
    } catch (err) {
      setFileContent('')
      setFileSha('')
      alert('加载失败: ' + err.message)
    } finally {
      setFileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && !activeFile) {
      loadFile('link.yml')
    }
  }, [isAuthenticated, activeFile, loadFile])

  const handleFileSelect = useCallback((fileName, content, sha) => {
    setActiveFile(fileName)
    setFileContent(content)
    setFileSha(sha)
  }, [])

  const handleSave = useCallback(async () => {
    if (!activeFile) return
    setFileLoading(true)
    try {
      const data = await apiFetch(`/api/file?name=${activeFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent, sha: fileSha }),
      })
      setFileSha(data.sha)
    } catch (err) {
      alert('保存失败: ' + err.message)
    } finally {
      setFileLoading(false)
    }
  }, [activeFile, fileContent, fileSha])

  if (loading) {
    return <div className="loading-screen" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return (
    <DashboardLayout>
      {({ activeView, sidebarOpen, toggleSidebar }) => {
        const isLinkYml = activeFile === 'link.yml'
        const showSorter = activeView === 'sort' && isLinkYml

        return (
          <>
            <Sidebar
              files={AVAILABLE_FILES}
              activeFile={activeFile}
              onFileSelect={handleFileSelect}
              isOpen={sidebarOpen}
              onToggle={toggleSidebar}
            />

            {activeView === 'dashboard' ? (
              <LinkDashboard />
            ) : showSorter ? (
              <LinkSorter
                content={fileContent}
                onChange={setFileContent}
                onSave={handleSave}
                isLoading={fileLoading}
              />
            ) : (
              <FileEditor
                fileName={activeFile}
                content={fileContent}
                sha={fileSha}
                isLoading={fileLoading}
                onContentChange={setFileContent}
                onSave={handleSave}
              />
            )}
          </>
        )
      }}
    </DashboardLayout>
  )
}
