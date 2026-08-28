<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="收支类型" prop="recordType">
        <el-select v-model="queryParams.recordType" placeholder="请选择收支类型" clearable>
          <el-option
            v-for="dict in record_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="明细分类" prop="category">
        <el-select v-model="queryParams.category" placeholder="请选择明细分类" clearable>
          <el-option
            v-for="dict in various"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="金额" prop="amount">
        <el-input
          v-model="queryParams.amount"
          placeholder="请输入金额"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker clearable
          v-model="queryParams.createTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择创建时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间" prop="updateTime">
        <el-date-picker clearable
          v-model="queryParams.updateTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择更新时间">
        </el-date-picker>
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
          v-hasPermi="['finance:finance:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['finance:finance:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['finance:finance:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['finance:finance:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="DataAnalysis"
          @click="handleSummary"
          v-hasPermi="['finance:finance:list']"
        >{{ showSummary ? '收起总结' : '总结' }}</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-row v-if="showSummary" :gutter="20" class="finance-summary" v-loading="summaryLoading">
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="summary-card">
          <div class="summary-title">赛季总收入</div>
          <div class="summary-value summary-income">{{ formatCurrency(summary.totalIncome) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="summary-card">
          <div class="summary-title">赛季总支出</div>
          <div class="summary-value summary-expense">{{ formatCurrency(summary.totalExpense) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="summary-card">
          <div class="summary-title">赛季净收支</div>
          <div class="summary-value summary-balance">{{ formatCurrency(summary.netBalance) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="financeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="主键ID" align="center" prop="id" />
      <el-table-column label="收支类型" align="center" prop="recordType">
        <template #default="scope">
          <dict-tag :options="record_type" :value="scope.row.recordType"/>
        </template>
      </el-table-column>
      <el-table-column label="明细分类" align="center" prop="category">
        <template #default="scope">
          <dict-tag :options="various" :value="scope.row.category"/>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amount" />
      <el-table-column label="业务发生日期" align="center" prop="recordDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.recordDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['finance:finance:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['finance:finance:remove']">删除</el-button>
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

    <!-- 添加或修改财务收支对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="financeRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="收支类型" prop="recordType">
          <el-select v-model="form.recordType" placeholder="请选择收支类型">
            <el-option
              v-for="dict in record_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="明细分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择明细分类">
            <el-option
              v-for="dict in various"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input v-model="form.amount" placeholder="请输入金额" />
        </el-form-item>
        <el-form-item label="业务发生日期" prop="recordDate">
          <el-date-picker clearable
            v-model="form.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择业务发生日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="业务描述/事由" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
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

<script setup name="Finance">
import { listFinance, getFinance, delFinance, addFinance, updateFinance, getFinanceSummary } from "@/api/finance/finance";

const { proxy } = getCurrentInstance();
const { various, record_type } = proxy.useDict('various', 'record_type');

const financeList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const showSummary = ref(false);
const summaryLoading = ref(false);
const summary = ref({
  totalIncome: 0,
  totalExpense: 0,
  netBalance: 0
});

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    recordType: null,
    category: null,
    amount: null,
    createTime: null,
    updateTime: null,
  },
  rules: {
    season: [
      { required: true, message: "赛季不能为空", trigger: "blur" }
    ],
    recordType: [
      { required: true, message: "收支类型不能为空", trigger: "change" }
    ],
    category: [
      { required: true, message: "明细分类不能为空", trigger: "change" }
    ],
    amount: [
      { required: true, message: "金额不能为空", trigger: "blur" }
    ],
    recordDate: [
      { required: true, message: "业务发生日期不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询财务收支列表 */
function getList() {
  loading.value = true;
  listFinance(queryParams.value).then(response => {
    financeList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
  if (showSummary.value) {
    loadSummary();
  }
}

/** 查询财务汇总 */
function loadSummary() {
  summaryLoading.value = true;
  getFinanceSummary().then(response => {
    summary.value = response.data || {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0
    };
  }).finally(() => {
    summaryLoading.value = false;
  });
}

/** 展开或收起财务总结 */
function handleSummary() {
  showSummary.value = !showSummary.value;
  if (showSummary.value) {
    loadSummary();
  }
}

/** 金额格式化 */
function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(Number(value || 0));
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
    season: null,
    recordType: null,
    category: null,
    amount: null,
    recordDate: null,
    description: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    delFlag: null,
    remark: null
  };
  proxy.resetForm("financeRef");
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
  title.value = "添加财务收支";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getFinance(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改财务收支";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["financeRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateFinance(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addFinance(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除财务收支编号为"' + _ids + '"的数据项？').then(function() {
    return delFinance(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('finance/finance/export', {
    ...queryParams.value
  }, `finance_${new Date().getTime()}.xlsx`)
}

getList();
</script>

<style scoped>
.finance-summary {
  margin-bottom: 16px;
}

.summary-card {
  text-align: center;
}

.summary-title,
.summary-note {
  color: #909399;
}

.summary-title {
  font-size: 16px;
}

.summary-value {
  margin: 14px 0;
  font-size: 24px;
  font-weight: 700;
}

.summary-income {
  color: #18b566;
}

.summary-expense {
  color: #f56c6c;
}

.summary-balance {
  color: #409eff;
}

.summary-note {
  font-size: 14px;
}

@media (max-width: 767px) {
  .summary-card {
    margin-bottom: 12px;
  }
}
</style>
