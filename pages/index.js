// pages/index.js
import { useState, useEffect, useRef } from "react";

export default function EditFile() {
  const [fileContent, setFileContent] = useState("");
  const [sha, setSha] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState("link.yml");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [passwordError, setPasswordError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 侧边栏状态
  const contentRef = useRef(null);

  const correctPassword = process.env.NEXT_PUBLIC_COMMIT_PASSWORD || "your-default-password";

  const files = [
    { name: "Link Config", file: "link.yml", icon: "🔗" },
    { name: "Manual Check", file: "manual_check.json", icon: "📋" },
  ];

  // 密码处理
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setPasswordError("");
    } else {
      setPasswordError("❌ 密码错误，请重新输入。");
    }
  };

  // 加载文件
  useEffect(() => {
    if (isAuthenticated) {
      const fetchFile = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/getFile?file=${selectedFile}`);
          const data = await res.json();
          if (data.content) {
            setFileContent(data.content);
            setSha(data.sha);
          } else {
            alert("加载文件失败：" + (data.error || "未知错误"));
          }
        } catch (err) {
          alert("网络错误，请检查连接。");
        } finally {
          setIsLoading(false);
        }
      };
      fetchFile();
    }
  }, [selectedFile, isAuthenticated]);

  // 搜索匹配
  useEffect(() => {
    if (searchTerm.trim()) {
      const regex = new RegExp(searchTerm, "gi");
      const matches = [];
      let match;
      while ((match = regex.exec(fileContent)) !== null) {
        matches.push(match.index);
      }
      setSearchResults(matches);
      setCurrentMatchIndex(0);
      if (matches.length > 0) {
        scrollToMatchCenter(matches[0]);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, fileContent]);

  // 滚动到匹配项并居中
  const scrollToMatchCenter = (index) => {
    if (!contentRef.current) return;
    const lines = fileContent.substring(0, index).split("\n");
    const lineHeight = 20;
    const totalLinesVisible = Math.floor(contentRef.current.clientHeight / lineHeight);
    const targetLine = lines.length;
    const scrollPosition = (targetLine - totalLinesVisible / 2) * lineHeight;
    contentRef.current.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: "smooth",
    });
  };

  // 上一个/下一个搜索结果
  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatchCenter(searchResults[nextIdx]);
  };

  const handlePreviousMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatchCenter(searchResults[prevIdx]);
  };

  const handleChange = (e) => setFileContent(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/commitFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent, sha, file: selectedFile, password }),
      });
      if (res.ok) {
        alert("✅ 保存成功！");
      } else {
        const err = await res.json();
        alert("❌ 错误：" + err.error);
      }
    } catch (err) {
      alert("❌ 保存失败：网络错误。");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // === 登录页面（中文版）===
  if (showPasswordPrompt) {
    return (
      <div className={`auth-page ${isDarkMode ? "dark" : ""}`}>
        <div className="auth-card">
          <div className="auth-logo">
            <div className="icon">🔐</div>
            <h1>安全编辑器</h1>
          </div>
          <p className="auth-desc">请输入管理员密码以进入文件编辑器。</p>
          <form onSubmit={handlePasswordSubmit} className="auth-form">
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="请输入密码"
              autoFocus
              className="auth-input"
            />
            {passwordError && <p className="auth-error">{passwordError}</p>}
            <button type="submit" className="auth-btn">
              继续 →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // === 主界面 ===
  return (
    <div className={`dashboard ${isDarkMode ? "dark" : ""}`}>
      {/* 顶部栏 */}
      <header className="topbar">
        <button className="menu-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <h2>📄 文件编辑器</h2>
        <div className="topbar-actions">
          <button onClick={toggleDarkMode} className="icon-btn" aria-label="切换暗色模式">
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={handleSubmit} disabled={isLoading} className="save-btn">
            {isLoading ? "⏳ 保存中..." : "💾 保存"}
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* 侧边栏 */}
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <h3>📁 文件列表</h3>
          <ul>
            {files.map((f) => (
              <li
                key={f.file}
                className={selectedFile === f.file ? "active" : ""}
                onClick={() => {
                  setSelectedFile(f.file);
                  setIsSidebarOpen(false); // 手机端点击后收起
                }}
              >
                <span>{f.icon}</span>
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* 主内容 */}
        <main className="main-content">
          <div className="editor-header">
            <h3>
              正在编辑: <code>{selectedFile}</code>
            </h3>
            <div className="search-toolbar">
              <input
                type="text"
                placeholder="🔍 搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchResults.length > 0 && (
                <div className="search-nav">
                  <button onClick={handlePreviousMatch} disabled={searchResults.length <= 1}>
                    ⬆️
                  </button>
                  <span className="search-count">
                    {currentMatchIndex + 1}/{searchResults.length}
                  </span>
                  <button onClick={handleNextMatch} disabled={searchResults.length <= 1}>
                    ⬇️
                  </button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="loading-screen">🔄 加载文件中...</div>
          ) : (
            <textarea
              ref={contentRef}
              value={fileContent}
              onChange={handleChange}
              spellCheck={false}
              className="code-editor"
              placeholder="在此编辑文件内容..."
            />
          )}
        </main>
      </div>
    </div>
  );
}
