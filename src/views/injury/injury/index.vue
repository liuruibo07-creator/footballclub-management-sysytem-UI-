<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="球员" prop="playerId">
        <el-select v-model="queryParams.playerId" placeholder="请选择球员" clearable>
          <el-option
            v-for="item in playerOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="受伤日期" style="width: 308px">
        <el-date-picker
          v-model="daterangeInjuryDate"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="康复状态" prop="recoveryStatus">
        <el-select v-model="queryParams.recoveryStatus" placeholder="请选择康复状态" clearable>
          <el-option label="未知" :value="0" />
          <el-option label="治疗中" :value="1" />
          <el-option label="康复中" :value="2" />
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
      <el-table-column label="序号" align="center" prop="id" />
      <el-table-column label="球员" align="center" prop="playerName">
        <template #default="scope">
          <span>{{ scope.row.playerName || scope.row.playerId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="伤病类型" align="center" prop="injuryType" />
      <el-table-column label="受伤位置" align="center" prop="injuryLocation" />
      <el-table-column label="受伤日期" align="center" prop="injuryDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.injuryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预期复出日期" align="center" prop="expectedReturnDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expectedReturnDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际返回日期" align="center" prop="actualReturnDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.actualReturnDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="康复状态" align="center" prop="recoveryStatus">
        <template #default="scope">
          <el-tag v-if="scope.row.recoveryStatus === 0" type="info">未知</el-tag>
          <el-tag v-else-if="scope.row.recoveryStatus === 1" type="danger">治疗中</el-tag>
          <el-tag v-else-if="scope.row.recoveryStatus === 2" type="warning">康复中</el-tag>
          <el-tag v-else-if="scope.row.recoveryStatus === 3" type="success">已康复</el-tag>
          <span v-else>{{ scope.row.recoveryStatus }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
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
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="injuryRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="球员" prop="playerId">
          <el-select v-model="form.playerId" placeholder="请选择球员">
            <el-option
              v-for="item in playerOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            ></el-option>
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
            placeholder="请选择受伤日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="预期复出日期" prop="expectedReturnDate">
          <el-date-picker clearable
            v-model="form.expectedReturnDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择预期复出日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="康复状态" prop="recoveryStatus">
          <el-select v-model="form.recoveryStatus" placeholder="请选择康复状态">
            <el-option label="未知" :value="0" />
            <el-option label="治疗中" :value="1" />
            <el-option label="康复中" :value="2" />
            <el-option label="已康复" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="康复计划" prop="rehabPlan">
          <el-input v-model="form.rehabPlan" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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
import { listInjury, getInjury, delInjury, addInjury, updateInjury, getPlayerOptions as fetchPlayerOptions } from "@/api/injury/injury";

const { proxy } = getCurrentInstance();

const injuryList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangeInjuryDate = ref([]);
const playerOptions = ref([]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    playerId: null,
    injuryType: null,
    injuryDate: null,
    recoveryStatus: null,
  },
  rules: {
    playerId: [
      { required: true, message: "球员不能为空", trigger: "change" }
    ],
    injuryType: [
      { required: true, message: "伤病类型不能为空", trigger: "change" }
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

/** 查询球员下拉数据 */
function getPlayerOptions() {
  fetchPlayerOptions().then(response => {
    playerOptions.value = response.data;
  });
}

/** 查询伤病康复列表 */
function getList() {
  loading.value = true;
  queryParams.value.params = {};
  if (null != daterangeInjuryDate && '' != daterangeInjuryDate) {
    queryParams.value.params["beginInjuryDate"] = daterangeInjuryDate.value[0];
    queryParams.value.params["endInjuryDate"] = daterangeInjuryDate.value[1];
  }
  listInjury(queryParams.value).then(response => {
    injuryList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
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
  daterangeInjuryDate.value = [];
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
  title.value = "添加伤病康复";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row?.id ?? ids.value[0];
  if (_id == null) {
    proxy.$modal.msgError("该记录缺少主键 ID，请先修复数据库中的伤病记录");
    return;
  }
  getInjury(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改伤病康复";
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

getList();
getPlayerOptions();
</script>
