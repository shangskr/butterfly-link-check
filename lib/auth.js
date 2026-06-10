import jwt from 'jsonwebtoken'

const getSecret = () => {
  if (typeof window !== 'undefined') {
    throw new Error('JWT_SECRET is not available on the client side')
  }
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未设置')
  }
  return secret
}

export function signToken(username) {
  return jwt.sign({ username, role: 'admin', iat: Date.now() }, getSecret(), { expiresIn: '24h' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret())
  } catch {
    return null
  }
}

export function authMiddleware(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权，请先登录' })
    }
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({ error: 'Token 已过期或无效，请重新登录' })
    }
    req.user = payload
    return handler(req, res)
  }
}
