import { useState, useRef, useCallback } from 'react'
import yaml from 'js-yaml'

export default function LinkSorter({ content, onChange, onSave, isLoading }) {
  const dragRef = useRef(null)
  const [dragState, setDragState] = useState(null)
  const [hoverZone, setHoverZone] = useState(null)
  const [collapsed, setCollapsed] = useState({})

  let data = []
  let parseError = null
  try {
    data = yaml.load(content) || []
  } catch (e) {
    parseError = e.message
  }

  const hasSiteshot = data.some(s =>
    s.link_list && s.link_list.some(item => item.siteshot)
  )

  const commit = useCallback((d) => {
    onChange(yaml.dump(d, { indent: 2, lineWidth: -1, noRefs: true }))
  }, [onChange])

  const getZoneKey = (si, ii) => `${si}-${ii}`

  const handlePointerDown = useCallback((e, si, ii) => {
    if (e.target.closest('input, button, select, textarea')) return
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    dragRef.current = { pointerId: e.pointerId, el, si, ii }
    setDragState({ si, ii })
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return
    e.preventDefault()
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    const zone = document.elementFromPoint(e.clientX, e.clientY)
    if (!zone) return
    const insertEl = zone.closest('[data-insert-zone]')
    if (insertEl) {
      const key = insertEl.dataset.insertZone
      setHoverZone(key)
    } else {
      const sectionEl = zone.closest('[data-section-target]')
      if (sectionEl) {
        setHoverZone('section-' + sectionEl.dataset.sectionTarget)
      } else {
        setHoverZone(null)
      }
    }
  }, [])

  const handlePointerUp = useCallback((e) => {
    if (!dragRef.current) return
    e.preventDefault()
    const src = dragRef.current
    dragRef.current = null
    setDragState(null)
    setHoverZone(null)
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''

    const zone = document.elementFromPoint(e.clientX, e.clientY)
    if (!zone) return

    const insertEl = zone.closest('[data-insert-zone]')
    if (insertEl) {
      const [targetSi, targetIi] = insertEl.dataset.insertZone.split('-').map(Number)
      let d = data.map(s => ({ ...s, link_list: [...s.link_list] }))
      let srcSi = src.si, srcIi = src.ii
      if (srcSi === targetSi && srcIi === targetIi) return
      if (srcSi === targetSi && srcIi + 1 === targetIi) return
      const [moved] = d[srcSi].link_list.splice(srcIi, 1)
      let ti = targetIi
      if (srcSi === targetSi && srcIi < ti) ti--
      d[targetSi].link_list.splice(ti, 0, moved)
      commit(d)
      return
    }

    const sectionEl = zone.closest('[data-section-target]')
    if (sectionEl) {
      const targetSi = Number(sectionEl.dataset.sectionTarget)
      if (src.si === targetSi) return
      let d = data.map(s => ({ ...s, link_list: [...s.link_list] }))
      const [moved] = d[src.si].link_list.splice(src.ii, 1)
      d[targetSi].link_list.push(moved)
      commit(d)
    }
  }, [commit, data])

  const toggleCollapse = (si) => {
    setCollapsed(prev => ({ ...prev, [si]: !prev[si] }))
  }

  const addSection = () => {
    commit([...data, { class_name: '新分类', class_desc: '描述', link_list: [] }])
  }

  const deleteSection = (si) => {
    commit(data.filter((_, i) => i !== si))
  }

  const updateSection = (si, field, value) => {
    commit(data.map((s, i) => i === si ? { ...s, [field]: value } : s))
  }

  const addLink = (si) => {
    commit(data.map((s, i) => i === si
      ? { ...s, link_list: [...s.link_list, { name: '新友链', link: 'https://example.com', avatar: 'https://example.com/avatar.png', descr: '描述' }] }
      : s))
  }

  const updateLink = (si, ii, field, value) => {
    commit(data.map((s, i) => i === si
      ? { ...s, link_list: s.link_list.map((item, j) => j === ii ? { ...item, [field]: value } : item) }
      : s))
  }

  const deleteLink = (si, ii) => {
    commit(data.map((s, i) => i === si
      ? { ...s, link_list: s.link_list.filter((_, j) => j !== ii) }
      : s))
  }

  if (parseError) {
    return (
      <main className="main-content">
        <div className="sorter-header">
          <h3>可视化排序</h3>
          <button className="save-btn" onClick={onSave} disabled={isLoading}>
            {isLoading ? '保存中...' : '💾 保存'}
          </button>
        </div>
        <div className="loading-screen" style={{ color: 'var(--danger)' }}>
          YAML 解析失败: {parseError}
        </div>
      </main>
    )
  }

  const isDragging = !!dragState

  return (
    <div
      className="main-content"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="sorter-header">
        <h3>可视化排序</h3>
        <div className="sorter-actions">
          <button className="add-section-btn" onClick={addSection}>+ 添加分类</button>
          <button className="save-btn" onClick={onSave} disabled={isLoading}>
            {isLoading ? '保存中...' : '💾 保存到 GitHub'}
          </button>
        </div>
      </div>

      <div className="sorter-sections" style={{ opacity: isDragging ? .7 : 1 }}>
        {data.map((section, si) => {
          const isCollapsed = collapsed[si]
          return (
            <div
              key={si}
              className={`sorter-section ${isCollapsed ? 'collapsed' : ''}`}
              data-section-target={si}
            >
              <div className="section-head">
                <button
                  className="collapse-btn"
                  onClick={() => toggleCollapse(si)}
                  title={isCollapsed ? '展开' : '折叠'}
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
                <div className="section-fields">
                  <input
                    className="sorter-input section-name"
                    value={section.class_name}
                    onChange={e => updateSection(si, 'class_name', e.target.value)}
                    placeholder="分类名称"
                  />
                  <input
                    className="sorter-input section-desc"
                    value={section.class_desc || ''}
                    onChange={e => updateSection(si, 'class_desc', e.target.value)}
                    placeholder="分类描述"
                  />
                </div>
                <div className="section-actions">
                  <span className="link-count">{section.link_list.length} 个链接</span>
                  {!isCollapsed && (
                    <button className="icon-btn-sm add" onClick={() => addLink(si)} title="添加友链">+</button>
                  )}
                  <button className="icon-btn-sm danger" onClick={() => deleteSection(si)} title="删除分类">×</button>
                </div>
              </div>

              {!isCollapsed && (
                <>
                  {section.link_list.length === 0 ? (
                    <div className="empty-links">
                      <span>该分类暂无友链，从其他分类拖拽友链到此区域即可移入</span>
                    </div>
                  ) : (
                    <div className="link-list">
                      {section.link_list.map((item, ii) => (
                        <div key={ii}>
                          <div
                            className={`insert-zone ${hoverZone === getZoneKey(si, ii) ? 'active' : ''}`}
                            data-insert-zone={getZoneKey(si, ii)}
                          >
                            <div className="insert-line" />
                          </div>
                          <div className="link-sort-item">
                            <div
                              className="drag-handle"
                              onPointerDown={e => handlePointerDown(e, si, ii)}
                              style={{ touchAction: 'none' }}
                            >⠿</div>
                            <img
                              className="sort-avatar"
                              src={item.avatar}
                              alt={item.name}
                              onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%23e2e8f0" width="64" height="64"/><text x="32" y="40" text-anchor="middle" fill="%23999" font-size="24">?</text></svg>' }}
                            />
                            <div className="sort-fields">
                              <input
                                className="sorter-input field-name"
                                value={item.name}
                                onChange={e => updateLink(si, ii, 'name', e.target.value)}
                                placeholder="名称"
                              />
                              <input
                                className="sorter-input field-link"
                                value={item.link}
                                onChange={e => updateLink(si, ii, 'link', e.target.value)}
                                placeholder="链接 URL"
                              />
                              <div className="field-row">
                                <input
                                  className="sorter-input field-avatar"
                                  value={item.avatar}
                                  onChange={e => updateLink(si, ii, 'avatar', e.target.value)}
                                  placeholder="头像 URL"
                                />
                                <input
                                  className="sorter-input field-descr"
                                  value={item.descr}
                                  onChange={e => updateLink(si, ii, 'descr', e.target.value)}
                                  placeholder="描述"
                                />
                              </div>
                              {hasSiteshot && (
                                <input
                                  className="sorter-input field-siteshot"
                                  value={item.siteshot || ''}
                                  onChange={e => updateLink(si, ii, 'siteshot', e.target.value)}
                                  placeholder="网站截图 URL (siteshot)"
                                />
                              )}
                            </div>
                            <button className="icon-btn-sm danger" onClick={() => deleteLink(si, ii)} title="删除友链">×</button>
                          </div>
                        </div>
                      ))}
                      <div
                        className={`insert-zone ${hoverZone === getZoneKey(si, section.link_list.length) ? 'active' : ''}`}
                        data-insert-zone={getZoneKey(si, section.link_list.length)}
                      >
                        <div className="insert-line" />
                      </div>
                    </div>
                  )}

                  <div className="drop-target">
                    + 拖拽友链到此处可移入该分类
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
