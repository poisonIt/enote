export function getPropByPath (obj, path, strict) {
  let tempObj = obj
  path = path.replace(/\[(\w+)\]/g, '.$1')
  path = path.replace(/^\./, '')

  let keyArr = path.split('.')
  let i = 0
  for (let len = keyArr.length; i < len - 1; ++i) {
    if (!tempObj && !strict) break
    let key = keyArr[i]
    if (key in tempObj) {
      tempObj = tempObj[key]
    } else {
      if (strict) {
        throw new Error('please transfer a valid prop path to form item!')
      }
      break
    }
  }
  return {
    o: tempObj,
    k: keyArr[i],
    v: tempObj ? tempObj[keyArr[i]] : null
  }
}

export function GenNonDuplicateID (randomLength) {
  return Number(Math.random().toString().substr(3, randomLength) + Date.now()).toString(36)
}

export function handleNameConflict (name, oldName, arr) {
  let seq
  let newName
  let reg = /((?<=\()[^\(\)]+)/g
  let similarReg = new RegExp(`${name.replace('(', '[(]').replace(')', '[)]')}[(][0-9]*[0-9][)]$`)
  let seqs = arr.filter(title => {
    if (title === oldName) {
      return false
    }
    let m = title.match(similarReg)
    if (!m || m[0] !== m.input) {
      return false
    } else {
      return true
    }
  }).map(title => {
    let s = title.match(reg)
    return s[s.length - 1]
  })
  if (seqs.length === 0) {
    seqs = [0]
  }
  let seqMin = Math.min(...seqs)
  let seqMax = Math.max(...seqs)
  if (Math.min(...seqs) > 1) {
    seq = seqMin - 1
    newName = `${name}(${seq})`
  } else {
    newName = `${name}(${seqMax + 1})`
  }

  return newName
}

export function matchIndex (str, reg, withLen) {
  let result = []
  let cursor = str.match(reg)
  let sub = 0

  while (cursor !== null) {
    let key = cursor[0]
    let idx = cursor.index

    if (withLen) {
      let strPrev = str.substring(0, idx)
      let prev = result[result.length - 1]
      result.push({
        index: idx + sub,
        left: (prev ? prev.left : 0) + getStrPixelLen(strPrev)
      })
      
    } else {
      result.push(idx + sub)
    }

    let strNext = str.substring(idx + key.length, str.length)
    str = strNext
    sub += (idx + key.length)
    cursor = str.match(reg)
  }

  return result
}

export function getStrPixelLen (str) {
  let result = 0

  for (let i = 0, len = str.length; i < len; i++) {
    let code = str.charCodeAt(i)
    let pixelLen = code > 255 ? 1 : 0.5
    if (code === 46) pixelLen = 1/3

    result += pixelLen
  }

  return result
}
