const GITHUB_API = 'https://api.github.com'

function getConfig() {
  const { GITHUB_TOKEN, GITHUB_REPO, FILE_1_PATH, FILE_2_PATH } = process.env
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO in environment')
  }
  return { GITHUB_TOKEN, GITHUB_REPO, FILE_1_PATH, FILE_2_PATH }
}

function filePathFor(name) {
  const { FILE_1_PATH, FILE_2_PATH } = getConfig()
  if (name === 'manual_check.json') return FILE_2_PATH || 'manual_check.json'
  return FILE_1_PATH || 'link.yml'
}

export async function fetchFile(fileName) {
  const { GITHUB_TOKEN, GITHUB_REPO } = getConfig()
  const path = filePathFor(fileName)
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
  })

  if (res.status === 404) {
    return null
  }

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || '获取文件失败')
  }

  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
    path: data.path,
  }
}

export async function commitFile(fileName, content, sha) {
  const { GITHUB_TOKEN, GITHUB_REPO } = getConfig()
  const path = filePathFor(fileName)
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`

  const body = {
    message: `Update ${fileName} via web`,
    content: Buffer.from(content).toString('base64'),
    path,
  }
  if (sha) body.sha = sha

  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || '提交文件失败')
  }

  return data
}

export const AVAILABLE_FILES = [
  { name: 'link.yml', label: '友链配置', icon: '🔗', description: '友链数据 YAML 配置文件' },
  { name: 'manual_check.json', label: '手动检测', icon: '📋', description: '手动覆盖链接检测状态' },
]
