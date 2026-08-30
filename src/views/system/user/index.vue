<template>
   <div class="app-container user-management-page">
      <el-row :gutter="16" class="user-workspace">
         <!--部门数据-->
         <el-col :span="4" :xs="24" class="dept-panel-col">
            <section class="dept-panel">
               <div class="panel-heading">
                  <h3>部门导航</h3>
                  <span>按组织快速筛选用户</span>
               </div>
               <div class="head-container dept-search">
               <el-input
                  v-model="deptName"
                  placeholder="请输入部门名称"
                  clearable
                  prefix-icon="Search"
               />
               </div>
               <div class="head-container dept-tree-scroll">
               <el-tree
                  class="dept-tree"
                  :data="deptOptions"
                  :props="{ label: 'label', children: 'children' }"
                  :expand-on-click-node="false"
                  :filter-node-method="filterNode"
                  ref="deptTreeRef"
                  node-key="id"
                  highlight-current
                  default-expand-all
                  @node-click="handleNodeClick"
               />
               </div>
            </section>
         </el-col>
         <!--用户数据-->
         <el-col :span="20" :xs="24" class="user-content-col">
            <el-form class="user-query-panel" :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
               <el-form-item label="用户名称" prop="userName">
                  <el-input
                     v-model="queryParams.userName"
                     placeholder="请输入用户名称"
                     clearable
                     style="width: 240px"
                     @keyup.enter="handleQuery"
                  />
               </el-form-item>
               <el-form-item label="手机号码" prop="phonenumber">
                  <el-input
                     v-model="queryParams.phonenumber"
                     placeholder="请输入手机号码"
                     clearable
                     style="width: 240px"
                     @keyup.enter="handleQuery"
                  />
               </el-form-item>
               <el-form-item label="创建时间" style="width: 308px;">
                  <el-date-picker
                     v-model="dateRange"
                     value-format="YYYY-MM-DD"
                     type="daterange"
                     range-separator="-"
                     start-placeholder="开始日期"
                     end-placeholder="结束日期"
                  ></el-date-picker>
               </el-form-item>
               <el-form-item>
                  <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetQuery">重置</el-button>
               </el-form-item>
            </el-form>

            <section class="user-table-card">
            <el-row :gutter="10" class="user-toolbar">
               <el-col :span="1.5">
                  <el-button
                     type="primary"
                     plain
                     icon="Plus"
                     @click="handleAdd"
                     v-hasPermi="['system:user:add']"
                  >新增</el-button>
               </el-col>
               <el-col :span="1.5">
                  <el-button
                     type="success"
                     plain
                     icon="Edit"
                     :disabled="single"
                     @click="handleUpdate"
                     v-hasPermi="['system:user:edit']"
                  >修改</el-button>
               </el-col>
               <el-col :span="1.5">
                  <el-button
                     type="danger"
                     plain
                     icon="Delete"
                     :disabled="multiple"
                     @click="handleDelete"
                     v-hasPermi="['system:user:remove']"
                  >删除</el-button>
               </el-col>
               <el-col :span="1.5">
                  <el-button
                     type="info"
                     plain
                     icon="Upload"
                     @click="handleImport"
                     v-hasPermi="['system:user:import']"
                  >导入</el-button>
               </el-col>
               <el-col :span="1.5">
                  <el-button
                     type="warning"
                     plain
                     icon="Download"
                     @click="handleExport"
                     v-hasPermi="['system:user:export']"
                  >导出</el-button>
               </el-col>
               <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
            </el-row>

            <el-table class="user-table" v-loading="loading" :data="userList" row-key="userId" stripe @selection-change="handleSelectionChange">
               <el-table-column type="selection" width="48" align="center" />
               <el-table-column label="用户编号" align="center" key="userId" prop="userId" v-if="columns[0].visible" width="96" />
               <el-table-column label="用户名称" align="left" key="userName" prop="userName" v-if="columns[1].visible" min-width="130" :show-overflow-tooltip="true" />
               <el-table-column label="用户昵称" align="left" key="nickName" prop="nickName" v-if="columns[2].visible" min-width="140" :show-overflow-tooltip="true" />
               <el-table-column label="部门" align="left" key="deptName" prop="dept.deptName" v-if="columns[3].visible" min-width="180" :show-overflow-tooltip="true" />
               <el-table-column label="手机号码" align="left" key="phonenumber" prop="phonenumber" v-if="columns[4].visible" width="140" />
               <el-table-column label="状态" align="center" key="status" v-if="columns[5].visible" width="90">
                  <template #default="scope">
                     <el-switch
                        v-model="scope.row.status"
                        active-value="0"
                        inactive-value="1"
                        @change="handleStatusChange(scope.row)"
                     ></el-switch>
                  </template>
               </el-table-column>
               <el-table-column label="创建时间" align="center" prop="createTime" v-if="columns[6].visible" width="180">
                  <template #default="scope">
                     <span>{{ parseTime(scope.row.createTime) }}</span>
                  </template>
               </el-table-column>
               <el-table-column label="操作" align="center" width="160" fixed="right" class-name="small-padding">
                  <template #default="scope">
                     <el-tooltip content="修改" placement="top" v-if="scope.row.userId !== 1">
                        <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:user:edit']"></el-button>
                     </el-tooltip>
                     <el-tooltip content="删除" placement="top" v-if="scope.row.userId !== 1">
                        <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:user:remove']"></el-button>
                     </el-tooltip>
                     <el-tooltip content="重置密码" placement="top" v-if="scope.row.userId !== 1">
                         <el-button link type="primary" icon="Key" @click="handleResetPwd(scope.row)" v-hasPermi="['system:user:resetPwd']"></el-button>
                     </el-tooltip>
                     <el-tooltip content="分配角色" placement="top" v-if="scope.row.userId !== 1">
                        <el-button link type="primary" icon="CircleCheck" @click="handleAuthRole(scope.row)" v-hasPermi="['system:user:edit']"></el-button>
                     </el-tooltip>
                  </template>
               </el-table-column>
            </el-table>
            <pagination
               v-show="total > 0"
               :total="total"
               v-model:page="queryParams.pageNum"
               v-model:limit="queryParams.pageSize"
               @pagination="getList"
            />
            </section>
         </el-col>
      </el-row>

      <!-- 添加或修改用户配置对话框 -->
      <el-dialog :title="title" v-model="open" width="600px" append-to-body>
         <el-form :model="form" :rules="rules" ref="userRef" label-width="80px">
            <el-row>
               <el-col :span="12">
                  <el-form-item label="用户昵称" prop="nickName">
                     <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="归属部门" prop="deptId">
                     <el-tree-select
                        v-model="form.deptId"
                        :data="deptOptions"
                        :props="{ value: 'id', label: 'label', children: 'children' }"
                        value-key="id"
                        placeholder="请选择归属部门"
                        check-strictly
                     />
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="12">
                  <el-form-item label="手机号码" prop="phonenumber">
                     <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="邮箱" prop="email">
                     <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="12">
                  <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
                     <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
                     <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="12">
                  <el-form-item label="用户性别">
                     <el-select v-model="form.sex" placeholder="请选择">
                        <el-option
                           v-for="dict in sys_user_sex"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                        ></el-option>
                     </el-select>
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="状态">
                     <el-radio-group v-model="form.status">
                        <el-radio
                           v-for="dict in sys_normal_disable"
                           :key="dict.value"
                           :label="dict.value"
                        >{{ dict.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="24">
                  <el-form-item label="角色">
                     <el-select v-model="form.roleIds" multiple placeholder="请选择" style="width: 100%">
                        <el-option
                           v-for="item in roleOptions"
                           :key="item.roleId"
                           :label="item.roleName"
                           :value="item.roleId"
                           :disabled="item.status == 1"
                        ></el-option>
                     </el-select>
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="24">
                  <el-form-item label="备注">
                     <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
                  </el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">确 定</el-button>
               <el-button @click="cancel">取 消</el-button>
            </div>
         </template>
      </el-dialog>

      <!-- 用户导入对话框 -->
      <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
         <el-upload
            ref="uploadRef"
            :limit="1"
            accept=".xlsx, .xls"
            :headers="upload.headers"
            :action="upload.url + '?updateSupport=' + upload.updateSupport"
            :disabled="upload.isUploading"
            :on-progress="handleFileUploadProgress"
            :on-success="handleFileSuccess"
            :auto-upload="false"
            drag
         >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
               <div class="el-upload__tip text-center">
                  <div class="el-upload__tip">
                     <el-checkbox v-model="upload.updateSupport" />是否更新已经存在的用户数据
                  </div>
                  <span>仅允许导入xls、xlsx格式文件。</span>
                  <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
               </div>
            </template>
         </el-upload>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitFileForm">确 定</el-button>
               <el-button @click="upload.open = false">取 消</el-button>
            </div>
         </template>
      </el-dialog>
   </div>
</template>

<script setup name="User">
import { getToken } from "@/utils/auth";
import { changeUserStatus, listUser, resetUserPwd, delUser, getUser, updateUser, addUser, deptTreeSelect } from "@/api/system/user";

const router = useRouter();
const { proxy } = getCurrentInstance();
const { sys_normal_disable, sys_user_sex } = proxy.useDict("sys_normal_disable", "sys_user_sex");

const userList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);
const deptName = ref("");
const deptOptions = ref(undefined);
const initPassword = ref(undefined);
const roleOptions = ref([]);
/*** 用户导入参数 */
const upload = reactive({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: "",
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: { Authorization: "Bearer " + getToken() },
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + "/system/user/importData"
});
// 列显隐信息
const columns = ref([
  { key: 0, label: `用户编号`, visible: true },
  { key: 1, label: `用户名称`, visible: true },
  { key: 2, label: `用户昵称`, visible: true },
  { key: 3, label: `部门`, visible: true },
  { key: 4, label: `手机号码`, visible: true },
  { key: 5, label: `状态`, visible: true },
  { key: 6, label: `创建时间`, visible: true }
]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: undefined,
    phonenumber: undefined,
    deptId: undefined
  },
  rules: {
    userName: [{ required: true, message: "用户名称不能为空", trigger: "blur" }, { min: 2, max: 20, message: "用户名称长度必须介于 2 和 20 之间", trigger: "blur" }],
    nickName: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
    password: [{ required: true, message: "用户密码不能为空", trigger: "blur" }, { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" }],
    email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
    phonenumber: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 通过条件过滤节点  */
const filterNode = (value, data) => {
  if (!value) return true;
  return data.label.indexOf(value) !== -1;
};
/** 根据名称筛选部门树 */
watch(deptName, val => {
  proxy.$refs["deptTreeRef"].filter(val);
});
/** 查询部门下拉树结构 */
function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data;
  });
};
/** 查询用户列表 */
function getList() {
  loading.value = true;
  listUser(proxy.addDateRange(queryParams.value, dateRange.value)).then(res => {
    loading.value = false;
    userList.value = res.rows;
    total.value = res.total;
  });
};
/** 节点单击事件 */
function handleNodeClick(data) {
  queryParams.value.deptId = data.id;
  handleQuery();
};
/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
};
/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  queryParams.value.deptId = undefined;
  proxy.$refs.deptTreeRef.setCurrentKey(null);
  handleQuery();
};
/** 删除按钮操作 */
function handleDelete(row) {
  const userIds = row.userId || ids.value;
  proxy.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？').then(function () {
    return delUser(userIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
};
/** 导出按钮操作 */
function handleExport() {
  proxy.download("system/user/export", {
    ...queryParams.value,
  },`user_${new Date().getTime()}.xlsx`);
};
/** 用户状态修改  */
function handleStatusChange(row) {
  let text = row.status === "0" ? "启用" : "停用";
  proxy.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗?').then(function () {
    return changeUserStatus(row.userId, row.status);
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功");
  }).catch(function () {
    row.status = row.status === "0" ? "1" : "0";
  });
};
/** 更多操作 */
function handleCommand(command, row) {
  switch (command) {
    case "handleResetPwd":
      handleResetPwd(row);
      break;
    case "handleAuthRole":
      handleAuthRole(row);
      break;
    default:
      break;
  }
};
/** 跳转角色分配 */
function handleAuthRole(row) {
  const userId = row.userId;
  router.push("/system/user-auth/role/" + userId);
};
/** 重置密码按钮操作 */
function handleResetPwd(row) {
  proxy.$prompt('请输入"' + row.userName + '"的新密码', "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    closeOnClickModal: false,
    inputPattern: /^.{5,20}$/,
    inputErrorMessage: "用户密码长度必须介于 5 和 20 之间",
  }).then(({ value }) => {
    resetUserPwd(row.userId, value).then(response => {
      proxy.$modal.msgSuccess("修改成功，新密码是：" + value);
    });
  }).catch(() => {});
};
/** 选择条数  */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.userId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};
/** 导入按钮操作 */
function handleImport() {
  upload.title = "用户导入";
  upload.open = true;
};
/** 下载模板操作 */
function importTemplate() {
  proxy.download("system/user/importTemplate", {
  }, `user_template_${new Date().getTime()}.xlsx`);
};
/**文件上传中处理 */
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};
/** 文件上传成功处理 */
const handleFileSuccess = (response, file, fileList) => {
  upload.open = false;
  upload.isUploading = false;
  proxy.$refs["uploadRef"].handleRemove(file);
  proxy.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
  getList();
};
/** 提交上传文件 */
function submitFileForm() {
  proxy.$refs["uploadRef"].submit();
};
/** 重置操作表单 */
function reset() {
  form.value = {
    userId: undefined,
    deptId: undefined,
    userName: undefined,
    nickName: undefined,
    password: undefined,
    phonenumber: undefined,
    email: undefined,
    sex: undefined,
    status: "0",
    remark: undefined,
    roleIds: []
  };
  proxy.resetForm("userRef");
};
/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
};
/** 新增按钮操作 */
function handleAdd() {
  reset();
  getUser().then(response => {
    roleOptions.value = response.roles;
    open.value = true;
    title.value = "添加用户";
    form.value.password = initPassword.value;
  });
};
/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const userId = row.userId || ids.value;
  getUser(userId).then(response => {
    form.value = response.data;
    roleOptions.value = response.roles;
    form.value.roleIds = response.roleIds;
    open.value = true;
    title.value = "修改用户";
    form.password = "";
  });
};
/** 提交按钮 */
function submitForm() {
  proxy.$refs["userRef"].validate(valid => {
    if (valid) {
      if (form.value.userId != undefined) {
        updateUser(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addUser(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
};

getDeptTree();
getList();
</script>

<style scoped>
.user-management-page {
  min-height: calc(100vh - 84px);
  background: var(--fc-bg);
}

.user-workspace {
  align-items: stretch;
}

.dept-panel,
.user-query-panel,
.user-table-card {
  background: var(--fc-surface);
  border: 1px solid var(--fc-border);
  border-radius: 10px;
  box-shadow: none;
}

.dept-panel {
  min-height: calc(100vh - 124px);
  padding: 18px 14px;
}

.panel-heading {
  margin-bottom: 16px;
  padding: 0 4px;
}

.panel-heading h3 {
  margin: 0 0 5px;
  color: var(--fc-text);
  font-size: 16px;
  font-weight: 600;
}

.panel-heading span {
  color: var(--fc-text-muted);
  font-size: 12px;
}

.dept-search {
  margin-bottom: 16px;
}

.dept-tree-scroll {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  border-top: 1px solid var(--fc-border-soft);
  padding-top: 12px;
}

.user-content-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-query-panel {
  margin: 0;
  padding: 18px 18px 2px;
}

.user-table-card {
  overflow: hidden;
}

.user-toolbar {
  margin: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--fc-border-soft);
}

:deep(.dept-search .el-input__wrapper),
:deep(.user-query-panel .el-input__wrapper),
:deep(.user-query-panel .el-select__wrapper),
:deep(.user-query-panel .el-date-editor) {
  background: #0c1725;
  box-shadow: 0 0 0 1px var(--fc-border) inset;
}

:deep(.dept-tree) {
  color: var(--fc-text-secondary);
  background: transparent;
}

:deep(.dept-tree .el-tree-node__content) {
  height: 38px;
  margin: 2px 0;
  border-radius: 6px;
}

:deep(.dept-tree .el-tree-node__content:hover) {
  color: #71aaff;
  background: var(--fc-primary-soft);
}

:deep(.dept-tree .el-tree-node.is-current > .el-tree-node__content) {
  color: #7bb2ff;
  font-weight: 500;
  background: rgba(47, 125, 255, .2);
}

:deep(.user-query-panel .el-form-item) {
  margin-right: 24px;
  margin-bottom: 16px;
}

:deep(.user-query-panel .el-form-item__label) {
  color: var(--fc-text-secondary);
  font-weight: 600;
}

:deep(.user-toolbar .el-button) {
  border-radius: 6px;
}

:deep(.user-query-panel .el-button--primary) {
  --el-button-bg-color: var(--fc-primary);
  --el-button-border-color: var(--fc-primary);
  --el-button-hover-bg-color: #4b90ff;
  --el-button-hover-border-color: #4b90ff;
}

:deep(.user-toolbar .el-button.is-plain) {
  background: #132238 !important;
}

:deep(.user-toolbar .el-button--primary.is-plain) {
  border-color: rgba(47, 125, 255, .62) !important;
  color: #6ba8ff !important;
}

:deep(.user-toolbar .el-button--success.is-plain) {
  border-color: rgba(34, 181, 115, .55) !important;
  color: #49d293 !important;
}

:deep(.user-toolbar .el-button--danger.is-plain) {
  border-color: rgba(241, 77, 92, .55) !important;
  color: #ff7b88 !important;
}

:deep(.user-toolbar .el-button--warning.is-plain) {
  border-color: rgba(255, 155, 49, .55) !important;
  color: #ffb15e !important;
}

:deep(.user-toolbar .el-button--info.is-plain) {
  border-color: rgba(115, 128, 149, .58) !important;
  color: #b7c2d2 !important;
}

:deep(.user-table .el-table__header-wrapper th.el-table__cell),
:deep(.user-table .el-table__fixed-header-wrapper th.el-table__cell) {
  height: 48px !important;
  color: #dfe6ef;
  font-weight: 600;
  background: var(--fc-surface-raised) !important;
}

:deep(.user-table .el-table__row td.el-table__cell) {
  height: 52px;
  color: var(--fc-text-secondary);
  background: var(--fc-surface) !important;
}

:deep(.user-table .el-table__body tr:hover > td.el-table__cell) {
  background: #16263a !important;
}

:deep(.user-table .el-button.is-link) {
  width: 30px;
  height: 30px;
  margin: 0 1px;
  border-radius: 6px;
}

:deep(.user-table .el-button.is-link:hover) {
  background: var(--fc-primary-soft);
}

:deep(.user-table-card .pagination-container) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 64px;
  height: auto;
  box-sizing: border-box;
  margin: 0;
  padding: 14px 16px !important;
  border-top: 1px solid var(--fc-border-soft);
}

:deep(.user-table-card .pagination-container .el-pagination) {
  position: static;
  right: auto;
  width: 100%;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .user-management-page {
    min-height: auto;
    padding: 12px;
  }

  .dept-panel {
    min-height: auto;
    margin-bottom: 14px;
  }

  .dept-tree-scroll {
    max-height: 260px;
  }

  .user-query-panel {
    padding: 14px 14px 0;
  }

  :deep(.user-query-panel .el-form-item) {
    width: 100% !important;
    margin-right: 0;
  }

  :deep(.user-query-panel .el-input),
  :deep(.user-query-panel .el-select),
  :deep(.user-query-panel .el-date-editor) {
    width: 100% !important;
  }
}
</style>
