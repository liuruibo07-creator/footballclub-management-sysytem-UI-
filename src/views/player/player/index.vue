<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="姓名(中文)" prop="nameCn">
        <el-input
          v-model="queryParams.nameCn"
          placeholder="请输入姓名(中文)"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="姓名(英文)" prop="nameEn">
        <el-input
          v-model="queryParams.nameEn"
          placeholder="请输入姓名(英文)"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
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
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in status"
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

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['player:player:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['player:player:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['player:player:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['player:player:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="playerList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="${comment}" align="center" prop="id" />
      <el-table-column label="球衣号码" align="center" prop="jerseyNumber" />
      <el-table-column label="姓名(中文)" align="center" prop="nameCn" />
      <el-table-column label="姓名(英文)" align="center" prop="nameEn" />
      <el-table-column label="位置" align="center" prop="position">
        <template #default="scope">
          <dict-tag :options="position" :value="scope.row.position"/>
        </template>
      </el-table-column>
      <el-table-column label="国籍" align="center" prop="nationality" />
      <el-table-column label="身高(米))" align="center" prop="height" />
      <el-table-column label="惯用脚" align="center" prop="preferredFoot">
        <template #default="scope">
          <dict-tag :options="preferred_foot" :value="scope.row.preferredFoot"/>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['player:player:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['player:player:remove']">删除</el-button>
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
      <el-form ref="playerRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="球衣号码" prop="jerseyNumber">
          <el-input v-model="form.jerseyNumber" placeholder="请输入球衣号码" />
        </el-form-item>
        <el-form-item label="姓名(中文)" prop="nameCn">
          <el-input v-model="form.nameCn" placeholder="请输入姓名(中文)" />
        </el-form-item>
        <el-form-item label="姓名(英文)" prop="nameEn">
          <el-input v-model="form.nameEn" placeholder="请输入姓名(英文)" />
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
        <el-form-item label="身高(米))" prop="height">
          <el-input v-model="form.height" placeholder="请输入身高(米))" />
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
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option
              v-for="dict in status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-divider content-position="center">球员当前合同（公开资料不足，不预置敏感数据）信息</el-divider>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" icon="Plus" @click="handleAddFootballPlayerContract">添加</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" icon="Delete" @click="handleDeleteFootballPlayerContract">删除</el-button>
          </el-col>
        </el-row>
        <el-table :data="footballPlayerContractList" :row-class-name="rowFootballPlayerContractIndex" @selection-change="handleFootballPlayerContractSelectionChange" ref="footballPlayerContract">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="$comment" prop="playerId" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.playerId" placeholder="请输入$comment" />
            </template>
          </el-table-column>
          <el-table-column label="$comment" prop="contractNo" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.contractNo" placeholder="请输入$comment" />
            </template>
          </el-table-column>
          <el-table-column label="$comment" prop="startDate" width="240">
            <template #default="scope">
              <el-date-picker clearable
                v-model="scope.row.startDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择$comment">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="$comment" prop="endDate" width="240">
            <template #default="scope">
              <el-date-picker clearable
                v-model="scope.row.endDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择$comment">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="非公开数据，不提供演示值" prop="baseSalary" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.baseSalary" placeholder="请输入非公开数据，不提供演示值" />
            </template>
          </el-table-column>
          <el-table-column label="$comment" prop="signingBonus" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.signingBonus" placeholder="请输入$comment" />
            </template>
          </el-table-column>
          <el-table-column label="草拟中/已签署/已到期/已终止" prop="status" width="150">
            <template #default="scope">
              <el-select v-model="scope.row.status" placeholder="请选择草拟中/已签署/已到期/已终止">
                <el-option label="请选择字典生成" value="" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
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

<script setup name="Player">
import { listPlayer, getPlayer, delPlayer, addPlayer, updatePlayer } from "@/api/player/player";

const { proxy } = getCurrentInstance();
const { preferred_foot, status, position } = proxy.useDict('preferred_foot', 'status', 'position');

const playerList = ref([]);
const footballPlayerContractList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const checkedFootballPlayerContract = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    nameCn: null,
    nameEn: null,
    position: null,
    status: null,
  },
  rules: {
    jerseyNumber: [
      { required: true, message: "球衣号码不能为空", trigger: "blur" }
    ],
    nameCn: [
      { required: true, message: "姓名(中文)不能为空", trigger: "blur" }
    ],
    position: [
      { required: true, message: "位置不能为空", trigger: "change" }
    ],
    nationality: [
      { required: true, message: "国籍不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询球员档案列表 */
function getList() {
  loading.value = true;
  listPlayer(queryParams.value).then(response => {
    playerList.value = response.rows;
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
    nameEn: null,
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
  footballPlayerContractList.value = [];
  proxy.resetForm("playerRef");
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
  getPlayer(_id).then(response => {
    form.value = response.data;
    footballPlayerContractList.value = response.data.footballPlayerContractList;
    open.value = true;
    title.value = "修改球员档案";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["playerRef"].validate(valid => {
    if (valid) {
      form.value.footballPlayerContractList = footballPlayerContractList.value;
      if (form.value.id != null) {
        updatePlayer(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPlayer(form.value).then(response => {
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
    return delPlayer(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 球员当前合同（公开资料不足，不预置敏感数据）序号 */
function rowFootballPlayerContractIndex({ row, rowIndex }) {
  row.index = rowIndex + 1;
}

/** 球员当前合同（公开资料不足，不预置敏感数据）添加按钮操作 */
function handleAddFootballPlayerContract() {
  let obj = {};
  obj.playerId = "";
  obj.contractNo = "";
  obj.startDate = "";
  obj.endDate = "";
  obj.baseSalary = "";
  obj.signingBonus = "";
  obj.performanceTerms = "";
  obj.status = "";
  obj.remark = "";
  footballPlayerContractList.value.push(obj);
}

/** 球员当前合同（公开资料不足，不预置敏感数据）删除按钮操作 */
function handleDeleteFootballPlayerContract() {
  if (checkedFootballPlayerContract.value.length == 0) {
    proxy.$modal.msgError("请先选择要删除的球员当前合同（公开资料不足，不预置敏感数据）数据");
  } else {
    const footballPlayerContracts = footballPlayerContractList.value;
    const checkedFootballPlayerContracts = checkedFootballPlayerContract.value;
    footballPlayerContractList.value = footballPlayerContracts.filter(function(item) {
      return checkedFootballPlayerContracts.indexOf(item.index) == -1
    });
  }
}

/** 复选框选中数据 */
function handleFootballPlayerContractSelectionChange(selection) {
  checkedFootballPlayerContract.value = selection.map(item => item.index)
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('player/player/export', {
    ...queryParams.value
  }, `player_${new Date().getTime()}.xlsx`)
}

getList();
</script>
