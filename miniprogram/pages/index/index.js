// pages/index/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    todayReminders: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadTodayReminders();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadTodayReminders();
  },

  /**
   * 加载今日提醒数据
   */
  loadTodayReminders() {
    this.setData({ isLoading: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      // 从本地存储获取所有事务
      const todos = wx.getStorageSync('todos') || [];
      
      // 获取今天日期
      const today = this.getTodayDate();
      
      // 筛选今天的事务
      const todayTodos = todos.filter(todo => todo.date === today);
      
      // 转换为提醒格式
      const todayReminders = todayTodos.map(todo => ({
        id: todo.id,
        content: todo.content,
        time: this.getTimeText(todo.priority),
        completed: todo.completed
      }));
      
      this.setData({
        todayReminders: todayReminders,
        isLoading: false
      });
    }, 500);
  },

  /**
   * 获取今天日期的字符串格式
   */
  getTodayDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 根据优先级获取时间文本
   */
  getTimeText(priority) {
    const timeTexts = ['今天', '今天', '今天'];
    return timeTexts[priority] || '今天';
  },

  /**
   * 完成提醒事项
   */
  completeReminder(e) {
    const id = e.currentTarget.dataset.id;
    
    // 获取所有事务
    const todos = wx.getStorageSync('todos') || [];
    
    // 更新对应事务的完成状态
    const updatedTodos = todos.map(todo => {
      if (todo.id === id) {
        return {
          ...todo,
          completed: !todo.completed
        };
      }
      return todo;
    });
    
    // 保存更新后的事务
    wx.setStorageSync('todos', updatedTodos);
    
    // 重新加载今日提醒
    this.loadTodayReminders();
    
    wx.showToast({
      title: '状态已更新',
      icon: 'success'
    });
  },

  /**
   * 跳转到事务页面
   */
  goToTodo() {
    wx.navigateTo({
      url: '/pages/todo/todo'
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadTodayReminders();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '舒赫宝宝家庭',
      path: '/pages/index/index'
    };
  }
})