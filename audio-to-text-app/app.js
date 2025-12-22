App({
  onLaunch() {
    // 应用启动时执行
    // 这里通常做登录、初始化等
    console.log('应用启动')
  },

  onShow() {
    // 应用显示时执行
    console.log('应用显示')
  },

  onHide() {
    // 应用隐藏时执行
    console.log('应用隐藏')
  },

  globalData: {
    // 全局变量（所有页面都可以访问）
    apiBaseUrl: 'http://localhost:9001'
  }
})
