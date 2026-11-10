export interface AnsiLogChunk {
	id: number
	raw: string
	html: string
}

export type AnsiLogWorkerRequest =
	| { type: 'append'; log: string }
	| { type: 'replace'; log: string }
	| { type: 'clear' }

export type AnsiLogWorkerResponse =
	| { type: 'append'; chunks: AnsiLogChunk[] }
	| { type: 'replace'; chunks: AnsiLogChunk[] }
