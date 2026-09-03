<!--
  球队日程管理页面
  路径: /system/event

  功能概述：
  1. 日程事件列表展示（卡片式布局，非表格）
  2. 多维度筛选：事件类型（下拉+标签页联动）、状态、日期
  3. 新增/修改/删除日程事件
  4. 训练事件点击查看详情（弹出训练详情对话框）
  5. 从首页"查看全部"跳转时自动筛选已安排状态

  核心设计：
  - 卡片式列表：每条日程显示日期徽章、类型徽章、标题、地点、状态、操作按钮
  - 标签页与下拉联动：切换标签页同步更新下拉框，反之亦然
  - 训练事件可点击：event_type=1 且有 trainingId 时，点击显示训练详情
  - 日期范围查询：前端构造 beginStartTime/endStartTime 参数传给后端

  事件类型（event_type）：
  - 0: 比赛（由比赛模块自动同步）
  - 1: 训练（由训练模块自动同步）
  - 2: 会议（用户手动新增）

  状态（status）：
  - 0: 已安排  1: 已完成  2: 已推迟  3: 已取消
-->
<template>
  <div class="app-container">
    <!-- ========== 搜索栏 ========== -->
    <!-- 紧凑型搜索栏：类型下拉+状态下拉+日期选择+搜索按钮，右侧放置新增按钮 -->
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
      <!-- 日期选择器：选择后构造 beginStartTime/endStartTime 日期范围查询 -->
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

    <!-- ========== 标签页筛选 ========== -->
    <!--
      标签页与下拉框联动：
      - 点击标签页 → 更新 queryParams.eventType → 触发查询
      - 切换下拉框 → 更新 activeTab → 触发查询
      标签页 name 值与 event_type 字典值一致：0=比赛,1=训练,2=会议
    -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="schedule-tabs">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="比赛" name="0" />
      <el-tab-pane label="训练" name="1" />
      <el-tab-pane label="会议" name="2" />
    </el-tabs>

    <!-- ========== 卡片列表区域 ========== -->
    <!--
      每条日程卡片结构：
      [日期徽章] [类型徽章] [标题] [地点] [状态徽章] [操作按钮]

      日期徽章：显示 MM-DD 日期 + 星期 + 时间（如 "03-15 周一 14:00"）
      类型徽章：根据 event_type 显示不同颜色（比赛=蓝,训练=绿,会议=紫）
      状态徽章：根据 status 显示不同颜色（已安排=蓝,已完成=绿,已取消=灰,已推迟=橙）

      训练事件可点击：event_type=1 且有 trainingId 时，卡片添加 clickable 样式，
      点击后弹出训练详情对话框
    -->
    <div class="schedule-list" v-loading="loading">
      <div v-if="eventList.length === 0" style="text-align:center;padding:40px;color:#999;">暂无数据</div>
      <div
        v-for="item in eventList"
        :key="item.id"
        class="schedule-item"
        :class="{ 'clickable': item.eventType == 1 && item.trainingId }"
        @click="handleTrainingClick(item)"
      >
        <!-- 日期徽章：左侧固定宽度区域，显示日期+星期+时间 -->
        <div class="schedule-date">
          <div class="date-main">{{ formatDateShort(item.startTime) }}</div>
          <div class="date-sub">{{ formatDayOfWeek(item.startTime) }} {{ formatTime(item.startTime) }}</div>
        </div>
        <!-- 类型徽章：根据 event_type 显示"比赛/训练/会议"，颜色由 CSS 类控制 -->
        <div class="schedule-type">
          <span :class="['type-badge', getTypeClass(item.eventType)]">{{ getTypeLabel(item.eventType) }}</span>
        </div>
        <!-- 标题：事件标题，超长时省略号截断 -->
        <div class="schedule-title">{{ item.title }}</div>
        <!-- 地点：固定宽度，右对齐 -->
        <div class="schedule-location">{{ item.location || '-' }}</div>
        <!-- 状态徽章：根据 status 显示"已安排/已完成/已取消/已推迟" -->
        <div class="schedule-status">
          <span :class="['status-badge', getStatusClass(item.status)]">{{ getStatusLabel(item.status) }}</span>
        </div>
        <!-- 操作按钮：修改/删除，各自有独立权限控制 -->
        <div class="schedule-actions">
          <el-button link type="primary" icon="Edit" @click.stop="handleUpdate(item)" v-hasPermi="['system:event:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click.stop="handleDelete(item)" v-hasPermi="['system:event:remove']">删除</el-button>
        </div>
      </div>
    </div>

    <!-- ========== 分页组件 ========== -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- ========== 训练详情对话框 ========== -->
    <!--
      点击训练事件时弹出，显示训练计划的详细信息
      使用 el-descriptions 组件以描述列表形式展示，2列布局
    -->
    <el-dialog title="训练详情" v-model="trainingDetailOpen" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="trainingDetail">
        <el-descriptions-item label="训练标题" :span="2">{{ trainingDetail.title }}</el-descriptions-item>
        <!-- 训练类型和状态使用自定义函数转换为中文标签（非字典组件） -->
        <el-descriptions-item label="训练类型">{{ getTrainingTypeLabel(trainingDetail.trainingType) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getTrainingStatusLabel(trainingDetail.status) }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ trainingDetail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ trainingDetail.endTime }}</el-descriptions-item>
        <el-descriptions-item label="训练场地" :span="2">{{ trainingDetail.venue || '-' }}</el-descriptions-item>
        <el-descriptions-item label="训练目标" :span="2">{{ trainingDetail.trainingGoal || '-' }}</el-descriptions-item>
        <el-descriptions-item label="训练描述" :span="2">{{ trainingDetail.description || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="trainingDetailOpen = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ========== 添加/修改日程对话框 ========== -->
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
          <!-- type="datetime" 支持日期+时间选择，value-format 指定返回格式 -->
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
/**
 * 球队日程管理页面 - 脚本逻辑
 *
 * 引入的 API：
 * - listEvent/getEvent/delEvent/addEvent/updateEvent：日程 CRUD 操作
 * - getTraining：获取训练详情（用于训练事件点击查看详情）
 *
 * 使用的字典：
 * - football_event_type：事件类型（0=比赛,1=训练,2=会议）
 * - football_schedule_status：日程状态（0=已安排,1=已完成,2=已推迟,3=已取消）
 */
import { listEvent, getEvent, delEvent, addEvent, updateEvent } from "@/api/system/event";
import { getTraining } from "@/api/system/training";

const { proxy } = getCurrentInstance();
const route = useRoute();
const { football_event_type, football_schedule_status } = proxy.useDict('football_event_type', 'football_schedule_status');

// ========== 列表相关状态 ==========
const eventList = ref([]);    // 日程列表数据（卡片展示）
const open = ref(false);      // 新增/修改对话框显示状态
const loading = ref(true);    // 列表加载状态
const total = ref(0);         // 列表总条数
const dialogTitle = ref("");  // 对话框标题
const activeTab = ref("all"); // 当前激活的标签页（all/0/1/2）
const trainingDetailOpen = ref(false);  // 训练详情对话框显示状态
const trainingDetail = ref(null);       // 当前查看的训练详情数据

// ========== 表单数据与查询参数 ==========
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    eventType: null,
    startTime: null,
    endTime: null,
    // 从首页"查看全部"跳转时，route.query.status='0' 表示筛选已安排状态
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

/**
 * 设置日期范围查询参数
 *
 * 当用户选择日期时，前端构造 beginStartTime 和 endStartTime 两个参数传给后端，
 * 实现"查询某一天"的日期范围过滤。
 * 例如：选择 2025-03-15，则构造：
 *   beginStartTime = "2025-03-15 00:00:00"
 *   endStartTime = "2025-03-15 23:59:59"
 * 后端 MyBatis 使用 BETWEEN 或 >= / <= 进行范围查询。
 */
function setDateParams() {
  if (queryParams.value.startTime) {
    queryParams.value.beginStartTime = queryParams.value.startTime + ' 00:00:00';
    queryParams.value.endStartTime = queryParams.value.startTime + ' 23:59:59';
  } else {
    queryParams.value.beginStartTime = null;
    queryParams.value.endStartTime = null;
  }
}

/**
 * 查询日程列表（分页）
 * 调用前执行 setDateParams() 构造日期范围参数
 * .catch() 确保请求失败时关闭 loading
 */
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

/**
 * 事件类型下拉框变化处理
 *
 * 下拉框与标签页联动：
 * - 下拉框选择"比赛"(0) → 标签页切换到"比赛"
 * - 下拉框清空 → 标签页切换到"全部"
 * 切换后重置页码并查询
 */
function handleEventTypeChange(val) {
  if (!val) {
    activeTab.value = 'all';
  } else {
    activeTab.value = val;
  }
  queryParams.value.pageNum = 1;
  getList();
}

/**
 * 标签页切换处理
 *
 * 标签页与下拉框联动：
 * - 点击"比赛"标签 → 下拉框设为 0
 * - 点击"全部"标签 → 下拉框清空（eventType=null）
 * 切换后重置页码并查询
 */
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

/** 表单重置 */
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
}

/** 搜索按钮 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/**
 * 监听路由 query 参数变化
 *
 * 用途：从首页点击"查看全部"跳转到日程页面时，
 * URL 携带 ?status=0 参数，自动筛选"已安排"状态的事件。
 * 当用户返回页面或参数变化时，同步更新筛选条件并重新查询。
 */
watch(() => route.query.status, status => {
  const normalizedStatus = status === '0' ? '0' : null;
  if (queryParams.value.status !== normalizedStatus) {
    queryParams.value.status = normalizedStatus;
    queryParams.value.pageNum = 1;
    getList();
  }
});

/** 新增按钮 */
function handleAdd() {
  reset();
  open.value = true;
  dialogTitle.value = "新增日程";
}

/**
 * 修改按钮操作
 * 获取完整数据后填充表单，清空子表参与人员列表
 */
function handleUpdate(row) {
  reset();
  const _id = row.id;
  getEvent(_id).then(response => {
    form.value = response.data;
    form.value.footballSchedulePlayerList = [];
    open.value = true;
    dialogTitle.value = "修改日程";
  });
}

/**
 * 提交表单（新增或修改）
 * 提交前清空子表参与人员列表（手动新增日程暂不处理参与人员）
 */
function submitForm() {
  proxy.$refs["eventRef"].validate(valid => {
    if (valid) {
      form.value.footballSchedulePlayerList = [];
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

// ========== 格式化工具函数 ==========

/**
 * 格式化日期为短格式 MM-DD
 * 用于卡片左侧日期徽章的主显示
 * @param {string} dateStr - ISO 日期字符串
 * @returns {string} 如 "03-15"
 */
function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

/**
 * 格式化日期为星期几
 * 用于卡片左侧日期徽章的副显示
 * @param {string} dateStr - ISO 日期字符串
 * @returns {string} 如 "周一"
 */
function formatDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

/**
 * 格式化时间为 HH:mm
 * 用于卡片左侧日期徽章的副显示
 * @param {string} dateStr - ISO 日期字符串
 * @returns {string} 如 "14:30"
 */
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * 获取事件类型标签文字
 * 从字典 football_event_type 中查找对应 value 的 label
 * @param {string|number} value - 事件类型编码（0/1/2）
 * @returns {string} 如 "比赛"、"训练"、"会议"
 */
function getTypeLabel(value) {
  const dict = football_event_type.value.find(d => d.value == value);
  return dict ? dict.label : value;
}

/**
 * 获取事件类型对应的 CSS 类名
 * 用于类型徽章的颜色样式
 * @param {string|number} value - 事件类型编码
 * @returns {string} CSS 类名（type-match/type-training/type-meeting）
 */
function getTypeClass(value) {
  const map = { '0': 'type-match', '1': 'type-training', '2': 'type-meeting' };
  return map[value] || 'type-match';
}

/**
 * 获取日程状态标签文字
 * 从字典 football_schedule_status 中查找对应 value 的 label
 * @param {string|number} value - 状态编码（0/1/2/3）
 * @returns {string} 如 "已安排"、"已完成"
 */
function getStatusLabel(value) {
  const dict = football_schedule_status.value.find(d => d.value == value);
  return dict ? dict.label : value;
}

/**
 * 获取日程状态对应的 CSS 类名
 * 用于状态徽章的颜色样式
 * @param {string|number} value - 状态编码
 * @returns {string} CSS 类名（status-scheduled/status-completed/status-cancelled/status-postponed）
 */
function getStatusClass(value) {
  const map = { '0': 'status-scheduled', '1': 'status-completed', '2': 'status-cancelled', '3': 'status-postponed' };
  return map[value] || 'status-scheduled';
}

/**
 * 获取球员位置标签文字（数字编码转中文）
 * football_player.position 字段存储数字编码，前端映射为中文
 * 映射关系：0=守门员, 1=后卫, 2=中场, 3=前锋
 * @param {string|number} value - 位置编码
 * @returns {string} 位置中文
 */
function getPositionLabel(value) {
  const map = { '0': '守门员', '1': '后卫', '2': '中场', '3': '前锋' };
  return map[value] || value;
}

/**
 * 训练事件点击处理
 *
 * 仅当事件类型为训练（event_type=1）且存在 trainingId 时才响应。
 * 点击后调用 getTraining API 获取训练详情，弹出训练详情对话框。
 * 使用 @click.stop 阻止事件冒泡，避免触发卡片的点击事件。
 *
 * @param {Object} item - 日程事件对象
 */
function handleTrainingClick(item) {
  // 只有训练类型且有trainingId时才响应
  if (item.eventType != 1 || !item.trainingId) return;
  getTraining(item.trainingId).then(response => {
    trainingDetail.value = response.data;
    trainingDetailOpen.value = true;
  });
}

/**
 * 获取训练类型标签（硬编码映射）
 * 注意：此处使用硬编码而非字典，因为训练类型字典在 event 页面未加载
 * @param {number} value - 训练类型编码（0-4）
 * @returns {string} 如 "体能"、"战术"
 */
function getTrainingTypeLabel(value) {
  const map = { 0: '体能', 1: '战术', 2: '技术', 3: '恢复', 4: '热身' };
  return map[value] || value;
}

/**
 * 获取训练状态标签（硬编码映射）
 * @param {number} value - 训练状态编码（0-2）
 * @returns {string} 如 "已计划"、"已完成"
 */
function getTrainingStatusLabel(value) {
  const map = { 0: '已计划', 1: '已完成', 2: '已取消' };
  return map[value] || value;
}

// ========== 页面初始化 ==========
getList();
</script>

<style scoped>
/* ========== 搜索栏布局 ========== */
/* 使用 Flexbox 实现紧凑型搜索栏，各元素水平排列，间距 12px */
.schedule-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

/* ========== 标签页样式 ========== */
/* 自定义标签页字号、间距、激活态颜色 */
.schedule-tabs {
  margin-bottom: 16px;
}
.schedule-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
}
/* 激活标签文字加粗，颜色为主题蓝 */
.schedule-tabs :deep(.el-tabs__item.is-active) {
  font-weight: 600;
  color: #66a7ff;
}
/* 激活标签下划线颜色 */
.schedule-tabs :deep(.el-tabs__active-bar) {
  background-color: #2f7dff;
}

/* ========== 卡片列表容器 ========== */
/* 深色主题卡片容器，圆角边框，无阴影 */
.schedule-list {
  background: #101b29;
  border: 1px solid #223044;
  border-radius: 7px;
  box-shadow: none;
  overflow: hidden;
}

/* ========== 单条日程卡片 ========== */
/* Flex 布局，各区域水平排列，底部细线分隔 */
.schedule-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(145, 166, 195, 0.14);
  transition: background 0.2s;
}
/* 鼠标悬停背景色变深 */
.schedule-item:hover {
  background: #16263a;
}
/* 可点击的训练事件添加手型光标 */
.schedule-item.clickable {
  cursor: pointer;
}
.schedule-item.clickable:hover {
  background: #172b43;
}
/* 最后一条不显示底部边框 */
.schedule-item:last-child {
  border-bottom: none;
}

/* ========== 日期徽章区域 ========== */
/* 固定宽度 100px，显示日期+星期+时间 */
.schedule-date {
  width: 100px;
  flex-shrink: 0;
}
/* 日期主显示：MM-DD 格式，加粗 */
.date-main {
  font-size: 14px;
  font-weight: 600;
  color: #e9eef6;
}
/* 日期副显示：星期+时间，小字灰色 */
.date-sub {
  font-size: 11px;
  color: #7f8da2;
  margin-top: 2px;
}

/* ========== 类型徽章区域 ========== */
.schedule-type {
  width: 70px;
  flex-shrink: 0;
}

/* ========== 标题区域 ========== */
/* 自适应宽度，超长时省略号截断 */
.schedule-title {
  flex: 1;
  font-size: 14px;
  color: #dfe6ef;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 地点区域 ========== */
/* 固定宽度 140px，右对齐，超长截断 */
.schedule-location {
  width: 140px;
  flex-shrink: 0;
  font-size: 12px;
  color: #8996a9;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 状态区域 ========== */
.schedule-status {
  width: 80px;
  flex-shrink: 0;
  text-align: center;
}

/* ========== 操作按钮区域 ========== */
.schedule-actions {
  width: 120px;
  flex-shrink: 0;
  text-align: right;
}

/* ========== 类型徽章样式 ========== */
/* 通用徽章：圆角、小字、内边距 */
.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}
/* 比赛类型：蓝色系（背景+边框+文字） */
.type-match {
  background: rgba(47, 125, 255, .13);
  color: #66a7ff;
  border: 1px solid rgba(47, 125, 255, .44);
}
/* 训练类型：绿色系 */
.type-training {
  background: rgba(34, 181, 115, .12);
  color: #45ce91;
  border: 1px solid rgba(34, 181, 115, .4);
}
/* 会议类型：紫色系 */
.type-meeting {
  background: rgba(156, 104, 255, .12);
  color: #b28cff;
  border: 1px solid rgba(156, 104, 255, .4);
}

/* ========== 状态徽章样式 ========== */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}
/* 已安排：蓝色系 */
.status-scheduled {
  background: rgba(47, 125, 255, .13);
  color: #66a7ff;
  border: 1px solid rgba(47, 125, 255, .44);
}
/* 已完成：绿色系 */
.status-completed {
  background: rgba(34, 181, 115, .12);
  color: #45ce91;
  border: 1px solid rgba(34, 181, 115, .4);
}
/* 已取消：灰色系 */
.status-cancelled {
  background: rgba(115, 128, 149, .12);
  color: #98a5b8;
  border: 1px solid rgba(115, 128, 149, .38);
}
/* 已推迟：橙色系 */
.status-postponed {
  background: rgba(255, 155, 49, .12);
  color: #ffad57;
  border: 1px solid rgba(255, 155, 49, .4);
}
</style>
