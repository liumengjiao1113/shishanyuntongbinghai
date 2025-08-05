<template>
  <view class="container">
    <!-- 表型采集结果 -->
    <view class="result-content">
      <view class="image-single">
        <!-- 添加点击事件显示大图 -->
        <image v-if="imageUrl" class="result-image" :src="formattedImageUrl" mode="aspectFill" @click="showImagePreview" />
        <view v-else class="loading-tip">
          <text>加载图片中...</text>
        </view>
      </view>
      <view class="info-group">
        <view class="info-item">
          <text class="info-label">任务ID：</text>
          <text class="info-value">{{ taskId }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">任务名称：</text>
          <text class="info-value">{{ taskName }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">小区ID：</text>
          <text class="info-value">{{ plotId }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">小区名称：</text>
          <text class="info-value">{{ blockNum }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">图片编号：</text>
          <!-- 移除可编辑状态，始终显示图片编号 -->
          <view class="info-value">{{ imgId }}</view>
        </view>
        
        <!-- 样品编号 - 可编辑/只读状态切换 -->
        <view class="info-item" v-if="!isEditing">
          <text class="info-label">样品编号：</text>
          <text class="info-value">{{ sampleId }}</text>
        </view>
        <view class="info-item" v-else>
          <text class="info-label">样品编号：</text>
          <input class="edit-input" v-model="editSampleId" placeholder="请输入样品编号" />
        </view>
        
        <!-- 经度 - 可编辑/只读状态切换 -->
        <view class="info-item" v-if="!isEditing">
          <text class="info-label">经度：</text>
          <text class="info-value">{{ longitude }}</text>
        </view>
        <view class="info-item" v-else>
          <text class="info-label">经度：</text>
          <input class="edit-input" v-model="editLongitude" placeholder="请输入经度" />
        </view>
        
        <!-- 纬度 - 可编辑/只读状态切换 -->
        <view class="info-item" v-if="!isEditing">
          <text class="info-label">纬度：</text>
          <text class="info-value">{{ latitude }}</text>
        </view>
        <view class="info-item" v-else>
          <text class="info-label">纬度：</text>
          <input class="edit-input" v-model="editLatitude" placeholder="请输入纬度" />
        </view>
        
        <!-- 备注 - 可编辑/只读状态切换 -->
        <view class="info-item" v-if="!isEditing">
          <text class="info-label">备注：</text>
          <text class="info-value">{{ remark }}</text>
        </view>
        <view class="info-item" v-else>
          <text class="info-label">备注：</text>
          <input class="edit-input" v-model="editRemark" placeholder="请输入备注信息" />
        </view>
        
        <!-- 病害类型 - 可编辑/只读状态切换 -->
        <view class="info-item" v-if="!isEditing">
          <text class="info-label">病害类型：</text>
          <text class="info-value">{{ diseaseType }}</text>
        </view>
        <view class="info-item" v-else>
          <text class="info-label">病害类型：</text>
          <picker 
            class="picker"
            mode="selector" 
            :range="diseaseTypes"
            @change="onDiseaseChange"
            :value="diseaseIndex"
          >
            <view class="picker-text">
              {{ diseaseTypes[diseaseIndex] || '请选择病害类型' }}
            </view>
          </picker>
        </view>
        
        <!-- 病害等级 - 可编辑/只读状态切换 -->
        <view class="info-item" v-if="!isEditing">
          <text class="info-label">病害等级：</text>
          <text class="info-value">{{ diseaseLevel }}</text>
        </view>
        <view class="info-item" v-else>
          <text class="info-label">病害等级：</text>
          <input 
            class="edit-input" 
            v-model="editDiseaseLevel" 
            placeholder="请输入病害等级(1-9)" 
            type="digit"
            @input="validateDiseaseLevel"
          />
        </view>
        
        <view class="info-item">
          <text class="info-label">上传状态：</text>
          <text class="info-value">{{ getStatusText(status) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 按钮区域 -->
    <view class="button-area">
      <button v-if="!isEditing" class="action-btn modify" @click="startEditing">修改</button>
      <button v-else class="action-btn confirm-modify" @click="confirmEditing">确认修改</button>
      <button class="action-btn back" @click="handleBack">返回</button>
    </view>
    
    <!-- 修改确认弹窗 -->
    <view class="modal" v-if="showModifyModal">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">确认修改</text>
        </view>
        <view class="modal-body">
          <text>是否对编号为 {{ imgId }} 的图片进行信息修改？</text>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="cancelModify">返回</button>
          <button class="modal-btn confirm" @click="saveModify">确认</button>
        </view>
      </view>
    </view>
    
    <!-- 大图预览弹窗 -->
    <view class="image-preview" v-if="showPreview">
      <view class="preview-mask" @click="closePreview"></view>
      <view class="preview-content">
        <image class="preview-image" :src="formattedImageUrl" mode="aspectFit" />
        <view class="close-btn" @click="closePreview">×</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      taskId: '',
      taskName: '',
      plotId: '',
      blockNum: '',
      imgId: '',
      imageUrl: '',
      longitude: '',
      latitude: '',
      sampleId: '', // 新增样品编号字段
      remark: '',   // 单独备注字段
      diseaseType: '',
      diseaseLevel: '',
      status: '',
      
      // 编辑状态相关
      isEditing: false,
      editLongitude: '',
      editLatitude: '',
      editSampleId: '', // 编辑状态的样品编号
      editRemark: '',   // 编辑状态的备注
      editDiseaseLevel: '',
      diseaseTypes: ['黄叶病', '锈斑病', '其他'],
      diseaseIndex: 0,
      
      // 接口数据
      imageDetail: null,
      
      // 全局数据引用
      globalData: getApp().globalData,
      
      // 弹窗控制
      showModifyModal: false,
      
      // 大图预览控制
      showPreview: false,
      
      // 修改请求状态
      isSubmitting: false,
      
      // 原始备注信息，用于取消编辑时恢复
      originalNote: ''
    };
  },
  computed: {
    // 格式化图片URL，将localhost替换为10.100.5.57
    formattedImageUrl() {
      if (!this.imageUrl) return '';
      return this.imageUrl.replace('localhost', 'larsc.hzau.edu.cn');
    }
  },
  onLoad(options) {
    this.taskId = options.taskId || '';
    this.taskName = options.taskName || '';
    this.plotId = options.plotId || '';
    this.imgId = options.imgId || '';
    this.branchTaskId = options.branchTaskId || '';
    this.blockId = options.blockId || '';
    this.imageNum = options.imageNum || '';
    
    // 调用接口获取图片详细信息
    this.fetchImageDetail();
  },
  methods: {
    // 调用接口获取图片详细信息
    async fetchImageDetail() {
      if (!this.branchTaskId || !this.blockId || !this.imageNum) {
        uni.showToast({
          title: '参数不完整，无法获取图片信息',
          icon: 'none'
        });
        return;
      }
      
      try {
        uni.showLoading({ title: '加载中...' });
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
        const response = await uni.request({
          url: `${this.globalData.baseUrl || 'https://larsc.hzau.edu.cn/prod-api'}/plant-disease/singlePictureInfo`,
          method: 'GET',
          header: {
            'Authorization': token,
            'Accept': '*/*'
          },
          data: {
            branchTaskId: this.branchTaskId,
            blockId: this.blockId,
            imageNum: this.imageNum
          }
        });
        
        let res = Array.isArray(response) ? response[0] : response;
        
        if (res.statusCode === 200 && res.data?.code === 200) {
          const data = res.data.data;
          this.imageDetail = data;
          this.imageUrl = data.imageUrl;
          this.longitude = data.longitude;
          this.latitude = data.latitude;
          this.originalNote = data.remark || '';
          
          // 解析备注信息，拆分为样品编号和备注
          if (this.originalNote) {
            const parts = this.originalNote.split('#');
            this.sampleId = parts[0] || '';
            this.remark = parts[1] || '';
          }
          
          this.diseaseType = data.diseaseType;
          this.diseaseLevel = data.diseaseLevel;
          this.status = data.status || 'uploaded';
          this.blockNum = data.blockNum;
          this.imgId = data.imageNum || this.imgId; // 使用接口返回的imageNum
          
          // 初始化编辑状态的输入值
          this.editLongitude = this.longitude;
          this.editLatitude = this.latitude;
          this.editSampleId = this.sampleId;
          this.editRemark = this.remark;
          this.editDiseaseLevel = this.diseaseLevel;
          this.diseaseIndex = this.diseaseTypes.indexOf(this.diseaseType) >= 0 
            ? this.diseaseTypes.indexOf(this.diseaseType) 
            : 0;
        } else {
          throw new Error(res.data?.msg || '获取图片信息失败');
        }
      } catch (error) {
        console.error('获取图片详情失败:', error);
        uni.showToast({
          title: error.message || '获取图片信息失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 开始编辑
    startEditing() {
      this.isEditing = true;
    },
    
    // 确认编辑
    confirmEditing() {
      this.showModifyModal = true;
    },
    
    // 取消修改
    cancelModify() {
      this.showModifyModal = false;
    },
    
    // 保存修改 - 对接编辑接口
    async saveModify() {
      if (this.isSubmitting) return;
      
      // 验证病害等级
      if (this.editDiseaseLevel && (this.editDiseaseLevel < 1 || this.editDiseaseLevel > 9)) {
        uni.showToast({
          title: '病害等级必须在1-9之间',
          icon: 'none'
        });
        return;
      }
      
      try {
        this.isSubmitting = true;
        this.showModifyModal = false;
        
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
        // 拼接样品编号和备注
        const combinedNote = `${this.editSampleId || ''}#${this.editRemark || ''}`;
        
        // 准备请求数据
        const requestData = {
          id: this.imageDetail?.id,
          longitude: this.editLongitude,
          latitude: this.editLatitude,
          remark: combinedNote, // 使用拼接后的备注
          diseaseType: this.diseaseTypes[this.diseaseIndex],
          diseaseLevel: this.editDiseaseLevel,
          imageUrl: this.imageUrl,
          branchTaskId: this.branchTaskId,
          blockId: this.blockId,
          blockNum: this.blockNum
        };
        
        // 调用编辑接口
        const response = await uni.request({
          url: `${this.globalData.baseUrl || 'https://larsc.hzau.edu.cn/prod-api'}/plant-disease/editInfo`,
          method: 'POST',
          header: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          },
          data: requestData
        });
        
        let res = Array.isArray(response) ? response[0] : response;
        
        if (res.statusCode === 200 && res.data?.code === 200) {
          // 更新本地数据
          this.longitude = this.editLongitude;
          this.latitude = this.editLatitude;
          this.sampleId = this.editSampleId;
          this.remark = this.editRemark;
          this.diseaseLevel = this.editDiseaseLevel;
          this.diseaseType = this.diseaseTypes[this.diseaseIndex];
          this.originalNote = combinedNote;
          
          this.isEditing = false;
          
          uni.showToast({
            title: '修改成功',
            icon: 'success'
          });
          
          // 使用事件总线通知上一页刷新数据
          uni.$emit('imageInfoUpdated', {
            imgId: this.imgId,
            updatedData: {
              longitude: this.longitude,
              latitude: this.latitude,
              remark: combinedNote,
              diseaseType: this.diseaseType,
              diseaseLevel: this.diseaseLevel
            }
          });
          
          // 延迟返回以确保事件被接收
          setTimeout(() => {
            uni.navigateBack();
          }, 500);
        } else {
          throw new Error(res.data?.msg || '修改失败');
        }
      } catch (error) {
        console.error('修改图片信息失败:', error);
        uni.showToast({
          title: error.message || '修改失败',
          icon: 'none'
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // 病害类型变更
    onDiseaseChange(e) {
      this.diseaseIndex = e.detail.value;
    },
    
    // 验证病害等级输入
    validateDiseaseLevel(e) {
      // 限制输入为1-5的数字
      let value = e.detail.value;
      if (value) {
        value = parseInt(value);
        if (isNaN(value) || value < 1) {
          value = 1;
        } else if (value > 9) {
          value = 9;
        }
        this.editDiseaseLevel = value.toString();
      }
    },
    
    getStatusText(status) {
      const map = {
        uploaded: '已上传',
        notUploaded: '未上传'
      };
      return map[status] || status;
    },
    
    // 显示大图预览
    showImagePreview() {
      if (this.imageUrl) {
        this.showPreview = true;
      }
    },
    
    // 关闭大图预览
    closePreview() {
      this.showPreview = false;
    },
    
    // 处理返回操作
    handleBack() {
      if (this.isEditing) {
        // 如果正在编辑，询问是否放弃修改
        uni.showModal({
          title: '提示',
          content: '您有未保存的修改，确定要返回吗？',
          success: (res) => {
            if (res.confirm) {
              // 恢复原始数据
              this.editSampleId = this.sampleId;
              this.editRemark = this.remark;
              this.isEditing = false;
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    }
  }
};
</script>

<style scoped>
.container {
  padding: 30rpx;
  background-color: #f8f8f8;
}
.result-content {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}
.image-single {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
  position: relative;
}
.result-image {
  width: 100%;
  max-height: 600rpx;
  border-radius: 16rpx;
  cursor: pointer;
}
.loading-tip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}
.info-group {
  width: 100%;
}
.info-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.info-label {
  color: #666;
  font-size: 28rpx;
  width: 200rpx;
  flex-shrink: 0;
}
.info-value {
  color: #333;
  font-size: 28rpx;
  flex: 1;
}
.edit-input {
  flex: 1;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
}
.picker {
  flex: 1;
}
.picker-text {
  height: 80rpx;
  line-height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #f9f9f9;
}
.button-area {
  display: flex;
  justify-content: center;
  margin: 60rpx 0 20rpx;
}
.action-btn {
  margin: 0 30rpx;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240rpx;
  font-weight: 500;
}
.modify {
  background-color: #FF9800;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.2);
}
.confirm-modify {
  background-color: #07C160;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.2);
}
.back {
  background-color: #999;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(153, 153, 153, 0.2);
}
/* 弹窗样式 */
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
}
.modal-header {
  padding: 40rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  text-align: center;
}
.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}
.modal-body {
  padding: 40rpx;
  text-align: center;
  font-size: 30rpx;
  color: #666;
  line-height: 1.5;
}
.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}
.modal-btn {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  background: none;
  border: none;
  font-size: 32rpx;
  font-weight: 500;
}
.modal-btn.cancel {
  color: #999;
}
.modal-btn.confirm {
  color: #07C160;
}

/* 大图预览样式 */
.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}
.preview-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
}
.preview-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
}
.preview-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 16rpx;
}
.close-btn {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}
</style>