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
  const reg = /[(][1-9][)]/g
  const similarReg = new RegExp(`${name.replace('(', '[(]').replace(')', '[)]')}[(][1-9][)]`)
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
    s = s[s.length - 1]
    return Number(s.substring(1, s.length - 1))
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
