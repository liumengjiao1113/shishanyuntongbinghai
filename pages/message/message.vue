<template>
  <view class="container">
    <!-- 用户信息部分 -->
    <view class="user-info">
      <!-- 头像 -->
      <image class="avatar" src="https://example.com/default-avatar.png"></image>
      <!-- 用户名 -->
      <text class="username">{{ userInfo.username }}</text>
    </view>

    <!-- 功能按钮部分 -->
    <view class="function-buttons">
      <button class="btn" @click="uploadRecord">上传记录</button>
      <button class="btn btn-danger" @click="logout">退出登录</button>
    </view>
  </view>
  <CustomTabBar current="message" />
</template>

<script>
import CustomTabBar from '@/components/tabBar/tabBar.vue'

export default {
  components: { CustomTabBar },
  data() {
    return {
      userInfo: {
        // 从本地存储获取用户名
        username: uni.getStorageSync('username') || '未登录用户'
      }
    }
  },
  methods: {
    uploadRecord() {
      uni.showToast({
        title: '跳转上传记录页面',
        icon: 'none'
      })
      // 示例跳转，可换成你自己的上传记录页
      // uni.navigateTo({ url: '/pages/upload-record/upload-record' })
    },
    logout() {
      uni.showModal({
        title: '提示',
        content: '确认退出登录？',
        success: (res) => {
          if (res.confirm) {
            // 清除本地缓存等逻辑
            uni.clearStorageSync()
            uni.reLaunch({ url: '/pages/login/login' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 40rpx;
  padding-bottom: 120rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  box-sizing: border-box;
}

.user-info {
  background: #fff;
  padding: 60rpx 30rpx;
  border-radius: 16rpx;
  margin-bottom: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  margin-bottom: 20rpx;
}

.username {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.function-buttons {
  display: flex;
  flex-direction: column;
}

.btn {
  width: 100%;
  margin-top: 20rpx;
  background-color: #2796f2;
  color: #fff;
  font-size: 30rpx;
  border-radius: 8rpx;
  padding: 20rpx 0;
  text-align: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.btn-danger {
  background-color: #ffaaff;
}
</style>