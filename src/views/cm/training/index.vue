<!--
  训练管理页面（增强版）- 俱乐部管理模块下
  路径: /cm/training

  功能概述：
  1. 训练计划列表展示（分页、搜索、筛选）
  2. 新增/修改/删除训练计划
  3. 训练详情查看（含缺席球员信息）
  4. 缺席球员选择（多选下拉，支持出勤率预览）

  核心设计：
  - "缺席球员"模式：系统只存储缺席/请假的球员，出勤球员通过"全部球员 - 缺席球员"计算
  - 出勤率预览：computed 属性实时计算并显示预期出勤率
  - 球员位置显示：下拉选项中显示球员姓名+位置（如"张三（后卫）"）

  与 system/training 的区别：
  - 对话框宽度 680px（更宽，适合显示缺席球员选择）
  - 时间选择器 type="datetime"（精确到秒）
  - 缺席球员下拉显示位置信息
  - getList 有 .catch() 错误处理
-->
<template>
  <div class="app-container">
    <!-- ========== 搜索表单区域 ========== -->
    <!-- 用于按条件筛选训练列表，支持训练名称（模糊）、训练类型（字典下拉）、状态（字典下拉） -->
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
        <!-- 训练类型下拉：使用字典 football_training_type，值映射：0=体能,1=战术,2=技术,3=恢复,4=热身 -->
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
        <!-- 状态下拉：使用字典 football_training_status，值映射：0=已计划,1=已完成,2=已取消 -->
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

    <!-- ========== 工具栏按钮区域 ========== -->
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
        <!-- 修改按钮：单选时可用（single=true 表示选中了恰好1条） -->
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
        <!-- 删除按钮：至少选1条时可用（multiple=false 表示有选中） -->
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

    <!-- ========== 训练列表表格 ========== -->
    <!--
      表格列说明：
      - 复选框列：用于批量操作（修改/删除）
      - 训练名称：直接显示 title 字段
      - 类型：使用 dict-tag 组件将数字编码渲染为中文标签（如 0 → "体能"）
      - 开始/结束时间：使用 parseTime 格式化为 "年-月-日 时:分:秒"
      - 场地：直接显示 venue 字段
      - 预期参与人数：participantCount 字段（后端计算）
      - 出勤率：attendanceRate 字段（后端计算，如 "85%"）
      - 状态：使用 dict-tag 组件渲染（如 0 → "已计划"）
      - 操作列：详情/编辑/删除按钮，各自有独立权限控制
    -->
    <el-table v-loading="loading" :data="trainingList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="训练名称" align="center" prop="title" />
      <el-table-column label="类型" align="center" prop="trainingType" min-width="100">
        <template #default="scope">
          <!-- dict-tag：根据字典值自动显示对应中文标签，颜色由字典配置决定 -->
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
          <!-- 出勤率可能为空（新建训练尚未统计），显示 "-" 占位 -->
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

    <!-- ========== 分页组件 ========== -->
    <!-- 与 queryParams 的 pageNum/pageSize 双向绑定，翻页时自动触发 getList -->
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- ========== 新增/修改训练对话框 ========== -->
    <!--
      对话框宽度 680px，包含：
      1. 训练基本信息（名称、类型、时间、场地、内容、目标、状态）
      2. 缺席球员选择区域（分割线下方）
      3. 出勤率预览提示（el-alert）
    -->
    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="trainingRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="训练名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入训练名称" />
        </el-form-item>
        <el-form-item label="训练类型" prop="trainingType">
          <!-- 注意：:value 使用 parseInt 将字典字符串值转为数字，匹配后端 Integer 类型 -->
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
          <!-- type="datetime" 支持选择日期+时间，value-format 指定返回格式 -->
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

        <!-- ========== 缺席球员选择区域 ========== -->
        <el-divider content-position="center">缺席球员</el-divider>
        <el-form-item label="缺席人员" prop="selectedPlayerIds">
          <!--
            缺席球员多选下拉：
            - multiple：支持多选
            - filterable：支持输入搜索过滤
            - collapse-tags：多选时折叠标签，避免撑开界面
            - 选项显示格式："球员姓名（位置）"，如 "张三（后卫）"
          -->
          <el-select v-model="selectedPlayerIds" multiple filterable collapse-tags placeholder="请从所有球员中选择缺席人员" style="width:100%">
            <el-option
              v-for="player in playerList"
              :key="player.id"
              :label="player.nameCn + '（' + getPositionLabel(player.position) + '）'"
              :value="player.id"
            />
          </el-select>
        </el-form-item>
        <!--
          出勤率预览提示：
          实时显示"共X名球员，缺席Y人，预计出勤率Z%"
          previewAttendanceRate 是 computed 属性，随 selectedPlayerIds 变化自动更新
        -->
        <el-alert
          v-if="playerList.length > 0"
          :title="`当前共 ${playerList.length} 名球员，缺席 ${selectedPlayerIds.length} 人，预计出勤率 ${previewAttendanceRate}%`"
          type="info"
          :closable="false"
          show-icon
        />
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
/**
 * 训练管理页面 - 脚本逻辑
 *
 * 引入的 API：
 * - listTraining/getTraining/delTraining/addTraining/updateTraining：训练 CRUD 操作
 * - listPlayer：获取所有球员列表（用于缺席球员下拉选择）
 *
 * 使用的字典：
 * - football_training_type：训练类型（0=体能,1=战术,2=技术,3=恢复,4=热身）
 * - football_training_status：训练状态（0=已计划,1=已完成,2=已取消）
 */
import { listTraining, getTraining, delTraining, addTraining, updateTraining } from "@/api/system/training";
import { listPlayer } from "@/api/pp/pp";

const { proxy } = getCurrentInstance();

// 加载字典数据，proxy.useDict 会从后端 sys_dict_data 表查询并返回响应式数组
const { football_training_type, football_training_status } = proxy.useDict('football_training_type', 'football_training_status');

// ========== 列表相关状态 ==========
const trainingList = ref([]);   // 训练列表数据（表格展示）
const playerList = ref([]);     // 所有球员列表（用于缺席球员下拉选择）
const selectedPlayerIds = ref([]);  // 当前选中的缺席球员ID数组（如 [1, 3, 5]）

/**
 * 出勤率预览计算（响应式）
 * 公式：(总球员数 - 缺席人数) / 总球员数 × 100%
 * 当 selectedPlayerIds 变化时自动重新计算，实时更新 el-alert 显示
 */
const previewAttendanceRate = computed(() => {
  if (playerList.value.length === 0) return 0;
  return Math.round((playerList.value.length - selectedPlayerIds.value.length) * 100 / playerList.value.length);
});

const open = ref(false);      // 对话框显示状态
const loading = ref(true);    // 表格加载状态（v-loading 指令使用）
const showSearch = ref(true); // 搜索表单显示状态
const ids = ref([]);          // 表格多选选中的ID数组（用于批量操作）
const single = ref(true);     // 单选标志（true=未选中或选中多条，修改按钮禁用）
const multiple = ref(true);   // 多选标志（true=未选中，删除按钮禁用）
const total = ref(0);         // 列表总条数（分页使用）
const title = ref("");        // 对话框标题（"新增训练"/"修改训练"/"训练详情"）

// ========== 表单数据与查询参数 ==========
const data = reactive({
  form: {},  // 当前编辑的训练表单数据
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,         // 训练名称（模糊查询）
    trainingType: null,  // 训练类型（字典值）
    startTime: null,     // 开始时间（日期筛选）
    status: null,        // 状态（字典值）
  },
  rules: {
    // 表单验证规则（仅标记必填项，具体验证由 el-form 自动触发）
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

// 将 reactive 对象的属性解构为 ref，方便在 template 中直接使用
const { queryParams, form, rules } = toRefs(data);

/**
 * 查询训练计划列表（分页）
 * 调用 listTraining API，返回数据绑定到表格
 * .catch() 确保即使请求失败也能关闭 loading 状态，避免页面卡在加载动画
 */
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

/**
 * 加载所有球员列表（用于缺席球员下拉选择）
 * 调用球员模块 API，pageSize=1000 确保获取全部球员
 * 使用 Map 去重，防止接口返回重复数据
 */
function getPlayerList() {
  listPlayer({ pageSize: 1000 }).then(response => {
    playerList.value = Array.from(
      new Map((response.rows || []).map(player => [player.id, player])).values()
    );
  });
}

// 取消按钮：关闭对话框并重置表单
function cancel() {
  open.value = false;
  reset();
}

/**
 * 表单重置
 * 清空 form 对象所有字段，清空缺席球员选择，重置 el-form 验证状态
 */
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
  proxy.resetForm("trainingRef");
}

/** 搜索按钮：重置页码为1后查询 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮：清空搜索条件后查询 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/**
 * 表格多选变化处理
 * 更新 ids（选中ID数组）、single（单选标志）、multiple（多选标志）
 * 用于控制"修改"和"删除"按钮的禁用状态
 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮：重置表单后打开对话框 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增训练";
}

/**
 * 修改按钮操作
 * 1. 调用 getTraining 获取完整数据（含 footballTrainingPlayerList 子表）
 * 2. 从子表中筛选出缺席/请假的球员（attendanceStatus=2或3）
 * 3. 提取其 playerId 填充到 selectedPlayerIds，用于回显缺席选择
 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getTraining(_id).then(response => {
    form.value = response.data;
    // 从子表数据中提取缺席球员ID（attendanceStatus=2缺勤 或 3请假）
    if (response.data.footballTrainingPlayerList) {
      selectedPlayerIds.value = response.data.footballTrainingPlayerList
        .filter(p => p.attendanceStatus === 2 || p.attendanceStatus === 3)
        .map(p => p.playerId);
    }
    open.value = true;
    title.value = "修改训练";
  });
}

/**
 * 详情按钮操作
 * 逻辑同修改，但对话框标题为"训练详情"
 * 注意：详情模式下表单仍可编辑（未做只读限制）
 */
function handleDetail(row) {
  reset();
  getTraining(row.id).then(response => {
    form.value = response.data;
    if (response.data.footballTrainingPlayerList) {
      selectedPlayerIds.value = response.data.footballTrainingPlayerList
        .filter(p => p.attendanceStatus === 2 || p.attendanceStatus === 3)
        .map(p => p.playerId);
    }
    open.value = true;
    title.value = "训练详情";
  });
}

/**
 * 提交表单（新增或修改）
 *
 * 核心逻辑：
 * 1. 将 selectedPlayerIds（缺席球员ID数组）转换为子表数据结构
 *    [{ playerId: 1, attendanceStatus: 2 }, ...]
 *    attendanceStatus 固定为 2（缺勤），因为这里只存储缺席人员
 * 2. 根据 form.id 是否存在判断新增/修改，调用对应 API
 * 3. 成功后关闭对话框并刷新列表
 */
function submitForm() {
  proxy.$refs["trainingRef"].validate(valid => {
    if (valid) {
      // 将缺席球员ID数组转换为子表数据格式
      // attendanceStatus=2 表示缺勤（系统只存储缺席人员，不存储出勤人员）
      form.value.footballTrainingPlayerList = selectedPlayerIds.value.map(playerId => ({
        playerId: playerId,
        attendanceStatus: 2
      }));
      if (form.value.id != null) {
        // 修改：调用 updateTraining，后端会先删后重建子表记录
        updateTraining(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        // 新增：调用 addTraining，后端会同时创建日程事件（自动同步）
        addTraining(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/**
 * 删除按钮操作
 * 弹出确认框，确认后调用 delTraining API
 * 支持单条删除（row.id）和批量删除（ids.value，逗号分隔）
 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除训练"' + _ids + '"？').then(function() {
    return delTraining(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/**
 * 球员位置编码转中文标签
 * football_player.position 字段存储数字编码，前端需映射为中文显示
 * 映射关系：0=守门员, 1=后卫, 2=中场, 3=前锋
 *
 * @param {string|number} value - 位置编码
 * @returns {string} 位置中文名称
 */
function getPositionLabel(value) {
  const map = { '0': '守门员', '1': '后卫', '2': '中场', '3': '前锋' };
  return map[value] || value;
}

/**
 * 导出按钮操作
 * 调用若依通用导出方法，参数透传 queryParams
 * 后端生成 Excel 文件，文件名格式：training_{时间戳}.xlsx
 */
function handleExport() {
  proxy.download('system/training/export', {
    ...queryParams.value
  }, `training_${new Date().getTime()}.xlsx`)
}

// ========== 页面初始化 ==========
// 加载训练列表和球员列表（球员列表用于缺席球员下拉选择）
getList();
getPlayerList();
</script>
