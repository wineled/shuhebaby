// app.js
App({
  globalData: {
    env: "",
    waterReminder: {
      enabled: false,
      nextReminderTime: null
    }
  },

  onLaunch: function () {
    this.globalData = {
      env: "",
      waterReminder: {
        enabled: false,
        nextReminderTime: null
      }
    };
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
    
    // 初始化喝水提醒状态
    this.initWaterReminder();
    
    // 初始化系统数据
    this.initSystem();
  },

  /**
   * 初始化系统数据
   */
  initSystem: function() {
    console.log('系统初始化...');
    
    // 检查本地存储
    this.checkStorage();
    
    // 初始化默认数据
    this.initDefaultData();
  },

  /**
   * 检查本地存储
   */
  checkStorage: function() {
    try {
      // 检查所有必要的存储项
      const storageKeys = ['todos', 'accountRecords', 'albumPhotos', 'health_reminders', 'waterReminder'];
      
      storageKeys.forEach(key => {
        const data = wx.getStorageSync(key);
        if (!data) {
          console.log(`初始化存储: ${key}`);
          
          switch(key) {
            case 'todos':
              wx.setStorageSync(key, []);
              break;
            case 'accountRecords':
              wx.setStorageSync(key, []);
              break;
            case 'albumPhotos':
              wx.setStorageSync(key, { baby: [], adult: [], idCard: [] });
              break;
            case 'health_reminders':
              wx.setStorageSync(key, []);
              break;
            case 'waterReminder':
              wx.setStorageSync(key, { enabled: false, nextTime: '' });
              break;
          }
        }
      });
      
      console.log('本地存储检查完成');
    } catch (error) {
      console.error('检查本地存储失败:', error);
    }
  },

  /**
   * 初始化默认数据
   */
  initDefaultData: function() {
    // 检查健康管理页面是否已有默认数据
    const healthReminders = wx.getStorageSync('health_reminders') || [];
    if (healthReminders.length === 0) {
      // 设置一个默认的年度复查提醒（3个月后）
      const today = new Date();
      const nextDate = new Date(today);
      nextDate.setMonth(today.getMonth() + 3);
      
      const defaultReminder = {
        id: 'default_health_checkup_' + Date.now(),
        title: '胆囊结石复查提醒',
        date: `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`,
        time: '09:00',
        description: '建议进行肝胆胰脾超声检查，了解胆囊结石状况',
        type: 'health_checkup',
        created: today.toISOString()
      };
      
      healthReminders.push(defaultReminder);
      wx.setStorageSync('health_reminders', healthReminders);
      
      // 同步到待办事项
      const todoItem = {
        id: defaultReminder.id,
        content: '健康检查：胆囊结石复查',
        date: defaultReminder.date,
        priority: 1,
        completed: false,
        createTime: today.toISOString(),
        type: 'health_checkup'
      };
      
      const todos = wx.getStorageSync('todos') || [];
      const exists = todos.find(todo => todo.id === defaultReminder.id);
      if (!exists) {
        todos.unshift(todoItem);
        wx.setStorageSync('todos', todos);
      }
    }
  },

  /**
   * 初始化喝水提醒
   */
  initWaterReminder: function() {
    try {
      const reminderData = wx.getStorageSync('waterReminder') || {};
      this.globalData.waterReminder.enabled = reminderData.enabled || false;
      this.globalData.waterReminder.nextReminderTime = reminderData.nextTime || null;
      
      console.log('喝水提醒状态:', this.globalData.waterReminder.enabled);
    } catch (error) {
      console.error('初始化喝水提醒失败:', error);
    }
  },

  onShow: function() {
    // 检查喝水提醒
    this.checkWaterReminder();
    
    // 检查是否有待处理的提醒
    this.checkPendingReminders();
  },

  /**
   * 检查喝水提醒
   */
  checkWaterReminder: function() {
    if (!this.globalData.waterReminder.enabled) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 只在9-18点之间检查
    if (currentHour >= 9 && currentHour < 18) {
      // 检查是否是2小时的整点（10, 12, 14, 16, 18）
      // 注意：9点不算，因为刚开启
      const reminderHours = [10, 12, 14, 16, 18];
      
      if (reminderHours.includes(currentHour) && currentMinute === 0) {
        console.log('触发喝水提醒:', currentHour + ':00');
        
        // 检查今天是否已经提醒过这个时段
        const today = new Date().toDateString();
        const lastReminderKey = `lastWaterReminder_${currentHour}`;
        const lastReminderDay = wx.getStorageSync(lastReminderKey);
        
        if (lastReminderDay !== today) {
          this.showWaterReminder();
          wx.setStorageSync(lastReminderKey, today);
        }
      }
    }
  },

  /**
   * 显示喝水提醒
   */
  showWaterReminder: function() {
    // 使用轻提示，避免弹窗打扰
    wx.showToast({
      title: '💧 记得喝水哦～',
      icon: 'none',
      duration: 3000
    });
    
    // 记录喝水提醒时间
    const now = new Date();
    const drinkHistory = wx.getStorageSync('drinkHistory') || {};
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    if (!drinkHistory[today]) {
      drinkHistory[today] = [];
    }
    
    drinkHistory[today].push({
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      type: 'reminder',
      timestamp: now.getTime()
    });
    
    wx.setStorageSync('drinkHistory', drinkHistory);
    
    // 添加喝水提醒到待办事项
    this.addWaterReminderTodo();
  },

  /**
   * 添加喝水提醒到待办事项
   */
  addWaterReminderTodo: function() {
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    const todoItem = {
      id: 'water_reminder_' + now.getTime(),
      content: '喝水提醒：记得按时喝水',
      date: today,
      priority: 0,
      completed: false,
      createTime: now.toISOString(),
      type: 'water_reminder'
    };
    
    // 获取现有事务
    const todos = wx.getStorageSync('todos') || [];
    
    // 检查是否已存在今日的喝水提醒（避免重复）
    const existingIndex = todos.findIndex(todo => 
      todo.type === 'water_reminder' && todo.date === today && !todo.completed
    );
    
    if (existingIndex === -1) {
      todos.unshift(todoItem);
      wx.setStorageSync('todos', todos);
    }
  },

  /**
   * 记录喝水完成
   */
  recordWaterDrink: function() {
    const now = new Date();
    const drinkHistory = wx.getStorageSync('drinkHistory') || {};
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    if (!drinkHistory[today]) {
      drinkHistory[today] = [];
    }
    
    drinkHistory[today].push({
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      type: 'drink',
      timestamp: now.getTime()
    });
    
    wx.setStorageSync('drinkHistory', drinkHistory);
    
    // 更新待办事项中的喝水提醒为完成
    this.completeWaterReminderTodo();
    
    console.log('喝水记录已保存');
  },

  /**
   * 完成喝水提醒待办事项
   */
  completeWaterReminderTodo: function() {
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    const todos = wx.getStorageSync('todos') || [];
    const updatedTodos = todos.map(todo => {
      if (todo.type === 'water_reminder' && todo.date === today && !todo.completed) {
        return { ...todo, completed: true };
      }
      return todo;
    });
    
    wx.setStorageSync('todos', updatedTodos);
  },

  /**
   * 检查待处理提醒
   */
  checkPendingReminders: function() {
    console.log('检查待处理提醒...');
    
    // 检查健康提醒
    const healthReminders = wx.getStorageSync('health_reminders') || [];
    const now = new Date();
    
    healthReminders.forEach(reminder => {
      const reminderDate = new Date(reminder.date);
      const timeDiff = reminderDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7 && daysDiff > 0) {
        console.log(`即将到期的健康提醒: ${reminder.title} (${daysDiff}天后)`);
        
        // 如果提醒即将到期（7天内），可以在这里显示通知
        if (daysDiff <= 3) {
          this.showUpcomingReminder(reminder, daysDiff);
        }
      }
    });
  },

  /**
   * 显示即将到期的提醒
   */
  showUpcomingReminder: function(reminder, daysLeft) {
    // 可以在这里实现显示即将到期提醒的逻辑
    // 为了避免频繁打扰，可以限制每天只显示一次
    const today = new Date().toDateString();
    const lastShown = wx.getStorageSync(`lastShown_${reminder.id}`) || '';
    
    if (lastShown !== today) {
      wx.showModal({
        title: '📅 即将到期的提醒',
        content: `您有即将到期的健康检查：${reminder.title}\n剩余时间：${daysLeft}天`,
        confirmText: '我知道了',
        cancelText: '忽略',
        success: (res) => {
          if (res.confirm) {
            wx.setStorageSync(`lastShown_${reminder.id}`, today);
          }
        }
      });
    }
  },

  /**
   * 获取今天的喝水次数
   */
  getTodayWaterCount: function() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    const drinkHistory = wx.getStorageSync('drinkHistory') || {};
    const todayDrinks = drinkHistory[todayStr] || [];
    
    // 只统计实际喝水的记录
    const drinkCount = todayDrinks.filter(record => record.type === 'drink').length;
    
    return drinkCount;
  },

  /**
   * 获取喝水提醒状态
   */
  getWaterReminderStatus: function() {
    return {
      enabled: this.globalData.waterReminder.enabled,
      nextReminderTime: this.globalData.waterReminder.nextReminderTime
    };
  },

  /**
   * 启用喝水提醒
   */
  enableWaterReminder: function() {
    this.globalData.waterReminder.enabled = true;
    
    // 保存状态
    const reminderData = {
      enabled: true,
      nextTime: this.globalData.waterReminder.nextReminderTime,
      lastUpdated: new Date().toISOString()
    };
    
    wx.setStorageSync('waterReminder', reminderData);
    
    console.log('喝水提醒已启用');
    return true;
  },

  /**
   * 禁用喝水提醒
   */
  disableWaterReminder: function() {
    this.globalData.waterReminder.enabled = false;
    this.globalData.waterReminder.nextReminderTime = null;
    
    // 保存状态
    const reminderData = {
      enabled: false,
      nextTime: '',
      lastUpdated: new Date().toISOString()
    };
    
    wx.setStorageSync('waterReminder', reminderData);
    
    console.log('喝水提醒已禁用');
    return true;
  },

  /**
   * 全局错误处理
   */
  onError: function(msg) {
    console.error('小程序全局错误:', msg);
    
    // 可以在这里上报错误日志
    // wx.request({
    //   url: 'https://your-error-log-api.com/log',
    //   data: {
    //     error: msg,
    //     timestamp: new Date().toISOString(),
    //     userInfo: wx.getStorageSync('userInfo')
    //   }
    // });
  },

  /**
   * 页面不存在处理
   */
  onPageNotFound: function(res) {
    console.warn('页面不存在:', res.path);
    
    // 重定向到首页
    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  /**
   * 小程序被销毁时调用
   */
  onUnload: function() {
    // 小程序销毁前的清理工作
    console.log('小程序被销毁');
  }
})