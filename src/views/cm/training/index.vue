<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="训练名称" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入训练名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="训练类型" prop="trainingType">
        <el-select v-model="queryParams.trainingType" placeholder="全部类型" clearable>
          <el-option
            v-for="dict in football_training_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable>
          <el-option
            v-for="dict in football_training_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['system:training:add']"
        >+ 新增训练</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:training:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:training:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:training:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="trainingList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="训练名称" align="center" prop="title" />
      <el-table-column label="类型" align="center" prop="trainingType" min-width="100">
        <template #default="scope">
          <dict-tag :options="football_training_type" :value="scope.row.trainingType"/>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" align="center" prop="startTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束时间" align="center" prop="endTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="场地" align="center" prop="venue" />
      <el-table-column label="预期参与人数" align="center" prop="participantCount" width="120" />
      <el-table-column label="出勤率" align="center" prop="attendanceRate" width="100">
        <template #default="scope">
          <span>{{ scope.row.attendanceRate || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :options="football_training_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:training:edit']">编辑</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:training:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改训练对话框 -->
    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="trainingRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="训练名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入训练名称" />
        </el-form-item>
        <el-form-item label="训练类型" prop="trainingType">
          <el-select v-model="form.trainingType" placeholder="请选择训练类型">
            <el-option
              v-for="dict in football_training_type"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker clearable
            v-model="form.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker clearable
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择结束时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="训练场地" prop="venue">
          <el-input v-model="form.venue" placeholder="请输入训练场地" />
        </el-form-item>
        <el-form-item label="训练内容" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入训练项目描述" />
        </el-form-item>
        <el-form-item label="训练目标" prop="trainingGoal">
          <el-input v-model="form.trainingGoal" type="textarea" placeholder="请输入训练目标" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option
              v-for="dict in football_training_status"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            />
          </el-select>
        </el-form-item>
        <el-divider content-position="center">参与球员</el-divider>
        <el-form-item label="参与人员" prop="selectedPlayerIds">
          <el-select v-model="selectedPlayerIds" multiple placeholder="请选择参与人员" style="width:100%">
            <el-option
              v-for="player in playerList"
              :key="player.id"
              :label="player.nameCn + '（' + getPositionLabel(player.position) + '）'"
              :value="player.id"
            />
          </el-select>
        </el-form-item>
        <el-table v-if="selectedPlayerIds.length > 0" :data="selectedPlayerIds.map(id => ({ id, ...playerList.find(p => p.id === id) }))" border size="small" max-height="200">
          <el-table-column label="球员" prop="nameCn" align="center">
            <template #default="scope">
              {{ scope.row.nameCn }}（{{ getPositionLabel(scope.row.position) }}）
            </template>
          </el-table-column>
          <el-table-column label="出勤状态" align="center" width="150">
            <template #default="scope">
              <el-tag
                :type="attendanceMap[scope.row.id] === 1 ? 'success' : attendanceMap[scope.row.id] === 2 ? 'danger' : attendanceMap[scope.row.id] === 3 ? 'warning' : 'info'"
                style="cursor: pointer; min-width: 70px; text-align: center;"
                @click="cycleAttendance(scope.row.id)"
              >
                {{ getAttendanceLabel(attendanceMap[scope.row.id]) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Training">
import { listTraining, getTraining, delTraining, addTraining, updateTraining } from "@/api/system/training";
import { listPlayer } from "@/api/pp/pp";

const { proxy } = getCurrentInstance();

const { football_training_type, football_training_status, football_attendance_status } = proxy.useDict('football_training_type', 'football_training_status', 'football_attendance_status');

const trainingList = ref([]);
const playerList = ref([]);
const selectedPlayerIds = ref([]);
const attendanceMap = ref({});
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    trainingType: null,
    startTime: null,
    status: null,
  },
  rules: {
    trainingType: [
      { required: true, message: "训练类型不能为空", trigger: "change" }
    ],
    startTime: [
      { required: true, message: "开始时间不能为空", trigger: "blur" }
    ],
    endTime: [
      { required: true, message: "结束时间不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询训练计划列表 */
function getList() {
  loading.value = true;
  listTraining(queryParams.value).then(response => {
    trainingList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 加载球员列表（用于下拉选择） */
function getPlayerList() {
  listPlayer({ pageSize: 1000 }).then(response => {
    playerList.value = response.rows || [];
  });
}

/** 监听球员选择变化，同步出勤状态 */
watch(selectedPlayerIds, (newIds, oldIds) => {
  // 新增的球员默认出勤状态为 0（待确认）
  newIds.forEach(id => {
    if (attendanceMap.value[id] === undefined) {
      attendanceMap.value[id] = 0;
    }
  });
  // 移除的球员清理出勤状态
  Object.keys(attendanceMap.value).forEach(id => {
    if (!newIds.includes(Number(id))) {
      delete attendanceMap.value[id];
    }
  });
});

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
    trainingType: null,
    startTime: null,
    endTime: null,
    venue: null,
    description: null,
    trainingGoal: null,
    status: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    delFlag: null
  };
  selectedPlayerIds.value = [];
  attendanceMap.value = {};
  proxy.resetForm("trainingRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增训练";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getTraining(_id).then(response => {
    form.value = response.data;
    if (response.data.footballTrainingPlayerList) {
      selectedPlayerIds.value = response.data.footballTrainingPlayerList.map(p => p.playerId);
      response.data.footballTrainingPlayerList.forEach(p => {
        attendanceMap.value[p.playerId] = p.attendanceStatus ?? 0;
      });
    }
    open.value = true;
    title.value = "修改训练";
  });
}

/** 详情按钮操作 */
function handleDetail(row) {
  reset();
  getTraining(row.id).then(response => {
    form.value = response.data;
    if (response.data.footballTrainingPlayerList) {
      selectedPlayerIds.value = response.data.footballTrainingPlayerList.map(p => p.playerId);
      response.data.footballTrainingPlayerList.forEach(p => {
        attendanceMap.value[p.playerId] = p.attendanceStatus ?? 0;
      });
    }
    open.value = true;
    title.value = "训练详情";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["trainingRef"].validate(valid => {
    if (valid) {
      form.value.footballTrainingPlayerList = selectedPlayerIds.value.map(playerId => ({
        playerId: playerId,
        attendanceStatus: attendanceMap.value[playerId] ?? 0
      }));
      if (form.value.id != null) {
        updateTraining(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addTraining(form.value).then(response => {
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
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除训练"' + _ids + '"？').then(function() {
    return delTraining(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 位置编码转中文 */
function getPositionLabel(value) {
  const map = { '0': '守门员', '1': '后卫', '2': '中场', '3': '前锋' };
  return map[value] || value;
}

/** 出勤状态编码转文字 */
function getAttendanceLabel(value) {
  const map = { 0: '待确认', 1: '已出勤', 2: '缺勤', 3: '请假' };
  return map[value] ?? '待确认';
}

/** 点击标签循环切换出勤状态 */
function cycleAttendance(playerId) {
  const current = attendanceMap.value[playerId] ?? 0;
  attendanceMap.value[playerId] = (current + 1) % 4;
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/training/export', {
    ...queryParams.value
  }, `training_${new Date().getTime()}.xlsx`)
}

getList();
getPlayerList();
</script>
