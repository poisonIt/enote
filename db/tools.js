export function getValid (key, pre, net) {
  console.log('getValid', key, pre, net)
  return pre[key] !== undefined ? pre[key] : net[key]
}
