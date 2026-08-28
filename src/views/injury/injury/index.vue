<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="球员" prop="playerId">
        <el-select v-model="queryParams.playerId" placeholder="请选择球员" clearable filterable>
          <el-option
            v-for="item in playerList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="伤病类型" prop="injuryType">
        <el-input
          v-model="queryParams.injuryType"
          placeholder="请输入伤病类型"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="康复状态" prop="recoveryStatus">
        <el-select v-model="queryParams.recoveryStatus" placeholder="请选择康复状态" clearable>
          <el-option label="未开始" :value="0" />
          <el-option label="康复中" :value="1" />
          <el-option label="已复出" :value="2" />
          <el-option label="已康复" :value="3" />
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
          v-hasPermi="['injury:injury:add']"
        >新增伤病记录</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['injury:injury:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

<<<<<<< Updated upstream
    <el-table v-loading="loading" :data="injuryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="id" width="60" />
      <el-table-column label="球员" align="center" prop="playerName" width="100" />
      <el-table-column label="伤病类型" align="center" prop="injuryType" />
      <el-table-column label="受伤位置" align="center" prop="injuryLocation" />
      <el-table-column label="受伤日期" align="center" prop="injuryDate" width="120">
=======
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">当前伤病总人数</div>
          <div class="stat-value stat-orange">{{ stats.totalInjury }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">治疗中</div>
          <div class="stat-value stat-red">{{ stats.treating }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">康复中</div>
          <div class="stat-value stat-orange">{{ stats.recovering }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-title">本月已康复</div>
          <div class="stat-value stat-green">{{ stats.recoveredMonth }}</div>
        </div>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="injuryList">
      <el-table-column label="序号" align="center" width="80">
        <template #default="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="球员" align="center" prop="playerName">
        <template #default="scope">
          <span>{{ scope.row.playerName || scope.row.playerId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="伤病类型" align="center" prop="injuryType" />
      <el-table-column label="受伤部位" align="center" prop="injuryLocation" />
      <el-table-column label="受伤日期" align="center" prop="injuryDate" width="180">
>>>>>>> Stashed changes
        <template #default="scope">
          <span>{{ parseTime(scope.row.injuryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
<<<<<<< Updated upstream
      <el-table-column label="预期复出" align="center" prop="expectedReturnDate" width="120">
=======
      <el-table-column label="预计复出" align="center" prop="expectedReturnDate" width="180">
>>>>>>> Stashed changes
        <template #default="scope">
          <span>{{ parseTime(scope.row.expectedReturnDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际返回" align="center" prop="actualReturnDate" width="120">
        <template #default="scope">
          <span>{{ scope.row.actualReturnDate ? parseTime(scope.row.actualReturnDate, '{y}-{m}-{d}') : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="康复状态" align="center" prop="recoveryStatus" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.recoveryStatus)">{{ getStatusText(scope.row.recoveryStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['injury:injury:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['injury:injury:remove']">删除</el-button>
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

    <!-- 添加或修改伤病康复对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="injuryRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="球员" prop="playerId">
          <el-select v-model="form.playerId" placeholder="请选择球员" filterable style="width: 100%">
            <el-option
              v-for="item in playerList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="伤病类型" prop="injuryType">
          <el-input v-model="form.injuryType" placeholder="请输入伤病类型" />
        </el-form-item>
        <el-form-item label="受伤部位" prop="injuryLocation">
          <el-input v-model="form.injuryLocation" placeholder="请输入受伤部位" />
        </el-form-item>
        <el-form-item label="受伤日期" prop="injuryDate">
          <el-date-picker clearable
            v-model="form.injuryDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择受伤日期"
            style="width: 100%">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="预计复出" prop="expectedReturnDate">
          <el-date-picker clearable
            v-model="form.expectedReturnDate"
            type="date"
            value-format="YYYY-MM-DD"
<<<<<<< Updated upstream
            placeholder="请选择预期复出日期"
            style="width: 100%">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="实际返回日期" prop="actualReturnDate">
          <el-date-picker clearable
            v-model="form.actualReturnDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择实际返回日期"
            style="width: 100%">
=======
            placeholder="请选择预计复出">
>>>>>>> Stashed changes
          </el-date-picker>
        </el-form-item>
        <el-form-item label="康复状态" prop="recoveryStatus">
          <el-radio-group v-model="form.recoveryStatus">
            <el-radio :label="0">未开始</el-radio>
            <el-radio :label="1">康复中</el-radio>
            <el-radio :label="2">已复出</el-radio>
            <el-radio :label="3">已康复</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.recoveryStatus === 3" label="实际返回日期" prop="actualReturnDate">
          <el-date-picker clearable
            v-model="form.actualReturnDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择实际返回日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="康复计划" prop="rehabPlan">
          <el-input v-model="form.rehabPlan" type="textarea" :rows="3" placeholder="请输入康复计划" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
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

<script setup name="Injury">
import { listInjury, getInjury, delInjury, addInjury, updateInjury, playerOptions } from "@/api/injury/injury";

const { proxy } = getCurrentInstance();

const injuryList = ref([]);
const playerList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const title = ref("");

const stats = reactive({
  totalInjury: 0,
  treating: 0,
  recovering: 0,
  recoveredMonth: 0
});

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    playerId: null,
    injuryType: null,
    recoveryStatus: null,
  },
  rules: {
    playerId: [
      { required: true, message: "球员不能为空", trigger: "change" }
    ],
    injuryType: [
      { required: true, message: "伤病类型不能为空", trigger: "blur" }
    ],
    injuryLocation: [
      { required: true, message: "受伤位置不能为空", trigger: "blur" }
    ],
    injuryDate: [
      { required: true, message: "受伤日期不能为空", trigger: "blur" }
    ],
    recoveryStatus: [
      { required: true, message: "康复状态不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

<<<<<<< Updated upstream
=======
// 康复状态选择"已康复"时自动填充实际返回日期（默认今天），保证"本月已康复"能统计到
watch(() => form.value.recoveryStatus, (val) => {
  if (val === 3 && !form.value.actualReturnDate) {
    form.value.actualReturnDate = proxy.parseTime(new Date(), '{y}-{m}-{d}');
  }
});

/** 查询球员下拉数据 */
function getPlayerOptions() {
  fetchPlayerOptions().then(response => {
    playerOptions.value = response.data;
  });
}

>>>>>>> Stashed changes
/** 查询伤病康复列表 */
function getList() {
  loading.value = true;
  listInjury(queryParams.value).then(response => {
    injuryList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    getStats();
  });
}

/** 查询伤病统计卡片数据 */
function getStats() {
  listInjury({ pageNum: 1, pageSize: 999999 }).then(response => {
    const rows = response.rows || [];
    const now = new Date();
    const monthPrefix = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    let treating = 0;
    let recovering = 0;
    let recoveredMonth = 0;
    rows.forEach(row => {
      if (row.recoveryStatus === 1) treating++;
      if (row.recoveryStatus === 2) recovering++;
      if (row.recoveryStatus === 3 && row.actualReturnDate && String(row.actualReturnDate).startsWith(monthPrefix)) {
        recoveredMonth++;
      }
    });
    // 当前伤病总人数：尚未康复的记录（未知/治疗中/康复中）
    stats.totalInjury = rows.filter(r => r.recoveryStatus !== 3).length;
    stats.treating = treating;
    stats.recovering = recovering;
    stats.recoveredMonth = recoveredMonth;
  });
}

/** 获取球员下拉列表 */
function getPlayerOptions() {
  playerOptions().then(response => {
    playerList.value = response.data;
  });
}

/** 康复状态文本 */
function getStatusText(status) {
  const map = { 0: '未开始', 1: '康复中', 2: '已复出', 3: '已康复' };
  return map[status] || '未知';
}

/** 康复状态标签颜色 */
function getStatusTagType(status) {
  const map = { 0: 'info', 1: 'warning', 2: '', 3: 'success' };
  return map[status] || 'info';
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
    playerId: null,
    injuryType: null,
    injuryLocation: null,
    injuryDate: null,
    expectedReturnDate: null,
    actualReturnDate: null,
    recoveryStatus: null,
    rehabPlan: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    delFlag: null,
    remark: null
  };
  proxy.resetForm("injuryRef");
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

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加伤病康复记录";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
<<<<<<< Updated upstream
  const _id = row.id || ids.value
  getInjury(_id).then(response => {
=======
  getInjury(row.id).then(response => {
>>>>>>> Stashed changes
    form.value = response.data;
    open.value = true;
    title.value = "修改伤病康复记录";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["injuryRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateInjury(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addInjury(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除伤病康复编号为"' + row.id + '"的数据项？').then(function() {
    return delInjury(row.id);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('injury/injury/export', {
    ...queryParams.value
  }, `injury_${new Date().getTime()}.xlsx`)
}

getPlayerOptions();
getList();
</script>
<<<<<<< Updated upstream
=======

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.stat-orange {
  color: #ff9800;
}

.stat-red {
  color: #f5222d;
}

.stat-green {
  color: #52c41a;
}
</style>
>>>>>>> Stashed changes
