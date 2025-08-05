<template>
  <view class="tab-bar">
    <view class="tab-item" @click="goTo('index')">
      <image :src="current === 'index' ? homeActive : home" />
      <text :class="{ active: current === 'index' }">任务</text>
    </view>
    <view class="tab-item" @click="goTo('message')">
      <image :src="current === 'message' ? msgActive : msg" />
      <text :class="{ active: current === 'message' }">我的</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    current: String
  },
  data() {
    return {
      home: '/static/tabs/home.png',
      homeActive: '/static/tabs/home-active.png',
      msg: '/static/tabs/member.png',
      msgActive: '/static/tabs/member-active.png'
    }
  },
methods: {
  goTo(page) {
    if (this.current !== page) {
      uni.reLaunch({ url: `/pages/${page}/${page}` })
    }
  }
}

}
</script>

<style>
.tab-bar {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 100rpx;
  background: #fff;
  display: flex;
  border-top: 1px solid #ddd;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 10rpx 0;
}
.tab-item image {
  width: 50rpx;
  height: 50rpx;
}
.tab-item text {
  display: block;
  font-size: 24rpx;
  color: #666;
}
.tab-item text.active {
  color: #007AFF;
}
</style>
