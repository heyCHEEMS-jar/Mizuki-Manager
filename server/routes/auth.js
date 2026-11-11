const express = require('express')
const router = express.Router()
const { authManager: am } = require('../managers/index.js')
const { COOKIE_SECURE } = require('../config.js')
const { getFormattedTimeMs } = require('../utils/util.js')

const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: COOKIE_SECURE, // 默认仅通过HTTPS传输cookie
	sameSite: 'strict', // 防止CSRF攻击
	maxAge: getFormattedTimeMs(process.env.TOKEN_EXPIRES_IN), // cookie过期时间与长token一致
	path: '/mizuki' // 所有业务请求携带长token
}

router.post('/login', (req, res) => {
	const { username, password, captcha } = req?.body || {}
	const result = am.login(username, password, captcha)
	if (result.refreshToken) {
		res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, path: '/mizuki/auth' }) // 清理旧版本cookie
		res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS)
	}
	res.status(result.code).json({ ...result, refreshToken: undefined }) // 长token用cookie传输，不直接返回给前端
})

router.post('/logout', (_req, res) => {
	res.clearCookie('refreshToken', COOKIE_OPTIONS)
	res.status(200).json({ code: 200, success: true, message: '退出成功' })
})

router.get('/refresh-captcha', (req, res) => {
	const { username } = req?.query || {}
	const result = am.refreshCaptcha(username)
	res.status(result.code).json(result)
})

router.post('/verify', (req, res) => {
	const { token } = req?.body || {}
	const result = am.verify(token)
	res.status(result.code).json(result)
})

router.post('/refresh-token', (req, res) => {
	const { refreshToken } = req?.cookies || {} // 长token放在cookie中
	const result = am.refreshToken(refreshToken)
	res.status(result.code).json(result) // 返回新的短token
})

router.post('/check-session', (req, res) => {
	const { refreshToken } = req?.cookies || {}
	const result = am.checkSession(refreshToken)
	res.status(result.code).json(result)
})

module.exports = router
