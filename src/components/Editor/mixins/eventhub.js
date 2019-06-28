export default {
  created () {
    this.$hub.hookHub('getIsFocused', 'FileTool', () => {
      this.SET_IS_EDITOR_FOCUSED(this.editor ? this.editor.ui.view.editable.isFocused : false)
		})
		this.$hub.hookHub('searchContent', 'FileHandler', (keywords) => {
			this.handleSearchContent(keywords)
		})
	}
}