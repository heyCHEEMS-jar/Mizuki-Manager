const fs = require('fs')
const { spawn, exec } = require('child_process')
const config = require('../config.js')

const BUILD_LOG_MAX_LENGTH = 200_000

/**
 * 注意内部函数执行完后会清理闭包
 * 闭包清理后上一次部署的日志将会清空
 */
class BuildManager {
	constructor() {
		this.basePath = config.BASE_PATH
		this.deployDir = config.DEPLOY_DIR
		this.distDir = config.DIST_DIR
		this.buildCommand =
			{
				pnpm: 'pnpm build',
				npm: 'npm run build',
				yarn: 'yarn build'
			}[config.PACKAGE_TOOL] || 'pnpm build'
		this.installCommand =
			{
				pnpm: 'pnpm install',
				npm: 'npm install',
				yarn: 'yarn install'
			}[config.PACKAGE_TOOL] || 'pnpm install'
		this.childProcess = null
		this.isWindows = process.platform === 'win32'
		this.logEntries = [] // 缓存当前结构化日志
		this.logLength = 0 // 日志总字符长度
		this.callbacks = new Set() // 多个监听运行输出回调
	}
	_trimLog() {
		while (this.logLength > BUILD_LOG_MAX_LENGTH && this.logEntries.length) {
			const entry = this.logEntries[0] // 最旧的一条
			const overflow = this.logLength - BUILD_LOG_MAX_LENGTH // 总日志超出最大的长度
			// 最旧的一条长度<=超出的长度，整条删除
			if (entry.i18nKey || entry.log.length <= overflow) {
				this.logEntries.shift()
				this.logLength -= entry.log.length
			} else {
				// 最旧的一条长度>超出的长度，直接抛掉超出的部分
				entry.log = entry.log.slice(overflow)
				this.logLength -= overflow
			}
		}
	}
	_appendLog(data) {
		const entry = { log: data.log || '' }
		if (data.i18nKey) entry.i18nKey = data.i18nKey
		if (data.i18nParams) entry.i18nParams = data.i18nParams
		if (entry.log) {
			this.logEntries.push(entry)
			this.logLength += entry.log.length
			this._trimLog()
		}
		return entry
	}
	_emitLog(data, onLog) {
		const entry = this._appendLog(data)
		this.execCallback('log', entry)
		onLog(entry)
	}
	_installDependencies(onLog) {
		this._emitLog(
			{
				log: '\n[System] 正在安装更新依赖...\n',
				i18nKey: 'buildLogs.installing'
			},
			onLog
		)

		const [cmd, ...args] = this.installCommand.split(' ')
		const process = this.isWindows
			? spawn('cmd.exe', ['/c', this.installCommand], { cwd: this.basePath, stdio: 'pipe', windowsHide: true })
			: spawn(cmd, args, { cwd: this.basePath, stdio: 'pipe', detached: true })
		this.childProcess = process
		process.stdout.on('data', data => this._emitLog({ log: data.toString() }, onLog))
		process.stderr.on('data', data => this._emitLog({ log: data.toString() }, onLog))
		return new Promise(resolve => {
			process.once('error', () => resolve(false))
			process.once('close', code => resolve(code === 0))
		})
	}
	// 添加状态重连输出监听
	addCallback(cb) {
		const { sendLog, handleEnd } = cb
		if (!this.childProcess) {
			// 直接通知前端断开SSE
			if (typeof handleEnd === 'function') {
				handleEnd({
					code: 200,
					success: true
				})
			}
			return
		}
		if (typeof sendLog === 'function') {
			const time = new Date().toISOString().replace('T', ' ').substring(0, 19)
			sendLog({
				logEntries: this.logEntries,
				isHistory: true
			}) // 回传历史日志
			sendLog({
				log: `\n---\n已连接部署进程\n${time}\n---\n`,
				i18nKey: 'buildLogs.connected',
				i18nParams: { time }
			})
		}
		this.callbacks.add(cb)
	}
	// 移除监听
	removeCallback(cb) {
		this.callbacks.delete(cb)
	}
	clearCallbacks() {
		this.callbacks.clear()
	}
	/**
	 * @description 执行输出回调
	 * @param {string|object} data
	 * @param {'log'|'done'|'error'} mode
	 */
	execCallback(mode, data) {
		if (mode === 'log') {
			this.callbacks.forEach(cb => {
				if (typeof cb.sendLog === 'function') cb.sendLog(data)
			})
		} else if (mode === 'error' || mode === 'done') {
			this.callbacks.forEach(cb => {
				if (typeof cb.handleEnd === 'function') cb.handleEnd(data)
			})
			this.clearCallbacks() // 进程结束清空所有监听
		}
	}
	/**
	 * @description 部署构建
	 * @func onLog 发送新日志内容回调
	 * @func onDone 部署完成回调,发送成功数据对象
	 * @func onError 执行出错回调,发送错误数据对象
	 */
	async deploy(onLog, onDone, onError) {
		if (this.childProcess) {
			this.execCallback('error', {
				code: 409,
				success: false,
				message: `\n[System] 已有在运行中的任务\n`,
				i18nKey: 'api.build.taskAlreadyRunning'
			})
			onError({
				code: 409,
				success: false,
				message: `\n[System] 已有在运行中的任务\n`,
				i18nKey: 'api.build.taskAlreadyRunning'
			})
			return
		}

		this.logEntries = []
		this.logLength = 0
		this.clearCallbacks()

		const installed = await this._installDependencies(onLog)
		this.childProcess = null
		if (!installed) {
			const cbData = {
				code: 500,
				success: false,
				message: '\n[System] 安装更新依赖失败\n',
				i18nKey: 'api.build.installFailed'
			}
			this.execCallback('error', cbData)
			onError(cbData)
			return
		}

		this._emitLog(
			{
				log: '\n[System] 准备启动构建任务...\n',
				i18nKey: 'buildLogs.preparing'
			},
			onLog
		)

		if (this.isWindows) {
			// Windows
			this.childProcess = spawn('cmd.exe', ['/c', this.buildCommand], {
				cwd: this.basePath,
				stdio: 'pipe',
				windowsHide: true
			})
		} else {
			// Linux/Mac
			const [cmd, ...args] = this.buildCommand.split(' ')
			this.childProcess = spawn(cmd, args, {
				cwd: this.basePath,
				stdio: 'pipe',
				detached: true
			})
		}
		// 监听输出
		this.childProcess.stdout.on('data', data => {
			this._emitLog({ log: data.toString() }, onLog)
		})
		// 构建工具的错误输出保持原样
		this.childProcess.stderr.on('data', data => {
			this._emitLog({ log: data.toString() }, onLog)
		})
		this.childProcess.on('close', async code => {
			if (code !== 0) {
				const cbData = {
					code: 500,
					success: false,
					message: `\n[System] 构建失败: code${code}\n`,
					i18nKey: 'api.build.failed',
					i18nParams: { exitCode: code }
				}
				this.execCallback('error', cbData)
				onError(cbData)
				this.childProcess = null
				return
			}
			if (this.distDir !== this.deployDir) {
				this._emitLog(
					{
						log: '\n[System] 构建完成，正在迁移文件到部署目录...\n',
						i18nKey: 'buildLogs.movingFiles'
					},
					onLog
				)
				await fs.promises.rm(this.deployDir, {
					recursive: true,
					force: true
				})
				await fs.promises.cp(this.distDir, this.deployDir, {
					recursive: true,
					force: true
				})
			}
			this._emitLog(
				{
					log: '\n[System] 部署完成\n',
					i18nKey: 'buildLogs.completed'
				},
				onLog
			)
			// 结束回调
			this.execCallback('done', {
				code: 200,
				success: true
			})
			onDone({
				code: 200,
				success: true
			})
			// 清除子进程引用
			this.childProcess = null
		})
		this.childProcess.on('error', err => {
			const cbData = {
				code: 500,
				success: false,
				message: `\n[System] 构建进程启动失败: ${err}\n`,
				i18nKey: 'api.build.startFailed',
				i18nParams: { detail: String(err) }
			}
			this.execCallback('error', cbData)
			onError(cbData)
			this.childProcess = null
			return
		})
	}
	// 强制停止构建子进程
	stopProcess() {
		try {
			if (this.childProcess && this.childProcess.pid) {
				const pid = this.childProcess.pid
				if (this.isWindows) {
					// Windows
					exec(`taskkill /PID ${pid} /T /F`, err => {
						if (err) console.error('终止进程失败:', err)
					})
				} else {
					// Linux/Mac
					process.kill(-pid, 'SIGKILL')
				}
				this.clearCallbacks()
				this.childProcess.removeAllListeners()
				this.childProcess = null
				return {
					code: 200,
					success: true,
					message: '已停止部署进程',
					i18nKey: 'notifications.deployStopped'
				}
			}
			return {
				code: 404,
				success: false,
				message: '无运行中的任务',
				i18nKey: 'api.build.noRunningTask'
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '执行失败',
				i18nKey: 'api.build.stopFailed',
				error: err
			}
		}
	}
}

module.exports = BuildManager
