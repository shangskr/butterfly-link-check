import { authMiddleware } from '../../lib/auth'
import { AVAILABLE_FILES } from '../../lib/github'

async function handler(req, res) {
  res.json({ files: AVAILABLE_FILES })
}

export default authMiddleware(handler)
