<template>
  <div class="app-container league-page">
    <!-- 页面标题 -->
    <div class="page-header">联赛球队管理</div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="queryParams.teamName"
        placeholder="请输入球队名称"
        clearable
        class="filter-input"
        @keyup.enter="handleQuery"
      />
      <el-select v-model="queryParams.leagueName" placeholder="所属联赛" clearable class="filter-select" @change="handleQuery">
        <el-option v-for="l in leagueOptions" :key="l" :label="l" :value="l" />
      </el-select>
      <el-select v-model="queryParams.status" placeholder="球队状态" clearable class="filter-select" @change="handleQuery">
        <el-option label="启用" value="1" />
        <el-option label="停用" value="0" />
      </el-select>
      <el-button type="primary" @click="handleQuery">搜索</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button
        type="primary"
        icon="Plus"
        class="add-btn"
        @click="handleAdd"
        v-hasPermi="['league:team:add']"
      >新增球队</el-button>
    </div>

    <!-- 球队表格 -->
    <el-table v-loading="loading" :data="leagueTeamList">
      <el-table-column label="球队logo" align="center" width="90">
        <template #default="scope">
          <img v-if="scope.row.logoUrl" :src="scope.row.logoUrl" class="team-logo" :alt="scope.row.teamName + 'logo'" />
          <span v-else class="team-logo-fallback">{{ (scope.row.teamName || '').slice(0, 1) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="球队名称" min-width="160">
        <template #default="scope">
          <span :class="{ 'dissolved-name': scope.row.dissolveFlag === '1' }">{{ scope.row.teamName }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="leagueName" label="所属联赛" min-width="110" />
      <el-table-column prop="division" label="俱乐部分部" align="center" width="110" />
      <el-table-column label="球队状态" align="center" width="140">
        <template #default="scope">
          <div class="status-cell">
            <span :class="['status-badge', scope.row.status === '1' ? 'enabled' : 'disabled']">{{ scope.row.status === '1' ? '启用' : '停用' }}</span>
            <span v-if="scope.row.dissolveFlag === '1'" class="status-badge dissolved">已解散</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="liaisonAdmin" label="对接管理员" min-width="110" />
      <el-table-column prop="managerPhone" label="领队电话" min-width="130" />
      <el-table-column label="操作" align="center" width="150">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            plain
            @click="handleUpdate(scope.row)"
            v-hasPermi="['league:team:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="danger"
            plain
            @click="handleDelete(scope.row)"
            v-hasPermi="['league:team:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-bar" v-show="total > 0">
      <span class="total-text">共 {{ total }} 支球队</span>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="queryParams.pageSize"
        v-model:current-page="queryParams.pageNum"
        @current-change="getList"
      />
    </div>

    <!-- 添加或修改联赛球队对话框 -->
    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="leagueTeamRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="球队名称" prop="teamName">
          <el-input v-model="form.teamName" placeholder="请输入球队名称" />
        </el-form-item>
        <el-form-item label="球队logo" prop="logoUrl">
          <el-upload
            class="logo-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            accept="image/png,image/jpg,image/jpeg,image/webp"
          >
            <img v-if="form.logoUrl" :src="form.logoUrl" class="logo-preview" alt="球队logo预览" />
            <div v-else class="logo-uploader-placeholder">
              <el-icon><Plus /></el-icon>
              <span>点击上传logo</span>
            </div>
          </el-upload>
          <div class="upload-tip">必填, 支持 png/jpg/webp, 大小不超过 5MB, 上传成功后自动填入OSS完整URL</div>
        </el-form-item>
        <el-form-item label="所属联赛" prop="leagueName">
          <el-select v-model="form.leagueName" placeholder="请选择所属联赛/赛事" style="width: 100%">
            <el-option v-for="l in leagueOptions" :key="l" :label="l" :value="l" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="俱乐部分部" prop="division">
          <el-select v-model="form.division" placeholder="请选择所属俱乐部分部" style="width: 100%">
            <el-option v-for="d in divisionOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="球队状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="解散标记">
          <el-switch v-model="dissolved" active-text="已解散" inactive-text="正常" />
        </el-form-item>
        <el-form-item label="领队电话" prop="managerPhone">
          <el-input v-model="form.managerPhone" placeholder="请输入领队电话" />
        </el-form-item>
        <el-form-item label="对接管理员" prop="liaisonAdmin">
          <el-input v-model="form.liaisonAdmin" placeholder="请输入对接管理员" />
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

<script setup name="LeagueTeam">
import { Plus } from '@element-plus/icons-vue'
import { getToken } from "@/utils/auth";
import { listLeagueTeam, addLeagueTeam, updateLeagueTeam, delLeagueTeam } from "@/api/league/team";

const { proxy } = getCurrentInstance();

const leagueTeamList = ref([]);
const open = ref(false);
const loading = ref(true);
const total = ref(0);
const title = ref("");
const baseUrl = import.meta.env.VITE_APP_BASE_API;
const uploadUrl = ref(baseUrl + "/common/upload");
const uploadHeaders = ref({ Authorization: "Bearer " + getToken() });

// 所属联赛/赛事静态选项(与系统字典competition_name一致, 加"其他"兜底, 不依赖字典)
const leagueOptions = ['中国足球超级联赛', '中国足球协会杯', 'U21联赛', '青超联赛', '青训赛事'];
// 所属俱乐部分部静态选项
const divisionOptions = ['一线队', 'U21', 'U19', 'U17', '青训梯队'];

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    teamName: undefined,
    leagueName: undefined,
    status: undefined
  },
  rules: {
    teamName: [
      { required: true, message: "球队名称不能为空", trigger: "blur" }
    ],
    logoUrl: [
      { required: true, message: "请上传球队logo", trigger: "change" }
    ],
    leagueName: [
      { required: true, message: "所属联赛/赛事不能为空", trigger: "change" }
    ],
    division: [
      { required: true, message: "所属俱乐部分部不能为空", trigger: "change" }
    ],
    status: [
      { required: true, message: "球队状态不能为空", trigger: "change" }
    ],
    managerPhone: [
      { pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 解散标记开关(表单存dissolveFlag: '0'/'1', 开关用布尔)
const dissolved = computed({
  get: () => form.value.dissolveFlag === '1',
  set: (val) => { form.value.dissolveFlag = val ? '1' : '0'; }
});

/** 查询联赛球队列表 */
function getList() {
  loading.value = true;
  listLeagueTeam(queryParams.value).then(response => {
    leagueTeamList.value = response.rows || [];
    total.value = response.total;
    loading.value = false;
  }).catch(() => {
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
    teamName: null,
    logoUrl: null,
    leagueName: null,
    division: null,
    status: "1",
    dissolveFlag: "0",
    managerPhone: null,
    liaisonAdmin: null,
    remark: null
  };
  proxy.resetForm("leagueTeamRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value.teamName = undefined;
  queryParams.value.leagueName = undefined;
  queryParams.value.status = undefined;
  queryParams.value.pageNum = 1;
  getList();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增球队";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  form.value = {
    id: row.id,
    teamName: row.teamName,
    logoUrl: row.logoUrl,
    leagueName: row.leagueName,
    division: row.division,
    status: row.status,
    dissolveFlag: row.dissolveFlag,
    managerPhone: row.managerPhone,
    liaisonAdmin: row.liaisonAdmin,
    remark: row.remark
  };
  open.value = true;
  title.value = "修改球队";
}

/** 删除按钮操作 */
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除球队"' + row.teamName + '"?').then(function() {
    return delLeagueTeam(row.id);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 提交按钮操作 */
function submitForm() {
  proxy.$refs["leagueTeamRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateLeagueTeam(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addLeagueTeam(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 上传前校验 */
function handleBeforeUpload(file) {
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    proxy.$modal.msgError("上传图片大小不能超过 5MB!");
    return false;
  }
  proxy.$modal.loading("正在上传球队logo...");
  return true;
}

/** 上传成功: 取OSS完整URL(res.url)填入表单 */
function handleUploadSuccess(res) {
  proxy.$modal.closeLoading();
  if (res.code === 200 && res.url) {
    form.value.logoUrl = res.url;
    proxy.$modal.msgSuccess("logo上传成功, 点击确定保存记录");
  } else {
    proxy.$modal.msgError(res.msg || "上传失败");
  }
}

/** 上传失败 */
function handleUploadError() {
  proxy.$modal.closeLoading();
  proxy.$modal.msgError("logo上传失败, 请检查后端OSS配置");
}

getList();
</script>

<style scoped lang="scss">
.league-page {
  .page-header {
    font-size: 18px;
    font-weight: 600;
    color: #f3f6fa;
    margin-bottom: 14px;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;

    .filter-input {
      width: 200px;
    }

    .filter-select {
      width: 160px;
    }

    .add-btn {
      margin-left: auto;
    }
  }

  .team-logo {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 3px;
    vertical-align: middle;
  }

  .team-logo-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(47, 125, 255, 0.18);
    border: 1px solid rgba(120, 176, 255, 0.4);
    color: #78b0ff;
    font-size: 15px;
    font-weight: 700;
  }

  .dissolved-name {
    color: #738095;
    text-decoration: line-through;
  }

  .status-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .status-badge {
    padding: 4px 14px;
    border-radius: 12px;
    color: #fff;
    font-size: 12px;
    white-space: nowrap;

    &.enabled {
      background: #22b573;
    }

    &.disabled {
      background: #738095;
    }

    &.dissolved {
      background: #f14d5c;
    }
  }

  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;

    .total-text {
      font-size: 13px;
      color: #8f9cb0;
    }
  }
}

/* ===== 弹窗上传控件样式 =====
   弹窗 append-to-body 会把 DOM 传送到 body 下, 嵌套在 .league-page 里的
   选择器编译成 ".league-page .logo-preview[data-v-xxx]" 后祖先匹配失效,
   图片按原始尺寸渲染而变大。提为页面级 scoped 选择器后,
   data-v 属性仍跟随传送的 DOM, 样式可正常命中。 */
.logo-uploader {
  display: inline-block;
}

.logo-preview {
  display: block;
  width: 100px;
  height: 100px;
  object-fit: contain;
  border: 1px dashed #223044;
  border-radius: 6px;
  background: #0c1725;
}

.logo-uploader-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100px;
  height: 100px;
  border: 1px dashed #223044;
  border-radius: 6px;
  background: #0c1725;
  color: #78b0ff;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #2f7dff;
  }
}

.upload-tip {
  font-size: 12px;
  color: #738095;
  line-height: 1.6;
}
</style>
