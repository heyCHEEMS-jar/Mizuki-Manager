import Convert from 'ansi-to-html'

export type LogWorkerResponse = { type: 'append' | 'replace'; html: string }
type LogWorkerRequest = { type: 'append' | 'replace'; log: string }

const options = {
  fg: '#999',
  bg: '#2a2a2a',
  newline: false,
  escapeXML: true,
  stream: true
}
const worker = self as unknown as {
  onmessage: ((event: MessageEvent<LogWorkerRequest>) => void) | null
  postMessage: (message: LogWorkerResponse) => void
}

let convert = new Convert(options)

worker.onmessage = ({ data }) => {
  if (data.type === 'replace') convert = new Convert(options)
  worker.postMessage({ type: data.type, html: convert.toHtml(data.log) })
}
