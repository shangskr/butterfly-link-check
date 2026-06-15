import { useState, useEffect, useRef, useCallback } from 'react'

export default function FileEditor({ fileName, content, isLoading, onContentChange, onSave }) {
  const contentRef = useRef(null)
  const backdropRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [dirty, setDirty] = useState(false)

  const handleChange = useCallback((e) => {
    onContentChange(e.target.value)
    setDirty(true)
  }, [onContentChange])

  const scrollToMatch = useCallback((index) => {
    const ta = contentRef.current
    if (!ta) return
    const lineHeight = parseFloat(window.getComputedStyle(ta).lineHeight) || 20
    const lines = content.substring(0, index).split('\n').length
    ta.scrollTop = Math.max(0, (lines - 1) * lineHeight - ta.clientHeight * 0.25)
  }, [content])

  const handleScroll = useCallback(() => {
    if (backdropRef.current && contentRef.current) {
      backdropRef.current.scrollTop = contentRef.current.scrollTop
      backdropRef.current.scrollLeft = contentRef.current.scrollLeft
    }
  }, [])

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
  }, [searchTerm, content, scrollToMatch])

  const navigateMatch = (dir) => {
    if (searchResults.length === 0) return
    const next = (currentMatchIndex + dir + searchResults.length) % searchResults.length
    setCurrentMatchIndex(next)
    scrollToMatch(searchResults[next])
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function highlightContent(text, term, currentIndex) {
    if (!term.trim()) return escapeHtml(text)
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedTerm})`, 'gi')
    const parts = text.split(regex)
    let matchCount = 0
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        const isCurrent = matchCount === currentIndex
        matchCount++
        const cls = isCurrent ? 'highlight-mark current-match' : 'highlight-mark'
        return `<mark class="${cls}">${escapeHtml(part)}</mark>`
      }
      return escapeHtml(part)
    }).join('')
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
        <div className="editor-wrapper">
          <pre
            ref={backdropRef}
            className="editor-highlighter"
            dangerouslySetInnerHTML={{
              __html: highlightContent(content, searchTerm, currentMatchIndex)
            }}
            aria-hidden="true"
          />
          <textarea
            ref={contentRef}
            value={content}
            onChange={handleChange}
            onScroll={handleScroll}
            spellCheck={false}
            className="code-editor"
          />
        </div>
      )}
    </main>
  )
}
