export function getValid (key, pre, net) {
  console.log('getValid', key, pre, net)
  return pre[key] !== undefined ? pre[key] : net[key]
}

export function isIllegal (keys, data) {
  let result = false
  for (let i = 0, len = keys.length; i < len; i++) {
    let key = keys[i]
    if (!data.hasOwnProperty(key)) {
      result = true
      break
    }
  }
  return result
}
