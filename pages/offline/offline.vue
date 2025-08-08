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
function requestStoragePermission() {
  return new Promise((resolve, reject) => {
    if (plus.os.name.toLowerCase() !== 'android') {
      resolve(true);
      return;
    }

    const main = plus.android.runtimeMainActivity();
    const permission = "android.permission.WRITE_EXTERNAL_STORAGE";
    const checkPermission = plus.android.importClass("android.content.pm.PackageManager");
    const pkgManager = main.getPackageManager();
    const hasPermission = pkgManager.checkPermission(permission, main.getPackageName());

    if (hasPermission === checkPermission.PERMISSION_GRANTED) {
      resolve(true);
    } else {
      const Permissions = plus.android.importClass("android.support.v4.app.ActivityCompat");
      Permissions.requestPermissions(main, [permission], 0);

      setTimeout(() => {
        resolve(true);
      }, 1000);
    }
  });
}


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
  onLoad() {
      this.requestAndroidPermissions();
    },
  methods: {
	  requestAndroidPermissions() {
	    if (typeof plus !== 'undefined' && plus.os.name === 'Android') {
	      const permissions = [
	        'android.permission.READ_EXTERNAL_STORAGE',
	        'android.permission.WRITE_EXTERNAL_STORAGE'
	      ];
	  
	      plus.android.requestPermissions(permissions, (resultObj) => {
	        const granted = resultObj.granted;
	        const denied = resultObj.deniedPresent;
	        const deniedAlways = resultObj.deniedAlways;
	  
	        console.log('权限申请结果：', resultObj);
	  
	        if (granted.length === permissions.length) {
	          console.log('所有权限已授予');
	        } else {
	          uni.showModal({
	            title: '权限提醒',
	            content: '为了正常使用，请授予存储权限',
	            showCancel: false
	          });
	        }
	      }, (error) => {
	        console.error('权限申请失败：', error);
	      });
	    }
	  },

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
	// saveOfflineData() {
	//   if (!this.taskName || !this.plotName || !this.imageSrc || !this.diseaseLevel) {
	// 	uni.showToast({ title: '请填写完整信息', icon: 'none' });
	// 	return;
	//   }

	//   // 先定义一个统一保存record的函数
	//   const saveRecordToStorage = (record) => {
	// 	const key = `taskData_${this.taskName}_${this.plotName}`;
	// 	const stored = uni.getStorageSync(key) || [];
	// 	stored.push(record);
	// 	uni.setStorageSync(key, stored);

	// 	uni.showToast({ title: '已保存到本地缓存', icon: 'success' });
	// 	this.resetForm();
	//   };

	// // App端写文件的函数
	// const saveRecordToFile = (record) => {
	//   const taskDir = `_doc/offline/${this.taskName}`;
	//   const plotDir = `${taskDir}/${this.plotName}`;
	//   const fileName = `${record.id}.json`;
	//   const imageName = `img_${record.id}.jpg`;
	
	//   const plusPath = plus.io.convertLocalFileSystemURL(this.imageSrc); // ✅ 转换路径
	
	//   plus.io.resolveLocalFileSystemURL(plusPath, (entry) => {
	//     plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
	//       fs.root.getDirectory(taskDir, { create: true }, (taskEntry) => {
	//         taskEntry.getDirectory(this.plotName, { create: true }, (plotEntry) => {
	//           plotEntry.getFile(imageName, { create: true }, (fileEntry) => {
	//             entry.copyTo(plotEntry, imageName, (copiedImageEntry) => {
	//               record.image = copiedImageEntry.fullPath.startsWith('file://')
	//                 ? copiedImageEntry.fullPath
	//                 : 'file://' + copiedImageEntry.fullPath;
	//               record.imageType = 'path';
	
	//               plotEntry.getFile(fileName, { create: true }, (jsonEntry) => {
	//                 jsonEntry.createWriter((writer) => {
	//                   writer.write(JSON.stringify(record, null, 2));
	//                   uni.showToast({ title: '已保存到本地文件', icon: 'success' });
	//                   this.resetForm();
	//                 }, (e) => {
	//                   console.error('写 JSON 文件失败', e);
	//                   uni.showToast({ title: '记录写入失败', icon: 'none' });
	//                 });
	//               }, (e) => {
	//                 console.error('创建 JSON 文件失败', e);
	//                 uni.showToast({ title: 'JSON 文件创建失败', icon: 'none' });
	//               });
	
	//             }, (e) => {
	//               console.error('图片复制失败', e);
	//               uni.showToast({ title: '图片保存失败', icon: 'none' });
	//             });
	//           });
	//         }, (e) => {
	//           console.error('创建 plot 文件夹失败', e);
	//           uni.showToast({ title: '小区目录创建失败', icon: 'none' });
	//         });
	//       }, (e) => {
	//         console.error('创建 task 文件夹失败', e);
	//         uni.showToast({ title: '任务目录创建失败', icon: 'none' });
	//       });
	//     }, (e) => {
	//       console.error('获取文件系统失败', e);
	//       uni.showToast({ title: '文件系统错误', icon: 'none' });
	//     });
	//   }, (e) => {
	//     console.error('读取图片路径失败', e);
	//     uni.showToast({ title: '图片读取失败', icon: 'none' });
	//   });
	// };


	//   // H5端把图片转Base64
	//   const handleH5Save = () => {
	// 	fetch(this.imageSrc)
	// 	  .then(res => res.blob())
	// 	  .then(blob => {
	// 		const reader = new FileReader();
	// 		reader.onloadend = () => {
	// 		  const base64Image = reader.result;
	// 		  const record = {
	// 			id: Date.now(),
	// 			image: base64Image,
	// 			// imageType: 'base64',
	// 			image: this.imageSrc,
	// 			longitude: this.longitude,
	// 			latitude: this.latitude,
	// 			diseaseType: this.diseaseTypes[this.diseaseIndex],
	// 			diseaseLevel: this.diseaseLevel,
	// 			remark: this.remark,
	// 			timestamp: new Date().toISOString()
	// 		  };
	// 		  saveRecordToStorage(record);
	// 		};
	// 		reader.readAsDataURL(blob);
	// 	  })
	// 	  .catch(() => {
	// 		uni.showToast({ title: '图片处理失败', icon: 'none' });
	// 	  });
	//   };

	//   // 判断平台
	//   const isApp = typeof plus !== 'undefined';

	//   if (isApp) {
	// 	// App端直接用图片路径
	// 	const record = {
	// 	  id: Date.now(),
	// 	  image: this.imageSrc,
	// 	  imageType: 'path',
	// 	  longitude: this.longitude,
	// 	  latitude: this.latitude,
	// 	  diseaseType: this.diseaseTypes[this.diseaseIndex],
	// 	  diseaseLevel: this.diseaseLevel,
	// 	  remark: this.remark,
	// 	  timestamp: new Date().toISOString()
	// 	};
	// 	saveRecordToFile(record);
	//   } else {
	// 	// H5端转base64存缓存
	// 	handleH5Save();
	//   }
	// },

async saveOfflineData() {
  // 检查必填项
  if (!this.taskName || !this.plotName || !this.imageSrc || !this.diseaseLevel) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }

  const isApp = typeof plus !== 'undefined';

  // 组装记录对象
  const record = {
    id: Date.now(),
    taskName: this.taskName,
    plotName: this.plotName,
    image: this.imageSrc,
    longitude: this.longitude,
    latitude: this.latitude,
    diseaseType: this.diseaseTypes[this.diseaseIndex],
    diseaseLevel: this.diseaseLevel,
    remark: this.remark,
    timestamp: new Date().toISOString(),
  };

  if (isApp) {
    // 动态申请存储权限（安卓）
    if (plus.os.name === 'Android') {
      const granted = await requestStoragePermission();
      if (!granted) {
        uni.showToast({ title: '请授予存储权限', icon: 'none' });
        return;
      }
    }

    // 创建目录并复制图片写文件
    const taskDir = `_doc/offline/${record.taskName}`;
    const plotDir = `${taskDir}/${record.plotName}`;
    const timestamp = record.id;
    const filename = `${timestamp}.json`;

    // 转换图片路径为文件系统路径
    const plusPath = plus.io.convertLocalFileSystemURL(record.image);

    plus.io.resolveLocalFileSystemURL(plusPath, (fileEntry) => {
      plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
        fs.root.getDirectory('offline', { create: true }, (offlineDir) => {
          offlineDir.getDirectory(record.taskName, { create: true }, (taskEntry) => {
            taskEntry.getDirectory(record.plotName, { create: true }, (plotEntry) => {

              // 复制图片到 plot 文件夹
              const ext = record.image.substring(record.image.lastIndexOf('.'));
              const imageName = `${timestamp}${ext}`;

              fileEntry.copyTo(plotEntry, imageName, (copiedImageEntry) => {
                // 图片路径写入 record
                record.image = copiedImageEntry.fullPath.startsWith('file://')
                  ? copiedImageEntry.fullPath
                  : 'file://' + copiedImageEntry.fullPath;

                // 写 JSON 文件
                plotEntry.getFile(filename, { create: true }, (jsonFileEntry) => {
                  jsonFileEntry.createWriter((writer) => {
                    writer.write(JSON.stringify(record, null, 2));
                    uni.showToast({ title: '保存成功', icon: 'success' });
                    this.resetForm();
                  }, (err) => {
                    console.error('写入JSON文件失败:', err);
                    uni.showToast({ title: '保存失败', icon: 'none' });
                  });
                }, (err) => {
                  console.error('创建JSON文件失败:', err);
                  uni.showToast({ title: '保存失败', icon: 'none' });
                });
              }, (err) => {
                console.error('复制图片失败:', err);
                uni.showToast({ title: '保存失败', icon: 'none' });
              });

            }, (err) => {
              console.error('创建小区文件夹失败:', err);
              uni.showToast({ title: '保存失败', icon: 'none' });
            });
          }, (err) => {
            console.error('创建任务文件夹失败:', err);
            uni.showToast({ title: '保存失败', icon: 'none' });
          });
        }, (err) => {
          console.error('创建offline文件夹失败:', err);
          uni.showToast({ title: '保存失败', icon: 'none' });
        });
      }, (err) => {
        console.error('请求文件系统失败:', err);
        uni.showToast({ title: '保存失败', icon: 'none' });
      });
    }, (err) => {
      console.error('读取图片路径失败:', err);
      uni.showToast({ title: '保存失败', icon: 'none' });
    });

  } else {
    // H5端转 base64 存缓存
    try {
      const res = await fetch(record.image);
      const blob = await res.blob();

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      record.image = base64; // base64 存储图片

      const storageKey = `taskData_${record.taskName}_${record.plotName}`;
      const existing = uni.getStorageSync(storageKey) || [];
      existing.push(record);
      uni.setStorageSync(storageKey, existing);

      uni.showToast({ title: '本地保存成功', icon: 'success' });
      this.resetForm();
    } catch (error) {
      console.error('H5图片转换失败:', error);
      uni.showToast({ title: '图片处理失败', icon: 'none' });
    }
  }
},

resetForm() {
  this.imageSrc = '';
  this.taskName = '';
  this.plotName = '';
  this.longitude = '';
  this.latitude = '';
  this.diseaseIndex = 0;
  this.diseaseLevel = '';
  this.remark = '';
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
