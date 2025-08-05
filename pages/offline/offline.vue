<template>
  <view class="container">
    <view class="header">
      <text class="title">离线采集</text>
      <text class="status">{{ isOnline ? '已联网' : '离线模式' }}</text>
    </view>

    <!-- 图片预览 -->
    <view class="preview-area" v-if="imageSrc">
      <image :src="imageSrc" class="preview-img" mode="aspectFill" />
    </view>

    <!-- 表单区域 -->
    <view class="form-container">
      <view class="form-item">
        <text class="label">任务名：</text>
        <input class="input" v-model="taskName" placeholder="请输入任务名" />
      </view>
      <view class="form-item">
        <text class="label">小区名：</text>
        <input class="input" v-model="plotName" placeholder="请输入小区名" />
      </view>
      <view class="form-item">
        <text class="label">经度：</text>
        <input class="input" v-model="longitude" placeholder="自动获取" readonly />
      </view>
      <view class="form-item">
        <text class="label">纬度：</text>
        <input class="input" v-model="latitude" placeholder="自动获取" readonly />
      </view>
      <view class="form-item">
        <text class="label">病害类型：</text>
        <picker :range="diseaseTypes" @change="onDiseaseChange">
          <view class="picker-text">
            {{ diseaseTypes[diseaseIndex] || '请选择病害类型' }}
          </view>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">等级：</text>
        <input class="input" type="number" v-model="diseaseLevel" placeholder="1-9" />
      </view>
      <view class="form-item">
        <text class="label">备注：</text>
        <input class="input" v-model="remark" placeholder="请输入备注" />
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="button-area">
      <button @click="takePhoto" class="btn camera">拍照</button>
      <button @click="chooseFromAlbum" class="btn album">选择图片</button>
      <button @click="saveOfflineData" class="btn save">保存本地</button>
      <button @click="goBack" class="btn goback">返回登录</button>
	  <button @click="goToRecordView" class="btn record">查看记录</button>

	</view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isOnline: true,
      imageSrc: '',
      longitude: '',
      latitude: '',
      diseaseTypes: ['黄叶病', '锈斑病', '其他'],
      diseaseIndex: 0,
      diseaseLevel: '',
      remark: '',
      taskName: '',
      plotName: ''
    };
  },
  onShow() {
    this.checkNetwork();
    this.getLocation();
  },
  methods: {
    checkNetwork() {
      uni.getNetworkType({
        success: (res) => {
          this.isOnline = res.networkType !== 'none';
        }
      });
    },
    getLocation() {
      uni.getLocation({
        type: 'wgs84',
        success: (res) => {
          this.longitude = res.longitude.toFixed(6);
          this.latitude = res.latitude.toFixed(6);
        },
        fail: () => {
          this.longitude = '';
          this.latitude = '';
        }
      });
    },
	  takePhoto() {
	  uni.chooseImage({
		count: 1,
		sourceType: ['camera'],
		success: (res) => {
		  this.imageSrc = res.tempFilePaths[0];
		  this.getLocation();
		},
		fail: () => {
		  uni.showToast({ title: '拍照失败', icon: 'none' });
		}
	  });
	},
    chooseFromAlbum() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          this.imageSrc = res.tempFilePaths[0];
          this.getLocation();
        }
      });
    },
    onDiseaseChange(e) {
      this.diseaseIndex = e.detail.value;
    },
    saveOfflineData() {
      if (!this.taskName || !this.plotName || !this.imageSrc || !this.diseaseLevel) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }

      const key = `taskData_${this.taskName}_${this.plotName}`;
      const record = {
        id: Date.now(),
        image: this.imageSrc,
        longitude: this.longitude,
        latitude: this.latitude,
        diseaseType: this.diseaseTypes[this.diseaseIndex],
        diseaseLevel: this.diseaseLevel,
        remark: this.remark,
        timestamp: new Date().toISOString()
      };

      const stored = uni.getStorageSync(key) || [];
      stored.push(record);
      uni.setStorageSync(key, stored);

      uni.showToast({ title: '已保存到本地', icon: 'success' });
      this.resetForm();
    },
    goBack() {
      uni.reLaunch({
        url: '/pages/login/login'
      });
    },
	goToRecordView() {
	  uni.navigateTo({
	    url: '/pages/record/record'
	  });
	},

    resetForm() {
      this.imageSrc = '';
      this.diseaseLevel = '';
      this.remark = '';
      this.taskName = '';
      this.plotName = '';
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
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20rpx;
}
.status {
  font-size: 12px;
  color: #999;
}
.preview-img {
  width: 100%;
  height: 400rpx;
  border-radius: 8px;
  margin-bottom: 20rpx;
}
.form-container {
  margin-bottom: 30rpx;
}
.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.label {
  width: 120rpx;
}
.input, .picker-text {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.button-area .btn {
  margin-bottom: 20rpx;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  color: #000;
  height: 70px;
}
.camera { background: #ffffcc; }
.album { background: #ccffff; }
.save { background: #ffcccc; }
.goback { background: #ccccff; }
.record{ background: #fffccc;}
</style>
