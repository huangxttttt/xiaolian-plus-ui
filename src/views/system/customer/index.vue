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
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:customer:edit']"
              >修改</el-button
            >
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:customer:remove']"
              >删除</el-button
            >
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
        <el-table-column label="地图位置" align="center" min-width="180">
          <template #default="{ row }">
            <span>{{ row.mapAddress || row.mapLocation || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="门面照片" align="center" prop="photo" width="120">
          <template #default="scope">
            <ImagePreview v-if="getPhotoUrl(scope.row.photo)" :width="70" :height="50" :src="getPhotoUrl(scope.row.photo)" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="客户详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['system:customer:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="订单查询" placement="top">
              <el-button link type="primary" icon="Tickets" @click="handleOrderInfo(scope.row)" v-hasPermi="['system:customer:query']"></el-button>
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
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="720px" append-to-body>
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
        <el-form-item label="地图位置" prop="mapAddress">
          <el-input v-model="form.mapAddress" placeholder="请选择地图位置" readonly>
            <template #append>
              <el-button icon="Location" @click="openMapPicker">选点</el-button>
            </template>
          </el-input>
          <div v-if="form.longitude && form.latitude" class="map-coordinate">经度 {{ form.longitude }}，纬度 {{ form.latitude }}</div>
        </el-form-item>
        <el-form-item label="门面照片" prop="photo">
          <image-upload v-model="form.photo" :limit="1" :file-size="8" :is-show-tip="false" />
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

    <el-dialog title="选择客户地图位置" v-model="mapDialog.visible" width="900px" append-to-body @opened="initAmapPicker" @closed="destroyAmapPicker">
      <div class="map-picker-toolbar">
        <el-input v-model="mapSearchKeyword" placeholder="输入客户地址或地点名称搜索" clearable @keyup.enter="searchMapKeyword" />
        <el-button type="primary" icon="Search" :loading="mapSearching" @click="searchMapKeyword">搜索</el-button>
      </div>
      <el-alert v-if="!amapKey" class="mb-3" type="warning" show-icon :closable="false" title="请先在 .env 中配置 VITE_APP_AMAP_KEY" />
      <div ref="mapContainerRef" class="map-picker"></div>
      <div class="map-picker-result">
        <span>{{ form.mapAddress || '点击地图或搜索后选择客户位置' }}</span>
        <span v-if="form.longitude && form.latitude">经度 {{ form.longitude }}，纬度 {{ form.latitude }}</span>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="mapDialog.visible = false">确 定</el-button>
          <el-button @click="clearMapLocation">清除位置</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="detailDialog.title" v-model="detailDialog.visible" width="760px" append-to-body>
      <el-descriptions v-if="detailCustomer" :column="2" border>
        <el-descriptions-item label="客户名称">{{ detailCustomer.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户简称">{{ detailCustomer.alias || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailCustomer.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailCustomer.contactName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="配送线路">{{ detailCustomer.routeName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="欠款金额">{{ formatAmount(detailCustomer.debt) }}</el-descriptions-item>
        <el-descriptions-item label="地图位置" :span="2">{{ detailCustomer.mapAddress || detailCustomer.mapLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="经纬度" :span="2">
          <span v-if="detailCustomer.longitude && detailCustomer.latitude">{{ detailCustomer.longitude }}，{{ detailCustomer.latitude }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="门面照片" :span="2">
          <ImagePreview v-if="getPhotoUrl(detailCustomer.photo)" :width="160" :height="110" :src="getPhotoUrl(detailCustomer.photo)" />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailCustomer.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="orderDialog.title" v-model="orderDialog.visible" width="1000px" append-to-body>
      <el-descriptions v-if="orderCustomer" :column="4" border>
        <el-descriptions-item label="客户名称">{{ orderCustomer.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderCustomer.phone }}</el-descriptions-item>
        <el-descriptions-item label="配送线路">{{ orderCustomer.routeName }}</el-descriptions-item>
        <el-descriptions-item label="总消费额">{{ formatAmount(orderSummary.totalAmount) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">常购商品 TOP 5</el-divider>
      <el-table v-loading="topProductLoading" border :data="topProducts" class="mb-3">
        <el-table-column label="排名" type="index" width="70" align="center" />
        <el-table-column label="商品" prop="productName" min-width="160" />
        <el-table-column label="规格" prop="specification" width="110" />
        <el-table-column label="提供商" prop="supplier" width="130" />
        <el-table-column label="累计数量" prop="totalQuantity" width="110" align="right">
          <template #default="{ row }">{{ formatNumber(row.totalQuantity) }}</template>
        </el-table-column>
        <el-table-column label="累计金额" prop="totalAmount" width="120" align="right">
          <template #default="{ row }">{{ formatAmount(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="下单次数" prop="orderCount" width="100" align="right" />
      </el-table>

      <el-divider content-position="left">订单记录</el-divider>
      <el-form :inline="true" class="mb-3">
        <el-form-item label="配送日期">
          <el-date-picker
            v-model="orderDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleOrderQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetOrderQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-empty v-if="!customerOrders.length" description="暂无订单记录" />
      <el-collapse v-else v-loading="orderLoading">
        <el-collapse-item v-for="order in customerOrders" :key="order.orderId" :name="String(order.orderId)">
          <template #title>
            <span class="font-medium">{{ order.deliveryDate }}</span>
            <span class="ml-3 text-gray-500">{{ order.routeName }}</span>
            <span class="ml-3 text-gray-500">{{ order.deliveryStatus }}</span>
            <span class="ml-3 text-gray-500">小计：{{ formatAmount(order.totalAmount) }}</span>
            <span class="ml-3 text-gray-500">欠款：{{ formatAmount(order.unpaidAmount) }}</span>
            <el-button
              v-if="Number(order.unpaidAmount || 0) > 0"
              class="ml-3"
              link
              type="primary"
              size="small"
              @click.stop="handleRepayment(order)"
              v-hasPermi="['system:customer:edit']"
            >
              还款
            </el-button>
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
      <pagination
        v-show="orderTotal > 0"
        :total="orderTotal"
        v-model:page="orderQueryParams.pageNum"
        v-model:limit="orderQueryParams.pageSize"
        @pagination="getOrderList"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="orderDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="repaymentDialog.title" v-model="repaymentDialog.visible" width="460px" append-to-body>
      <el-descriptions v-if="repaymentOrder" :column="1" border>
        <el-descriptions-item label="配送日期">{{ repaymentOrder.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ formatAmount(repaymentOrder.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="当前欠款">{{ formatAmount(repaymentOrder.unpaidAmount) }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="repaymentFormRef" class="mt-4" :model="repaymentForm" :rules="repaymentRules" label-width="90px">
        <el-form-item label="还款金额" prop="amount">
          <el-input-number
            v-model="repaymentForm.amount"
            :precision="2"
            :min="0.01"
            :max="repaymentMaxAmount"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="repaymentLoading" type="primary" @click="submitRepayment">确 定</el-button>
          <el-button @click="repaymentDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Customer" lang="ts">
import {
  listCustomer,
  getCustomer,
  delCustomer,
  addCustomer,
  updateCustomer,
  getCustomerOrders,
  getCustomerOrderSummary,
  repayCustomerOrder,
  getCustomerTopProducts
} from '@/api/system/customer';
import {
  CustomerVO,
  CustomerQuery,
  CustomerForm,
  CustomerOrderSummaryVO,
  CustomerOrderQuery,
  CustomerTopProductVO
} from '@/api/system/customer/types';
import { CustomerOrderVO } from '@/api/system/deliveryOrder/types';
import { listRouteOptions } from '@/api/system/route';
import { RouteVO } from '@/api/system/route/types';
import { listByIds } from '@/api/system/oss';
import ImagePreview from '@/components/ImagePreview/index.vue';
import { useUserStore } from '@/store/modules/user';

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
    __amapLoading?: Promise<any>;
  }
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userStore = useUserStore();
const amapKey = import.meta.env.VITE_APP_AMAP_KEY as string;
const amapSecurityCode = import.meta.env.VITE_APP_AMAP_SECURITY_CODE as string;

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
const topProductLoading = ref(false);
const detailCustomer = ref<CustomerVO>();
const orderCustomer = ref<CustomerVO>();
const customerOrders = ref<CustomerOrderVO[]>([]);
const topProducts = ref<CustomerTopProductVO[]>([]);
const orderTotal = ref(0);
const orderDateRange = ref<string[]>([]);
const repaymentOrder = ref<CustomerOrderVO>();
const repaymentLoading = ref(false);
const photoUrlMap = reactive<Record<string, string>>({});
const mapContainerRef = ref<HTMLDivElement>();
const mapSearchKeyword = ref('');
const mapSearching = ref(false);
let amapInstance: any;
let amapMarker: any;
let amapGeocoder: any;
let amapPlaceSearch: any;
const orderSummary = reactive<CustomerOrderSummaryVO>({
  orderCount: 0,
  totalAmount: 0
});

const queryFormRef = ref<ElFormInstance>();
const customerFormRef = ref<ElFormInstance>();
const repaymentFormRef = ref<ElFormInstance>();
const canQueryOss = computed(() => userStore.permissions.includes('*:*:*') || userStore.permissions.includes('system:oss:query'));

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const orderDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const detailDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const repaymentDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const mapDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const orderQueryParams = reactive<CustomerOrderQuery>({
  pageNum: 1,
  pageSize: 5
});

const repaymentForm = reactive({
  amount: 0
});

const repaymentMaxAmount = computed(() => Number(repaymentOrder.value?.unpaidAmount || 0));

const repaymentRules = {
  amount: [
    { required: true, message: '还款金额不能为空', trigger: 'blur' },
    {
      validator: (_rule: any, value: number, callback: any) => {
        if (!value || value <= 0) {
          callback(new Error('还款金额必须大于0'));
          return;
        }
        if (value > repaymentMaxAmount.value) {
          callback(new Error('还款金额不能大于当前欠款'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
};

const initFormData: CustomerForm = {
  customerId: undefined,
  name: undefined,
  alias: undefined,
  phone: undefined,
  contactName: undefined,
  routeId: undefined,
  debt: undefined,
  mapLocation: undefined,
  longitude: undefined,
  latitude: undefined,
  mapAddress: undefined,
  mapProvider: undefined,
  photo: undefined,
  remark: undefined
};
const data = reactive<PageData<CustomerForm, CustomerQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    alias: undefined,
    phone: undefined,
    contactName: undefined,
    routeId: undefined,
    params: {}
  },
  rules: {
    customerId: [{ required: true, message: '客户ID不能为空', trigger: 'blur' }],
    name: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
    phone: [{ required: true, message: '联系电话不能为空', trigger: 'blur' }],
    routeId: [{ required: true, message: '配送线路不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询客户档案列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listCustomer(queryParams.value);
    customerList.value = res.rows;
    total.value = res.total;
    await loadCustomerPhotoUrls(res.rows || []);
  } finally {
    loading.value = false;
  }
};

const loadCustomerPhotoUrls = async (rows: CustomerVO[]) => {
  if (!canQueryOss.value) {
    return;
  }

  const ids = rows
    .map((item) => item.photo)
    .filter((photo): photo is string => !!photo && !/^https?:\/\//.test(photo))
    .flatMap((photo) => photo.split(','))
    .map((id) => id.trim())
    .filter((id) => id && !photoUrlMap[id]);

  const uniqueIds = Array.from(new Set(ids));
  if (!uniqueIds.length) {
    return;
  }

  try {
    const res = await listByIds(uniqueIds.join(','));
    (res.data || []).forEach((item) => {
      if (item.ossId && item.url) {
        photoUrlMap[String(item.ossId)] = item.url;
      }
    });
  } catch {
    // 图片预览失败不能影响客户列表展示。
  }
};

const getPhotoUrl = (photo?: string) => {
  if (!photo) {
    return '';
  }
  if (/^https?:\/\//.test(photo)) {
    return photo;
  }
  const firstId = photo.split(',')[0]?.trim();
  return firstId ? photoUrlMap[firstId] || '' : '';
};

const getRouteOptions = async () => {
  const res = await listRouteOptions();
  routeOptions.value = res.data;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  customerFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: CustomerVO[]) => {
  ids.value = selection.map((item) => item.customerId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加客户档案';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: CustomerVO) => {
  reset();
  const _customerId = row?.customerId || ids.value[0];
  const res = await getCustomer(_customerId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改客户档案';
};

const handleDetail = async (row: CustomerVO) => {
  detailCustomer.value = undefined;
  detailDialog.visible = true;
  detailDialog.title = `${row.name}的客户详情`;
  const res = await getCustomer(row.customerId);
  detailCustomer.value = res.data;
  await loadCustomerPhotoUrls([res.data]);
};

const loadAmap = async () => {
  const AMap = await loadAmapBase();
  await loadAmapPlugins(['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.AutoComplete']);
  return AMap;
};

const loadAmapBase = async () => {
  if (window.AMap) {
    return window.AMap;
  }
  if (!amapKey) {
    throw new Error('请先配置高德地图 Key');
  }
  if (amapSecurityCode) {
    window._AMapSecurityConfig = {
      securityJsCode: amapSecurityCode
    };
  }
  if (!window.__amapLoading) {
    window.__amapLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`;
      script.async = true;
      script.onload = () => resolve(window.AMap);
      script.onerror = () => reject(new Error('高德地图加载失败'));
      document.head.appendChild(script);
    });
  }
  return window.__amapLoading;
};

const loadAmapPlugins = (plugins: string[]) => {
  return new Promise<void>((resolve, reject) => {
    if (!window.AMap?.plugin) {
      reject(new Error('高德地图插件加载器不可用'));
      return;
    }
    window.AMap.plugin(plugins, () => resolve());
  });
};

const openMapPicker = () => {
  if (!amapKey) {
    proxy?.$modal.msgWarning('请先在 .env 中配置 VITE_APP_AMAP_KEY');
  }
  mapSearchKeyword.value = form.value.mapAddress || form.value.name || '';
  mapDialog.visible = true;
};

const getMapCenter = () => {
  if (form.value.longitude && form.value.latitude) {
    return [Number(form.value.longitude), Number(form.value.latitude)];
  }
  return [113.30765, 23.120049];
};

const renderMapMarker = (lng: number, lat: number) => {
  if (!amapInstance || !window.AMap) {
    return;
  }
  const position = [lng, lat];
  if (!amapMarker) {
    amapMarker = new window.AMap.Marker({
      position,
      anchor: 'bottom-center'
    });
    amapInstance.add(amapMarker);
  } else {
    amapMarker.setPosition(position);
  }
  amapInstance.setCenter(position);
};

const setMapLocation = (lng: number, lat: number, address?: string) => {
  const longitude = Number(lng.toFixed(6));
  const latitude = Number(lat.toFixed(6));
  form.value.longitude = longitude;
  form.value.latitude = latitude;
  form.value.mapLocation = `${longitude},${latitude}`;
  form.value.mapProvider = 'amap';
  if (address) {
    form.value.mapAddress = address;
  }
  renderMapMarker(longitude, latitude);
};

const reverseGeocode = (lng: number, lat: number) => {
  if (!amapGeocoder) {
    setMapLocation(lng, lat);
    return;
  }
  amapGeocoder.getAddress([lng, lat], (status: string, result: any) => {
    const address = status === 'complete' ? result?.regeocode?.formattedAddress : '';
    setMapLocation(lng, lat, address);
  });
};

const initAmapPicker = async () => {
  if (!amapKey || !mapContainerRef.value) {
    return;
  }
  const AMap = await loadAmap();
  const center = getMapCenter();
  amapInstance = new AMap.Map(mapContainerRef.value, {
    zoom: 15,
    center
  });
  amapGeocoder = new AMap.Geocoder({
    city: '全国'
  });
  amapPlaceSearch = new AMap.PlaceSearch({
    city: '全国',
    pageSize: 1
  });
  amapInstance.on('click', (event: any) => {
    reverseGeocode(event.lnglat.getLng(), event.lnglat.getLat());
  });
  if (form.value.longitude && form.value.latitude) {
    renderMapMarker(Number(form.value.longitude), Number(form.value.latitude));
  }
};

const destroyAmapPicker = () => {
  amapMarker = undefined;
  amapGeocoder = undefined;
  amapPlaceSearch = undefined;
  if (amapInstance) {
    amapInstance.destroy();
    amapInstance = undefined;
  }
};

const searchMapKeyword = async () => {
  if (!mapSearchKeyword.value) {
    proxy?.$modal.msgWarning('请输入搜索地址');
    return;
  }
  if (!amapKey) {
    proxy?.$modal.msgWarning('请先在 .env 中配置 VITE_APP_AMAP_KEY');
    return;
  }
  mapSearching.value = true;
  try {
    if (!amapPlaceSearch) {
      await initAmapPicker();
    }
    amapPlaceSearch.search(mapSearchKeyword.value, (status: string, result: any) => {
      const poi = status === 'complete' ? result?.poiList?.pois?.[0] : undefined;
      if (!poi?.location) {
        proxy?.$modal.msgWarning('未找到匹配地点，请换个关键词');
        return;
      }
      setMapLocation(poi.location.lng, poi.location.lat, poi.address ? `${poi.name} ${poi.address}` : poi.name);
    });
  } finally {
    mapSearching.value = false;
  }
};

const clearMapLocation = () => {
  form.value.longitude = undefined;
  form.value.latitude = undefined;
  form.value.mapAddress = undefined;
  form.value.mapLocation = undefined;
  form.value.mapProvider = undefined;
  mapDialog.visible = false;
};

const handleOrderInfo = async (row: CustomerVO) => {
  orderCustomer.value = row;
  customerOrders.value = [];
  topProducts.value = [];
  orderDateRange.value = [];
  orderSummary.orderCount = 0;
  orderSummary.totalAmount = 0;
  orderQueryParams.pageNum = 1;
  orderQueryParams.beginDate = undefined;
  orderQueryParams.endDate = undefined;
  orderDialog.visible = true;
  orderDialog.title = `${row.name}的订单信息`;
  await Promise.all([getOrderList(), getOrderSummary(), getTopProducts()]);
};

const syncOrderDateParams = () => {
  orderQueryParams.beginDate = orderDateRange.value?.[0];
  orderQueryParams.endDate = orderDateRange.value?.[1];
};

const handleOrderQuery = async () => {
  syncOrderDateParams();
  orderQueryParams.pageNum = 1;
  await Promise.all([getOrderList(), getOrderSummary()]);
};

const resetOrderQuery = async () => {
  orderDateRange.value = [];
  orderQueryParams.beginDate = undefined;
  orderQueryParams.endDate = undefined;
  orderQueryParams.pageNum = 1;
  await Promise.all([getOrderList(), getOrderSummary()]);
};

const getOrderList = async () => {
  if (!orderCustomer.value) {
    return;
  }
  orderLoading.value = true;
  const res = await getCustomerOrders(orderCustomer.value.customerId, orderQueryParams).finally(() => (orderLoading.value = false));
  customerOrders.value = res.rows || [];
  orderTotal.value = res.total || 0;
};

const getOrderSummary = async () => {
  if (!orderCustomer.value) {
    return;
  }
  const res = await getCustomerOrderSummary(orderCustomer.value.customerId, {
    beginDate: orderQueryParams.beginDate,
    endDate: orderQueryParams.endDate
  });
  orderSummary.orderCount = res.data?.orderCount || 0;
  orderSummary.totalAmount = res.data?.totalAmount || 0;
};

const getTopProducts = async () => {
  if (!orderCustomer.value) {
    return;
  }
  topProductLoading.value = true;
  const res = await getCustomerTopProducts(orderCustomer.value.customerId).finally(() => (topProductLoading.value = false));
  topProducts.value = res.data || [];
};

const handleRepayment = (order: CustomerOrderVO) => {
  repaymentOrder.value = order;
  repaymentForm.amount = Number(order.unpaidAmount || 0);
  repaymentDialog.title = `${order.deliveryDate} 订单还款`;
  repaymentDialog.visible = true;
};

const submitRepayment = () => {
  repaymentFormRef.value?.validate(async (valid: boolean) => {
    if (!valid || !repaymentOrder.value?.orderId) {
      return;
    }
    repaymentLoading.value = true;
    await repayCustomerOrder(repaymentOrder.value.orderId, {
      amount: Number(repaymentForm.amount || 0)
    }).finally(() => (repaymentLoading.value = false));
    proxy?.$modal.msgSuccess('还款成功');
    repaymentDialog.visible = false;
    await Promise.all([getOrderList(), getOrderSummary(), getList()]);
  });
};

const formatAmount = (value?: number) => {
  return Number(value || 0).toFixed(2);
};

const formatNumber = (value?: number) => {
  return Number(value || 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 2
  });
};

/** 提交按钮 */
const submitForm = () => {
  customerFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.customerId) {
        await updateCustomer(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addCustomer(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: CustomerVO) => {
  const _customerIds = row?.customerId || ids.value;
  await proxy?.$modal.confirm('是否确认删除客户档案编号为"' + _customerIds + '"的数据项？').finally(() => (loading.value = false));
  await delCustomer(_customerIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'system/customer/export',
    {
      ...queryParams.value
    },
    `customer_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getRouteOptions();
  getList();
});
</script>

<style scoped>
.map-coordinate {
  margin-top: 6px;
  color: #606266;
  font-size: 12px;
  line-height: 18px;
}

.map-picker-toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-bottom: 12px;
}

.map-picker {
  width: 100%;
  height: 480px;
  border: 1px solid #dcdfe6;
}

.map-picker-result {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  color: #606266;
  font-size: 13px;
}
</style>
