<template>
  <view class="container">
    <text class="title">离线记录</text>
    <scroll-view class="record-list" scroll-y>
      <view v-if="records.length === 0" class="empty">暂无记录</view>

      <view v-for="(task, tIndex) in records" :key="tIndex" class="task-block">
        <view class="task-header">
          <text class="task-title">📂 {{ task.taskName }}</text>
        </view>

        <view v-for="(plot, pIndex) in task.plots" :key="pIndex" class="plot-block">
          <view class="plot-header">
            <text class="plot-title">🏷 {{ plot.plotName }}</text>
          </view>

          <view v-for="(record, rIndex) in plot.items" :key="record.id" class="record-item">
            <image :src="record.image" mode="aspectFill" class="record-img" />
            <view class="record-info">
              <text>病害：{{ record.diseaseType }}</text>
              <text>等级：{{ record.diseaseLevel }}</text>
              <text>经度：{{ record.longitude }}</text>
              <text>纬度：{{ record.latitude }}</text>
              <text>备注：{{ record.remark }}</text>
              <text>时间：{{ record.timestamp }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>


<script>
export default {
  data() {
    return {
      records: [], // 所有离线记录
    };
  },
  onShow() {
    this.loadRecords();
  },
  methods: {
    async loadRecords() {
      if (typeof plus === "undefined") {
        uni.showToast({ title: '非App环境暂不支持查看离线记录', icon: 'none' });
        return;
      }
    
      this.records = [];
      try {
        await this.requestStoragePermission();
        const offlineDir = await this.getOrCreateDir('_doc/offline');
        const taskDirs = await this.readDirEntries(offlineDir);
    
        for (const taskDir of taskDirs) {
          const taskEntry = await this.getDirEntry(offlineDir, taskDir);
          const plotDirs = await this.readDirEntries(taskEntry);
    
          const plotList = [];
    
          for (const plotDir of plotDirs) {
            const plotEntry = await this.getDirEntry(taskEntry, plotDir);
            const files = await this.readDirEntries(plotEntry);
            const items = [];
    
            for (const fileName of files) {
              if (fileName.endsWith('.json')) {
                const jsonEntry = await this.getFileEntry(plotEntry, fileName);
                const content = await this.readFileContent(jsonEntry);
                try {
                  const record = JSON.parse(content);
                  items.push(record);
                } catch(e) {
                  console.warn('解析 JSON 失败:', e);
                }
              }
            }
    
            plotList.push({
              plotName: plotDir,
              items
            });
          }
    
          this.records.push({
            taskName: taskDir,
            plots: plotList
          });
        }
      } catch (error) {
        console.error(error);
        uni.showToast({ title: '加载记录失败', icon: 'none' });
      }
    },
 
// async deleteRecord(taskName, plotName, imagePath, timestamp) {
//   if (typeof plus === "undefined") {
//     uni.showToast({ title: '非App环境不支持删除', icon: 'none' });
//     return;
//   }

//   try {
//     // 删除图片
//     let localImagePath = imagePath;
//     if (!localImagePath.startsWith('file://')) {
//       localImagePath = 'file://' + localImagePath;
//     }

//     await new Promise((resolve, reject) => {
//       plus.io.resolveLocalFileSystemURL(localImagePath,
//         entry => entry.remove(resolve, reject),
//         err => reject(err)
//       );
//     });

//     // 删除JSON文件
//     const jsonPath = `_doc/offline/${taskName}/${plotName}/${timestamp}.json`;
//     const jsonUrl = 'file://' + jsonPath;

//     await new Promise((resolve, reject) => {
//       plus.io.resolveLocalFileSystemURL(jsonUrl,
//         entry => entry.remove(resolve, reject),
//         err => reject(err)
//       );
//     });

//     // 从内存数据删除对应记录，保持页面同步
//     for (let t = 0; t < this.records.length; t++) {
//       if (this.records[t].taskName === taskName) {
//         for (let p = 0; p < this.records[t].plots.length; p++) {
//           if (this.records[t].plots[p].plotName === plotName) {
//             const index = this.records[t].plots[p].items.findIndex(item => item.id === timestamp);
//             if (index !== -1) {
//               this.records[t].plots[p].items.splice(index, 1);
//               if (this.records[t].plots[p].items.length === 0) {
//                 this.records[t].plots.splice(p, 1);
//               }
//               if (this.records[t].plots.length === 0) {
//                 this.records.splice(t, 1);
//               }
//               break;
//             }
//           }
//         }
//       }
//     }

//     uni.showToast({ title: '删除成功', icon: 'success' });
//   } catch (error) {
//     console.error('删除失败:', error);
//     uni.showToast({ title: '删除失败', icon: 'none' });
//   }
// },


    
  
//     // 删除整个小区
//     async deletePlot(taskName, plot, pIndex, tIndex) {
//       if (!await this.confirmDialog(`确认删除任务【${taskName}】的小区【${plot.plotName}】？（包含所有记录）`)) return;
//       try {
//         await this.requestStoragePermission();
//         await this.removeDir(`_doc/offline/${taskName}/${plot.plotName}`);
//         this.records[tIndex].plots.splice(pIndex, 1);
//         if (this.records[tIndex].plots.length === 0) {
//           this.records.splice(tIndex, 1);
//         }
//         uni.showToast({ title: '小区已删除', icon: 'success' });
//       } catch (e) {
//         console.error(e);
//         uni.showToast({ title: '删除失败', icon: 'none' });
//       }
//     },
  
//     // 删除整个任务
//     async deleteTask(task, tIndex) {
//       if (!await this.confirmDialog(`确认删除任务【${task.taskName}】？（包含所有小区和记录）`)) return;
//       try {
//         await this.requestStoragePermission();
//         await this.removeDir(`_doc/offline/${task.taskName}`);
//         this.records.splice(tIndex, 1);
//         uni.showToast({ title: '任务已删除', icon: 'success' });
//       } catch (e) {
//         console.error(e);
//         uni.showToast({ title: '删除失败', icon: 'none' });
//       }
//     },
  
//     // 公共确认弹窗
//     confirmDialog(content) {
//       return new Promise(resolve => {
//         uni.showModal({
//           title: '确认操作',
//           content,
//           success: res => resolve(res.confirm)
//         });
//       });
//     },
  
//     // 删除文件夹
//     removeDir(dirPath) {
//       return new Promise((resolve, reject) => {
//         plus.io.resolveLocalFileSystemURL(dirPath, entry => {
//           entry.removeRecursively(() => resolve(), reject);
//         }, reject);
//       });
//     },

    // 权限请求
    requestStoragePermission() {
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
          setTimeout(() => resolve(true), 1000);
        }
      });
    },
	
    getOrCreateDir(path) {
      return new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL(path, dirEntry => {
          resolve(dirEntry);
        }, () => {
          plus.io.requestFileSystem(plus.io.PRIVATE_DOC, fs => {
            fs.root.getDirectory(path.replace('_doc/', ''), { create: true }, dirEntry => {
              resolve(dirEntry);
            }, reject);
          }, reject);
        });
      });
    },
    readDirEntries(dirEntry) {
      return new Promise((resolve, reject) => {
        const reader = dirEntry.createReader();
        reader.readEntries(entries => {
          const names = entries.map(e => e.name);
          resolve(names);
        }, reject);
      });
    },
    getDirEntry(parentEntry, name) {
      return new Promise((resolve, reject) => {
        parentEntry.getDirectory(name, {}, resolve, reject);
      });
    },
    getFileEntry(dirEntry, name) {
      return new Promise((resolve, reject) => {
        dirEntry.getFile(name, {}, resolve, reject);
      });
    },
    readFileContent(fileEntry) {
      return new Promise((resolve, reject) => {
        fileEntry.file(file => {
          const reader = new plus.io.FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      });
    },
    removeFile(filePath) {
      return new Promise((resolve, reject) => {
        // 转成文件系统路径
        let localPath = filePath.startsWith('file://') ? filePath : 'file://' + filePath;
        plus.io.resolveLocalFileSystemURL(localPath, fileEntry => {
          fileEntry.remove(() => resolve(), reject);
        }, reject);
      });
    },
  },
};
</script>

<style>
.container {
  padding: 20px 15px;
  background: #f0f2f5;
  min-height: 100vh;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}
.record-list {
  max-height: 85vh;
  overflow-y: auto;
}

/* 任务卡片 */
.task-block {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: none;
}
.task-header {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
}
.task-title {
  user-select: none;
}

/* 小区卡片 */
.plot-block {
  background: #f9fafc;
  border-left: 4px solid #4a90e2;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 14px;
}
.plot-header {
  font-size: 16px;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 12px;
  user-select: none;
}
.plot-title {
  margin: 0;
}

/* 记录条目 */
.record-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.08);
  gap: 14px;
}
.record-img {
  width: 75px;
  height: 75px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.record-info {
  flex: 1;
  font-size: 14px;
  color: #555;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* 空白提示 */
.empty {
  text-align: center;
  font-size: 16px;
  color: #999;
  margin-top: 80px;
  user-select: none;
}
</style>