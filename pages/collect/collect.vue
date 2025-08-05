<template>
  <view class="container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">玉米叶片采集</text>
      <view class="connection-status">
        <text>{{ locationStatus }}</text>
      </view>
    </view>
    <!-- 相机预览区域 -->
    <view class="camera-container" v-if="showCamera">
      <camera 
        class="camera" 
        device-position="back" 
        flash="off"
        style="height: 70vh;"
      ></camera>
      <!-- 九宫格辅助线 -->
      <view class="grid-overlay">
        <view class="grid-line vertical-line-1"></view>
        <view class="grid-line vertical-line-2"></view>
        <view class="grid-line horizontal-line-1"></view>
        <view class="grid-line horizontal-line-2"></view>
      </view>
    </view>
    <!-- 照片预览区域 -->
    <view class="preview-container" v-if="!showCamera && imageSrc">
      <image :src="imageSrc" class="preview-image" mode="aspectFill" />
      <view class="oss-url" v-if="ossUrl">
        <text>OSS URL: {{ ossUrl }}</text>
      </view>
      <view class="upload-status" v-if="uploadStatus">
        <text>{{ uploadStatus }}</text>
      </view>
    </view>
    <!-- 操作按钮区域 -->
    <view class="button-area">
      <!-- 相机模式下的按钮 -->
      <template v-if="showCamera">
        <button class="action-btn capture" @click="takePhoto">拍照</button>
        <button class="action-btn cancel" @click="cancelCamera">返回</button>
      </template>
      <!-- 预览模式下的按钮 -->
      <template v-if="!showCamera && imageSrc">
        <view class="form-container">
          <view class="form-item">
            <text class="label">经度：</text>
            <input class="input" v-model="longitude" placeholder="请输入经度" readonly />
          </view>
          <view class="form-item">
            <text class="label">纬度：</text>
            <input class="input" v-model="latitude" placeholder="请输入纬度" readonly />
          </view>
          <view class="form-item">
            <text class="label">图片编号：</text>
            <input class="input" v-model="imgId" placeholder="自动生成" readonly />
          </view>
          <view class="form-item">
            <text class="label">样品编号：</text>
            <input class="input" v-model="sampleId" placeholder="请输入样品编号" />
          </view>
          <view class="form-item">
            <text class="label">病害类型：</text>
            <picker 
              class="picker"
              mode="selector" 
              :range="diseaseTypes"
              @change="onDiseaseChange"
            >
              <view class="picker-text">
                {{ diseaseTypes[diseaseIndex] || '请选择病害类型' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="label">病害等级：</text>
            <input 
              class="input" 
              v-model="diseaseLevel" 
              placeholder="请输入病害等级(1-9)" 
              type="number"
              max="9"
              min="1"
            />
          </view>
          <view class="form-item">
            <text class="label">备注：</text>
            <input class="input" v-model="remark" placeholder="请输入备注信息" />
          </view>
        </view>
        <button class="action-btn confirm" @click="confirmImage">确认上传</button>
        <button class="action-btn retake" @click="retakePhoto">重新拍摄</button>
      </template>
      <!-- 初始状态下的按钮 -->
      <template v-if="!showCamera && !imageSrc">
        <button class="action-btn capture" @click="startCamera">调用相机拍摄</button>
        <button class="action-btn album" @click="chooseFromAlbum">从图库上传</button>
      </template>
    </view>
  </view>
</template>

<script>
import CustomTabBar from '@/components/tabBar/tabBar.vue'
import { request } from '../../components/request'
export default {
  data() {
    return {
      showCamera: false,
      imageSrc: '',
      ossUrl: '',
      uploadStatus: '',
      taskId: '',
      locationStatus: '正在获取定位...',
      longitude: '114.1',
      latitude: '30.2',
      diseaseTypes: ['黄叶病', '锈斑病', '其他'],
      diseaseIndex: 0,
      diseaseLevel: '',
      imgId: '',
      sampleId: '', // 新增样品编号字段
      remark: '',   // 备注字段
      uploadedImageUrls: [], // 存储上传的图片URL
      blockNum: '', // 小区编号
      imageCounter: 1, // 图片计数器
      blockId: '' // 小区ID
    };
  },
  onLoad(options) {
    this.taskId = options.taskId || '';
    this.getLocation();
    this.initImageId();
  },
  methods: {
    startCamera() {
      this.showCamera = true;
      this.imageSrc = '';
      this.ossUrl = '';
      this.uploadStatus = '';
    },
    
    takePhoto() {
      const ctx = uni.createCameraContext();
      ctx.takePhoto({
        quality: 'high',
        success: (res) => {
          this.imageSrc = res.tempImagePath;
          this.showCamera = false;
          this.getLocation();
        },
        fail: (err) => {
          console.error('拍照失败:', err);
          uni.showToast({ title: '拍照失败，请重试', icon: 'none' });
        }
      });
    },
    
    cancelCamera() {
      this.showCamera = false;
      uni.navigateBack();
    },
    
    retakePhoto() {
      this.startCamera();
    },
    
    getLocation() {
      this.locationStatus = '正在获取定位...';
      uni.getLocation({
        type: 'wgs84',
        altitude: true,
        success: (res) => {
          this.longitude = res.longitude.toFixed(6);
          this.latitude = res.latitude.toFixed(6);
          this.locationStatus = '定位成功';
        },
        fail: (err) => {
          console.error('获取定位失败:', err);
          this.locationStatus = '定位失败';
          this.longitude = '114.353280';
          this.latitude = '30.477193';
          this.remark = '无';
        }
      });
    },
    
    onDiseaseChange(e) {
      const selectedIndex = e.detail.value;
      if (selectedIndex >= 0 && selectedIndex < this.diseaseTypes.length) {
        this.diseaseIndex = selectedIndex;
      } else {
        console.warn('无效的病害类型选择:', selectedIndex);
        this.diseaseIndex = 0;
      }
    },
    
    chooseFromAlbum() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          this.imageSrc = res.tempFilePaths[0];
          this.initImageId();
          this.getLocation();
        }
      });
    },
    
    // 初始化图片编号
    initImageId() {
      // 从本地存储获取正确的blockId和blockNum
      this.blockId = uni.getStorageSync('blockId') || '';
      this.blockNum = uni.getStorageSync('blockNum') || 'unknown';
      
      if (!this.blockNum || this.blockNum === 'unknown') {
        this.imgId = 'unknown_001';
        return;
      }
      
      // 从本地存储获取当前小区的图片计数器
      const counterKey = `imageCounter_${this.blockNum}`;
      this.imageCounter = uni.getStorageSync(counterKey) || 1;
      
      // 生成图片编号
      this.imgId = `${this.blockNum}_${this.imageCounter.toString().padStart(3, '0')}`;
    },
    
    // 确认上传图片
    async confirmImage() {
      if (!this.validateForm()) return;
      
      try {
        uni.showLoading({ title: '上传数据中...', mask: true });
        
        const token = uni.getStorageSync('token') || '';
        console.log('【调试】token:', token);
        
        const branchTaskId = uni.getStorageSync('branchTaskId');
        console.log('【调试】branchTaskId:', branchTaskId);
        
        // 修正blockId的获取键名
        this.blockId = uni.getStorageSync('blockId') || '';
        console.log('【调试】blockId:', this.blockId);
        
        const blockName = uni.getStorageSync('blockName');
        console.log('【调试】blockName:', blockName);
        
        // 拼接样品编号和备注
        const combinedRemark = `${this.sampleId || ''}#${this.remark || ''}`;
        
        // 1. 使用uni.uploadFile上传图片到远程服务器
        const uploadPicRes = await uni.uploadFile({
          url: 'https://larsc.hzau.edu.cn/prod-api/plant-disease/uploadPic',
          filePath: this.imageSrc,
          name: 'file',
          header: {
            'Authorization': token
          }
        });
        console.log('【调试】uploadPicRes原始响应:', uploadPicRes);
        
        if (uploadPicRes.statusCode !== 200) {
          throw new Error(`上传图片失败，状态码: ${uploadPicRes.statusCode}`);
        }
        try {
          let uploadPicData = {};
          
          // 尝试解析响应（支持不同格式的响应）
          try {
            uploadPicData = JSON.parse(uploadPicRes.data);
          } catch (parseErr) {
            // 如果解析JSON失败，尝试其他方式提取URL
            // 例如：假设响应是纯文本URL
            uploadPicData = { url: uploadPicRes.data };
            console.log('【调试】使用纯文本解析响应:', uploadPicData);
          }
          
          console.log('【调试】uploadPicData解析后:', uploadPicData);
          
          // 从响应中获取imageUrl（支持多种响应结构）
          const imageUrl = 
            uploadPicData.data?.url || 
            uploadPicData.url || 
            uploadPicData?.data || 
            uploadPicRes.data;
          
          if (!imageUrl) {
            throw new Error('未获取到图片URL');
          }
          
          console.log('【调试】imageUrl:', imageUrl);
          this.ossUrl = imageUrl;
          
          // 2. 上传图片相关信息到数据库
          const uploadInfoRes = await uni.request({
            url: 'https://larsc.hzau.edu.cn/prod-api/plant-disease/uploadInfo',
            method: 'POST',
            header: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              imageUrl,
              imageNum: this.imgId,
              longitude: this.longitude,
              latitude: this.latitude,
              branchTaskId,
              blockId: this.blockId,
              blockNum: this.blockNum, // 使用已初始化的blockNum
              diseaseType: this.diseaseTypes[this.diseaseIndex],
              diseaseLevel: this.diseaseLevel,
              remark: combinedRemark // 使用拼接后的备注
            }
          });
          console.log('【调试】uploadInfoRes响应:', uploadInfoRes);
          
          uni.hideLoading();
          
          if (uploadInfoRes.statusCode === 200 && uploadInfoRes.data.code === 200) {
            uni.showToast({ title: '上传成功', icon: 'success' });
            
            // 更新图片计数器
            const counterKey = `imageCounter_${this.blockNum}`;
            this.imageCounter++;
            uni.setStorageSync(counterKey, this.imageCounter);
            
            // 生成下一个图片编号
            this.imgId = `${this.blockNum}_${this.imageCounter.toString().padStart(3, '0')}`;
            
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            throw new Error(uploadInfoRes.data.msg || '上传图片信息失败');
          }
        } catch (parseError) {
          console.error('【错误】解析图片响应失败:', parseError);
          throw new Error('解析图片响应失败');
        }
      } catch (error) {
        uni.hideLoading();
        const errorMsg = error.message || '上传失败';
        uni.showToast({ 
          title: `上传失败: ${errorMsg}`, 
          icon: 'none', 
          duration: 3000 
        });
        console.error('【错误】上传流程异常:', error);
      }
    },
    
    validateForm() {
      if (!this.imageSrc) {
        uni.showToast({ title: '请先拍摄或选择图片', icon: 'none' });
        return false;
      }
      
      if (!this.imgId) {
        uni.showToast({ title: '图片编号生成失败', icon: 'none' });
        return false;
      }
      
      if (this.diseaseIndex === undefined || this.diseaseIndex < 0 || this.diseaseIndex >= this.diseaseTypes.length) {
        uni.showToast({ title: '请选择有效的病害类型', icon: 'none' });
        return false;
      }
      
      if (!this.diseaseLevel || isNaN(parseInt(this.diseaseLevel)) || parseInt(this.diseaseLevel) < 1 || parseInt(this.diseaseLevel) > 9) {
        uni.showToast({ title: '请输入有效的病害等级(1-9)', icon: 'none' });
        return false;
      }
      
      return true;
    }
  },
  onUnload() {
    // 不需要再存储全局数据
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}
.header {
  padding: 15px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.connection-status {
  font-size: 12px;
  color: #666;
}
.camera-container {
  flex: 1;
  background-color: #000;
  position: relative;
}
.camera {
  width: 100%;
  height: 100%;
}
/* 九宫格样式 */
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.grid-line {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.5);
}
.vertical-line-1 {
  width: 1px;
  height: 100%;
  left: 33.33%;
}
.vertical-line-2 {
  width: 1px;
  height: 100%;
  left: 66.66%;
}
.horizontal-line-1 {
  width: 100%;
  height: 1px;
  top: 33.33%;
}
.horizontal-line-2 {
  width: 100%;
  height: 1px;
  top: 66.66%;
}
.preview-container {
  flex: 1;
  background-color: #eee;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
}
.preview-image {
  width: 100%;
  height: 70%;
  object-fit: contain;
  margin-bottom: 10px;
}
.oss-url {
  width: 100%;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 10px;
  word-break: break-all;
  font-size: 12px;
}
.upload-status {
  width: 100%;
  padding: 8px;
  background-color: #e6f7ff;
  border-radius: 4px;
  font-size: 14px;
  color: #1890ff;
  text-align: center;
}
.button-area {
  padding: 15px;
  background-color: #fff;
}
.action-btn {
  margin-bottom: 15px;
  height: 45px;
  border-radius: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.capture {
  background-color: #07C160;
  color: white;
}
.album {
  background-color: #1989FA;
  color: white;
}
.confirm {
  background-color: #07C160;
  color: white;
}
.retake {
  background-color: #FF976A;
  color: white;
}
.cancel {
  background-color: #FF0000;
  color: white;
}
.form-container {
  margin-bottom: 20px;
}
.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.label {
  width: 80px;
  font-size: 14px;
  color: #666;
}
.input {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
}
.picker {
  flex: 1;
}
.picker-text {
  height: 40px;
  line-height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
  color: #333;
}
</style>