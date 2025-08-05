<template>
  <view class="container">
    <!-- 遍历所有任务分类 -->
    <view v-for="category in taskCategories" :key="category.id" class="category-wrapper">
      <view class="category-card" @click="toggleCategory(category.id)">
        <text class="category-title">{{ category.name }}</text>
        <view class="arrow" :class="{ 'is-open': activeCategoryId === category.id }"></view>
      </view>
      
      <!-- 任务列表 -->
      <view v-if="activeCategoryId === category.id" class="task-list-container">
        <view v-if="category.loading" class="task-card empty">
          加载中...
        </view>
        <view v-else-if="!category.tasks || !category.tasks.length" class="task-card empty">
          暂无任务
        </view>
        <view 
          v-else 
          v-for="(task, index) in category.tasks" 
          :key="task.id" 
          class="task-card" 
          @click="goToDetail(task, category.value)"
          @longpress="showDeleteConfirm(task, index)"
        >
          <text class="task-title">{{ task.name }}</text>
        </view>
        
        <!-- 添加任务输入框 -->
        <view class="add-task-input" v-if="showAddTask">
          <input 
            class="input-field" 
            v-model="newTaskName" 
            placeholder="输入任务名称" 
            placeholder-class="placeholder"
            focus
            @input="handleInput"
          />
          <view class="confirm-btn" v-if="newTaskName.trim()" @click="addTask">
            <text class="confirm-icon">✓</text>
          </view>
        </view>
        
        <!-- 添加任务按钮 -->
        <view class="add-task-btn" @click="toggleAddTask">
          <text class="add-icon">+</text>
          <text class="add-text">添加任务</text>
        </view>
      </view>
    </view>
    
    <!-- 删除确认弹窗 -->
    <view class="modal" v-if="showDeleteModal">
      <view class="modal-content">
        <view class="modal-body">
          <text>确定删除任务"{{ deleteTaskName }}"吗？</text>
        </view>
        <view class="modal-footer">
          <view class="modal-btn cancel" @click="cancelDelete">取消</view>
          <view class="modal-btn confirm" @click="confirmDelete">删除</view>
        </view>
      </view>
    </view>
    
    <CustomTabBar current="index" />
  </view>
</template>

<script>
import CustomTabBar from '@/components/tabBar/tabBar.vue'
import { request } from '../../components/request'

export default {
  components: {
    CustomTabBar
  },
  data() {
    return {
      taskCategories: [
        {
          id: 2,
          name: '病害叶片采集',
          value: 'roast',
          tasks: [],
          loading: false,
          error: null
        },
      ],
      activeCategoryId: null,
      showAddTask: false,
      newTaskName: '',
      taskCounter: 4,
      showDeleteModal: false,
      deleteTaskName: '',
      deleteTaskIndex: -1,
      deleteTaskId: null,
      token: uni.getStorageSync('token')
    }
  },
  methods: {
    async toggleCategory(categoryId) {
      if (this.activeCategoryId === categoryId) {
        this.activeCategoryId = null
        this.showAddTask = false
        return
      }
      this.activeCategoryId = categoryId
      this.showAddTask = false
      const category = this.taskCategories.find(c => c.id === categoryId)
      if (!category) return
      if (category.tasks.length > 0 || category.loading) return
      await this.fetchTasks(category)
    },
    
    async fetchTasks(category) {
      category.loading = true;
      category.error = null;
      
      if (!this.token) {
        category.error = '未获取到Token，请重新登录';
        category.loading = false;
        return;
      }
      
      try {
        const res = await request({
          url: '/branchTask/branchTaskList',
          method: 'GET',
          headers: {
            'Authorization': this.token,
            'Accept': '*/*'
          },
          data: {
            currentPageCount: 1,
            pageSize: 10000,
            name: ''
          }
        });
        
        if (res.code === 200 && res.data && res.data.records) {
          category.tasks = res.data.records.map(record => ({
            id: record.id,
            name: record.name,
            description: record.name
          }));
        } else {
          throw new Error(res.msg || '获取任务失败');
        }
      } catch (error) {
        console.error('错误:', error);
        category.error = error.message || '请求失败，请重试';
      } finally {
        category.loading = false;
      }
    },

    goToDetail(task, typeValue) {
      uni.navigateTo({
        url: `/pages/task-detail/task-detail?id=${task.id}&type=${typeValue}&desc=${encodeURIComponent(task.description)}`
      })
    },
    
    toggleAddTask() {
      this.showAddTask = !this.showAddTask
      this.newTaskName = ''
    },
    
    handleInput() {
      // 输入时触发，用于响应式显示✓
    },
    
    async addTask() {
      if (!this.newTaskName.trim()) return;

      const category = this.taskCategories.find(c => c.id === this.activeCategoryId);
      if (!category) return;

      try {
        category.loading = true;
        
        const res = await request({
          url: '/branchTask/add',
          method: 'POST',
          headers: {
            'Authorization': this.token,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          },
          data: {
            name: this.newTaskName.trim()
          }
        });

        if (res.code === 200) {
          await this.fetchTasks(category);
          this.newTaskName = '';
          this.showAddTask = false;
          
          uni.showToast({
            title: '添加任务成功',
            icon: 'success'
          });
        } else {
          throw new Error(res.msg || '添加任务失败');
        }
      } catch (error) {
        console.error('添加任务错误:', error);
        uni.showToast({
          title: error.message || '添加任务失败',
          icon: 'none'
        });
      } finally {
        category.loading = false;
      }
    },
    
    showDeleteConfirm(task, index) {
      this.deleteTaskName = task.name
      this.deleteTaskIndex = index
      this.deleteTaskId = task.id
      this.showDeleteModal = true
    },
    
    cancelDelete() {
      this.showDeleteModal = false
      this.deleteTaskName = ''
      this.deleteTaskIndex = -1
      this.deleteTaskId = null
    },
    
    async confirmDelete() {
      if (!this.token) {
        uni.showToast({ title: '请先登录', icon: 'error' });
        return;
      }

      try {
        const res = await request({
          url: `/branchTask/${this.deleteTaskId}`,
          method: 'POST',
          headers: {
            'Authorization': this.token,
            'Accept': '*/*',
            'User-Agent': 'Apifox/1.0.0',
            'Host': 'larsc.hzau.edu.cn',
            'Connection': 'keep-alive'
          }
        });

        if (res.code === 'A0230') {
          uni.showToast({ title: '登录已过期', icon: 'error' });
          uni.navigateTo({ url: '/pages/login/login' });
          return;
        }

        // 成功处理逻辑
        const category = this.taskCategories.find(c => c.id === this.activeCategoryId);
        if (category) {
          category.tasks.splice(this.deleteTaskIndex, 1);
        }
        uni.showToast({ title: '删除成功', icon: 'success' });

      } catch (error) {
        console.error('删除失败:', error);
        uni.showToast({ title: '删除失败', icon: 'error' });
      } finally {
        this.showDeleteModal = false;
        this.deleteTaskName = '';
        this.deleteTaskIndex = -1;
        this.deleteTaskId = null;
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 50rpx 30rpx 120rpx;
}
.category-wrapper {
  margin-bottom: 30rpx;
}
.category-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ghostwhite;
  border-radius: 16rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}
.category-title {
  font-size: 48rpx;
  font-weight: bold;
}
.arrow {
  border: solid #555;
  border-width: 0 4rpx 4rpx 0;
  display: inline-block;
  padding: 8rpx;
  transform: rotate(45deg);
  transition: transform 0.3s ease;
}
.arrow.is-open {
  transform: rotate(-135deg);
}
.task-list-container {
  margin-top: -15rpx;
  padding-top: 25rpx; 
  background-color: #ffffff;
  border-radius: 0 0 16rpx 16rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04);
  animation: slideDown 0.3s ease-out; 
}
.task-card {
  background: #fff;
  padding: 30rpx;
  margin: 0 20rpx 20rpx; 
  border-radius: 12rpx;
  border: 1rpx solid #f0f0f0;
  text-align: center;
}
.task-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}
.task-card.empty {
  color: #999;
  border: 1rpx dashed #ddd;
}
.add-task-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80rpx;
  margin: 20rpx;
  background-color: #f0f0f0;
  border-radius: 40rpx;
  color: #666;
}
.add-icon {
  font-size: 36rpx;
  margin-right: 10rpx;
}
.add-text {
  font-size: 28rpx;
}
.add-task-input {
  display: flex;
  align-items: center;
  margin: 20rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 40rpx;
  overflow: hidden;
}
.input-field {
  flex: 1;
  height: 80rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}
.confirm-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}
.confirm-icon {
  font-size: 36rpx;
  color: #4CAF50;
}
.placeholder {
  color: #ccc;
}
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
  z-index: 1000;
}
.modal-content {
  width: 80%;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.modal-body {
  padding: 40rpx 30rpx;
  text-align: center;
  font-size: 32rpx;
}
.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}
.modal-btn {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 32rpx;
}
.modal-btn.cancel {
  border-right: 1rpx solid #f0f0f0;
  color: #666;
}
.modal-btn.confirm {
  color: #f44336;
  font-weight: bold;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.add-task-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80rpx;
  width: 80rpx;
  margin: 20rpx auto;
  background-color: #f8f8f8;
  border-radius: 40rpx;
  color: #666;
}
.add-icon {
  font-size: 40rpx;
  margin-right: 0;
}
.add-text {
  display: none;
}
.add-task-input {
  margin: 20rpx;
  border: 1rpx solid #f0f0f0;
  border-radius: 12rpx;
  overflow: hidden;
}
.input-field {
  height: 80rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
  background: #fff;
}
.confirm-btn {
  background-color: #f8f8f8;
}
</style>