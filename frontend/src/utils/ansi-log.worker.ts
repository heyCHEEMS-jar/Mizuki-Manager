import Convert from 'ansi-to-html'
import type { AnsiLogChunk, AnsiLogWorkerRequest, AnsiLogWorkerResponse } from './ansi-log'

const CHUNK_LENGTH = 1024
const createConvert = () =>
	new Convert({
		fg: '#999',
		bg: '#2a2a2a',
		newline: false,
		escapeXML: true,
		stream: true
	})

const worker = self as unknown as {
	onmessage: ((event: MessageEvent<AnsiLogWorkerRequest>) => void) | null
	postMessage: (message: AnsiLogWorkerResponse) => void
}

let convert = createConvert()
let lastChunk: AnsiLogChunk | null = null
let nextId = 0

const splitLog = (log: string) => {
	const parts: string[] = []
	let start = 0

	while (start < log.length) {
		let end = Math.min(start + CHUNK_LENGTH, log.length)
		if (end < log.length) {
			const newline = log.lastIndexOf('\n', end)
			if (newline >= start + CHUNK_LENGTH / 2) end = newline + 1
		}
		parts.push(log.slice(start, end))
		start = end
	}

	return parts
}

const renderLog = (log: string) => {
	const changed = new Map<number, AnsiLogChunk>()

	splitLog(log).forEach((raw) => {
		const html = convert.toHtml(raw)
		if (lastChunk && lastChunk.raw.length + raw.length <= CHUNK_LENGTH) {
			lastChunk.raw += raw
			lastChunk.html += html
			changed.set(lastChunk.id, { ...lastChunk })
			return
		}

		lastChunk = { id: ++nextId, raw, html }
		changed.set(lastChunk.id, lastChunk)
	})

	return [...changed.values()]
}

const replaceLog = (log: string) => {
	convert = createConvert()
	lastChunk = null
	worker.postMessage({ type: 'replace', chunks: renderLog(log) })
}

const appendLog = (log: string) => {
	if (log) worker.postMessage({ type: 'append', chunks: renderLog(log) })
}

worker.onmessage = ({ data }) => {
	if (data.type === 'append') appendLog(data.log)
	else if (data.type === 'replace') replaceLog(data.log)
	else replaceLog('')
}
