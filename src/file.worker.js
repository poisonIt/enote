self.addEventListener('message', (e) => {
  var command = e.data[0]
  console.log('message', command)
  if (command === 'calcLocalData') {
    let folderFiles = e.data[1]

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
    })

    rootChildren.forEach((item, index) => {
      getChildren(item, folderFiles)
    })
    rootFolder.children = rootChildren
    // let folderTree = new TreeStore([latestNav, rootFolder, tagNav, binNav])

    self.postMessage([command, rootFolder])
  } else {
    self.postMessage('Unknown command')
  }
}, false)

function getChildren (cur, arr) {
  cur.children = arr.filter(item => (item.remote_pid === cur.remote_id || item.pid === cur.remote_id || item.pid === cur.id)).map(item => {
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
  })
  cur.children.forEach(child => {
    getChildren(child, arr)
  })
}
