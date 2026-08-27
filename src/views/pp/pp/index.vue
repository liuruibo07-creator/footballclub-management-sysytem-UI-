<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" v-show="showSearch" label-width="68px">
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item label="姓名" prop="nameCn" style="margin-left: -5px">
            <el-input
              v-model="queryParams.nameCn"
              placeholder="请输入姓名"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="位置" prop="position">
            <el-select v-model="queryParams.position" placeholder="请选择位置" clearable>
              <el-option
                v-for="dict in position"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="球员状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择球员状态" clearable>
              <el-option label="活跃" value="活跃" />
              <el-option label="非活跃" value="非活跃" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="" style="margin-left: -5px">
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['pp:pp:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['pp:pp:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['pp:pp:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['pp:pp:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="ppList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="id" width="55" />
      <el-table-column label="球衣号码" align="center" prop="jerseyNumber" />
      <el-table-column label="姓名" align="center" prop="nameCn" />
      <el-table-column label="位置" align="center" prop="position">
        <template #default="scope">
          <dict-tag :options="position" :value="scope.row.position"/>
        </template>
      </el-table-column>
      <el-table-column label="国籍" align="center" prop="nationality" />
      <el-table-column label="出生日期" align="center" prop="birthDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.birthDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="身高" align="center" prop="height" />
      <el-table-column label="惯用脚" align="center" prop="preferredFoot">
        <template #default="scope">
          <dict-tag :options="preferred_foot" :value="scope.row.preferredFoot"/>
        </template>
      </el-table-column>
      <el-table-column label="球员状态" align="center" prop="status" />
      <el-table-column label="合同到期" align="center" prop="endDate" width="120">
        <template #default="scope">
          <span>{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['pp:pp:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['pp:pp:remove']">删除</el-button>
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

    <!-- 添加或修改球员档案对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="ppRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="球衣号码" prop="jerseyNumber">
          <el-input v-model="form.jerseyNumber" placeholder="请输入球衣号码" />
        </el-form-item>
        <el-form-item label="姓名" prop="nameCn">
          <el-input v-model="form.nameCn" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="位置" prop="position">
          <el-select v-model="form.position" placeholder="请选择位置">
            <el-option
              v-for="dict in position"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="国籍" prop="nationality">
          <el-input v-model="form.nationality" placeholder="请输入国籍" />
        </el-form-item>
        <el-form-item label="出生日期" prop="birthDate">
          <el-date-picker clearable
            v-model="form.birthDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择出生日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="身高" prop="height">
          <el-input v-model="form.height" placeholder="请输入身高" />
        </el-form-item>
        <el-form-item label="惯用脚" prop="preferredFoot">
          <el-select v-model="form.preferredFoot" placeholder="请选择惯用脚">
            <el-option
              v-for="dict in preferred_foot"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="球员状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择球员状态">
            <el-option label="活跃" value="活跃" />
            <el-option label="非活跃" value="非活跃" />
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

<script setup name="Pp">
import { listPp, getPp, delPp, addPp, updatePp } from "@/api/pp/pp";

const { proxy } = getCurrentInstance();
const { preferred_foot, position } = proxy.useDict('preferred_foot', 'position');

const ppList = ref([]);
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
    pageSize: 20,
    nameCn: null,
    position: null,
    nationality: null,
    birthDate: null,
    preferredFoot: null,
    status: null,
  },
  rules: {
    jerseyNumber: [
      { required: true, message: "球员球衣号码不能为空", trigger: "blur" }
    ],
    nameCn: [
      { required: true, message: "姓名不能为空", trigger: "blur" }
    ],
    position: [
      { required: true, message: "位置不能为空", trigger: "change" }
    ],
    nationality: [
      { required: true, message: "国籍不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "球员状态：活跃/非活跃不能为空", trigger: "blur" }
    ],
    createBy: [
      { required: true, message: "创建者不能为空", trigger: "blur" }
    ],
    createTime: [
      { required: true, message: "创建时间不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询球员档案列表 */
function getList() {
  loading.value = true;
  listPp(queryParams.value).then(response => {
    ppList.value = response.rows;
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
    jerseyNumber: null,
    nameCn: null,
    position: null,
    nationality: null,
    birthDate: null,
    height: null,
    preferredFoot: null,
    status: null,
    registrationNote: null,
    userId: null,
    sourceUrl: null,
    sourceAsOf: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    delFlag: null,
    remark: null
  };
  proxy.resetForm("ppRef");
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
  title.value = "添加球员档案";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getPp(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改球员档案";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["ppRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updatePp(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPp(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除球员档案编号为"' + _ids + '"的数据项？').then(function() {
    return delPp(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('pp/pp/export', {
    ...queryParams.value
  }, `pp_${new Date().getTime()}.xlsx`)
}

getList();
</script>
