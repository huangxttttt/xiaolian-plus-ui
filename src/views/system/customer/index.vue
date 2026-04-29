<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入客户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户简称" prop="alias">
              <el-input v-model="queryParams.alias" placeholder="请输入客户简称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="queryParams.phone" placeholder="请输入联系电话" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="queryParams.contactName" placeholder="请输入联系人" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="配送线路" prop="routeId">
              <el-select v-model="queryParams.routeId" placeholder="请选择配送线路" clearable filterable>
                <el-option v-for="item in routeOptions" :key="item.routeId" :label="item.routeName" :value="item.routeId" />
              </el-select>
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:customer:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:customer:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:customer:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['system:customer:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="customerList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="客户名称" align="center" prop="name" />
        <el-table-column label="客户简称" align="center" prop="alias" />
        <el-table-column label="联系电话" align="center" prop="phone" />
        <el-table-column label="联系人" align="center" prop="contactName" />
        <el-table-column label="配送线路" align="center" prop="routeName" />
        <el-table-column label="欠款金额" align="center" prop="debt" />
        <el-table-column label="客户位置" align="center" prop="address" />
        <el-table-column label="地图定位" align="center" prop="mapLocation" />
        <el-table-column label="常用商品" align="center" prop="commonProducts" />
        <el-table-column label="门面照片" align="center" prop="photo" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" fixed="right"  class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="订单信息" placement="top">
              <el-button link type="primary" icon="View" @click="handleOrderInfo(scope.row)" v-hasPermi="['system:customer:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:customer:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:customer:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改客户档案对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="customerFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="客户简称" prop="alias">
          <el-input v-model="form.alias" placeholder="请输入客户简称" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="配送线路" prop="routeId">
          <el-select v-model="form.routeId" placeholder="请选择配送线路" clearable filterable>
            <el-option v-for="item in routeOptions" :key="item.routeId" :label="item.routeName" :value="item.routeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="欠款金额" prop="debt">
          <el-input v-model="form.debt" placeholder="请输入欠款金额" />
        </el-form-item>
        <el-form-item label="客户位置" prop="address">
          <el-input v-model="form.address" placeholder="请输入客户位置" />
        </el-form-item>
        <el-form-item label="地图定位" prop="mapLocation">
            <el-input v-model="form.mapLocation" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="常用商品" prop="commonProducts">
            <el-input v-model="form.commonProducts" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="门面照片" prop="photo">
            <el-input v-model="form.photo" type="textarea" placeholder="请输入内容" />
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

    <el-dialog :title="orderDialog.title" v-model="orderDialog.visible" width="1000px" append-to-body>
      <el-descriptions v-if="orderCustomer" :column="3" border>
        <el-descriptions-item label="客户名称">{{ orderCustomer.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderCustomer.phone }}</el-descriptions-item>
        <el-descriptions-item label="配送线路">{{ orderCustomer.routeName }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">订单记录</el-divider>
      <el-empty v-if="!customerOrders.length" description="暂无订单记录" />
      <el-collapse v-else v-loading="orderLoading">
        <el-collapse-item v-for="order in customerOrders" :key="order.orderId" :name="String(order.orderId)">
          <template #title>
            <span class="font-medium">{{ order.deliveryDate }}</span>
            <span class="ml-3 text-gray-500">{{ order.routeName }}</span>
            <span class="ml-3 text-gray-500">{{ order.deliveryStatus }}</span>
            <span class="ml-3 text-gray-500">小计：{{ formatAmount(order.totalAmount) }}</span>
          </template>
          <el-table border :data="order.items">
            <el-table-column label="商品" prop="productName" min-width="160" />
            <el-table-column label="规格" prop="specification" width="110" />
            <el-table-column label="提供商" prop="supplier" width="130" />
            <el-table-column label="数量" prop="quantity" width="100" />
            <el-table-column label="销售价" prop="salePrice" width="110" />
            <el-table-column label="成本价" prop="costPrice" width="110" />
            <el-table-column label="金额" prop="amount" width="120">
              <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" min-width="140" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="orderDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Customer" lang="ts">
import { listCustomer, getCustomer, delCustomer, addCustomer, updateCustomer, getCustomerOrders } from '@/api/system/customer';
import { CustomerVO, CustomerQuery, CustomerForm } from '@/api/system/customer/types';
import { CustomerOrderVO } from '@/api/system/deliveryOrder/types';
import { listRouteOptions } from '@/api/system/route';
import { RouteVO } from '@/api/system/route/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const customerList = ref<CustomerVO[]>([]);
const routeOptions = ref<RouteVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const orderLoading = ref(false);
const orderCustomer = ref<CustomerVO>();
const customerOrders = ref<CustomerOrderVO[]>([]);

const queryFormRef = ref<ElFormInstance>();
const customerFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const orderDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CustomerForm = {
  customerId: undefined,
  name: undefined,
  alias: undefined,
  phone: undefined,
  contactName: undefined,
  routeId: undefined,
  debt: undefined,
  address: undefined,
  mapLocation: undefined,
  commonProducts: undefined,
  photo: undefined,
  remark: undefined
}
const data = reactive<PageData<CustomerForm, CustomerQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    alias: undefined,
    phone: undefined,
    contactName: undefined,
    routeId: undefined,
    params: {
    }
  },
  rules: {
    customerId: [
      { required: true, message: "客户ID不能为空", trigger: "blur" }
    ],
    name: [
      { required: true, message: "客户名称不能为空", trigger: "blur" }
    ],
    phone: [
      { required: true, message: "联系电话不能为空", trigger: "blur" }
    ],
    routeId: [
      { required: true, message: "配送线路不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询客户档案列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCustomer(queryParams.value);
  customerList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

const getRouteOptions = async () => {
  const res = await listRouteOptions();
  routeOptions.value = res.data;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  customerFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: CustomerVO[]) => {
  ids.value = selection.map(item => item.customerId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加客户档案";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: CustomerVO) => {
  reset();
  const _customerId = row?.customerId || ids.value[0]
  const res = await getCustomer(_customerId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改客户档案";
}

const handleOrderInfo = async (row: CustomerVO) => {
  orderCustomer.value = row;
  customerOrders.value = [];
  orderDialog.visible = true;
  orderDialog.title = `${row.name}的订单信息`;
  orderLoading.value = true;
  const res = await getCustomerOrders(row.customerId).finally(() => orderLoading.value = false);
  customerOrders.value = res.data || [];
}

const formatAmount = (value?: number) => {
  return Number(value || 0).toFixed(2);
}

/** 提交按钮 */
const submitForm = () => {
  customerFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.customerId) {
        await updateCustomer(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addCustomer(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: CustomerVO) => {
  const _customerIds = row?.customerId || ids.value;
  await proxy?.$modal.confirm('是否确认删除客户档案编号为"' + _customerIds + '"的数据项？').finally(() => loading.value = false);
  await delCustomer(_customerIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('system/customer/export', {
    ...queryParams.value
  }, `customer_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getRouteOptions();
  getList();
});
</script>
