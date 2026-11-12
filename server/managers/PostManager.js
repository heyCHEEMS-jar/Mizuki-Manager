const fs = require('fs')
const config = require('../config.js')
const { readFile, fileExists, writeFile, deleteFile, isMarkdown, isLegalFilename, ensureDirExist } = require('../utils/util.js')
const path = require('path')
const BaseManager = require('./BaseManager.js')

class PostManager extends BaseManager {
	constructor() {
		super()
		this.postsDir = path.resolve(config.POSTS_DIR)
		this.total = 0 // 缓存总文章数
	}
	// 获取全部文章Markdown文件名列表
	async getAll(pageNum, pageSize) {
		try {
			const allFilenames = await fs.promises.readdir(this.postsDir)
			const mdFiles = allFilenames.filter(isMarkdown)
			const filesWithTime = await Promise.all(
				mdFiles.map(async filename => ({
					filename,
					mtime: (await fs.promises.stat(path.resolve(this.postsDir, filename))).mtime.getTime()
				}))
			)
			// 按最新修改时间倒序
			filesWithTime.sort((a, b) => b.mtime - a.mtime)
			const slicedFilenames = filesWithTime.slice((pageNum - 1) * pageSize, pageNum * pageSize).map(f => f.filename)
			this.total = mdFiles.length
			return {
				code: 200,
				success: true,
				data: {
					posts: slicedFilenames,
					total: mdFiles.length
				}
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '获取所有文章失败',
				i18nKey: 'api.post.listFailed',
				error: err
			}
		}
	}
	// 获取单个文章内容
	async getContent(filename) {
		try {
			if (typeof filename !== 'string' || !filename)
				return {
					code: 400,
					success: false,
					message: '请传入正确的文件',
					i18nKey: 'api.file.invalid'
				}
			const content = await readFile(this.postsDir, filename)
			return {
				code: 200,
				success: true,
				data: content.toString()
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '文件读取失败',
				i18nKey: 'api.file.readFailed',
				error: err
			}
		}
	}
	// 更新文章
	async update(filename, content) {
		try {
			if (typeof filename !== 'string' || !filename)
				return {
					code: 400,
					success: false,
					message: '请传入正确的文件',
					i18nKey: 'api.file.invalid'
				}
			if (!content)
				return {
					code: 400,
					success: false,
					message: '新内容不能为空',
					i18nKey: 'api.content.required'
				}
			if (!(await fileExists(this.postsDir, filename)))
				return {
					code: 404,
					success: false,
					message: '文件不存在',
					i18nKey: 'api.file.notFound'
				}
			await writeFile(this.postsDir, filename, content)
			return {
				code: 200,
				success: true
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '修改失败',
				i18nKey: 'api.common.updateFailed',
				error: err
			}
		}
	}
	// 创建文章
	async create(filename, content) {
		try {
			if (typeof filename !== 'string' || !filename)
				return {
					code: 400,
					success: false,
					message: '请传入正确的文件',
					i18nKey: 'api.file.invalid'
				}
			if (!content)
				return {
					code: 400,
					success: false,
					message: '新内容不能为空',
					i18nKey: 'api.content.required'
				}
			if (await fileExists(this.postsDir, filename))
				return {
					code: 400,
					success: false,
					message: '当前名称的文件已存在',
					i18nKey: 'api.file.alreadyExists'
				}
			await writeFile(this.postsDir, filename, content)
			return {
				code: 200,
				success: true,
				data: {
					filename
				}
			}
		} catch (err) {
			console.error(err)
			return {
				code: 500,
				success: false,
				message: '添加失败',
				i18nKey: 'api.post.createFailed',
				error: err
			}
		}
	}
	// 上传文章
	async upload(file) {
		return await super.uploadFiles(this.postsDir, [file], cbFile => isMarkdown(cbFile.originalname))
	}
	// 删除文章
	async delete(filename) {
		try {
			if (typeof filename !== 'string' || !filename)
				return {
					code: 400,
					success: false,
					message: '请传入正确的文件',
					i18nKey: 'api.file.invalid'
				}
			if (!isMarkdown(filename))
				return {
					code: 400,
					success: false,
					message: '请传入正确的文件',
					i18nKey: 'api.file.markdownFilenameRequired'
				}
			if (!(await fileExists(this.postsDir, filename)))
				return {
					code: 404,
					success: false,
					message: '文件不存在',
					i18nKey: 'api.file.notFound'
				}
			await deleteFile(this.postsDir, filename)
			this.total--
			return {
				code: 200,
				success: true,
				data: {
					total: this.total
				}
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '删除失败',
				i18nKey: 'api.common.deleteFailed',
				error: err
			}
		}
	}
	// 重命名文章 filename为带.md后缀的文件, newName不带后缀
	async rename(filename, newName) {
		try {
			if (typeof filename !== 'string' || !filename)
				return {
					code: 400,
					success: false,
					message: '请传入正确的文件名',
					i18nKey: 'api.file.invalidName'
				}
			if (typeof newName !== 'string' || !newName)
				return {
					code: 400,
					success: false,
					message: '请传入正确的新文件名',
					i18nKey: 'api.file.invalidNewName'
				}
			if (!isMarkdown(filename))
				return {
					code: 400,
					success: false,
					message: '请传入.md格式的文件名',
					i18nKey: 'api.file.markdownFilenameRequired'
				}
			if (!isLegalFilename(newName))
				return {
					code: 400,
					success: false,
					message: '文章名称不能有特殊符号, 长度最大为100个字符',
					i18nKey: 'api.post.invalidNamePattern',
					i18nParams: { maxLength: 100 }
				}
			newName += '.md'
			if (!(await fileExists(config.POSTS_DIR, filename))) {
				return {
					code: 404,
					success: false,
					message: '未找到该文件',
					i18nKey: 'api.file.notFound'
				}
			}
			const oldFilePath = path.resolve(config.POSTS_DIR, filename)
			const newFilePath = path.resolve(config.POSTS_DIR, newName)
			await fs.promises.rename(oldFilePath, newFilePath)
			return {
				code: 200,
				success: true,
				data: {
					filename: newName
				}
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '重命名失败',
				i18nKey: 'api.common.renameFailed',
				error: err
			}
		}
	}
}

module.exports = PostManager
