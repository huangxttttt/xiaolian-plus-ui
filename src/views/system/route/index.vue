<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="路线名称" prop="routeName">
              <el-input v-model="queryParams.routeName" placeholder="请输入路线名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="路线编码" prop="routeCode">
              <el-input v-model="queryParams.routeCode" placeholder="请输入路线编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:route:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:route:edit']">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:route:remove']">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['system:route:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="routeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="路线名称" align="center" prop="routeName" />
        <el-table-column label="路线编码" align="center" prop="routeCode" />
        <el-table-column label="显示顺序" align="center" prop="routeSort" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:route:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:route:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="routeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="路线名称" prop="routeName">
          <el-input v-model="form.routeName" placeholder="请输入路线名称" />
        </el-form-item>
        <el-form-item label="路线编码" prop="routeCode">
          <el-input v-model="form.routeCode" placeholder="请输入路线编码" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="routeSort">
          <el-input-number v-model="form.routeSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Route" lang="ts">
import { listRoute, getRoute, delRoute, addRoute, updateRoute } from '@/api/system/route';
import { RouteVO, RouteQuery, RouteForm } from '@/api/system/route/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const routeList = ref<RouteVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const routeFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: RouteForm = {
  routeId: undefined,
  routeName: undefined,
  routeCode: undefined,
  routeSort: 0,
  remark: undefined
};

const data = reactive<PageData<RouteForm, RouteQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    routeName: undefined,
    routeCode: undefined,
    params: {}
  },
  rules: {
    routeName: [{ required: true, message: '路线名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  const res = await listRoute(queryParams.value);
  routeList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  routeFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: RouteVO[]) => {
  ids.value = selection.map((item) => item.routeId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加路线';
};

const handleUpdate = async (row?: RouteVO) => {
  reset();
  const _routeId = row?.routeId || ids.value[0];
  const res = await getRoute(_routeId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改路线';
};

const submitForm = () => {
  routeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.routeId) {
        await updateRoute(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addRoute(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: RouteVO) => {
  const _routeIds = row?.routeId || ids.value;
  await proxy?.$modal.confirm('是否确认删除路线编号为"' + _routeIds + '"的数据项？').finally(() => (loading.value = false));
  await delRoute(_routeIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download(
    'system/route/export',
    {
      ...queryParams.value
    },
    `route_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
