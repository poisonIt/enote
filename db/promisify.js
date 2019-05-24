import bluebird from 'bluebird'

export function promisifyAll (Model) {
  // bluebird.promisify(Model.save, { context: Model })
  // bluebird.promisify(Model.insert, { context: Model })
  // bluebird.promisify(Model.remove, { context: Model })
  bluebird.promisifyAll(Model.find().__proto__)
  bluebird.promisifyAll(Model.findOne().__proto__)
}
