export default {
  name: '我的文件夹',
  id: 1,
  pid: 0,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [
    {
      name: '新建文件夹',
      id: 2,
      pid: 1,
      data: {
        type: 'folder'
      }
    },
    {
      name: '新建文件夹',
      id: 3,
      pid: 2,
      data: {
        type: 'folder'
      }
    },
    {
      name: '新建文件夹',
      id: 4,
      pid: 3,
      data: {
        type: 'folder'
      }
    }
  ]
}