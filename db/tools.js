export function getValid (key, pre, net) {
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

export function htmlToText (html) {
  const reTag = /<(?:.|\s)*?>/g
  const decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&nbsp;': '  ',
  }
  const encode = /&(?:lt|gt|quot|amp|#10|#9|nbsp);/g

  return html.replace(reTag, '').replace(encode, match => decodingMap[match])
}
