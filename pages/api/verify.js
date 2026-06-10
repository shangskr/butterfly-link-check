import { authMiddleware } from '../../lib/auth'

async function handler(req, res) {
  res.json({ valid: true, user: req.user })
}

export default authMiddleware(handler)
