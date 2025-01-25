// /pages/api/getFile.js
export default async function handler(req, res) {
  const { GITHUB_TOKEN, GITHUB_REPO, FILE_1_PATH, FILE_2_PATH } = process.env;

  // 从查询参数中获取文件名，默认为 FILE_1_PATH
  const { file } = req.query;
  
  // 根据传递的参数选择文件路径，若没有传递文件，则默认使用环境变量中的 FILE_1_PATH
  const filePath = file === 'manual_check.json' ? FILE_2_PATH : FILE_1_PATH;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    });

    const data = await response.json();

    // 如果文件不存在，返回 404 错误
    if (data.message && data.message === "Not Found") {
      return res.status(404).json({ error: `File '${filePath}' not found` });
    }

    // 解码文件内容
    const fileContent = Buffer.from(data.content, 'base64').toString();
    res.status(200).json({ content: fileContent, sha: data.sha });

  } catch (error) {
    res.status(500).json({ error: "Error fetching file from GitHub" });
  }
}
