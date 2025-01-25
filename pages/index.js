import { useState, useEffect } from "react";

const EditFile = () => {
  const [fileContent, setFileContent] = useState("");
  const [sha, setSha] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState("link.yml"); // 默认选择 link.yml
  const [password, setPassword] = useState(""); // 用于存储用户输入的密码
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 用户是否认证通过
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true); // 控制密码提示框的显示
  const [passwordError, setPasswordError] = useState(""); // 控制密码错误的提示

  // 使用NEXT_PUBLIC_COMMIT_PASSWORD来获取密码
  const correctPassword = process.env.NEXT_PUBLIC_COMMIT_PASSWORD || "your-default-password"; // 默认密码

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true); // 密码正确，认证通过
      setShowPasswordPrompt(false); // 隐藏密码提示框
      setPasswordError(""); // 清空错误信息
    } else {
      setPasswordError("Incorrect password!"); // 设置错误信息
    }
  };

  // Fetch current file content when the page loads or when the selected file changes
  useEffect(() => {
    if (isAuthenticated) {
      const fetchFileContent = async () => {
        setIsLoading(true);
        const response = await fetch(`/api/getFile?file=${selectedFile}`); // 根据选择的文件获取内容
        const data = await response.json();

        if (data.content) {
          setFileContent(data.content);
          setSha(data.sha);
        } else {
          alert("Error loading file");
        }
        setIsLoading(false);
      };

      fetchFileContent();
    }
  }, [selectedFile, isAuthenticated]); // 每次文件选择变化时重新加载文件内容，且只有认证后才触发请求

  const handleChange = (e) => {
    setFileContent(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const response = await fetch('/api/commitFile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: fileContent, sha: sha, file: selectedFile, password }),
    });

    if (response.ok) {
      alert("File updated successfully");
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
    setIsLoading(false);
  };

  // 如果用户没有通过密码验证，显示密码提示框
  if (showPasswordPrompt) {
    return (
      <div className="container">
        <h1>Enter Password to Access Edit Page</h1>
        <form onSubmit={handlePasswordSubmit} className="form-container">
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className="input-field"
            placeholder="Enter password"
          />
          {passwordError && <p style={{ color: 'red' }}>{passwordError}</p>}
          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Edit {selectedFile}</h1>
      <div>
        {/* 文件选择器 */}
        <label>Select file: </label>
        <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
          <option value="link.yml">link.yml</option>
          <option value="manual_check.json">manual_check.json</option>
        </select>
      </div>
      {isLoading ? (
        <div className="loading">Saving changes, please wait...</div>
      ) : (
        <form onSubmit={handleSubmit} className="form-container">
          <textarea
            value={fileContent}
            onChange={handleChange}
            rows="20"
            cols="60"
            className="textarea"
            placeholder={`Edit your ${selectedFile} content here...`}
          />
          <button type="submit" className="submit-btn">Save Changes</button>
        </form>
      )}
    </div>
  );
};

export default EditFile;
