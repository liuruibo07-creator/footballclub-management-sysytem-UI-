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
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['injury:injury:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['injury:injury:remove']"
        >删除</el-button>
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

    <el-table v-loading="loading" :data="injuryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="id" width="60" />
      <el-table-column label="球员" align="center" prop="playerName" width="100" />
      <el-table-column label="伤病类型" align="center" prop="injuryType" />
      <el-table-column label="受伤位置" align="center" prop="injuryLocation" />
      <el-table-column label="受伤日期" align="center" prop="injuryDate" width="120">
        <template #default="scope">
          <span>{{ parseTime(scope.row.injuryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预期复出" align="center" prop="expectedReturnDate" width="120">
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
        <el-form-item label="受伤位置" prop="injuryLocation">
          <el-input v-model="form.injuryLocation" placeholder="请输入受伤位置" />
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
        <el-form-item label="预期复出日期" prop="expectedReturnDate">
          <el-date-picker clearable
            v-model="form.expectedReturnDate"
            type="date"
            value-format="YYYY-MM-DD"
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

/** 查询伤病康复列表 */
function getList() {
  loading.value = true;
  listInjury(queryParams.value).then(response => {
    injuryList.value = response.rows;
    total.value = response.total;
    loading.value = false;
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
  title.value = "添加伤病康复记录";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getInjury(_id).then(response => {
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
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除伤病康复编号为"' + _ids + '"的数据项？').then(function() {
    return delInjury(_ids);
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
