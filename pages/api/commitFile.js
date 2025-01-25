// /pages/api/commitFile.js
export default async function handler(req, res) {
  const { GITHUB_TOKEN, GITHUB_REPO, NEXT_PUBLIC_COMMIT_PASSWORD } = process.env; // 使用NEXT_PUBLIC_COMMIT_PASSWORD

  const { content, sha, file, password } = req.body;  // 接收文件内容、sha、文件名和密码

  // 密码验证
  if (password !== NEXT_PUBLIC_COMMIT_PASSWORD) {
    return res.status(403).json({ error: "Forbidden: Incorrect password" });
  }

  // 如果没有传递文件名，默认为 link.yml
  const fileName = file || 'link.yml';
  const updatedContent = Buffer.from(content).toString('base64');

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        message: `Update ${fileName} via web`,  // 提交信息包含文件名
        content: updatedContent,
        path: fileName,
        sha: sha,  // 必须提供当前文件的 sha
      }),
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      const error = await response.json();
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error committing file to GitHub" });
  }
}
