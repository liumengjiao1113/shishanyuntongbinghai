<template>
  <view class="container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="icon">←</text>
      </view>
      <text class="nav-title">任务详情</text>
      <view class="nav-right">
        <text class="icon">⋮⋮</text>
      </view>
    </view>
    
    <!-- 新建小区按钮和切换小区按钮 -->
    <view class="new-plot-btn-container">
      <button class="new-plot-btn" @click="showNewPlotModal = true">新建小区</button>
      <button class="new-plot-btn switch-plot-btn" @click="openSwitchModal">切换小区</button>
    </view>
    
    <!-- 任务信息 -->
    <view class="info-card">
      <view class="info-item">
        <text class="info-label">任务ID：</text>
        <text class="info-value">{{ task.id }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">任务名称：</text>
        <text class="info-value">{{ task.taskName }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">小区编号：</text>
        <text class="info-value">{{ task.position }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">小区描述：</text>
        <text class="info-value">{{ plotDescription }}</text>
      </view>
    </view>
    
    <!-- 图片列表 - 修改为列表形式展示imageNum -->
    <view class="image-list-container">
      <scroll-view class="image-list" scroll-y>
        <view v-if="filteredImages.length === 0" class="empty-tip">
          <text>暂无图片数据</text>
        </view>
        <view 
          v-for="(img, index) in filteredImages" 
          :key="img.id" 
          class="image-item"
          @click="toggleSelect(img)"
        >
          <view class="image-info-list">
            <view class="image-status">{{ getStatusText(img.status) }}</view>
            <!-- 移除点击事件 -->
            <view class="image-id">{{ img.imageNum || '未获取到编号' }}</view> 
            <view v-if="img.selected" class="selected-mask-list">
              <view class="selected-icon">✓</view>
            </view>
          </view>
        </view>
      </scroll-view>
      
      <!-- 分页控件 -->
      <view class="pagination" v-if="totalPages > 1">
        <button class="page-btn prev" @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <text class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</text>
        <button class="page-btn next" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="action-btn upload" @click="handleRefresh">刷新</button>
      <button class="action-btn view" @click="handleView">查看</button>
      <button class="action-btn delete" @click="handleDelete">删除</button>
      <button class="action-btn capture" @click="goToCollect">采集</button>
    </view>
    
    <!-- 新建小区弹窗 - 优化样式 -->
    <view class="modal" v-if="showNewPlotModal">
      <view class="modal-content new-plot-modal">
        <view class="modal-header">
          <text class="modal-title">新建小区</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <view class="form-item">
              <label class="form-label">小区编号：</label>
              <input class="form-input" v-model="newPlotId" placeholder="请输入小区编号" />
            </view>
            <view class="form-item">
              <label class="form-label">小区描述：</label>
              <input class="form-input" v-model="newPlotDesc" placeholder="请输入小区描述" />
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="cancelNewPlot">取消</button>
          <button class="modal-btn confirm" @click="confirmNewPlot" :disabled="isSubmitting">
            <text v-if="!isSubmitting">确认</text>
            <text v-else>提交中...</text>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 未上传图片提示弹窗 -->
    <view class="modal" v-if="showUnuploadedWarning">
      <view class="modal-content warning">
        <view class="modal-header">
          <text class="modal-title">提示</text>
        </view>
        <view class="modal-body">
          <text>当前存在未上传的图片，是否继续新建小区？</text>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="cancelNewPlot">返回</button>
          <button class="modal-btn confirm" @click="forceNewPlot" :disabled="isSubmitting">
            <text v-if="!isSubmitting">确认</text>
            <text v-else>提交中...</text>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 切换小区弹窗 -->
    <view class="modal" v-if="showSwitchModal">
      <view class="modal-content switch-modal">
        <view class="modal-header">
          <text class="modal-title">切换小区</text>
        </view>
        <view class="modal-body">
          <!-- 加载状态提示 -->
          <view v-if="loadingCells" class="loading-tip">
            <text>小区数据加载中...</text>
          </view>
          
          <!-- 错误提示 -->
          <view v-if="loadError" class="error-tip">
            <text>{{ errorMessage }}</text>
            <button class="retry-btn" @click="loadCells">重试</button>
          </view>
          
          <!-- 小区列表 -->
          <scroll-view scroll-y class="cell-list" style="height: 500rpx;" v-if="!loadingCells && !loadError">
            <view 
              v-for="(cell, index) in visibleCells" 
              :key="cell.id" 
              class="cell-item"
              @click="selectCell(cell)"
            >
              <view class="cell-info">
                <text class="cell-id">小区编号：{{ cell.blockNum }}</text>
                <text class="cell-desc">小区描述：{{ cell.blockName }}</text>
              </view>
              <view class="cell-actions">
                <view class="cell-arrow"></view>
                <button class="delete-btn" @click.stop="showDeleteConfirm(cell, index)">删除</button>
              </view>
            </view>
            
            <!-- 空数据提示 -->
            <view v-if="visibleCells.length === 0" class="empty-tip">
              <text>暂无小区数据</text>
            </view>
          </scroll-view>
          
          <!-- 分页控件 -->
          <view class="pagination" v-if="totalPages > 1">
            <button class="page-btn prev" @click="prevPage" :disabled="currentPage === 1">上一页</button>
            <text class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</text>
            <button class="page-btn next" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showSwitchModal = false">取消</button>
        </view>
      </view>
    </view>
    
    <!-- 删除确认弹窗 -->
    <view class="modal" v-if="showDeleteDialog">
      <view class="modal-content delete-modal">
        <view class="modal-header">
          <text class="modal-title">删除确认</text>
        </view>
        <view class="modal-body">
          <text>确定要删除小区 {{ deleteCellInfo.blockNum }} 吗？</text>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showDeleteDialog = false">取消</button>
          <button class="modal-btn confirm" @click="confirmDeleteCell" :disabled="isDeleting">
            <text v-if="!isDeleting">确认删除</text>
            <text v-else>删除中...</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>
<script>
export default {
  data() {
    return {
      task: {
        id: '1937794845536321538',
        taskName: '田间任务调查2',
        position: ''
      },
      plotDescription: '',
      images: [],
      // 新增分页相关数据
      currentPage: 1,
      pageSize: 10, // 修改为每页10条记录
      // 其他原有数据
      showNewPlotModal: false,
      showUnuploadedWarning: false,
      newPlotId: '',
      newPlotDesc: '',
      isSubmitting: false,
      baseUrl: 'https://larsc.hzau.edu.cn/prod-api',
      
      // 切换小区相关数据
      showSwitchModal: false,
      loadingCells: false,
      loadError: false,
      errorMessage: '',
      totalCells: 0,
      visibleCells: [],
      
      // 删除相关数据
      showDeleteDialog: false,
      deleteCellInfo: {},
      isDeleting: false
    }
  },
  computed: {
    // 计算总页数
    totalPages() {
      return Math.ceil(this.totalCells / this.pageSize);
    },
    // 计算当前页显示的图片列表
    filteredImages() {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      return this.images.slice(startIndex, endIndex);
    }
  },
   onLoad(options) {
      this.task.id = options.id || this.task.id;
      this.task.taskName = decodeURIComponent(options.desc || this.task.taskName);
      this.loadCells().then(() => {
        if (this.visibleCells.length > 0) {
          const firstCell = this.visibleCells[0];
          this.task.position = firstCell.blockNum;
          this.plotDescription = firstCell.blockName;
          uni.setStorageSync('blockId', firstCell.id);
          uni.setStorageSync('blockNum', firstCell.blockNum);
          this.loadImages(); // 初始化加载图片
        }
      });
    },
    
    onShow() {
      // 从页面返回时重新加载图片
      if (uni.getStorageSync('blockId')) {
        this.loadImages();
      }
    },
    
    methods: {
      // 修改后的loadImages方法
      async loadImages() {
        const blockId = uni.getStorageSync('blockId');
        if (!blockId) {
          console.error('未获取到blockId');
          return;
        }
        
        try {
          const token = uni.getStorageSync('token');
          if (!token) {
            throw new Error('用户未登录');
          }
          
          // 清空现有图片数据
          this.images = [];
          
          const response = await uni.request({
            url: `${this.baseUrl}/plant-disease/blockList?blockId=${blockId}`,
            method: 'GET',
            header: {
              'Authorization': token,
              'Accept': '*/*'
            }
          });
          
          let res = Array.isArray(response) ? response[0] : response;
          
          if (res.statusCode === 200 && res.data?.code === 200) {
            // 解析接口返回的imageNum作为图片编号
            this.images = (res.data.data || []).map(item => ({
              ...item,
              imageNum: item.imageNum || `未命名_${item.id}`,
              selected: false
            }));
            
            // 重置分页
            this.currentPage = 1;
          } else {
            throw new Error(res.data?.msg || '加载图片数据失败');
          }
        } catch (error) {
          console.error('加载图片数据失败:', error);
          uni.showToast({
            title: error.message || '网络请求失败',
            icon: 'none'
          });
        }
      },
      
      // 修改后的handleRefresh方法
      async handleRefresh() {
        uni.showLoading({ title: '刷新中...' });
        try {
          await this.loadImages();
          uni.showToast({
            title: '刷新成功',
            icon: 'success'
          });
        } catch (error) {
          console.error('刷新失败:', error);
          uni.showToast({
            title: error.message || '刷新失败',
            icon: 'none'
          });
        } finally {
          uni.hideLoading();
        }
      },
      
      // 修改后的selectCell方法
      selectCell(cell) {
        // 清除之前选中的图片
        this.images = [];
        
        this.task.position = cell.blockNum;
        this.plotDescription = cell.blockName;
        uni.setStorageSync('blockId', cell.id);
        uni.setStorageSync('blockNum', cell.blockNum);
        
        this.showSwitchModal = false;
        uni.showToast({
          title: `已切换到小区: ${cell.blockNum}`,
          icon: 'success'
        });
        
        // 加载新小区的图片
        this.loadImages();
      },
    
    async loadImages() {
      const blockId = uni.getStorageSync('blockId');
      if (!blockId) return;
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
        const response = await uni.request({
          url: `${this.baseUrl}/plant-disease/blockList?blockId=${blockId}`,
          method: 'GET',
          header: {
            'Authorization': token,
            'Accept': '*/*'
          }
        });
        
        let res = Array.isArray(response) ? response[0] : response;
        
        if (res.statusCode === 200 && res.data?.code === 200) {
          // 解析接口返回的imageNum作为图片编号
          this.images = (res.data.data || []).map(item => ({
            ...item,
            // 确保imageNum存在，避免undefined
            imageNum: item.imageNum || `未命名_${item.id}`
          }));
        } else {
          throw new Error(res.data?.msg || '加载图片数据失败');
        }
      } catch (error) {
        console.error('加载图片数据失败:', error);
        uni.showToast({
          title: error.message || '网络请求失败',
          icon: 'none'
        });
      }
    },
    
    goBack() {
      uni.navigateBack();
    },
    
    toggleSelect(img) {
      img.selected = !img.selected;
    },
    
    getStatusText(status) {
      const map = {
        new: '新建',
        started: '进行中',
        ended: '已完成',
        uploaded: '已上传',
        notUploaded: '未上传'
      };
      return map[status] || status;
    },
    
    
    // 查看单张图片详情
    viewImageDetail(img) {
      if (!img.imageNum) {
        uni.showToast({
          title: '图片编号不存在',
          icon: 'none'
        });
        return;
      }
      
      uni.navigateTo({
        url: `/pages/result/result?` +
             `taskId=${this.task.id}&` +
             `taskName=${this.task.taskName}&` +
             `plotId=${img.blockId || ''}&` +
             `plotName=${img.blockName || ''}&` +
             `imgId=${img.imageNum}&` +
             `branchTaskId=${this.task.id}&` +
             `blockId=${img.blockId || ''}&` +
             `imageNum=${img.imageNum}`
      });
    },
    
    handleView() {
      const selected = this.images.filter(img => img.selected);
      if (selected.length !== 1) {
        uni.showToast({
          title: '请选择一张图片查看',
          icon: 'none'
        });
        return;
      }
      
      this.viewImageDetail(selected[0]);
    },
    
    async handleDelete() {
      const selected = this.images.filter(img => img.selected);
      if (selected.length === 0) {
        uni.showToast({
          title: '请先选择要删除的图片',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '确认删除',
        content: `确定要删除选中的${ selected.length }张图片吗？`,
        success: async (res) => {
          if (res.confirm) {
            const token = uni.getStorageSync('token');
            if (!token) {
              uni.showToast({
                title: '请先登录',
                icon: 'none'
              });
              return;
            }

            for (const img of selected) {
              try {
                const response = await uni.request({
                  url: `${this.baseUrl}/plant-disease/${img.id}`,
                  method: 'POST',
                  header: {
                    'Authorization': token,
                    'Accept': '*/*'
                  }
                });

                let res = Array.isArray(response) ? response[0] : response;

                if (res.statusCode === 200) {
                  console.log(`图片 ${img.id} 删除成功`);
                } else {
                  throw new Error(res.data?.msg || '删除图片失败');
                }
              } catch (error) {
                console.error(`删除图片 ${img.id} 失败:`, error);
                uni.showToast({
                  title: error.message || '删除图片失败',
                  icon: 'none'
                });
              }
            }

            // 重新加载图片数据
            await this.loadImages();
            uni.showToast({ title: '删除成功' });
          }
        }
      });
    },
    
    goToCollect() {
      uni.setStorageSync('branchTaskId', this.task.id);
      uni.setStorageSync('branchTaskName', this.task.taskName);
      uni.setStorageSync('blockNum', this.task.position);
      uni.setStorageSync('blockName', this.plotDescription);
      
      uni.navigateTo({
        url: `/pages/collect/collect?taskId=${this.task.id}`
      });
    },
    
    checkUnuploadedImages() {
      return this.images.some(img => img.status === 'notUploaded');
    },
    
    cancelNewPlot() {
      this.showNewPlotModal = false;
      this.showUnuploadedWarning = false;
      this.newPlotId = '';
      this.newPlotDesc = '';
      this.isSubmitting = false;
    },
    
    async addNewPlot() {
      try {
        this.isSubmitting = true;
        
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          });
          this.isSubmitting = false;
          return;
        }
        
        const response = await uni.request({
          url: `${this.baseUrl}/block/add`,
          method: 'POST',
          header: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          },
          data: {
            branchTaskId: this.task.id,
            blockNum: this.newPlotId,
            blockName: this.newPlotDesc,
            remark: this.newPlotDesc
          }
        });
        
        let res = Array.isArray(response) ? response[0] : response;
        
        if (res.data?.code === 200) {
          this.task.position = this.newPlotId;
          this.plotDescription = this.newPlotDesc;
          this.images = [];
          uni.showToast({
            title: '小区创建成功',
            icon: 'success'
          });
          this.cancelNewPlot();
        } else {
          const errorMsg = res.data?.msg || '创建小区失败';
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('创建小区失败:', error);
        uni.showToast({
          title: error.message || '创建小区失败',
          icon: 'none'
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    
    confirmNewPlot() {
      if (!this.newPlotId) {
        uni.showToast({
          title: '请输入小区编号',
          icon: 'none'
        });
        return;
      }
      
      if (this.checkUnuploadedImages()) {
        this.showNewPlotModal = false;
        this.showUnuploadedWarning = true;
      } else {
        this.addNewPlot();
      }
    },
    
    forceNewPlot() {
      this.addNewPlot();
    },
    
    // 切换小区相关方法
    openSwitchModal() {
      this.showSwitchModal = true;
      this.currentPage = 1;
      this.loadCells();
    },
    
    async loadCells() {
      this.loadingCells = true;
      this.loadError = false;
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
        const params = {
          currentPageCount: this.currentPage,
          pageSize: this.pageSize,
          branchTaskId: this.task.id
        };
        
        const response = await uni.request({
          url: `${this.baseUrl}/block/blockList`,
          method: 'GET',
          header: {
            'Authorization': token,
            'Accept': '*/*'
          },
          data: params
        });
        
        let res = Array.isArray(response) ? response[0] : response;
        
        if (res.statusCode === 200 && res.data?.code === 200) {
          const apiData = res.data.data;
          this.visibleCells = (apiData.records || []).map(item => ({
            id: item.id,
            blockNum: item.blockNum,
            blockName: item.blockName,
            remark: item.remark
          }));
          
          this.totalCells = apiData.total || 0;
        } else {
          throw new Error(res.data?.msg || '加载小区数据失败');
        }
      } catch (error) {
        console.error('加载小区数据失败:', error);
        this.loadError = true;
        this.errorMessage = error.message || '网络请求失败';
        this.visibleCells = [];
      } finally {
        this.loadingCells = false;
      }
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadCells();
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadCells();
      }
    },
    
    selectCell(cell) {
      this.task.position = cell.blockNum;
      this.plotDescription = cell.blockName;
      uni.setStorageSync('blockId', cell.id);
      console.log('blockId', cell.id);
      uni.setStorageSync('blockNum', cell.blockNum);
      console.log('blockNum', cell.blockNum);
      this.showSwitchModal = false;
      uni.showToast({
        title: `已切换到小区: ${cell.blockNum}`,
        icon: 'success'
      });
      this.loadImages();
    },
    
    // 显示删除确认
    showDeleteConfirm(cell, index) {
      uni.vibrateShort();
      this.deleteCellInfo = cell;
      this.showDeleteDialog = true;
    },
    // 确认删除小区
    async confirmDeleteCell() {
      if (this.isDeleting) return;
      
      try {
        this.isDeleting = true;
        const token = uni.getStorageSync('token');
        
        const response = await uni.request({
          url: `${this.baseUrl}/block/${this.deleteCellInfo.id}`,
          method: 'POST',
          header: {
            'Authorization': token,
            'Accept': '*/*'
          }
        });
        
        let res = Array.isArray(response) ? response[0] : response;
        
        if (res.statusCode === 200) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadCells();
          
          // 如果删除的是当前小区，重置为默认值
          if (this.task.position === this.deleteCellInfo.blockNum) {
            this.task.position = '';
            this.plotDescription = '';
          }
        } else {
          throw new Error(res.data?.msg || '删除失败');
        }
      } catch (error) {
        console.error('删除小区失败:', error);
        uni.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        });
      } finally {
        this.isDeleting = false;
        this.showDeleteDialog = false;
      }
    },
  }
}
</script>
<style scoped>
/* 样式部分保持不变 */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}
/* 导航栏样式 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  height: 90rpx;
}
.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}
.icon {
  font-size: 36rpx;
  color: #666;
}
/* 按钮容器 */
.new-plot-btn-container {
  padding: 20rpx 30rpx;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.new-plot-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  background-color: #4CAF50;
  color: white;
  font-size: 28rpx;
  border: none;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.switch-plot-btn {
  background-color: #2196F3;
}
/* 任务信息卡片 */
.info-card {
  background-color: #4CAF50;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 20rpx 30rpx;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.15);
}
.info-item {
  display: flex;
  margin-bottom: 20rpx;
  align-items: center;
}
.info-label {
  width: 160rpx;
  font-size: 28rpx;
}
.info-value {
  flex: 1;
  font-size: 28rpx;
}
/* 图片列表容器 */
.image-list-container {
  flex: 1;
  padding: 20rpx 30rpx;
}
.image-list {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  height: calc(100vh - 400rpx); /* 计算高度以适配页面 */
}
.image-item {
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.image-info-list {
  flex: 1;
}
.image-status {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}
.image-id {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  cursor: pointer;
}
.selected-mask-list {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(7, 193, 96, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.selected-icon {
  color: white;
  font-size: 32rpx;
}
/* 底部操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1rpx solid #f0f0f0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}
.action-btn {
  flex: 1;
  margin: 0 10rpx;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}
.upload {
  background-color: #2196F3;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(33, 150, 243, 0.2);
}
.view {
  background-color: #4CAF50;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.2);
}
.delete {
  background-color: #F44336;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(244, 67, 54, 0.2);
}
.capture {
  background-color: #FF9800;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.2);
}
/* 弹窗通用样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-content {
  background-color: #fff;
  width: 80%;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  text-align: center;
}
.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
.modal-body {
  padding: 30rpx;
}
.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}
.modal-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: none;
  border: none;
  font-size: 30rpx;
  font-weight: 500;
}
.modal-btn.cancel {
  color: #999;
}
.modal-btn.confirm {
  color: #4CAF50;
}
/* 新建小区弹窗特定样式 */
.new-plot-modal {
  width: 85%;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.form-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.form-label {
  width: 180rpx;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}
.form-input {
  flex: 1;
  height: 70rpx;
  background-color: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  border: none;
}
/* 切换小区弹窗特定样式 */
.switch-modal {
  width: 85%;
}
.cell-list {
  margin-bottom: 30rpx;
}
.cell-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  transition: all 0.2s;
  position: relative;
}
.cell-item:active {
  background-color: #f9f9f9;
  transform: scale(0.98);
}
.cell-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.cell-id {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 10rpx;
}
.cell-desc {
  font-size: 26rpx;
  color: #666;
}
.cell-actions {
  display: flex;
  align-items: center;
  gap: 15rpx;
}
.cell-arrow {
  font-size: 32rpx;
  color: #999;
}
.delete-btn {
  background-color: #F44336;
  color: white;
  border: none;
  border-radius: 30rpx;
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80rpx;
}
/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20rpx 0;
  padding: 20rpx 0;
  border-top: 1rpx solid #f5f5f5;
  border-bottom: 1rpx solid #f5f5f5;
}
.page-btn {
  padding: 12rpx 30rpx;
  font-size: 28rpx;
  margin: 0 15rpx;
  background-color: #4CAF50;
  color: white;
  border-radius: 8rpx;
  border: none;
  transition: all 0.2s;
}
.page-btn:hover {
  background-color: #45a049;
}
.page-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
.page-info {
  font-size: 28rpx;
  margin: 0 20rpx;
  color: #666;
}
/* 新增样式 */
.loading-tip, .error-tip, .empty-tip {
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  flex-direction: column;
}
.error-tip {
  color: #f44336;
}
.retry-btn {
  margin-top: 20rpx;
  padding: 10rpx 30rpx;
  background-color: #4CAF50;
  color: white;
  border-radius: 8rpx;
  border: none;
  font-size: 28rpx;
}
</style>