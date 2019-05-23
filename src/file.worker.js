self.addEventListener('message', (e) => {
  var command = e.data[0]
  if (command === 'calcLocalData') {
    console.log('calcLocalData', e)
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

    let rootChildren = folderFiles
      .filter(item => item.pid === '0')
      .map((item, index) => {
        return {
          id: item._id,
          pid: item.pid,
          remote_id: item.remote_id,
          remote_pid: item.remote_pid,
          name: item.title,
          data: item,
          hidden: item.trash !== 'NORMAL',
          children: []
        }
      }).sort((a, b) => {
        return a.seq - b.seq
      })

    let remotePidMap = {}
    let pidMap = {}

    folderFiles.forEach(file => {
      if (file.remote_pid) {
        if (!remotePidMap[file.remote_pid]) {
          remotePidMap[file.remote_pid] = []
        }
        remotePidMap[file.remote_pid].push(file)
      } else {
        if (file.pid) {
          if (!pidMap[file.pid]) {
            pidMap[file.pid] = []
          }
          pidMap[file.pid].push(file)
        }
      }
    })

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
