<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="赛事名称" prop="competitionName">
        <el-input
          v-model="queryParams.competitionName"
          placeholder="请输入赛事名称"
          clearable
          @keyup.enter="handleQuery"
        />
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
          v-hasPermi="['match:match:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['match:match:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['match:match:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['match:match:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="matchList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="轮次" align="center" prop="roundNo" />
      <el-table-column label="比赛时间" align="center" prop="matchDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.matchDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="主队" align="center" prop="homeTeam" />
      <el-table-column label="客队" align="center" prop="awayTeam" />
      <el-table-column label="主队得分" align="center" prop="homeScore" />
      <el-table-column label="客队得分" align="center" prop="awayScore" />
      <el-table-column label="状态" align="center" prop="status" />
      <el-table-column label="场地" align="center" prop="venue" />
      <el-table-column label="赛事名称" align="center" prop="competitionName" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['match:match:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['match:match:remove']">删除</el-button>
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

    <!-- 添加或修改比赛管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="matchRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="赛季" prop="season">
          <el-input v-model="form.season" placeholder="请输入赛季" />
        </el-form-item>
        <el-form-item label="轮次" prop="roundNo">
          <el-input v-model="form.roundNo" placeholder="请输入轮次" />
        </el-form-item>
        <el-form-item label="比赛时间" prop="matchDate">
          <el-date-picker clearable
            v-model="form.matchDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择比赛时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="主队" prop="homeTeam">
          <el-input v-model="form.homeTeam" placeholder="请输入主队" />
        </el-form-item>
        <el-form-item label="客队" prop="awayTeam">
          <el-input v-model="form.awayTeam" placeholder="请输入客队" />
        </el-form-item>
        <el-form-item label="场地" prop="venue">
          <el-input v-model="form.venue" placeholder="请输入场地" />
        </el-form-item>
        <el-form-item label="赛事名称" prop="competitionName">
          <el-input v-model="form.competitionName" placeholder="请输入赛事名称" />
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

<script setup name="Match">
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/match/match";

const { proxy } = getCurrentInstance();

const matchList = ref([]);
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
    status: null,
    competitionName: null,
  },
  rules: {
    season: [
      { required: true, message: "赛季不能为空", trigger: "blur" }
    ],
    matchDate: [
      { required: true, message: "比赛时间不能为空", trigger: "blur" }
    ],
    homeTeam: [
      { required: true, message: "主队不能为空", trigger: "blur" }
    ],
    awayTeam: [
      { required: true, message: "客队不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ],
    competitionType: [
      { required: true, message: "赛事类型不能为空", trigger: "change" }
    ],
    competitionName: [
      { required: true, message: "赛事名称不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询比赛管理列表 */
function getList() {
  loading.value = true;
  listMatch(queryParams.value).then(response => {
    matchList.value = response.rows;
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
    season: null,
    roundNo: null,
    matchDate: null,
    homeTeam: null,
    awayTeam: null,
    homeScore: null,
    awayScore: null,
    status: null,
    venue: null,
    competitionType: null,
    competitionName: null,
    sourceUrl: null,
    sourceAsOf: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    delFlag: null,
    remark: null
  };
  proxy.resetForm("matchRef");
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
  title.value = "添加比赛管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getMatch(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改比赛管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["matchRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateMatch(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addMatch(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除比赛管理编号为"' + _ids + '"的数据项？').then(function() {
    return delMatch(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('match/match/export', {
    ...queryParams.value
  }, `match_${new Date().getTime()}.xlsx`)
}

getList();
</script>
