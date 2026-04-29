<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="配送日期" prop="deliveryDate">
              <el-date-picker v-model="queryParams.deliveryDate" value-format="YYYY-MM-DD" type="date" placeholder="请选择配送日期" />
            </el-form-item>
            <el-form-item label="配送地" prop="routeId">
              <el-select v-model="queryParams.routeId" placeholder="请选择配送地" clearable filterable style="width: 200px">
                <el-option v-for="item in routeOptions" :key="item.routeId" :label="item.routeName" :value="item.routeId" />
              </el-select>
            </el-form-item>
            <el-form-item label="归档状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择归档状态" clearable style="width: 160px">
                <el-option label="未归档" value="未归档" />
                <el-option label="已归档" value="已归档" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:deliveryOrder:add']">新增配货</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:deliveryOrder:edit']">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:deliveryOrder:remove']">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['system:deliveryOrder:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="deliveryOrderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="配送日期" align="center" prop="deliveryDate" width="130" />
        <el-table-column label="配送地" align="center" prop="routeName" min-width="130" />
        <el-table-column label="订单总金额" align="center" prop="totalAmount" width="130" />
        <el-table-column label="状态" align="center" prop="status" width="100" />
        <el-table-column label="备注" align="center" prop="remark" min-width="160" />
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['system:deliveryOrder:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:deliveryOrder:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:deliveryOrder:remove']"></el-button>
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
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="1100px" append-to-body>
      <el-form ref="deliveryOrderFormRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="配送日期" prop="deliveryDate">
              <el-date-picker v-model="form.deliveryDate" value-format="YYYY-MM-DD" type="date" placeholder="请选择配送日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="配送地" prop="routeId">
              <el-select v-model="form.routeId" placeholder="请选择配送地" filterable style="width: 100%" @change="handleRouteChange">
                <el-option v-for="item in routeOptions" :key="item.routeId" :label="item.routeName" :value="item.routeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="未归档" value="未归档" />
                <el-option label="已归档" value="已归档" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>

        <el-divider content-position="left">客户订单</el-divider>
        <div class="mb8">
          <el-select v-model="selectedCustomerId" placeholder="请选择客户" filterable style="width: 260px">
            <el-option v-for="item in availableCustomers" :key="item.customerId" :label="item.name" :value="item.customerId" />
          </el-select>
          <el-button class="ml-2" type="primary" icon="Plus" @click="addCustomerOrder">添加客户</el-button>
        </div>

        <el-empty v-if="!form.customerOrders.length" description="请选择配送地后添加客户订单" />
        <el-collapse v-else>
          <el-collapse-item v-for="(order, orderIndex) in form.customerOrders" :key="order.customerId" :name="String(order.customerId)">
            <template #title>
              <span class="font-medium">{{ order.customerName }}</span>
              <span v-if="order.customerPhone" class="ml-3 text-gray-500">{{ order.customerPhone }}</span>
              <span class="ml-3 text-gray-500">小计：{{ calcOrderTotal(order).toFixed(2) }}</span>
            </template>
            <div class="mb8">
              <el-button type="primary" plain icon="Plus" @click="addItem(order)">添加商品</el-button>
              <el-button type="danger" plain icon="Delete" @click="removeCustomerOrder(orderIndex)">移除客户</el-button>
            </div>
            <el-table border :data="order.items">
              <el-table-column label="商品" min-width="180">
                <template #default="{ row }">
                  <el-cascader
                    :model-value="getProductPath(row)"
                    :options="categoryProductOptions"
                    :props="productCascaderProps"
                    placeholder="选择商品"
                    filterable
                    clearable
                    style="width: 100%"
                    @change="(value) => handleProductChange(row, value)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="规格" prop="specification" width="120" />
              <el-table-column label="提供商" prop="supplier" width="140" />
              <el-table-column label="数量" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.quantity" :precision="2" :min="0.01" controls-position="right" style="width: 110px" />
                </template>
              </el-table-column>
              <el-table-column label="销售价" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.salePrice" :precision="2" :min="0" controls-position="right" style="width: 110px" />
                </template>
              </el-table-column>
              <el-table-column label="成本价" width="130">
                <template #default="{ row }">
                  <el-input-number v-model="row.costPrice" :precision="2" :min="0" controls-position="right" style="width: 110px" />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="120">
                <template #default="{ row }">{{ calcItemAmount(row).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ $index }">
                  <el-button link type="primary" icon="Delete" @click="removeItem(order, $index)" />
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <span class="mr-4">合计：{{ calcDeliveryTotal().toFixed(2) }}</span>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="配货装车详情" v-model="detailDialog.visible" width="1000px" append-to-body>
      <el-descriptions v-if="detailData" :column="3" border>
        <el-descriptions-item label="配送日期">{{ detailData.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="配送地">{{ detailData.routeName }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailData.status }}</el-descriptions-item>
        <el-descriptions-item label="订单总金额">{{ formatAmount(detailData.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">客户订单</el-divider>
      <el-empty v-if="!detailData?.customerOrders?.length" description="暂无客户订单" />
      <el-collapse v-else>
        <el-collapse-item v-for="order in detailData.customerOrders" :key="order.orderId" :name="String(order.orderId)">
          <template #title>
            <span class="font-medium">{{ order.customerName }}</span>
            <span v-if="order.customerPhone" class="ml-3 text-gray-500">{{ order.customerPhone }}</span>
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
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DeliveryOrder" lang="ts">
import { listDeliveryOrder, getDeliveryOrder, delDeliveryOrder, addDeliveryOrder, updateDeliveryOrder } from '@/api/system/deliveryOrder';
import { CustomerOrderVO, DeliveryOrderForm, DeliveryOrderItemVO, DeliveryOrderQuery, DeliveryOrderVO } from '@/api/system/deliveryOrder/types';
import { listRouteOptions } from '@/api/system/route';
import { RouteVO } from '@/api/system/route/types';
import { listCustomer } from '@/api/system/customer';
import { CustomerVO } from '@/api/system/customer/types';
import { listProduct } from '@/api/system/product';
import { ProductVO } from '@/api/system/product/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const deliveryOrderList = ref<DeliveryOrderVO[]>([]);
const routeOptions = ref<RouteVO[]>([]);
const customerOptions = ref<CustomerVO[]>([]);
const productOptions = ref<ProductVO[]>([]);
const selectedCustomerId = ref<string | number>();
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const deliveryOrderFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const detailDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const detailData = ref<DeliveryOrderVO>();

const today = () => {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const initFormData: DeliveryOrderForm = {
  deliveryId: undefined,
  deliveryDate: today(),
  routeId: undefined,
  status: '未归档',
  remark: undefined,
  customerOrders: []
};

const data = reactive<PageData<DeliveryOrderForm, DeliveryOrderQuery>>({
  form: { ...initFormData, customerOrders: [] },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deliveryDate: undefined,
    routeId: undefined,
    status: undefined,
    params: {}
  },
  rules: {
    deliveryDate: [{ required: true, message: '配送日期不能为空', trigger: 'change' }],
    routeId: [{ required: true, message: '配送地不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const availableCustomers = computed(() => {
  const used = new Set(form.value.customerOrders.map((item) => item.customerId));
  return customerOptions.value.filter((item) => !used.has(item.customerId));
});

const productCascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
  emitPath: true
};

const categoryProductOptions = computed(() => {
  const categoryMap = new Map<string | number, { value: string | number; label: string; children: Array<{ value: string | number; label: string }> }>();
  productOptions.value.forEach((product) => {
    const categoryId = product.categoryId || 'uncategorized';
    const categoryName = product.categoryName || '未分类';
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        value: categoryId,
        label: categoryName,
        children: []
      });
    }
    categoryMap.get(categoryId)?.children.push({
      value: product.productId,
      label: `${product.productName} ${product.specification || ''}`
    });
  });
  return Array.from(categoryMap.values());
});

const getRouteOptions = async () => {
  const res = await listRouteOptions();
  routeOptions.value = res.data;
};

const getProductOptions = async () => {
  const res = await listProduct({ pageNum: 1, pageSize: 9999 });
  productOptions.value = res.rows;
};

const getCustomersByRoute = async (routeId?: string | number) => {
  if (!routeId) {
    customerOptions.value = [];
    return;
  }
  const res = await listCustomer({ pageNum: 1, pageSize: 9999, routeId });
  customerOptions.value = res.rows;
};

const getList = async () => {
  loading.value = true;
  const res = await listDeliveryOrder(queryParams.value);
  deliveryOrderList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const handleRouteChange = async () => {
  form.value.customerOrders = [];
  selectedCustomerId.value = undefined;
  await getCustomersByRoute(form.value.routeId);
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData, customerOrders: [] };
  selectedCustomerId.value = undefined;
  customerOptions.value = [];
  deliveryOrderFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: DeliveryOrderVO[]) => {
  ids.value = selection.map((item) => item.deliveryId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增配货装车单';
};

const handleUpdate = async (row?: DeliveryOrderVO) => {
  reset();
  const _deliveryId = row?.deliveryId || ids.value[0];
  const res = await getDeliveryOrder(_deliveryId);
  Object.assign(form.value, res.data);
  form.value.customerOrders = res.data.customerOrders || [];
  await getCustomersByRoute(form.value.routeId);
  dialog.visible = true;
  dialog.title = '修改配货装车单';
};

const handleDetail = async (row: DeliveryOrderVO) => {
  const res = await getDeliveryOrder(row.deliveryId);
  detailData.value = res.data;
  detailDialog.visible = true;
};

const addCustomerOrder = () => {
  if (!selectedCustomerId.value) {
    proxy?.$modal.msgWarning('请选择客户');
    return;
  }
  const customer = customerOptions.value.find((item) => item.customerId === selectedCustomerId.value);
  if (!customer) return;
  form.value.customerOrders.push({
    customerId: customer.customerId,
    customerName: customer.name,
    customerPhone: customer.phone,
    items: []
  });
  selectedCustomerId.value = undefined;
};

const removeCustomerOrder = (index: number) => {
  form.value.customerOrders.splice(index, 1);
};

const addItem = (order: CustomerOrderVO) => {
  order.items.push({
    categoryId: undefined,
    productPath: [],
    productId: undefined,
    quantity: 1,
    salePrice: 0,
    costPrice: 0
  });
};

const removeItem = (order: CustomerOrderVO, index: number) => {
  order.items.splice(index, 1);
};

const getProductPath = (row: DeliveryOrderItemVO) => {
  if (row.productPath?.length) {
    return row.productPath;
  }
  if (row.categoryId && row.productId) {
    return [row.categoryId, row.productId];
  }
  const product = productOptions.value.find((item) => item.productId === row.productId);
  return product ? [product.categoryId, product.productId] : [];
};

const handleProductChange = (row: DeliveryOrderItemVO, value: Array<string | number>) => {
  const productId = value?.[1];
  const product = productOptions.value.find((item) => item.productId === productId);
  if (!product) {
    row.productPath = [];
    row.categoryId = undefined;
    row.categoryName = undefined;
    row.productId = undefined;
    return;
  }
  row.productPath = value;
  row.categoryId = product.categoryId;
  row.categoryName = product.categoryName;
  row.productId = product.productId;
  row.productName = product.productName;
  row.specification = product.specification;
  row.supplier = product.supplier;
  row.salePrice = product.latestSaleAmount || 0;
  row.costPrice = product.latestCostPrice || 0;
};

const calcItemAmount = (row: DeliveryOrderItemVO) => {
  return Number(row.quantity || 0) * Number(row.salePrice || 0);
};

const calcOrderTotal = (order: CustomerOrderVO) => {
  return order.items.reduce((sum, item) => sum + calcItemAmount(item), 0);
};

const calcDeliveryTotal = () => {
  return form.value.customerOrders.reduce((sum, order) => sum + calcOrderTotal(order), 0);
};

const formatAmount = (value?: number) => {
  return Number(value || 0).toFixed(2);
};

const normalizeForm = () => {
  return {
    ...form.value,
    customerOrders: form.value.customerOrders.map((order) => ({
      customerId: order.customerId,
      remark: order.remark,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        salePrice: item.salePrice,
        costPrice: item.costPrice,
        remark: item.remark
      }))
    }))
  };
};

const validateOrders = () => {
  if (!form.value.customerOrders.length) {
    proxy?.$modal.msgWarning('请至少添加一个客户订单');
    return false;
  }
  for (const order of form.value.customerOrders) {
    if (!order.items.length) {
      proxy?.$modal.msgWarning(`${order.customerName} 未添加商品`);
      return false;
    }
    for (const item of order.items) {
      if (!item.productId || !item.quantity || item.salePrice === undefined || item.salePrice === null) {
        proxy?.$modal.msgWarning(`${order.customerName} 的商品明细不完整`);
        return false;
      }
    }
  }
  return true;
};

const submitForm = () => {
  deliveryOrderFormRef.value?.validate(async (valid: boolean) => {
    if (valid && validateOrders()) {
      buttonLoading.value = true;
      if (form.value.deliveryId) {
        await updateDeliveryOrder(normalizeForm()).finally(() => (buttonLoading.value = false));
      } else {
        await addDeliveryOrder(normalizeForm()).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getProductOptions();
      await getList();
    }
  });
};

const handleDelete = async (row?: DeliveryOrderVO) => {
  const _deliveryIds = row?.deliveryId || ids.value;
  await proxy?.$modal.confirm('是否确认删除配送货单编号为"' + _deliveryIds + '"的数据项？').finally(() => (loading.value = false));
  await delDeliveryOrder(_deliveryIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download(
    'system/deliveryOrder/export',
    {
      ...queryParams.value
    },
    `delivery_order_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getRouteOptions();
  getProductOptions();
  getList();
});
</script>
