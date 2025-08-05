<template>
  <view class="container">
    <view class="header">
      <text class="title">离线数据上传</text>
    </view>

    <view v-if="records.length === 0" class="empty">
      <text>暂无离线采集数据</text>
      <button @click="goBack" class="btn back">返回</button>
    </view>

    <view v-else>
      <scroll-view scroll-y style="max-height: 60vh;">
        <view class="record" v-for="item in records" :key="item.id">
          <image :src="item.image" class="preview-img" mode="aspectFill" />
          <view class="info">
            <text>经纬度: {{ item.longitude }}, {{ item.latitude }}</text>
            <text>病害类型: {{ item.diseaseType }}</text>
            <text>等级: {{ item.diseaseLevel }}</text>
            <text>备注: {{ item.remark }}</text>
          </view>
        </view>
      </scroll-view>

      <button @click="uploadAll" class="btn upload">上传全部</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      records: []
    };
  },
  onShow() {
    const stored = uni.getStorageSync('offlineUploads') || [];
    this.records = stored;
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },

    async uploadAll() {
      if (!this.records.length) return;

      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '未登录，无法上传', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '上传中...' });

      try {
        for (let item of this.records) {
          // 1. 上传图片
          const uploadPicRes = await uni.uploadFile({
            url: 'https://larsc.hzau.edu.cn/prod-api/plant-disease/uploadPic',
            filePath: item.image,
            name: 'file',
            header: { Authorization: token }
          });

          if (uploadPicRes.statusCode !== 200) {
            throw new Error('图片上传失败');
          }

          let imageUrl = '';
          try {
            const result = JSON.parse(uploadPicRes.data);
            imageUrl = result.data?.url || '';
          } catch {
            imageUrl = uploadPicRes.data;
          }

          if (!imageUrl) throw new Error('无法解析图片URL');

          // 2. 上传表单信息
          const infoRes = await uni.request({
            url: 'https://larsc.hzau.edu.cn/prod-api/plant-disease/uploadInfo',
            method: 'POST',
            header: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              imageUrl,
              longitude: item.longitude,
              latitude: item.latitude,
              diseaseType: item.diseaseType,
              diseaseLevel: item.diseaseLevel,
              remark: item.remark
            }
          });

          if (infoRes.statusCode !== 200 || infoRes.data.code !== 200) {
            throw new Error(infoRes.data.msg || '信息上传失败');
          }
        }

        // 清除本地缓存
        uni.removeStorageSync('offlineUploads');
        this.records = [];

        uni.hideLoading();
        uni.showToast({ title: '全部上传成功', icon: 'success' });
        setTimeout(() => {
          uni.navigateBack();
        }, 1000);
      } catch (err) {
        uni.hideLoading();
        uni.showToast({ title: `上传失败：${err.message}`, icon: 'none' });
      }
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}
.header {
  font-size: 18px;
  font-weight: bold;
  padding-bottom: 20rpx;
}
.empty {
  text-align: center;
  padding: 100rpx 0;
}
.preview-img {
  width: 100%;
  height: 200rpx;
  border-radius: 8px;
}
.record {
  background: #fff;
  margin-bottom: 20rpx;
  padding: 10rpx;
  border-radius: 8px;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}
.info {
  font-size: 12px;
  color: #555;
  margin-top: 10rpx;
  line-height: 1.6;
}
.btn {
  margin-top: 30rpx;
  background-color: #07C160;
  color: #fff;
  padding: 14rpx;
  text-align: center;
  border-radius: 8px;
}
.back {
  background-color: #666;
}
.upload {
  background-color: #1989FA;
}
</style>
