export function getValid (key, pre, net) {
  return pre[key] !== undefined ? pre[key] : net[key]
}
