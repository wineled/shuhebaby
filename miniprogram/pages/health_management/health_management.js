// pages/health_management/health_management.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 患者基本信息
    patientInfo: {
      name: '王荍',
      gender: '女',
      age: 38,
      status: '定期随访中'
    },
    
    // 下次提醒时间
    nextGallbladderCheckup: '',
    nextBreastCheckup: '',
    nextBoneCheckup: '',
    
    // 喝水提醒状态
    waterReminderEnabled: false,
    todayWaterCount: 0,
    waterProgress: 0,
    targetWaterCount: 8, // 目标8杯水
    
    // 日期选择器相关
    showDatePicker: false,
    reminderType: '',
    reminderTitle: '',
    reminderDesc: '',
    checkupDate: '',
    checkupTime: '09:00'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadWaterReminderStatus();
    this.loadTodayWaterCount();
    this.setDefaultCheckupDate();
    this.loadHealthReminders();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadWaterReminderStatus();
    this.loadTodayWaterCount();
    this.loadHealthReminders();
  },

  /**
   * 设置默认复查日期（明天）
   */
  setDefaultCheckupDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const day = tomorrow.getDate().toString().padStart(2, '0');
    
    this.setData({
      checkupDate: `${year}-${month}-${day}`
    });
  },

  /**
   * 加载喝水提醒状态
   */
  loadWaterReminderStatus() {
    const reminderData = wx.getStorageSync('waterReminder') || {};
    this.setData({
      waterReminderEnabled: reminderData.enabled || false
    });
  },

  /**
   * 加载今日喝水次数
   */
  loadTodayWaterCount() {
    const today = this.getTodayDate();
    const drinkHistory = wx.getStorageSync('drinkHistory') || {};
    const todayDrinks = drinkHistory[today] || [];
    
    // 只统计实际的喝水记录（不包括提醒记录）
    const drinkCount = todayDrinks.filter(record => record.type === 'drink').length;
    const progress = Math.min(100, (drinkCount / this.data.targetWaterCount) * 100);
    
    this.setData({
      todayWaterCount: drinkCount,
      waterProgress: progress
    });
  },

  /**
   * 记录喝水
   */
  recordWater() {
    const app = getApp();
    if (app && app.recordWaterDrink) {
      app.recordWaterDrink();
      this.loadTodayWaterCount();
      
      wx.showToast({
        title: '喝水记录已添加',
        icon: 'success',
        duration: 1500
      });
    } else {
      const today = this.getTodayDate();
      const now = new Date();
      
      let drinkHistory = wx.getStorageSync('drinkHistory') || {};
      if (!drinkHistory[today]) {
        drinkHistory[today] = [];
      }
      
      drinkHistory[today].push({
        time: this.formatTime(now),
        type: 'drink',
        timestamp: now.getTime()
      });
      
      wx.setStorageSync('drinkHistory', drinkHistory);
      
      this.loadTodayWaterCount();
      
      wx.showToast({
        title: '喝水记录已添加',
        icon: 'success',
        duration: 1500
      });
    }
  },

  /**
   * 加载所有健康提醒
   */
  loadHealthReminders() {
    const reminders = wx.getStorageSync('health_reminders') || [];
    
    // 分组显示不同类型的提醒
    const gallbladderReminders = reminders.filter(r => r.type === 'gallbladder');
    const breastReminders = reminders.filter(r => r.type === 'breast');
    const boneReminders = reminders.filter(r => r.type === 'bone');
    
    // 找到最近的一个提醒
    let nextGallbladder = '';
    let nextBreast = '';
    let nextBone = '';
    
    if (gallbladderReminders.length > 0) {
      // 按日期排序，找到最早的一个
      gallbladderReminders.sort((a, b) => new Date(a.date) - new Date(b.date));
      const next = gallbladderReminders[0];
      nextGallbladder = `${this.formatDisplayDate(next.date)} ${next.time || '09:00'}`;
    }
    
    if (breastReminders.length > 0) {
      breastReminders.sort((a, b) => new Date(a.date) - new Date(b.date));
      const next = breastReminders[0];
      nextBreast = `${this.formatDisplayDate(next.date)} ${next.time || '09:00'}`;
    }
    
    if (boneReminders.length > 0) {
      boneReminders.sort((a, b) => new Date(a.date) - new Date(b.date));
      const next = boneReminders[0];
      nextBone = `${this.formatDisplayDate(next.date)} ${next.time || '09:00'}`;
    }
    
    this.setData({
      nextGallbladderCheckup: nextGallbladder,
      nextBreastCheckup: nextBreast,
      nextBoneCheckup: nextBone
    });
  },

  /**
   * 设置复查提醒 - 支持多种类型
   */
  setReminder(e) {
    const type = e.currentTarget.dataset.type;
    let title = '';
    let desc = '';
    
    switch(type) {
      case 'gallbladder':
        title = '胆囊结石复查提醒';
        desc = '肝胆胰脾超声检查，观察结石大小、数量及胆囊情况的变化';
        break;
      case 'breast':
        title = '乳腺结节复查提醒';
        desc = '乳腺外科或甲乳外科专科检查，包括触诊和乳腺超声';
        break;
      case 'bone':
        title = '骨质密度复查提醒';
        desc = '内分泌科或骨科就诊，进行DXA检测评估骨量状况';
        break;
    }
    
    this.setData({
      showDatePicker: true,
      reminderType: type,
      reminderTitle: title,
      reminderDesc: desc
    });
  },

  /**
   * 日期选择变化
   */
  onDateChange(e) {
    this.setData({
      checkupDate: e.detail.value
    });
  },

  /**
   * 时间选择变化
   */
  onTimeChange(e) {
    this.setData({
      checkupTime: e.detail.value
    });
  },

  /**
   * 确认设置复查提醒 - 支持多种类型
   */
  confirmCheckupReminder() {
    const { checkupDate, checkupTime, reminderType, reminderTitle, reminderDesc } = this.data;
    
    if (!checkupDate) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }

    // 检查选择的日期是否在今天之后
    const selectedDate = new Date(checkupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      wx.showToast({
        title: '请选择今天或之后的日期',
        icon: 'none'
      });
      return;
    }

    // 创建提醒数据
    const reminder = {
      id: Date.now().toString(),
      title: reminderTitle,
      date: checkupDate,
      time: checkupTime,
      fullDate: `${checkupDate} ${checkupTime}`,
      description: reminderDesc,
      created: new Date().toISOString(),
      type: reminderType,
      category: 'health_checkup'
    };
    
    // 获取现有提醒
    const reminders = wx.getStorageSync('health_reminders') || [];
    
    // 移除同类型的旧提醒
    const filteredReminders = reminders.filter(r => r.type !== reminderType);
    filteredReminders.push(reminder);
    
    // 保存到本地存储
    wx.setStorageSync('health_reminders', filteredReminders);
    
    // 同步到事务列表
    this.syncToTodoList(reminder);
    
    this.setData({
      showDatePicker: false,
      reminderType: '',
      reminderTitle: '',
      reminderDesc: ''
    });
    
    // 重新加载提醒
    this.loadHealthReminders();
    
    wx.showToast({
      title: '复查提醒设置成功',
      icon: 'success',
      duration: 2000
    });
  },

  /**
   * 取消设置复查提醒
   */
  cancelCheckupReminder() {
    this.setData({
      showDatePicker: false,
      reminderType: '',
      reminderTitle: '',
      reminderDesc: ''
    });
  },

  /**
   * 同步到事务列表
   */
  syncToTodoList(reminder) {
    const todoItem = {
      id: reminder.id,
      content: `${reminder.title}`,
      date: reminder.date,
      priority: 1,
      completed: false,
      createTime: new Date().toISOString(),
      type: 'health_checkup',
      subType: reminder.type
    };
    
    // 获取现有事务
    const todos = wx.getStorageSync('todos') || [];
    
    // 移除同类型的旧事务
    const filteredTodos = todos.filter(todo => !(todo.type === 'health_checkup' && todo.subType === reminder.type));
    filteredTodos.unshift(todoItem);
    
    // 保存到本地存储
    wx.setStorageSync('todos', filteredTodos);
  },

  /**
   * 设置喝水提醒
   */
  setWaterReminder() {
    const that = this;
    
    if (this.data.waterReminderEnabled) {
      // 如果已开启，询问是否关闭
      wx.showModal({
        title: '喝水提醒设置',
        content: '是否关闭喝水提醒？',
        confirmText: '关闭',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            that.stopWaterReminder();
          }
        }
      });
    } else {
      // 如果未开启，询问是否开启
      wx.showModal({
        title: '喝水提醒设置',
        content: '开启后，每天9:00-18:00每2小时提醒一次喝水\n是否开启？',
        confirmText: '开启',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            that.startWaterReminder();
          }
        }
      });
    }
  },

  /**
   * 开始喝水提醒
   */
  startWaterReminder() {
    const app = getApp();
    if (app && app.enableWaterReminder) {
      app.enableWaterReminder();
    } else {
      // 保存提醒设置
      const reminderData = {
        enabled: true,
        nextTime: '',
        lastUpdated: new Date().toISOString()
      };
      
      wx.setStorageSync('waterReminder', reminderData);
    }
    
    this.setData({
      waterReminderEnabled: true
    });
    
    wx.showToast({
      title: '喝水提醒已开启',
      icon: 'success',
      duration: 2000
    });
  },

  /**
   * 停止喝水提醒
   */
  stopWaterReminder() {
    const app = getApp();
    if (app && app.disableWaterReminder) {
      app.disableWaterReminder();
    } else {
      // 保存提醒设置
      const reminderData = {
        enabled: false,
        nextTime: '',
        lastUpdated: new Date().toISOString()
      };
      
      wx.setStorageSync('waterReminder', reminderData);
    }
    
    this.setData({
      waterReminderEnabled: false
    });
    
    wx.showToast({
      title: '喝水提醒已关闭',
      icon: 'success',
      duration: 2000
    });
  },

  /**
   * 分享健康方案
   */
  shareHealthInfo() {
    // 显示分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
    
    // 提示用户分享
    wx.showModal({
      title: '分享提示',
      content: '请点击右上角"..."分享给好友',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 查看所有提醒
   */
  viewAllReminders() {
    wx.showModal({
      title: '所有健康提醒',
      content: '请在事务管理页面查看所有已设置的复查提醒',
      confirmText: '前往事务管理',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/todo/todo'
          });
        }
      }
    });
  },

  /**
   * 格式化日期显示
   */
  formatDisplayDate(dateString) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  },

  /**
   * 获取今天日期
   */
  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 获取最大日期（1年后）
   */
  getMaxDate() {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    
    const year = nextYear.getFullYear();
    const month = (nextYear.getMonth() + 1).toString().padStart(2, '0');
    const day = nextYear.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadWaterReminderStatus();
    this.loadTodayWaterCount();
    this.loadHealthReminders();
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '王荍的健康管理方案',
      path: '/pages/health_management/health_management',
      imageUrl: '/images/health.png'
    };
  }
})