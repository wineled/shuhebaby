// pages/todo/todo.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    newTodoContent: '', // 新事务内容
    selectedDate: '', // 选择的日期
    selectedPriorityIndex: 0, // 选择的优先级索引
    filterIndex: 0, // 筛选条件索引
    sortBy: 'date', // 排序字段：date, priority
    sortOrder: 'desc', // 排序顺序：asc, desc
    todos: [], // 所有事务列表
    filteredTodos: [], // 筛选后的事务列表
    
    // 优先级选项
    priorityOptions: ['低', '中', '高'],
    
    // 筛选选项
    filterOptions: ['全部', '待完成', '已完成'],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadTodos();
    // 设置默认日期为今天
    const today = this.getTodayDate();
    this.setData({
      selectedDate: today
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadTodos();
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
   * 从本地存储加载事务列表
   */
  loadTodos() {
    const todos = wx.getStorageSync('todos') || [];
    this.setData({
      todos: todos
    }, () => {
      this.filterTodos();
      this.updateStats();
      this.updateCanAdd();
    });
  },

  /**
   * 保存事务列表到本地存储
   */
  saveTodos() {
    wx.setStorageSync('todos', this.data.todos);
    this.filterTodos();
    this.updateStats();
  },

  /**
   * 根据筛选条件过滤事务
   */
  filterTodos() {
    const { todos, filterIndex, sortBy, sortOrder } = this.data;
    let filteredTodos = [];
    
    // 筛选
    switch (filterIndex) {
      case 0: // 全部
        filteredTodos = [...todos];
        break;
      case 1: // 待完成
        filteredTodos = todos.filter(todo => !todo.completed);
        break;
      case 2: // 已完成
        filteredTodos = todos.filter(todo => todo.completed);
        break;
    }
    
    // 排序
    filteredTodos.sort((a, b) => {
      let result = 0;
      
      if (sortBy === 'date') {
        result = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'priority') {
        result = a.priority - b.priority;
      }
      
      // 如果排序顺序是降序，反转结果
      return sortOrder === 'desc' ? -result : result;
    });
    
    this.setData({
      filteredTodos: filteredTodos
    });
  },

  /**
   * 更新统计信息
   */
  updateStats() {
    const { todos } = this.data;
    const totalCount = todos.length;
    const completedCount = todos.filter(todo => todo.completed).length;
    const pendingCount = totalCount - completedCount;
    
    this.setData({
      totalCount,
      completedCount,
      pendingCount
    });
  },

  /**
   * 更新是否可以添加事务的状态
   */
  updateCanAdd() {
    const { newTodoContent, selectedDate } = this.data;
    const canAdd = newTodoContent.trim().length > 0 && selectedDate.length > 0;
    this.setData({ canAdd });
  },

  /**
   * 事务内容输入处理
   */
  onContentInput(e) {
    this.setData({
      newTodoContent: e.detail.value
    }, () => {
      this.updateCanAdd();
    });
  },

  /**
   * 日期选择处理
   */
  onDateChange(e) {
    this.setData({
      selectedDate: e.detail.value
    }, () => {
      this.updateCanAdd();
    });
  },

  /**
   * 优先级选择处理
   */
  selectPriority(e) {
    const priority = parseInt(e.currentTarget.dataset.priority);
    this.setData({
      selectedPriorityIndex: priority
    });
  },

  /**
   * 筛选条件变更处理
   */
  onFilterChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      filterIndex: index
    }, () => {
      this.filterTodos();
    });
  },

  /**
   * 设置排序字段
   */
  setSort(e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({
      sortBy: sortBy
    }, () => {
      this.filterTodos();
    });
  },

  /**
   * 切换排序顺序
   */
  toggleSortOrder() {
    const newOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    this.setData({
      sortOrder: newOrder
    }, () => {
      this.filterTodos();
    });
  },

  /**
   * 添加新事务
   */
  addTodo() {
    const { newTodoContent, selectedDate, selectedPriorityIndex } = this.data;
    
    if (!newTodoContent.trim()) {
      wx.showToast({
        title: '请输入事务内容',
        icon: 'none'
      });
      return;
    }
    
    if (!selectedDate) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }
    
    const newTodo = {
      id: Date.now().toString(), // 使用时间戳作为唯一ID
      content: newTodoContent.trim(),
      date: selectedDate,
      priority: selectedPriorityIndex, // 0:低, 1:中, 2:高
      completed: false,
      createTime: new Date().toISOString()
    };
    
    const todos = [newTodo, ...this.data.todos];
    this.setData({
      todos: todos,
      newTodoContent: '',
      selectedPriorityIndex: 0
    }, () => {
      this.saveTodos();
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    });
  },

  /**
   * 切换事务完成状态
   */
  toggleTodo(e) {
    const id = e.currentTarget.dataset.id;
    const todos = this.data.todos.map(todo => {
      if (todo.id === id) {
        return {
          ...todo,
          completed: !todo.completed
        };
      }
      return todo;
    });
    
    this.setData({
      todos: todos
    }, () => {
      this.saveTodos();
    });
  },

  /**
   * 编辑事务
   */
  editTodo(e) {
    const id = e.currentTarget.dataset.id;
    const todo = this.data.todos.find(t => t.id === id);
    
    if (todo) {
      // 设置表单为编辑模式
      this.setData({
        newTodoContent: todo.content,
        selectedDate: todo.date,
        selectedPriorityIndex: todo.priority,
        editingId: id
      });
      
      // 滚动到表单区域
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
      
      this.updateCanAdd();
    }
  },

  /**
   * 删除事务
   */
  deleteTodo(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个事务吗？',
      success: (res) => {
        if (res.confirm) {
          const todos = this.data.todos.filter(todo => todo.id !== id);
          this.setData({
            todos: todos
          }, () => {
            this.saveTodos();
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          });
        }
      }
    });
  },

  /**
   * 获取优先级对应的CSS类名
   */
  getPriorityClass(priority) {
    const classes = ['low', 'medium', 'high'];
    return classes[priority] || 'low';
  },

  /**
   * 获取优先级对应的文本
   */
  getPriorityText(priority) {
    const texts = ['低优先级', '中优先级', '高优先级'];
    return texts[priority] || '低优先级';
  },

  /**
   * 格式化显示日期
   */
  formatDisplayDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 如果是今天
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    }
    
    // 如果是明天
    if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    }
    
    // 其他情况显示完整日期
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏时保存数据
    this.saveTodos();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载时保存数据
    this.saveTodos();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadTodos();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里实现加载更多功能
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的事务管理',
      path: '/pages/todo/todo'
    };
  }
})