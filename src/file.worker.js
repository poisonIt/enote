self.addEventListener('message', (e) => {
  var command = e.data[0]
  console.log('message', command)
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

    let rootChildren = folderFiles.filter(item => item.pid === '0').map((item, index) => {
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

    rootChildren.forEach((item, index) => {
      getChildren(item, folderFiles)
    })
    rootFolder.children = rootChildren
    // let folderTree = new TreeStore([latestNav, rootFolder, tagNav, binNav])

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

function getChildren (cur, arr) {
  cur.children = arr.filter(item => (
    (item.remote_pid && item.remote_pid === cur.remote_id) ||
    (cur.remote_id && item.pid === cur.remote_id) ||
    (item.pid && item.pid === cur.id))).map(item => {
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
    return a.data.seq - b.data.seq
  })
  cur.children.forEach(child => {
    getChildren(child, arr)
  })
}
