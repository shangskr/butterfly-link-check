import { signToken } from '../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' })
  }

  const { username, password } = req.body
  const correctUsername = process.env.AUTH_USERNAME
  const correctPassword = process.env.AUTH_PASSWORD

  if (!correctUsername || !correctPassword) {
    console.error('AUTH_USERNAME 或 AUTH_PASSWORD 环境变量未设置')
    return res.status(500).json({ error: '服务端配置错误，请联系管理员' })
  }

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' })
  }

  if (username !== correctUsername || password !== correctPassword) {
    return res.status(403).json({ error: '用户名或密码错误' })
  }

  const token = signToken(username)

  res.status(200).json({
    token,
    user: { name: username, role: 'admin' },
  })
}
