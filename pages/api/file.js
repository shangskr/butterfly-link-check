import { authMiddleware } from '../../lib/auth'
import { fetchFile, commitFile, AVAILABLE_FILES } from '../../lib/github'

async function handler(req, res) {
  const { name } = req.query

  if (!name || !AVAILABLE_FILES.find(f => f.name === name)) {
    return res.status(400).json({ error: '无效的文件名' })
  }

  if (req.method === 'GET') {
    const file = await fetchFile(name)
    if (!file) {
      return res.status(404).json({ error: '文件不存在' })
    }
    return res.json(file)
  }

  if (req.method === 'PUT') {
    const { content, sha } = req.body
    if (typeof content !== 'string') {
      return res.status(400).json({ error: '缺少文件内容' })
    }
    const result = await commitFile(name, content, sha || undefined)
    return res.json({ success: true, sha: result.content.sha })
  }

  return res.status(405).json({ error: '仅支持 GET/PUT' })
}

export default authMiddleware(handler)
