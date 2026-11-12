const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config.js')
const { authManager } = require('../managers/index.js')

const verifyToken = (req, res, next) => {
	const header = req.headers['authorization'] || req.headers['Authorization']
	if (!header)
		return res.status(401).json({
			code: 401,
			success: false,
			message: '未提供登录凭证',
			i18nKey: 'api.auth.credentialMissing'
		})
	const token = header && header.split(' ')[1]
	if (!token)
		return res.status(401).json({
			code: 401,
			success: false,
			message: '登录凭证错误',
			i18nKey: 'api.auth.credentialMalformed'
		})
	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			if (err.name === 'TokenExpiredError') {
				return res.status(401).json({
					code: 401,
					success: false,
					message: '登录状态已过期，请重新登录',
					i18nKey: 'api.auth.sessionExpired'
				})
			}
			return res.status(401).json({
				code: 401,
				success: false,
				message: '身份认证失败',
				i18nKey: 'api.auth.authenticationFailed'
			})
		}
		const sessionResult = authManager.checkSession(req.cookies?.refreshToken)
		if (sessionResult.code !== 200) {
			const code = sessionResult.code === 601 ? 401 : sessionResult.code
			return res.status(code).json({
				...sessionResult,
				code: code === 403 ? 40301 : code,
				message: sessionResult.message || '登录凭证无效',
				i18nKey: sessionResult.i18nKey || 'api.auth.invalidCredential'
			})
		}
		req.user = user
		next()
	})
}

module.exports = { verifyToken }
