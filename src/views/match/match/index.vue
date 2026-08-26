<template>
  <div class="app-container">
    <!-- 搜索栏 + 新增按钮 -->
    <div class="search-bar">
      <div class="search-left">
        <el-select v-model="queryParams.competitionName" placeholder="全部赛事" clearable style="width: 140px">
          <el-option
            v-for="dict in competition_name"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
          <el-option
            v-for="dict in status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
        <el-button type="primary" @click="handleQuery">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
      <el-button
        type="primary"
        color="#0d47a1"
        icon="Plus"
        @click="handleAdd"
        v-hasPermi="['match:match:add']"
      > 新增比赛</el-button>
    </div>

    <!-- Tab 切换栏 -->
    <div class="tab-bar">
      <span :class="['tab-item', { active: activeTab === 'all' }]" @click="handleTabClick('all')">全部比赛</span>
      <span :class="['tab-item', { active: activeTab === 'finished' }]" @click="handleTabClick('finished')">已完赛</span>
      <span :class="['tab-item', { active: activeTab === 'upcoming' }]" @click="handleTabClick('upcoming')">待进行</span>
    </div>

    <!-- 比赛卡片列表 -->
    <div v-loading="loading" class="match-list">
      <div
        v-for="match in matchList"
        :key="match.id"
        class="match-card"
        :class="{ 'card-active': activeCardId === match.id }"
        @click="activeCardId = match.id"
      >
        <!-- 左侧：轮次 -->
        <div class="card-round">第{{ match.roundNo }}轮</div>
        <!-- 中间：对阵 -->
        <div class="card-teams">
          <span class="team-name">{{ match.homeTeam }}</span>
          <span v-if="match.status === '已完成'" class="score">{{ match.homeScore }} - {{ match.awayScore }}</span>
          <span v-else-if="match.status === '已推迟'" class="score postpone-text">延期</span>
          <span v-else class="score vs-text">VS</span>
          <span class="team-name">{{ match.awayTeam }}</span>
        </div>
        <!-- 右侧：信息 -->
        <div class="card-info">
          <div class="info-date">{{ parseTime(match.matchDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</div>
          <div class="info-venue">{{ match.venue || '-' }}</div>
          <el-tag :type="getStatusTagType(match.status)" size="small">{{ match.status }}</el-tag>
        </div>
      </div>
      <el-empty v-if="!loading && matchList.length === 0" description="暂无比赛数据" />
    </div>
    
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
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in status"
              :key="dict.value"
              :label="dict.value"
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
              :value="dict.value"
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
import { listMatch, getMatch, delMatch, addMatch, updateMatch } from "@/api/match/match";

const { proxy } = getCurrentInstance();
const { status, competition_name, competition_type } = proxy.useDict('status', 'competition_name', 'competition_type');

const matchList = ref([]);
const open = ref(false);
const loading = ref(true);
const activeTab = ref('all');
const activeCardId = ref(null);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 5,
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
      { required: true, message: "赛事名称不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询比赛管理列表 */
function getList() {
  loading.value = true;
  const params = { ...queryParams.value };
  if (activeTab.value === 'finished') {
    params.status = '已完成';
  } else if (activeTab.value === 'upcoming') {
    params.status = '已安排';
  }
  listMatch(params).then(response => {
    matchList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// Tab 切换
function handleTabClick(tab) {
  activeTab.value = tab;
  queryParams.value.pageNum = 1;
  getList();
}

// 状态标签颜色
function getStatusTagType(status) {
  const map = { '已安排': '', '已完成': 'success', '已推迟': 'warning' };
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
  queryParams.value.status = null;
  queryParams.value.competitionName = null;
  queryParams.value.pageNum = 1;
  getList();
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
  getMatch(row.id).then(response => {
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
  proxy.$modal.confirm('是否确认删除该比赛数据？').then(function() {
    return delMatch(row.id);
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

<style scoped>
/* 搜索栏 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.search-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* Tab 切换栏 */
.tab-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}
.tab-item {
  padding: 8px 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  user-select: none;
}
.tab-item.active {
  color: #1a1a1a;
  font-weight: 600;
  border-bottom-color: #0d47a1;
}
.tab-item:hover {
  color: #0d47a1;
}

/* 卡片列表 */
.match-list {
  min-height: 200px;
}
.match-card {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: border-left-color 0.2s;
}
.match-card:hover,
.match-card.card-active {
  border-left-color: #0d47a1;
}
.card-round {
  width: 80px;
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
}
.card-teams {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.team-name {
  font-size: 15px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}
.score {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}
.vs-text {
  font-size: 14px;
  color: #bbb;
  font-weight: 400;
}
.postpone-text {
  font-size: 14px;
  color: #e6a23c;
  font-weight: 400;
}
.card-info {
  width: 180px;
  text-align: right;
  flex-shrink: 0;
}
.info-date {
  font-size: 13px;
  color: #999;
}
.info-venue {
  font-size: 12px;
  color: #bbb;
  margin: 2px 0 6px;
}
</style>
