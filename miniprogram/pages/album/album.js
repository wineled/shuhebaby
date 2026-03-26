Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeCategory: 'baby', // 当前激活的分类
    showModal: false, // 是否显示模态框
    photoDesc: '', // 照片描述
    tempImagePaths: [], // 临时图片路径数组（支持多张）
    editingPhotoId: null, // 正在编辑的照片ID
    currentPhotos: [], // 当前显示的照片
    categoryText: '宝宝照片', // 当前分类文本
    
    // 照片数据
    photos: {
      baby: [], // 宝宝照片
      adult: [], // 大人照片
      idCard: [] // 身份证照片
    },
    
    // 分类显示文本
    categoryTextMap: {
      baby: '宝宝照片',
      adult: '大人照片',
      idCard: '身份证照片'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadPhotosData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadPhotosData();
  },

  /**
   * 从本地存储加载照片数据
   */
  loadPhotosData() {
    const photos = wx.getStorageSync('albumPhotos') || {
      baby: [],
      adult: [],
      idCard: []
    };
    this.setData({
      photos: photos
    }, () => {
      this.updateCurrentPhotos();
    });
  },

  /**
   * 保存照片数据到本地存储
   */
  savePhotosToStorage() {
    wx.setStorageSync('albumPhotos', this.data.photos);
    this.updateCurrentPhotos();
  },

  /**
   * 更新当前显示的照片
   */
  updateCurrentPhotos() {
    const { activeCategory, photos } = this.data;
    const currentPhotos = photos[activeCategory] || [];
    
    this.setData({
      currentPhotos: currentPhotos,
      categoryText: this.data.categoryTextMap[activeCategory]
    });
  },

  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: category
    }, () => {
      this.updateCurrentPhotos();
    });
  },

  /**
   * 拍照
   */
  takePhoto() {
    wx.chooseMedia({
      count: 1, // 拍照只能拍一张
      mediaType: ['image'],
      sourceType: ['camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          tempImagePaths: tempFilePaths,
          photoDesc: '',
          editingPhotoId: null
        });
        this.showModal();
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 选择图片 - 支持多张选择
   */
  chooseImage() {
    wx.chooseMedia({
      count: 9, // 最多选择9张
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
        if (tempFilePaths.length > 0) {
          this.setData({
            tempImagePaths: tempFilePaths,
            photoDesc: '',
            editingPhotoId: null
          });
          this.showModal();
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 显示模态框
   */
  showModal() {
    this.setData({
      showModal: true
    });
  },

  /**
   * 隐藏模态框
   */
  hideModal() {
    this.setData({
      showModal: false,
      photoDesc: '',
      tempImagePaths: [],
      editingPhotoId: null
    });
  },

  /**
   * 描述输入处理
   */
  onDescInput(e) {
    this.setData({
      photoDesc: e.detail.value
    });
  },

  /**
   * 保存照片（处理模态框确认）
   */
  savePhotos() {
    const { tempImagePaths, photoDesc, activeCategory, editingPhotoId, photos } = this.data;
    
    if (!tempImagePaths || tempImagePaths.length === 0) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 批量创建照片对象
    const newPhotos = tempImagePaths.map(tempFilePath => {
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // 确保ID唯一
        url: tempFilePath,
        desc: photoDesc.trim() || '无描述',
        date: this.formatDate(new Date()),
        category: activeCategory
      };
    });

    let updatedPhotos = { ...photos };
    
    if (editingPhotoId) {
      // 编辑模式（单张编辑）
      const newPhoto = newPhotos[0]; // 编辑模式下只取第一张
      updatedPhotos[activeCategory] = updatedPhotos[activeCategory].map(photo => 
        photo.id === editingPhotoId ? newPhoto : photo
      );
    } else {
      // 添加模式，将新照片数组添加到现有照片列表的前面
      updatedPhotos[activeCategory] = [...newPhotos, ...updatedPhotos[activeCategory]];
    }

    this.setData({
      photos: updatedPhotos
    }, () => {
      this.savePhotosToStorage();
      this.hideModal();
      wx.showToast({
        title: editingPhotoId ? '更新成功' : `成功添加${newPhotos.length}张照片`,
        icon: 'success'
      });
    });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const category = e.currentTarget.dataset.category;
    const urls = this.data.photos[category].map(photo => photo.url);
    
    wx.previewImage({
      urls: urls,
      current: url
    });
  },

  /**
   * 编辑照片
   */
  editPhoto(e) {
    const id = e.currentTarget.dataset.id;
    const photo = this.data.currentPhotos.find(p => p.id === id);
    
    if (photo) {
      this.setData({
        tempImagePaths: [photo.url], // 编辑模式只处理一张照片
        photoDesc: photo.desc,
        editingPhotoId: id
      });
      this.showModal();
    }
  },

  /**
   * 删除照片
   */
  deletePhoto(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          const { activeCategory, photos } = this.data;
          const updatedPhotos = {
            ...photos,
            [activeCategory]: photos[activeCategory].filter(photo => photo.id !== id)
          };
          
          this.setData({
            photos: updatedPhotos
          }, () => {
            this.savePhotosToStorage();
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
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.savePhotosToStorage();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.savePhotosToStorage();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadPhotosData();
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
      title: '舒赫宝宝相册',
      path: '/pages/album/album'
    };
  }
})
