const express = require('express')
const router = express.Router()
const { systemManager: sm } = require('../managers/index.js')

router.get('/', async (_req, res) => {
	const result = sm.getInfo()
	res.status(result.code).json(result)
})

module.exports = router
