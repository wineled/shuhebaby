// pages/account/account.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    amount: '', // 金额
    recordType: 'expense', // 记录类型：income/expense
    categoryIndex: 0, // 分类索引
    remark: '', // 备注
    filterIndex: 0, // 筛选条件索引
    records: [], // 所有记录
    filteredRecords: [], // 筛选后的记录
    
    // 分类选项
    categories: ['餐饮', '购物', '交通', '娱乐', '医疗', '教育', '工资', '奖金', '其他'],
    
    // 筛选选项
    filterOptions: ['全部', '收入', '支出'],
    
    // 统计信息
    totalIncome: '0.00',
    totalExpense: '0.00',
    balance: '0.00',
    canAdd: false // 添加缺失的 canAdd 字段
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadRecords();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadRecords();
  },

  /**
   * 从本地存储加载记录
   */
  loadRecords() {
    const records = wx.getStorageSync('accountRecords') || [];
    this.setData({
      records: records
    }, () => {
      this.filterRecords();
      this.updateStats();
      this.updateCanAdd();
    });
  },

  /**
   * 保存记录到本地存储
   */
  saveRecords() {
    wx.setStorageSync('accountRecords', this.data.records);
    this.filterRecords();
    this.updateStats();
  },

  /**
   * 根据筛选条件过滤记录
   */
  filterRecords() {
    const { records, filterIndex } = this.data;
    let filteredRecords = [];
    
    switch (filterIndex) {
      case 0: // 全部
        filteredRecords = [...records];
        break;
      case 1: // 收入
        filteredRecords = records.filter(record => record.type === 'income');
        break;
      case 2: // 支出
        filteredRecords = records.filter(record => record.type === 'expense');
        break;
    }
    
    // 按日期倒序排列
    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.setData({
      filteredRecords: filteredRecords
    });
  },

  /**
   * 更新统计信息
   */
  updateStats() {
    const { records } = this.data;
    let totalIncome = 0;
    let totalExpense = 0;
    
    records.forEach(record => {
      if (record.type === 'income') {
        totalIncome += parseFloat(record.amount);
      } else {
        totalExpense += parseFloat(record.amount);
      }
    });
    
    const balance = totalIncome - totalExpense;
    
    this.setData({
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      balance: balance.toFixed(2)
    });
  },

  /**
   * 更新是否可以添加记录的状态
   */
  updateCanAdd() {
    const { amount } = this.data;
    const canAdd = amount && parseFloat(amount) > 0;
    this.setData({ canAdd });
  },

  /**
   * 金额输入处理
   */
  onAmountInput(e) {
    this.setData({
      amount: e.detail.value
    }, () => {
      this.updateCanAdd();
    });
  },

  /**
   * 设置记录类型
   */
  setRecordType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      recordType: type
    });
  },

  /**
   * 分类选择处理
   */
  onCategoryChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      categoryIndex: index
    });
  },

  /**
   * 备注输入处理
   */
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
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
      this.filterRecords();
    });
  },

  /**
   * 添加记录
   */
  addRecord() {
    const { amount, recordType, categoryIndex, categories, remark } = this.data;
    
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }
    
    const newRecord = {
      id: Date.now().toString(),
      amount: parseFloat(amount).toFixed(2),
      type: recordType,
      category: categories[categoryIndex],
      remark: remark.trim(),
      date: new Date().toISOString()
    };
    
    const records = [newRecord, ...this.data.records];
    this.setData({
      records: records,
      amount: '',
      remark: '',
      categoryIndex: 0,
      recordType: 'expense'
    }, () => {
      this.saveRecords();
      this.updateCanAdd();
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    });
  },

  /**
   * 删除记录
   */
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          const records = this.data.records.filter(record => record.id !== id);
          this.setData({
            records: records
          }, () => {
            this.saveRecords();
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
   * 格式化日期
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.saveRecords();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.saveRecords();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadRecords();
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
      title: '家庭记账',
      path: '/pages/account/account'
    };
  }
})