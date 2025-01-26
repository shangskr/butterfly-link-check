import { useState, useEffect, useRef } from "react";

const EditFile = () => {
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
  const [isDarkMode, setIsDarkMode] = useState(false); // 夜间模式状态
  const contentRef = useRef(null);

  const correctPassword = process.env.NEXT_PUBLIC_COMMIT_PASSWORD || "your-default-password";

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password!");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchFileContent = async () => {
        setIsLoading(true);
        const response = await fetch(`/api/getFile?file=${selectedFile}`);
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
  }, [selectedFile, isAuthenticated]);

  useEffect(() => {
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "gi");
      const matches = [];
      let match;
      while ((match = regex.exec(fileContent)) !== null) {
        matches.push(match.index);
      }
      setSearchResults(matches);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, fileContent]);

  const handleNextMatch = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentMatchIndex + 1) % searchResults.length;
      setCurrentMatchIndex(nextIndex);
      contentRef.current.scrollTo({
        top: searchResults[nextIndex] - 100,
        behavior: "smooth",
      });
    }
  };

  const handlePreviousMatch = () => {
    if (searchResults.length > 0) {
      const prevIndex =
        (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
      setCurrentMatchIndex(prevIndex);
      contentRef.current.scrollTo({
        top: searchResults[prevIndex] - 100,
        behavior: "smooth",
      });
    }
  };

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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (showPasswordPrompt) {
    return (
      <div className={`container ${isDarkMode ? "dark" : ""}`}>
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
    <div className={`container ${isDarkMode ? "dark" : ""}`}>
      <h1>Edit {selectedFile}</h1>
      <button onClick={toggleDarkMode} className="dark-mode-toggle">
        {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </button>
      <div>
        <label>Select file: </label>
        <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
          <option value="link.yml">link.yml</option>
          <option value="manual_check.json">manual_check.json</option>
        </select>
      </div>
      <div>
        <label>Search: </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search in file"
        />
        {searchResults.length > 0 && (
          <div>
            <button onClick={handlePreviousMatch}>Previous</button>
            <button onClick={handleNextMatch}>Next</button>
          </div>
        )}
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
            ref={contentRef}
          />
          <button type="submit" className="submit-btn">Save Changes</button>
        </form>
      )}
    </div>
  );
};

export default EditFile;
