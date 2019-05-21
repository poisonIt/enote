<template>
  <div class="checkbox">
    <label>
      <input type="checkbox" v-model="value">
      {{ label }}
    </label>
  </div>
</template>

<script>
export default {
  name: 'Checkbox',

  data () {
    return {
      value
    }
  },

  props: {
    label: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="stylus" scoped>
// .checkbox
</style>

