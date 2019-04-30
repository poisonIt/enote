class QueueClass {
	constructor() {
		this._queue = []
  }

	enqueue(run, options) {
		this._queue.push(run)
  }

	dequeue() {
		return this._queue.shift()
  }

	get size() {
		return this._queue.length
	}
}

export {
  QueueClass
}
