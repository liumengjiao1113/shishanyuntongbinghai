<template>
  <view class="container">
    <view class="title">📂 本地采集记录</view>

    <view v-for="task in taskList" :key="task.taskName" class="task-block">
      <view class="task-title" @click="toggleTask(task)">
       任务名： {{ task.taskName }}
      </view>

      <view v-if="task.expanded">
        <view v-for="plot in task.plots" :key="plot.plotName" class="plot-block">
          <view class="plot-title" @click="togglePlot(plot)">
            └ {{ plot.plotName }}（{{ plot.records.length }}条）
          </view>

          <view v-if="plot.expanded">
            <view v-for="record in plot.records" :key="record.id" class="record-item">
              <image :src="record.image" class="thumb" mode="aspectFill" />
              <view class="info">
                <text>经纬度：{{ record.longitude }}, {{ record.latitude }}</text>
                <text>病害：{{ record.diseaseType }}，等级：{{ record.diseaseLevel }}</text>
                <text>备注：{{ record.remark }}</text>
                <text>时间：{{ record.timestamp }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      taskList: []
    };
  },
  onShow() {
    this.loadAllRecords();
  },
  methods: {
    loadAllRecords() {
      const keys = uni.getStorageInfoSync().keys;
      const taskKeys = keys.filter(k => k.startsWith('taskData_'));

      const taskMap = {}; // { taskName: { plotName: records[] } }

      taskKeys.forEach(key => {
        const [, taskName, plotName] = key.split('_');
        const records = uni.getStorageSync(key) || [];

        if (!taskMap[taskName]) taskMap[taskName] = {};
        taskMap[taskName][plotName] = records;
      });

      // 转换为数组结构用于 v-for 渲染
      this.taskList = Object.entries(taskMap).map(([taskName, plotsObj]) => {
        const plots = Object.entries(plotsObj).map(([plotName, records]) => ({
          plotName,
          records,
          expanded: false
        }));
        return { taskName, plots, expanded: false };
      });
    },
    toggleTask(task) {
      task.expanded = !task.expanded;
    },
    togglePlot(plot) {
      plot.expanded = !plot.expanded;
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20rpx;
  background: #f9f9f9;
  min-height: 100vh;
}
.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 30rpx;
}
.task-block {
  margin-bottom: 30rpx;
}
.task-title {
  font-size: 16px;
  font-weight: bold;
  background: #eee;
  padding: 10rpx;
  border-radius: 8rpx;
}
.plot-title {
  font-size: 14px;
  padding: 8rpx 16rpx;
  background: #ddd;
  margin-top: 6rpx;
  border-radius: 6rpx;
}
.record-item {
  display: flex;
  padding: 10rpx;
  margin: 10rpx;
  background: #fff;
  border-radius: 10rpx;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.thumb {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #333;
}
</style>
