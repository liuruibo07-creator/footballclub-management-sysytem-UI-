<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <div class="schedule-search-bar">
      <el-select v-model="queryParams.eventType" placeholder="全部类型" clearable style="width: 120px" @change="handleEventTypeChange">
        <el-option
          v-for="dict in football_event_type"
          :key="dict.value"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
      <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
        <el-option
          v-for="dict in football_schedule_status"
          :key="dict.value"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
      <el-date-picker
        v-model="queryParams.startTime"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="选择日期"
        style="width: 160px"
      />
      <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
      <div style="flex:1;"></div>
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['system:event:add']">新增日程</el-button>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="schedule-tabs">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="比赛" name="0" />
      <el-tab-pane label="训练" name="1" />
      <el-tab-pane label="会议" name="2" />
    </el-tabs>

    <!-- 卡片列表 -->
    <div class="schedule-list" v-loading="loading">
      <div v-if="eventList.length === 0" style="text-align:center;padding:40px;color:#999;">暂无数据</div>
      <div
        v-for="item in eventList"
        :key="item.id"
        class="schedule-item"
        :class="{ 'clickable': item.eventType == 1 && item.trainingId }"
        @click="handleTrainingClick(item)"
      >
        <div class="schedule-date">
          <div class="date-main">{{ formatDateShort(item.startTime) }}</div>
          <div class="date-sub">{{ formatDayOfWeek(item.startTime) }} {{ formatTime(item.startTime) }}</div>
        </div>
        <div class="schedule-type">
          <span :class="['type-badge', getTypeClass(item.eventType)]">{{ getTypeLabel(item.eventType) }}</span>
        </div>
        <div class="schedule-title">{{ item.title }}</div>
        <div class="schedule-location">{{ item.location || '-' }}</div>
        <div class="schedule-status">
          <span :class="['status-badge', getStatusClass(item.status)]">{{ getStatusLabel(item.status) }}</span>
        </div>
        <div class="schedule-actions">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(item)" v-hasPermi="['system:event:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(item)" v-hasPermi="['system:event:remove']">删除</el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 训练详情对话框 -->
    <el-dialog title="训练详情" v-model="trainingDetailOpen" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="trainingDetail">
        <el-descriptions-item label="训练标题" :span="2">{{ trainingDetail.title }}</el-descriptions-item>
        <el-descriptions-item label="训练类型">{{ getTrainingTypeLabel(trainingDetail.trainingType) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getTrainingStatusLabel(trainingDetail.status) }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ trainingDetail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ trainingDetail.endTime }}</el-descriptions-item>
        <el-descriptions-item label="训练场地" :span="2">{{ trainingDetail.venue || '-' }}</el-descriptions-item>
        <el-descriptions-item label="训练目标" :span="2">{{ trainingDetail.trainingGoal || '-' }}</el-descriptions-item>
        <el-descriptions-item label="训练描述" :span="2">{{ trainingDetail.description || '-' }}</el-descriptions-item>
      </el-descriptions>
      <!-- 参与球员 -->
      <div v-if="trainingDetail && trainingDetail.footballTrainingPlayerList && trainingDetail.footballTrainingPlayerList.length > 0" style="margin-top: 16px;">
        <div style="font-weight: 600; margin-bottom: 8px;">参与球员</div>
        <el-table :data="trainingDetail.footballTrainingPlayerList" size="small" border>
          <el-table-column prop="playerName" label="姓名" />
          <el-table-column prop="position" label="位置">
            <template #default="scope">{{ getPositionLabel(scope.row.position) }}</template>
          </el-table-column>
          <el-table-column prop="attendanceStatus" label="出勤状态">
            <template #default="scope">{{ getAttendanceLabel(scope.row.attendanceStatus) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="trainingDetailOpen = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加或修改日程对话框 -->
    <el-dialog :title="dialogTitle" v-model="open" width="560px" append-to-body>
      <el-form ref="eventRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="事件类型" prop="eventType">
          <el-select v-model="form.eventType" placeholder="请选择事件类型" style="width:100%">
            <el-option
              v-for="dict in football_event_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入事件描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width:100%">
            <el-option
              v-for="dict in football_schedule_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="参与人员">
          <el-select v-model="selectedPlayerIds" multiple placeholder="请选择参与人员" style="width:100%">
            <el-option
              v-for="player in playerList"
              :key="player.id"
              :label="player.nameCn + '（' + getPositionLabel(player.position) + '）'"
              :value="player.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Event">
import { listEvent, getEvent, delEvent, addEvent, updateEvent } from "@/api/system/event";
import { getTraining, updateTraining } from "@/api/system/training";
import { listPp } from "@/api/pp/pp";

const { proxy } = getCurrentInstance();
const route = useRoute();
const { football_event_type, football_schedule_status } = proxy.useDict('football_event_type', 'football_schedule_status');

const eventList = ref([]);
const open = ref(false);
const loading = ref(true);
const total = ref(0);
const dialogTitle = ref("");
const activeTab = ref("all");
const playerList = ref([]);
const selectedPlayerIds = ref([]);
const trainingDetailOpen = ref(false);
const trainingDetail = ref(null);

/** 获取球员列表 */
function getPlayerList() {
  listPp({ pageSize: 100, status: '活跃' }).then(response => {
    playerList.value = response.rows || [];
  });
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    eventType: null,
    startTime: null,
    endTime: null,
    status: route.query.status === '0' ? '0' : null,
  },
  rules: {
    eventType: [
      { required: true, message: "事件类型不能为空", trigger: "change" }
    ],
    title: [
      { required: true, message: "标题不能为空", trigger: "blur" }
    ],
    startTime: [
      { required: true, message: "开始时间不能为空", trigger: "change" }
    ],
    endTime: [
      { required: true, message: "结束时间不能为空", trigger: "change" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 设置日期范围参数（实体类有 beginStartTime/endStartTime 的 getter/setter） */
function setDateParams() {
  if (queryParams.value.startTime) {
    queryParams.value.beginStartTime = queryParams.value.startTime + ' 00:00:00';
    queryParams.value.endStartTime = queryParams.value.startTime + ' 23:59:59';
  } else {
    queryParams.value.beginStartTime = null;
    queryParams.value.endStartTime = null;
  }
}

/** 查询日程列表 */
function getList() {
  loading.value = true;
  setDateParams();
  listEvent(queryParams.value).then(response => {
    eventList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 下拉框类型变化时同步标签页并查询 */
function handleEventTypeChange(val) {
  if (!val) {
    activeTab.value = 'all';
  } else {
    activeTab.value = val;
  }
  queryParams.value.pageNum = 1;
  getList();
}

/** 标签页切换时同步下拉框并查询 */
function handleTabClick(tab) {
  if (tab.paneName === 'all') {
    queryParams.value.eventType = null;
  } else {
    queryParams.value.eventType = tab.paneName;
  }
  queryParams.value.pageNum = 1;
  getList();
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    title: null,
    eventType: null,
    startTime: null,
    endTime: null,
    location: null,
    description: null,
    status: null,
    footballSchedulePlayerList: []
  };
  proxy.resetForm("eventRef");
  selectedPlayerIds.value = [];
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 从首页“查看全部”进入或返回已缓存页面时，同步已安排筛选条件 */
watch(() => route.query.status, status => {
  const normalizedStatus = status === '0' ? '0' : null;
  if (queryParams.value.status !== normalizedStatus) {
    queryParams.value.status = normalizedStatus;
    queryParams.value.pageNum = 1;
    getList();
  }
});

/** 新增按钮操作 */
function handleAdd() {
  reset();
  getPlayerList();
  open.value = true;
  dialogTitle.value = "新增日程";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getPlayerList();
  const _id = row.id;
  getEvent(_id).then(response => {
    form.value = response.data;
    // 从返回的参与人列表中提取playerId
    if (response.data.footballSchedulePlayerList) {
      selectedPlayerIds.value = response.data.footballSchedulePlayerList.map(p => p.playerId);
    }
    // 如果是训练事件且有trainingId，从训练记录中获取参与人员
    if (response.data.eventType == 1 && response.data.trainingId) {
      getTraining(response.data.trainingId).then(trainingRes => {
        if (trainingRes.data && trainingRes.data.footballTrainingPlayerList) {
          selectedPlayerIds.value = trainingRes.data.footballTrainingPlayerList.map(p => p.playerId);
        }
      });
    }
    open.value = true;
    dialogTitle.value = "修改日程";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["eventRef"].validate(valid => {
    if (valid) {
      const playerData = selectedPlayerIds.value.map(playerId => ({
        playerId: playerId
      }));
      // 如果是训练事件且有trainingId，同步更新训练记录的参与人员
      if (form.value.eventType == 1 && form.value.trainingId) {
        const trainingData = {
          id: form.value.trainingId,
          footballTrainingPlayerList: playerData
        };
        updateTraining(trainingData).then(() => {
          proxy.$modal.msgSuccess("参与人员已同步到训练记录");
        }).catch(() => {});
      }
      form.value.footballSchedulePlayerList = playerData;
      if (form.value.id != null) {
        updateEvent(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addEvent(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除日程"' + row.title + '"？').then(function() {
    return delEvent(row.id);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 格式化日期短格式 MM-DD */
function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

/** 格式化星期 */
function formatDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

/** 格式化时间 HH:mm */
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** 获取类型标签文字 */
function getTypeLabel(value) {
  const dict = football_event_type.value.find(d => d.value == value);
  return dict ? dict.label : value;
}

/** 获取类型样式类 */
function getTypeClass(value) {
  const map = { '0': 'type-match', '1': 'type-training', '2': 'type-meeting' };
  return map[value] || 'type-match';
}

/** 获取状态标签文字 */
function getStatusLabel(value) {
  const dict = football_schedule_status.value.find(d => d.value == value);
  return dict ? dict.label : value;
}

/** 获取状态样式类 */
function getStatusClass(value) {
  const map = { '0': 'status-scheduled', '1': 'status-completed', '2': 'status-cancelled', '3': 'status-postponed' };
  return map[value] || 'status-scheduled';
}

/** 获取位置标签文字（数字编码→中文） */
function getPositionLabel(value) {
  const map = { '0': '守门员', '1': '后卫', '2': '中场', '3': '前锋' };
  return map[value] || value;
}

/** 点击训练事件，查看训练详情 */
function handleTrainingClick(item) {
  // 只有训练类型且有trainingId时才响应
  if (item.eventType != 1 || !item.trainingId) return;
  getTraining(item.trainingId).then(response => {
    trainingDetail.value = response.data;
    trainingDetailOpen.value = true;
  });
}

/** 获取训练类型标签 */
function getTrainingTypeLabel(value) {
  const map = { 0: '体能', 1: '战术', 2: '技术', 3: '恢复', 4: '热身' };
  return map[value] || value;
}

/** 获取训练状态标签 */
function getTrainingStatusLabel(value) {
  const map = { 0: '已计划', 1: '已完成', 2: '已取消' };
  return map[value] || value;
}

/** 获取出勤状态标签 */
function getAttendanceLabel(value) {
  const map = { 0: '待确认', 1: '已出勤', 2: '缺勤', 3: '请假' };
  return map[value] || value;
}

getList();
</script>

<style scoped>
/* 搜索栏 */
.schedule-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

/* 标签页 */
.schedule-tabs {
  margin-bottom: 16px;
}
.schedule-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
}
.schedule-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
  color: #1a3a5c;
}
.schedule-tabs :deep(.el-tabs__active-bar) {
  background-color: #1a3a5c;
}

/* 卡片列表 */
.schedule-list {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  overflow: hidden;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.schedule-item:hover {
  background: #f5f8fa;
}
.schedule-item.clickable {
  cursor: pointer;
}
.schedule-item.clickable:hover {
  background: #e8f4fd;
}
.schedule-item:last-child {
  border-bottom: none;
}

.schedule-date {
  width: 100px;
  flex-shrink: 0;
}
.date-main {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.date-sub {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.schedule-type {
  width: 70px;
  flex-shrink: 0;
}

.schedule-title {
  flex: 1;
  font-size: 14px;
  color: #333;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-location {
  width: 140px;
  flex-shrink: 0;
  font-size: 12px;
  color: #999;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-status {
  width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.schedule-actions {
  width: 120px;
  flex-shrink: 0;
  text-align: right;
}

/* 类型标签 */
.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}
.type-match {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
.type-training {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.type-meeting {
  background: #f9f0ff;
  color: #722ed1;
  border: 1px solid #d3adf7;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}
.status-scheduled {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
.status-completed {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.status-cancelled {
  background: #fafafa;
  color: #999;
  border: 1px solid #d9d9d9;
}
.status-postponed {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}
</style>
