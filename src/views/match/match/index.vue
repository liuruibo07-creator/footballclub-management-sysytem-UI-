<template>
  <div class="app-container match-page">
    <!-- 页面标题 -->
    <div class="page-header">比赛管理</div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="queryParams.competitionName" placeholder="全部赛事" clearable class="filter-select" @change="handleQuery">
        <el-option
          v-for="dict in competition_name"
          :key="dict.value"
          :label="dict.label"
          :value="dict.value"
        />
        <el-option label="其他" value="其他" />
      </el-select>
      <el-select v-model="queryParams.status" placeholder="全部状态" clearable class="filter-select" @change="handleStatusChange">
        <el-option
          v-for="dict in status"
          :key="dict.value"
          :label="dict.label"
          :value="parseInt(dict.value)"
        />
      </el-select>
      <el-button type="primary" @click="handleQuery">搜索</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button
        type="primary"
        icon="Plus"
        class="add-btn"
        @click="handleAdd"
        v-hasPermi="['match:match:add']"
      >新增比赛</el-button>
    </div>

    <!-- 状态标签页 -->
    <el-tabs v-model="activeTab" class="match-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部比赛" name="all" />
      <el-tab-pane label="已完赛" name="1" />
      <el-tab-pane label="待进行" name="0" />
    </el-tabs>

    <!-- 比赛卡片列表 -->
    <div v-loading="loading" class="match-cards">
      <div v-for="match in matchList" :key="match.id" class="match-card">
        <div class="left-info">
          <div class="round-badge">第{{ match.roundNo }}轮</div>
          <div class="competition-name" v-if="match.competitionName">{{ match.competitionName }}</div>
        </div>
        <div class="teams-row">
          <span class="team home">{{ match.homeTeam }}</span>
          <span :class="match.status === 1 && match.homeScore != null && match.awayScore != null ? 'center-sep sep-score' : 'center-sep sep-vs'">
            <template v-if="match.status === 1 && match.homeScore != null && match.awayScore != null">{{ match.homeScore }} - {{ match.awayScore }}</template>
            <template v-else>vs</template>
          </span>
          <span class="team away">{{ match.awayTeam }}</span>
        </div>
        <div class="right-block">
          <div class="datetime">{{ parseTime(match.matchDate, '{y}-{m}-{d} {h}:{i}') }}</div>
          <div class="venue" v-if="match.venue">{{ match.venue }}</div>
          <span :class="['status-badge', statusClass(match.status)]">{{ statusLabel(match.status) }}</span>
        </div>
      </div>
      <el-empty v-if="!loading && matchList.length === 0" description="暂无比赛数据" />
    </div>

    <!-- 分页 -->
    <div class="pagination-bar" v-show="total > 0">
      <span class="total-text">总共 {{ total }} 场比赛</span>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="queryParams.pageSize"
        v-model:current-page="queryParams.pageNum"
        @current-change="getList"
      />
    </div>

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
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in status"
              :key="dict.value"
              :label="parseInt(dict.value)"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="场地" prop="venue">
          <el-input v-model="form.venue" placeholder="请输入场地" />
        </el-form-item>
        <el-form-item label="赛事类型" prop="competitionType">
          <el-select v-model="form.competitionType" placeholder="请选择赛事类型">
            <el-option
              v-for="dict in competition_type"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="赛事名称" prop="competitionName">
          <el-select v-model="form.competitionName" placeholder="请选择赛事名称">
            <el-option
              v-for="dict in competition_name"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
            <el-option label="其他" value="其他" />
          </el-select>
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
import { listMatch, addMatch, updateMatch } from "@/api/match/match";

const { proxy } = getCurrentInstance();
const route = useRoute();
const { status, competition_name, competition_type } = proxy.useDict('status', 'competition_name', 'competition_type');

const matchList = ref([]);
const open = ref(false);
const loading = ref(true);
const total = ref(0);
const title = ref("");
const activeTab = ref(route.query.status === "1" ? "1" : "all");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    status: route.query.status === "1" ? 1 : null,
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
      { required: true, message: "赛事名称不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询比赛管理列表（按轮次从小到大排序） */
function getList() {
  loading.value = true;
  listMatch(queryParams.value).then(response => {
    matchList.value = (response.rows || []).slice().sort((a, b) => (a.roundNo ?? 0) - (b.roundNo ?? 0));
    total.value = response.total;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

/** 标签页切换 */
function handleTabChange(name) {
  queryParams.value.status = name === "all" ? null : parseInt(name);
  queryParams.value.pageNum = 1;
  getList();
}

/** 状态下拉变化时回到全部比赛标签 */
function handleStatusChange() {
  activeTab.value = "all";
  handleQuery();
}

/** 状态文案 */
function statusLabel(val) {
  const dict = status.value.find(d => parseInt(d.value) === parseInt(val));
  return dict ? dict.label : "未知";
}

/** 状态徽章样式 */
function statusClass(val) {
  const map = { 0: 'scheduled', 1: 'completed', 2: 'postponed', 3: 'cancelled' };
  return map[val] || 'cancelled';
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

/** 从首页进入或返回缓存页面时，同步“已完赛”筛选 */
watch(() => route.query.status, routeStatus => {
  const normalizedStatus = routeStatus === "1" ? 1 : null;
  if (queryParams.value.status !== normalizedStatus) {
    queryParams.value.status = normalizedStatus;
    activeTab.value = normalizedStatus === 1 ? "1" : "all";
    queryParams.value.pageNum = 1;
    getList();
  }
});

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value.status = null;
  queryParams.value.competitionName = null;
  queryParams.value.pageNum = 1;
  activeTab.value = "all";
  getList();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加比赛管理";
}

/** 提交按钮操作 */
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

getList();
</script>

<style scoped lang="scss">
.match-page {
  .page-header {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 14px;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    .filter-select {
      width: 160px;
    }

    .add-btn {
      margin-left: auto;
    }
  }

  .match-tabs {
    margin-bottom: 6px;

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }
  }

  .match-cards {
    min-height: 200px;
  }

  .match-card {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 18px 16px;
    margin-bottom: 16px;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .left-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-right: 12px;

      .round-badge {
        background: #f4f4f5;
        color: #909399;
        padding: 4px 10px;
        border-radius: 4px;
        text-align: center;
        font-size: 13px;
        white-space: nowrap;
      }

      .competition-name {
        font-size: 13px;
        color: #909399;
        white-space: nowrap;
      }
    }

    .teams-row {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;

      .team {
        flex: 1;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        word-break: break-all;

        &.home {
          text-align: right;
          padding-left: 12px;
        }

        &.away {
          text-align: left;
          padding-right: 12px;
        }
      }

      .center-sep {
        min-width: 90px;
        text-align: center;
        font-weight: 700;
        font-size: 15px;
      }

      .sep-vs {
        color: #409eff;
      }

      .sep-score {
        color: #303133;
      }
    }

    .right-block {
      min-width: 190px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;

      .status-badge {
        padding: 4px 14px;
        border-radius: 12px;
        color: #fff;
        font-size: 12px;
        white-space: nowrap;
      }

      .scheduled {
        background: #409eff;
      }

      .completed {
        background: #67c23a;
      }

      .postponed {
        background: #e6a23c;
      }

      .cancelled {
        background: #909399;
      }

      .datetime {
        font-size: 14px;
        color: #303133;
        font-weight: 600;
      }

      .venue {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;

    .total-text {
      font-size: 13px;
      color: #606266;
    }
  }
}
</style>
