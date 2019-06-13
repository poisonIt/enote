self.addEventListener('message', (e) => {
  var command = e.data[0]
  if (command === 'calcLocalData') {
    let folderFiles = e.data[1][0]
    let tags = e.data[1][1]

    // calcFolder
    let rootFolder = {
      name: '我的文件夹',
      id: '0',
      pid: null,
      dragDisabled: true,
      addTreeNodeDisabled: true,
      addLeafNodeDisabled: true,
      editNodeDisabled: true,
      delNodeDisabled: true,
      children: [],
      data: {
        type: 'folder'
      }
    }

    let remotePidMap = {}
    let pidMap = {}

    for (let i = 0, len = folderFiles.length; i < len; i++) {
      let file = folderFiles[i]
      if (file.remote_pid !== undefined) {
        if (!remotePidMap[file.remote_pid]) {
          remotePidMap[file.remote_pid] = []
        }
        remotePidMap[file.remote_pid].push(file)
        continue
      }
      if (file.pid !== undefined) {
        if (!pidMap[file.pid]) {
          pidMap[file.pid] = []
        }
        pidMap[file.pid].push(file)
      }
    }

    let rootChildren = (remotePidMap['0'] || []).concat(pidMap['0'] || []).sort((a, b) => a.seq - b.seq).map(item => {
      return transFile(item)
    })

    console.log('rootChildren', rootChildren)

    rootChildren.forEach((item, index) => {
      getChildren(item, remotePidMap, pidMap)
    })
    rootFolder.children = rootChildren

    // calcTag
    let tagNav = {
      name: '标签',
      id: 'tag',
      pid: null,
      dragDisabled: true,
      addTreeNodeDisabled: true,
      addLeafNodeDisabled: true,
      editNodeDisabled: true,
      delNodeDisabled: true,
      children: tags.map(tag => {
        tag.id = tag._id
        tag.type = 'select'
        tag.isSelected = false
        tag.dragDisabled = true
        tag.data = {
          type: 'select',
          name: tag.name,
          _id: tag._id,
          remote_id: tag.remote_id
        }
        return tag
      }),
      data: {
        type: 'tag'
      }
    }
    self.postMessage([command, rootFolder, tagNav])
  } else {
    self.postMessage('Unknown command')
  }
}, false)

function getChildren (cur, remotePidMap, pidMap) {
  let childArr = []
  if (cur.remote_id && remotePidMap[cur.remote_id]) {
    childArr = remotePidMap[cur.remote_id].map(item => {
      return transFile(item)
    })
  } else if (cur.pid && pidMap[cur.id]) {
    childArr = pidMap[cur.id].map(item => {
      return transFile(item)
    })
  }
  cur.children = childArr.length > 0 ? sortFunc(childArr) : []
  cur.children.forEach(child => {
    getChildren(child, remotePidMap, pidMap)
  })
}

function transFile (file) {
  return {
    id: file._id,
    pid: file.pid,
    remote_id: file.remote_id,
    remote_pid: file.remote_pid,
    name: file.title,
    data: file,
    hidden: file.trash !== 'NORMAL',
    children: []
  }
}

function sortFunc (arr) {
  return arr.sort((a, b) => {
    return a.data.seq - b.data.seq
  })
}
