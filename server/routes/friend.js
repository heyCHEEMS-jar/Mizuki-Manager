const express = require('express')
const router = express.Router()
const { friendManager: fm } = require('../managers/index.js')

// 获取配置数据
router.get('/', async (_req, res) => {
	const result = await fm.getConfigData()
	res.status(result.code).json(result)
})

// 写入新配置数据
router.post('/write', async (req, res) => {
	const { data } = req?.body || {}
	const result = await fm.writeConfig(data)
	res.status(result.code).json(result)
})

module.exports = router
