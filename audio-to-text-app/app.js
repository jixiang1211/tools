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
    // 真机调试必须使用真实 IP，不能用 localhost
    apiBaseUrl: 'http://192.168.2.8:9002'  // 真机调试使用此 IP
    // 或者用 http://127.0.0.1:9002 在开发工具中本地测试
  }
})
