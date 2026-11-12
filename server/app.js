const express = require('express')
const app = express()
const routes = require('./routes/index.js')
const config = require('./config')
const { verifyToken } = require('./middlewares/auth.js')
const path = require('path')
const cookieParser = require('cookie-parser')

const isProd = process.env.NODE_ENV === 'production'

app.use(express.json({ limit: '1mb' })) // 解析json
app.use(express.urlencoded({ extended: true })) // 解析url参数
app.use(cookieParser()) // 解析cookie

const SAFE_PATH = path.resolve(config.BASE_PATH)
app.use('/mizuki', (req, res, next) => {
	const requestPath = req.path
	if (!requestPath) return next()

	const realPath = path.resolve(SAFE_PATH, requestPath.slice(1))
	const relativePath = path.relative(SAFE_PATH, realPath)
	const isOutsideSafePath = relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)

	// 防止越出项目根目录访问
	if (isOutsideSafePath) {
		return res.status(403).json({
			code: 403,
			success: false,
			message: '非法路径访问',
			i18nKey: 'api.security.illegalPath'
		})
	}
	next()
})
const mizukiRouter = express.Router()
// 登录模块
mizukiRouter.use('/auth', routes.auth)

// 令牌验证
mizukiRouter.use(verifyToken)
mizukiRouter.use('/about', routes.about)
mizukiRouter.use('/album', routes.album)
mizukiRouter.use('/anime', routes.anime)
mizukiRouter.use('/config', routes.config)
mizukiRouter.use('/device', routes.device)
mizukiRouter.use('/diary', routes.diary)
mizukiRouter.use('/friend', routes.friend)
mizukiRouter.use('/post', routes.post)
mizukiRouter.use('/project', routes.project)
mizukiRouter.use('/skill', routes.skill)
mizukiRouter.use('/timeline', routes.timeline)
mizukiRouter.use('/music', routes.music)
mizukiRouter.use('/builder', routes.builder)
mizukiRouter.use('/system', routes.system)

// 404
mizukiRouter.use((_req, res) => {
	res.status(404).json({
		code: 404,
		success: false,
		message: '无效的资源路径',
		i18nKey: 'api.route.notFound',
		error: 'Route not found'
	})
})

app.use('/mizuki', mizukiRouter)

// 提供静态文件访问路径
app.use('/', express.static(path.resolve(config.PUBLIC_DIR)))
app.use('/assets', express.static(path.resolve(config.BASE_PATH, 'src/assets')))

// 生产环境下使用构建文件
if (isProd) {
	const distDir = path.resolve(__dirname, '../frontend/dist')
	app.use(express.static(distDir))
	app.use((_req, res) => {
		res.sendFile(path.resolve(distDir, 'index.html'), err => {
			if (err) console.error(err)
		})
	})
}

app.use((err, _req, res, _next) => {
	if (err) console.error(err)
	res.status(500).json({
		code: 500,
		success: false,
		message: '服务器内部错误',
		i18nKey: 'api.server.internalError',
		error: 'Internal Server Error'
	})
})

app.listen(config.PORT, () => {
	console.log(`
Mizuki Manager
──────────────
状态  ● 在线
端口  ${config.PORT}
环境  ${process.env.NODE_ENV || 'development'}
系统  ${process.platform}
`)
	isProd && console.log(`生产环境：请通过后台端口 ${config.PORT} 访问应用`)
})
