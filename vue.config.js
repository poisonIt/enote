module.exports = {
  // chainWebpack: config => {
  //   config.module
  //     .rule('worker')
  //     .test(/\.worker\.js$/)
  //     .use('worker-loader')
  //       .loader('worker-loader')
  // },
  // configureWebpack: {
  //   // Configuration applied to all builds
  // },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        productName: '添富云笔记',
      }
    }
  }
}