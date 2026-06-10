import { useState, useEffect, useRef, useCallback } from 'react'

export default function FileEditor({ fileName, content, sha, isLoading, onContentChange, onSave }) {
  const contentRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [dirty, setDirty] = useState(false)

  const handleChange = useCallback((e) => {
    onContentChange(e.target.value)
    setDirty(true)
  }, [onContentChange])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    const regex = new RegExp(searchTerm, 'gi')
    const matches = []
    let match
    while ((match = regex.exec(content)) !== null) {
      matches.push(match.index)
    }
    setSearchResults(matches)
    setCurrentMatchIndex(0)
    if (matches.length > 0) scrollToMatch(matches[0])
  }, [searchTerm, content])

  const scrollToMatch = (index) => {
    if (!contentRef.current) return
    const lines = content.substring(0, index).split('\n').length
    const lineHeight = 20
    const visibleLines = Math.floor(contentRef.current.clientHeight / lineHeight)
    contentRef.current.scrollTo({
      top: Math.max(0, (lines - visibleLines / 2) * lineHeight),
      behavior: 'smooth',
    })
  }

  const navigateMatch = (dir) => {
    if (searchResults.length === 0) return
    const next = (currentMatchIndex + dir + searchResults.length) % searchResults.length
    setCurrentMatchIndex(next)
    scrollToMatch(searchResults[next])
  }

  return (
    <main className="main-content">
      <div className="editor-header">
        <div className="editor-title">
          <h3>
            编辑: <code>{fileName}</code>
            {dirty && <span className="unsaved-badge">未保存</span>}
          </h3>
        </div>
        <div className="editor-actions">
          <div className="search-toolbar">
            <input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchResults.length > 0 && (
              <div className="search-nav">
                <button onClick={() => navigateMatch(-1)} disabled={searchResults.length <= 1}>
                  ⬆
                </button>
                <span className="search-count">
                  {currentMatchIndex + 1}/{searchResults.length}
                </span>
                <button onClick={() => navigateMatch(1)} disabled={searchResults.length <= 1}>
                  ⬇
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => { onSave(); setDirty(false) }}
            disabled={isLoading || !dirty}
            className="save-btn"
          >
            {isLoading ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-screen">加载文件中...</div>
      ) : (
        <textarea
          ref={contentRef}
          value={content}
          onChange={handleChange}
          spellCheck={false}
          className="code-editor"
        />
      )}
    </main>
  )
}
