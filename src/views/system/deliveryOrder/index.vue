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
            <el-button
              type="success"
              plain
              icon="Edit"
              :disabled="single || selectedHasArchived"
              @click="handleUpdate()"
              v-hasPermi="['system:deliveryOrder:edit']"
            >
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple || selectedHasArchived"
              @click="handleDelete()"
              v-hasPermi="['system:deliveryOrder:remove']"
            >
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
        <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['system:deliveryOrder:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="打印销售单" placement="top">
              <el-button link type="primary" icon="Printer" @click="handlePrint(scope.row)" v-hasPermi="['system:deliveryOrder:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="归档" placement="top">
              <el-button
                link
                type="primary"
                icon="CircleCheck"
                :disabled="scope.row.status === '已归档'"
                @click="handleArchive(scope.row)"
                v-hasPermi="['system:deliveryOrder:edit']"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button
                link
                type="primary"
                icon="Edit"
                :disabled="scope.row.status === '已归档'"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['system:deliveryOrder:edit']"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                link
                type="primary"
                icon="Delete"
                :disabled="scope.row.status === '已归档'"
                @click="handleDelete(scope.row)"
                v-hasPermi="['system:deliveryOrder:remove']"
              ></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="86vw"
      class="delivery-order-dialog"
      append-to-body
      @opened="renderRouteMap"
      @closed="destroyRouteMap"
    >
      <el-form ref="deliveryOrderFormRef" :model="form" :rules="rules" label-width="90px">
        <div class="delivery-edit-layout">
          <section class="delivery-map-section">
            <div class="section-title">配送信息</div>
            <el-row :gutter="12" class="delivery-info-grid">
              <el-col :span="12">
                <el-form-item label="配送日期" prop="deliveryDate">
                  <el-date-picker
                    v-model="form.deliveryDate"
                    value-format="YYYY-MM-DD"
                    type="date"
                    placeholder="请选择配送日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="配送地" prop="routeId">
                  <el-select v-model="activeRouteId" placeholder="请选择配送地" filterable style="width: 100%" @change="handleRouteChange">
                    <el-option v-for="item in routeOptions" :key="item.routeId" :label="item.routeName" :value="item.routeId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-select v-model="form.status" disabled style="width: 100%">
                    <el-option label="未归档" value="未归档" />
                    <el-option label="已归档" value="已归档" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="备注" prop="remark">
                  <el-input v-model="form.remark" placeholder="请输入备注" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="section-title">客户路线图</div>
            <div class="route-map-panel">
              <div class="route-map-summary">
                <span>{{ selectedRouteName || '请选择配送地' }}</span>
                <span v-if="primaryRouteName && primaryRouteName !== selectedRouteName">主配送地：{{ primaryRouteName }}</span>
                <span>已定位 {{ routeMapCustomers.length }} 个客户</span>
                <span v-if="routeMapCustomers.length">已智能排序</span>
                <span v-if="routeMapMissingCount">未定位 {{ routeMapMissingCount }} 个客户</span>
                <span v-if="routePlanDistance">规划 {{ routePlanDistance }}，约 {{ routePlanDuration }}</span>
              </div>
              <el-alert
                v-if="!amapKey"
                class="mb-2"
                type="warning"
                show-icon
                :closable="false"
                title="请先在 .env 中配置 VITE_APP_AMAP_KEY，配置后可展示客户路线图"
              />
              <div ref="routeMapContainerRef" v-loading="routeMapLoading" class="route-map"></div>
              <div v-if="routeMapDisplayCustomers.length" class="route-customer-list">
                <div
                  v-for="(customer, index) in routeMapDisplayCustomers"
                  :key="customer.customerId"
                  class="route-customer-item"
                  :class="{ 'is-low-share': customer.orderSharePercentage < 10, 'is-missing-location': !hasCustomerLocation(customer) }"
                  :style="getRouteCustomerShareStyle(customer.orderSharePercentage)"
                  @click="focusRouteCustomer(customer)"
                >
                  <span class="route-customer-share-bg">{{ formatRouteCustomerShare(customer.orderSharePercentage) }}</span>
                  <span class="route-customer-index">{{ index + 1 }}</span>
                  <span class="route-customer-main">
                    <span class="route-customer-name-row">
                      <span class="route-customer-name" :title="customer.name">{{ customer.name }}</span>
                    </span>
                    <span class="route-customer-share" :title="`该配送地订单占比：${formatRouteCustomerShare(customer.orderSharePercentage)}`">
                      {{ customer.orderCount }}单 · {{ formatRouteCustomerShare(customer.orderSharePercentage) }}
                    </span>
                  </span>
                  <span v-if="!hasCustomerLocation(customer)" class="route-customer-location-tag">无位置</span>
                  <el-button
                    class="route-customer-action"
                    link
                    type="primary"
                    size="small"
                    :disabled="hasCustomerOrder(customer.customerId)"
                    @click.stop="addCustomerOrder(customer.customerId)"
                  >
                    {{ hasCustomerOrder(customer.customerId) ? '已添加' : '加订单' }}
                  </el-button>
                </div>
              </div>
            </div>
          </section>

          <section class="delivery-order-section">
            <div class="section-title">客户订单</div>

            <div class="delivery-order-scroll">
              <el-empty v-if="!form.customerOrders.length" description="请选择配送地后添加客户订单" />
              <el-collapse v-else v-model="activeCustomerOrderNames" class="customer-order-collapse">
                <el-collapse-item v-for="(order, orderIndex) in form.customerOrders" :key="order.customerId" :name="String(order.customerId)">
                  <template #title>
                    <div class="customer-order-title">
                      <div class="customer-order-title-main">
                        <span class="customer-order-title-name">{{ order.customerName }}</span>
                        <span v-if="order.routeName" class="customer-order-title-meta">{{ order.routeName }}</span>
                        <span v-if="order.customerPhone" class="customer-order-title-meta">{{ order.customerPhone }}</span>
                      </div>
                      <span class="customer-order-title-total">小计：{{ calcOrderTotal(order).toFixed(2) }}</span>
                    </div>
                  </template>
                  <div class="mb8">
                    <el-button type="primary" plain icon="Plus" @click="addItem(order)">添加商品</el-button>
                    <el-button type="success" plain icon="ShoppingCart" @click="addTopProducts(order)">添加常购商品</el-button>
                    <el-button
                      v-if="!getOrderDebtAmount(order)"
                      type="warning"
                      plain
                      icon="Coin"
                      :disabled="getCustomerDebt(order) <= 0"
                      @click="addCustomerDebt(order)"
                    >
                      添加欠款{{ getCustomerDebt(order) > 0 ? ` ${formatAmount(getCustomerDebt(order))}` : '' }}
                    </el-button>
                    <el-button v-else type="warning" plain icon="Close" @click="removeCustomerDebt(order)">
                      移除欠款 {{ formatAmount(getOrderDebtAmount(order)) }}
                    </el-button>
                    <el-button type="danger" plain icon="Delete" @click="removeCustomerOrder(orderIndex)">移除客户</el-button>
                  </div>
                  <el-alert
                    v-if="getOrderDebtAmount(order)"
                    class="mb8"
                    type="warning"
                    show-icon
                    :closable="false"
                    :title="`已带入该客户欠款 ${formatAmount(getOrderDebtAmount(order))}，会计入本客户小计和整车合计`"
                  />
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
            </div>
          </section>
        </div>
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
            <span v-if="order.customerAlias" class="ml-3 text-gray-500">简称：{{ order.customerAlias }}</span>
            <span v-if="order.routeName" class="ml-3 text-gray-500">配送地：{{ order.routeName }}</span>
            <span v-if="order.customerPhone" class="ml-3 text-gray-500">{{ order.customerPhone }}</span>
            <span v-if="order.previousDebtAmount" class="ml-3 text-gray-500">带入欠款：{{ formatAmount(order.previousDebtAmount) }}</span>
            <span class="ml-3 text-gray-500">小计：{{ formatAmount(order.totalAmount) }}</span>
            <span v-if="detailData?.status === '已归档'" class="ml-3 text-gray-500">实收：{{ formatAmount(order.receivedAmount) }}</span>
            <span v-if="detailData?.status === '已归档'" class="ml-3 text-gray-500">未收：{{ formatAmount(order.unpaidAmount) }}</span>
            <el-button class="ml-3" link type="primary" icon="Printer" @click.stop="handlePrint(detailData, order.orderId)">打印</el-button>
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
          </el-table>
        </el-collapse-item>
      </el-collapse>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="detailData" type="primary" plain icon="Printer" @click="handlePrint(detailData)">打印销售单</el-button>
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="archiveDialog.title" v-model="archiveDialog.visible" width="860px" append-to-body>
      <el-descriptions v-if="archiveData" :column="3" border>
        <el-descriptions-item label="配送日期">{{ archiveData.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="配送地">{{ archiveData.routeName }}</el-descriptions-item>
        <el-descriptions-item label="订单总金额">{{ formatAmount(archiveData.totalAmount) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">客户收款确认</el-divider>
      <el-table border :data="archiveReceipts">
        <el-table-column label="客户" prop="customerName" min-width="150" />
        <el-table-column label="联系电话" prop="customerPhone" width="140" />
        <el-table-column label="带入欠款" width="120">
          <template #default="{ row }">{{ formatAmount(row.previousDebtAmount) }}</template>
        </el-table-column>
        <el-table-column label="订单金额" width="120">
          <template #default="{ row }">{{ formatAmount(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="实收金额" width="170">
          <template #default="{ row }">
            <el-input-number
              v-model="row.receivedAmount"
              :precision="2"
              :min="0"
              :max="Number(row.totalAmount || 0)"
              controls-position="right"
              style="width: 140px"
            />
          </template>
        </el-table-column>
        <el-table-column label="未收金额" width="120">
          <template #default="{ row }">{{ formatAmount(calcArchiveUnpaid(row)) }}</template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <span class="mr-4">订单合计：{{ formatAmount(archiveTotalAmount) }}</span>
          <span class="mr-4">实收合计：{{ formatAmount(archiveReceivedAmount) }}</span>
          <span class="mr-4">未收合计：{{ formatAmount(archiveUnpaidAmount) }}</span>
          <el-button :loading="archiveLoading" type="primary" @click="submitArchive">确认归档</el-button>
          <el-button @click="archiveDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DeliveryOrder" lang="ts">
import {
  listDeliveryOrder,
  getDeliveryOrder,
  delDeliveryOrder,
  addDeliveryOrder,
  updateDeliveryOrder,
  archiveDeliveryOrder
} from '@/api/system/deliveryOrder';
import { CustomerOrderVO, DeliveryOrderForm, DeliveryOrderItemVO, DeliveryOrderQuery, DeliveryOrderVO } from '@/api/system/deliveryOrder/types';
import { listRouteOptions } from '@/api/system/route';
import { RouteVO } from '@/api/system/route/types';
import { getCustomerTopProducts, getRouteCustomerOrderStats, listCustomer } from '@/api/system/customer';
import { CustomerVO, RouteCustomerOrderStatsVO } from '@/api/system/customer/types';
import { getConfigKey } from '@/api/system/config';
import { listProduct } from '@/api/system/product';
import { ProductVO } from '@/api/system/product/types';

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
const router = useRouter();
const route = useRoute();
const amapKey = import.meta.env.VITE_APP_AMAP_KEY as string;
const amapSecurityCode = import.meta.env.VITE_APP_AMAP_SECURITY_CODE as string;
const routeStartPointConfigKey = 'biz.delivery.routeStartPoint';
interface RouteStartPoint {
  longitude: number;
  latitude: number;
  name: string;
}

interface RouteCustomerWithStats extends CustomerVO {
  orderCount: number;
  routeOrderCount: number;
  orderSharePercentage: number;
}
const defaultRouteStartPoint: RouteStartPoint = {
  longitude: 117.729033,
  latitude: 24.540024,
  name: '出发点'
};
const routeStartPoint = ref<RouteStartPoint>({ ...defaultRouteStartPoint });

const deliveryOrderList = ref<DeliveryOrderVO[]>([]);
const routeOptions = ref<RouteVO[]>([]);
const customerOptions = ref<CustomerVO[]>([]);
const routeCustomerOrderStats = ref<RouteCustomerOrderStatsVO[]>([]);
const productOptions = ref<ProductVO[]>([]);
const activeRouteId = ref<string | number>();
const activeCustomerOrderNames = ref<string[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const selectedRows = ref<DeliveryOrderVO[]>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const routeMapContainerRef = ref<HTMLDivElement>();
const routeMapLoading = ref(false);
const routePlanDistance = ref('');
const routePlanDuration = ref('');
let routeMapInstance: any;
let routeMapMarkers: any[] = [];
let routeMapCustomerMarkers = new Map<string | number, any>();
let routeMapPolyline: any;
let routeMapDriving: any;

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

interface ArchiveReceiptRow {
  orderId: string | number;
  customerName?: string;
  customerPhone?: string;
  previousDebtAmount?: number;
  totalAmount?: number;
  receivedAmount: number;
}

const archiveDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const archiveData = ref<DeliveryOrderVO>();
const archiveReceipts = ref<ArchiveReceiptRow[]>([]);
const archiveLoading = ref(false);

const archiveTotalAmount = computed(() => archiveReceipts.value.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0));
const archiveReceivedAmount = computed(() => archiveReceipts.value.reduce((sum, item) => sum + Number(item.receivedAmount || 0), 0));
const archiveUnpaidAmount = computed(() => archiveReceipts.value.reduce((sum, item) => sum + calcArchiveUnpaid(item), 0));

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

const selectedHasArchived = computed(() => selectedRows.value.some((item) => item.status === '已归档'));

const selectedRouteName = computed(() => routeOptions.value.find((item) => item.routeId === activeRouteId.value)?.routeName);
const primaryRouteName = computed(() => routeOptions.value.find((item) => item.routeId === form.value.routeId)?.routeName);

const getPointDistance = (from: Pick<RouteStartPoint, 'longitude' | 'latitude'>, to: Pick<RouteStartPoint, 'longitude' | 'latitude'>) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const fromLat = toRad(from.latitude);
  const toLat = toRad(to.latitude);
  const deltaLat = toRad(to.latitude - from.latitude);
  const deltaLng = toRad(to.longitude - from.longitude);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcRouteDistance = <T extends Pick<RouteStartPoint, 'longitude' | 'latitude'>>(customers: T[]) => {
  let total = 0;
  let current: Pick<RouteStartPoint, 'longitude' | 'latitude'> = routeStartPoint.value;
  customers.forEach((customer) => {
    total += getPointDistance(current, customer);
    current = customer;
  });
  return total;
};

const optimizeRouteCustomers = <T extends Pick<RouteStartPoint, 'longitude' | 'latitude'>>(customers: T[]) => {
  const remaining = [...customers];
  const ordered: T[] = [];
  let current: Pick<RouteStartPoint, 'longitude' | 'latitude'> = routeStartPoint.value;
  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach((customer, index) => {
      const distance = getPointDistance(current, customer);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    const [next] = remaining.splice(nearestIndex, 1);
    ordered.push(next);
    current = next;
  }

  if (ordered.length < 4) {
    return ordered;
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < ordered.length - 2; i++) {
      for (let j = i + 1; j < ordered.length - 1; j++) {
        const candidate = [...ordered.slice(0, i), ...ordered.slice(i, j + 1).reverse(), ...ordered.slice(j + 1)];
        if (calcRouteDistance(candidate) < calcRouteDistance(ordered)) {
          ordered.splice(0, ordered.length, ...candidate);
          improved = true;
        }
      }
    }
  }
  return ordered;
};

const routeCustomerOrderStatsMap = computed(() => {
  const map = new Map<string | number, RouteCustomerOrderStatsVO>();
  routeCustomerOrderStats.value.forEach((item) => map.set(item.customerId, item));
  return map;
});

const routeCustomersWithStats = computed<RouteCustomerWithStats[]>(() =>
  customerOptions.value.map((customer) => {
    const stats = routeCustomerOrderStatsMap.value.get(customer.customerId);
    return {
      ...customer,
      orderCount: Number(stats?.orderCount || 0),
      routeOrderCount: Number(stats?.routeOrderCount || 0),
      orderSharePercentage: Number(stats?.percentage || 0)
    };
  })
);

const hasCustomerLocation = (customer: Pick<CustomerVO, 'longitude' | 'latitude'>) => {
  if (customer.longitude === null || customer.longitude === undefined || customer.latitude === null || customer.latitude === undefined) {
    return false;
  }
  const longitude = Number(customer.longitude);
  const latitude = Number(customer.latitude);
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
};

const routeMapCustomers = computed(() =>
  optimizeRouteCustomers(
    routeCustomersWithStats.value.filter(hasCustomerLocation).map((item) => ({
      ...item,
      longitude: Number(item.longitude),
      latitude: Number(item.latitude)
    }))
  )
);

const routeMapMissingCustomers = computed(() => routeCustomersWithStats.value.filter((item) => !hasCustomerLocation(item)));

const routeMapDisplayCustomers = computed(() =>
  [...routeMapCustomers.value, ...routeMapMissingCustomers.value].filter((customer) => !hasCustomerOrder(customer.customerId))
);

const routeMapMissingCount = computed(() => routeMapMissingCustomers.value.length);

const productMap = computed(() => {
  const map = new Map<string | number, ProductVO>();
  productOptions.value.forEach((item) => map.set(item.productId, item));
  return map;
});

const productCascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
  emitPath: true
};

const categoryProductOptions = computed(() => {
  const categoryMap = new Map<
    string | number,
    { value: string | number; label: string; children: Array<{ value: string | number; label: string }> }
  >();
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

const parseRouteStartPoint = (value?: string): RouteStartPoint | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    const point = JSON.parse(value);
    const longitude = Number(point.longitude);
    const latitude = Number(point.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return undefined;
    }
    return {
      longitude,
      latitude,
      name: point.name || defaultRouteStartPoint.name
    };
  } catch {
    return undefined;
  }
};

const getRouteStartPointConfig = async () => {
  try {
    const res = await getConfigKey(routeStartPointConfigKey);
    routeStartPoint.value = parseRouteStartPoint(res.data) || { ...defaultRouteStartPoint };
  } catch {
    routeStartPoint.value = { ...defaultRouteStartPoint };
  }
};

const getRouteCustomerStats = async (routeId?: string | number) => {
  if (!routeId) {
    routeCustomerOrderStats.value = [];
    return;
  }
  try {
    const res = await getRouteCustomerOrderStats(routeId);
    routeCustomerOrderStats.value = res.data || [];
  } catch {
    routeCustomerOrderStats.value = [];
  }
};

const getCustomersByRoute = async (routeId?: string | number) => {
  if (!routeId) {
    customerOptions.value = [];
    routeCustomerOrderStats.value = [];
    await renderRouteMap();
    return;
  }
  const [customerRes] = await Promise.all([listCustomer({ pageNum: 1, pageSize: 9999, routeId }), getRouteCustomerStats(routeId)]);
  customerOptions.value = customerRes.rows;
  await renderRouteMap();
};

const getList = async () => {
  loading.value = true;
  const res = await listDeliveryOrder(queryParams.value);
  deliveryOrderList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const handleRouteChange = async () => {
  if (!form.value.routeId || !form.value.customerOrders.length) {
    form.value.routeId = activeRouteId.value;
  }
  await getCustomersByRoute(activeRouteId.value);
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData, customerOrders: [] };
  activeRouteId.value = undefined;
  activeCustomerOrderNames.value = [];
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
  selectedRows.value = selection;
  ids.value = selection.map((item) => item.deliveryId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增配货装车单';
};

const getQueryValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const openAddFromRouteQuery = () => {
  if (getQueryValue(route.query.action) !== 'add') {
    return;
  }
  handleAdd();
  const deliveryDate = getQueryValue(route.query.deliveryDate);
  if (typeof deliveryDate === 'string' && deliveryDate) {
    form.value.deliveryDate = deliveryDate;
  }
  const { action, deliveryDate: _deliveryDate, ...restQuery } = route.query;
  router.replace({ path: route.path, query: restQuery });
};

const handleUpdate = async (row?: DeliveryOrderVO) => {
  reset();
  const _deliveryId = row?.deliveryId || ids.value[0];
  const res = await getDeliveryOrder(_deliveryId);
  Object.assign(form.value, res.data);
  form.value.customerOrders = res.data.customerOrders || [];
  activeRouteId.value = form.value.routeId;
  activeCustomerOrderNames.value = form.value.customerOrders[0]?.customerId ? [String(form.value.customerOrders[0].customerId)] : [];
  dialog.visible = true;
  dialog.title = '修改配货装车单';
  await getCustomersByRoute(activeRouteId.value);
};

const loadAmap = async () => {
  const AMap = await loadAmapBase();
  await loadAmapPlugins(['AMap.Driving']);
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

const clearRouteMapOverlays = () => {
  if (!routeMapInstance) {
    return;
  }
  routePlanDistance.value = '';
  routePlanDuration.value = '';
  if (routeMapMarkers.length) {
    routeMapInstance.remove(routeMapMarkers);
    routeMapMarkers = [];
  }
  routeMapCustomerMarkers = new Map();
  if (routeMapPolyline) {
    routeMapInstance.remove(routeMapPolyline);
    routeMapPolyline = undefined;
  }
  if (routeMapDriving) {
    routeMapDriving.clear();
  }
};

const formatRouteDistance = (meters?: number) => {
  const value = Number(meters || 0);
  return value >= 1000 ? `${(value / 1000).toFixed(1)} 公里` : `${value.toFixed(0)} 米`;
};

const formatRouteDuration = (seconds?: number) => {
  const value = Number(seconds || 0);
  if (value >= 3600) {
    const hours = Math.floor(value / 3600);
    const minutes = Math.round((value % 3600) / 60);
    return `${hours} 小时 ${minutes} 分钟`;
  }
  return `${Math.round(value / 60)} 分钟`;
};

const renderDrivingRoute = (AMap: any, points: number[][]) => {
  if (!points.length) {
    return;
  }
  if (routeMapDriving) {
    routeMapDriving.clear();
  }
  const origin = [routeStartPoint.value.longitude, routeStartPoint.value.latitude];
  routeMapPolyline = new AMap.Polyline({
    path: [origin, ...points],
    strokeColor: '#16a34a',
    strokeWeight: 4,
    strokeOpacity: 0.85,
    lineJoin: 'round',
    zIndex: 50
  });
  routeMapInstance.add(routeMapPolyline);
  routeMapDriving = new AMap.Driving({
    map: routeMapInstance,
    hideMarkers: true,
    autoFitView: false,
    showTraffic: false
  });
  const destination = points[points.length - 1];
  const waypoints = points.slice(0, -1);
  routeMapDriving.search(origin, destination, { waypoints }, (status: string, result: any) => {
    if (status !== 'complete') {
      routePlanDistance.value = `直线约 ${formatRouteDistance(calcRouteDistance(routeMapCustomers.value))}`;
      routePlanDuration.value = '驾车规划失败';
      return;
    }
    const route = result?.routes?.[0];
    routePlanDistance.value = formatRouteDistance(route?.distance);
    routePlanDuration.value = formatRouteDuration(route?.time);
    if (routeMapPolyline) {
      routeMapInstance.remove(routeMapPolyline);
      routeMapPolyline = undefined;
    }
  });
};

const openRouteCustomerInfo = (AMap: any, customer: CustomerVO, marker: any) => {
  new AMap.InfoWindow({
    content: `<div class="route-map-info"><strong>${customer.name}</strong><br/>${customer.phone || ''}<br/>${customer.mapAddress || customer.mapLocation || ''}</div>`
  }).open(routeMapInstance, marker.getPosition());
};

const focusRouteCustomer = async (customer: CustomerVO) => {
  if (!hasCustomerLocation(customer) || !routeMapContainerRef.value || !amapKey) {
    return;
  }
  try {
    const AMap = await loadAmap();
    if (!routeMapInstance) {
      await renderRouteMap();
    }
    const marker = routeMapCustomerMarkers.get(customer.customerId);
    const position = [Number(customer.longitude), Number(customer.latitude)];
    routeMapInstance?.setZoomAndCenter(15, position);
    if (marker) {
      openRouteCustomerInfo(AMap, customer, marker);
    }
  } catch (error) {
    proxy?.$modal.msgError((error as Error).message || '客户定位失败');
  }
};

const renderRouteMap = async () => {
  await nextTick();
  if (!dialog.visible || !routeMapContainerRef.value || !amapKey) {
    return;
  }
  routeMapLoading.value = true;
  try {
    const AMap = await loadAmap();
    if (!routeMapInstance) {
      routeMapInstance = new AMap.Map(routeMapContainerRef.value, {
        zoom: 13,
        center: [113.30765, 23.120049]
      });
    }
    clearRouteMapOverlays();
    const points = routeMapCustomers.value.map((item) => [item.longitude, item.latitude]);
    const startMarker = new AMap.Marker({
      position: [routeStartPoint.value.longitude, routeStartPoint.value.latitude],
      title: routeStartPoint.value.name,
      label: {
        content: routeStartPoint.value.name,
        direction: 'top'
      }
    });
    routeMapMarkers = routeMapCustomers.value.map((item, index) => {
      const marker = new AMap.Marker({
        position: [item.longitude, item.latitude],
        title: item.name,
        label: {
          content: `${index + 1}. ${item.name}`,
          direction: 'top'
        }
      });
      marker.on('click', () => {
        openRouteCustomerInfo(AMap, item, marker);
      });
      routeMapCustomerMarkers.set(item.customerId, marker);
      return marker;
    });
    routeMapMarkers.unshift(startMarker);
    if (routeMapMarkers.length) {
      routeMapInstance.add(routeMapMarkers);
    }
    renderDrivingRoute(AMap, points);
    if (points.length) {
      routeMapInstance.setFitView([...routeMapMarkers, routeMapPolyline].filter(Boolean), false, [60, 60, 60, 60]);
    }
  } catch (error) {
    proxy?.$modal.msgError((error as Error).message || '客户路线图加载失败');
  } finally {
    routeMapLoading.value = false;
  }
};

const destroyRouteMap = () => {
  clearRouteMapOverlays();
  routeMapDriving = undefined;
  routeMapPolyline = undefined;
  routeMapMarkers = [];
  routeMapCustomerMarkers = new Map();
  if (routeMapInstance) {
    routeMapInstance.destroy();
    routeMapInstance = undefined;
  }
};

const handleDetail = async (row: DeliveryOrderVO) => {
  const res = await getDeliveryOrder(row.deliveryId);
  detailData.value = res.data;
  detailDialog.visible = true;
};

const handlePrint = (row?: DeliveryOrderVO, orderId?: string | number) => {
  if (!row?.deliveryId) return;
  const route = router.resolve({
    name: 'DeliveryOrderPrint',
    params: { deliveryId: row.deliveryId },
    query: orderId ? { orderId } : undefined
  });
  window.open(route.href, '_blank');
};

const handleArchive = async (row: DeliveryOrderVO) => {
  const res = await getDeliveryOrder(row.deliveryId);
  archiveData.value = res.data;
  archiveReceipts.value = (res.data.customerOrders || []).map((order) => ({
    orderId: order.orderId!,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    previousDebtAmount: Number(order.previousDebtAmount || 0),
    totalAmount: Number(order.totalAmount || 0),
    receivedAmount: 0
  }));
  archiveDialog.title = `${row.deliveryDate} ${row.routeName} 归档确认`;
  archiveDialog.visible = true;
};

const calcArchiveUnpaid = (row: ArchiveReceiptRow) => {
  return Math.max(Number(row.totalAmount || 0) - Number(row.receivedAmount || 0), 0);
};

const validateArchiveReceipts = () => {
  if (!archiveData.value?.deliveryId || !archiveReceipts.value.length) {
    proxy?.$modal.msgWarning('没有可归档的客户订单');
    return false;
  }
  for (const item of archiveReceipts.value) {
    const receivedAmount = Number(item.receivedAmount);
    const totalAmount = Number(item.totalAmount || 0);
    if (!item.orderId || Number.isNaN(receivedAmount)) {
      proxy?.$modal.msgWarning(`${item.customerName || '客户'} 的实收金额不能为空`);
      return false;
    }
    if (receivedAmount < 0) {
      proxy?.$modal.msgWarning(`${item.customerName || '客户'} 的实收金额不能小于0`);
      return false;
    }
    if (receivedAmount > totalAmount) {
      proxy?.$modal.msgWarning(`${item.customerName || '客户'} 的实收金额不能大于订单金额`);
      return false;
    }
  }
  return true;
};

const submitArchive = async () => {
  if (!validateArchiveReceipts()) {
    return;
  }
  await proxy?.$modal.confirm(`确认归档？未收合计 ${formatAmount(archiveUnpaidAmount.value)} 将计入客户欠款金额。`);
  archiveLoading.value = true;
  await archiveDeliveryOrder(archiveData.value!.deliveryId, {
    receipts: archiveReceipts.value.map((item) => ({
      orderId: item.orderId,
      receivedAmount: Number(item.receivedAmount || 0)
    }))
  }).finally(() => (archiveLoading.value = false));
  archiveDialog.visible = false;
  proxy?.$modal.msgSuccess('归档成功');
  await getList();
};

const hasCustomerOrder = (customerId?: string | number) => {
  return !!customerId && form.value.customerOrders.some((item) => item.customerId === customerId);
};

const addCustomerOrder = (customerId?: string | number) => {
  if (!customerId) {
    proxy?.$modal.msgWarning('请选择左侧客户');
    return;
  }
  if (hasCustomerOrder(customerId)) {
    return;
  }
  const customer = customerOptions.value.find((item) => item.customerId === customerId);
  if (!customer) return;
  const order: CustomerOrderVO = {
    customerId: customer.customerId,
    customerName: customer.name,
    customerPhone: customer.phone,
    routeName: customer.routeName,
    previousDebtAmount: 0,
    items: [createEmptyItem()]
  };
  form.value.customerOrders.push(order);
  const orderName = String(customer.customerId);
  if (!activeCustomerOrderNames.value.includes(orderName)) {
    activeCustomerOrderNames.value.push(orderName);
  }
};

const removeCustomerOrder = (index: number) => {
  const order = form.value.customerOrders[index];
  form.value.customerOrders.splice(index, 1);
  if (order?.customerId) {
    activeCustomerOrderNames.value = activeCustomerOrderNames.value.filter((item) => item !== String(order.customerId));
  }
};

const createEmptyItem = (): DeliveryOrderItemVO => ({
  categoryId: undefined,
  productPath: [],
  productId: undefined,
  quantity: 1,
  salePrice: 0,
  costPrice: 0
});

const createItemFromProduct = (product: ProductVO): DeliveryOrderItemVO => ({
  categoryId: product.categoryId,
  categoryName: product.categoryName,
  productPath: [product.categoryId, product.productId],
  productId: product.productId,
  productName: product.productName,
  specification: product.specification,
  supplier: product.supplier,
  unit: product.unit,
  quantity: 1,
  salePrice: product.latestSaleAmount || 0,
  costPrice: product.latestCostPrice || 0
});

const addItem = (order: CustomerOrderVO) => {
  order.items.push(createEmptyItem());
  const orderName = String(order.customerId);
  if (!activeCustomerOrderNames.value.includes(orderName)) {
    activeCustomerOrderNames.value.push(orderName);
  }
};

const removeItem = (order: CustomerOrderVO, index: number) => {
  order.items.splice(index, 1);
};

const addTopProducts = async (order: CustomerOrderVO) => {
  if (!order.customerId) {
    proxy?.$modal.msgWarning('请先选择客户');
    return;
  }
  const res = await getCustomerTopProducts(order.customerId);
  const existingProductIds = new Set(order.items.map((item) => item.productId).filter(Boolean));
  const products = (res.data || [])
    .map((item) => productMap.value.get(item.productId))
    .filter((item): item is ProductVO => !!item && !existingProductIds.has(item.productId));

  if (!products.length) {
    proxy?.$modal.msgWarning('该客户暂无可添加的常购商品');
    return;
  }
  if (order.items.length === 1 && !order.items[0].productId) {
    order.items.splice(0, 1);
  }
  order.items.push(...products.map(createItemFromProduct));
  const orderName = String(order.customerId);
  if (!activeCustomerOrderNames.value.includes(orderName)) {
    activeCustomerOrderNames.value.push(orderName);
  }
};

const getCustomerDebt = (order: CustomerOrderVO) => {
  const customer = customerOptions.value.find((item) => item.customerId === order.customerId);
  return Number(customer?.debt || 0);
};

const getOrderDebtAmount = (order: CustomerOrderVO) => Number(order.previousDebtAmount || 0);

const addCustomerDebt = (order: CustomerOrderVO) => {
  const debt = getCustomerDebt(order);
  if (debt <= 0) {
    proxy?.$modal.msgWarning('该客户暂无欠款');
    return;
  }
  order.previousDebtAmount = debt;
};

const removeCustomerDebt = (order: CustomerOrderVO) => {
  order.previousDebtAmount = 0;
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
    row.unit = undefined;
    return;
  }
  row.productPath = value;
  row.categoryId = product.categoryId;
  row.categoryName = product.categoryName;
  row.productId = product.productId;
  row.productName = product.productName;
  row.specification = product.specification;
  row.supplier = product.supplier;
  row.unit = product.unit;
  row.salePrice = product.latestSaleAmount || 0;
  row.costPrice = product.latestCostPrice || 0;
};

const calcItemAmount = (row: DeliveryOrderItemVO) => {
  return Number(row.quantity || 0) * Number(row.salePrice || 0);
};

const calcOrderTotal = (order: CustomerOrderVO) => {
  return order.items.reduce((sum, item) => sum + calcItemAmount(item), 0) + getOrderDebtAmount(order);
};

const calcDeliveryTotal = () => {
  return form.value.customerOrders.reduce((sum, order) => sum + calcOrderTotal(order), 0);
};

const formatAmount = (value?: number) => {
  return Number(value || 0).toFixed(2);
};

const formatRouteCustomerShare = (value?: number) => {
  return `${Number(value || 0).toFixed(1)}%`;
};

const getRouteCustomerShareStyle = (value?: number) => {
  const percentage = Math.max(0, Math.min(100, Number(value || 0)));
  if (percentage < 10) {
    return {
      '--share-percent': `${percentage}%`,
      '--share-bg': 'rgba(245, 108, 108, 0.14)',
      '--share-fill': 'rgba(245, 108, 108, 0.22)',
      '--share-text': 'rgba(245, 108, 108, 0.28)'
    };
  }
  const alpha = Math.min(0.5, 0.12 + percentage * 0.004);
  const textAlpha = Math.min(0.38, 0.16 + percentage * 0.003);
  return {
    '--share-percent': `${percentage}%`,
    '--share-bg': `rgba(103, 194, 58, ${alpha})`,
    '--share-fill': `rgba(82, 168, 39, ${Math.min(0.55, alpha + 0.12)})`,
    '--share-text': `rgba(35, 120, 26, ${textAlpha})`
  };
};

const normalizeForm = () => {
  return {
    ...form.value,
    customerOrders: form.value.customerOrders.map((order) => ({
      customerId: order.customerId,
      previousDebtAmount: getOrderDebtAmount(order),
      remark: order.remark,
      items: order.items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          salePrice: item.salePrice,
          costPrice: item.costPrice
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
    const validItems = order.items.filter((item) => item.productId);
    if (!validItems.length && getOrderDebtAmount(order) <= 0) {
      proxy?.$modal.msgWarning(`${order.customerName} 未添加商品或欠款`);
      return false;
    }
    for (const item of validItems) {
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
  getRouteStartPointConfig();
  getRouteOptions();
  getProductOptions();
  getList();
  openAddFromRouteQuery();
});

watch(
  () => route.query.action,
  () => openAddFromRouteQuery()
);
</script>

<style scoped>
:deep(.delivery-order-dialog .el-dialog__body) {
  max-height: calc(100vh - 180px);
  overflow: hidden;
}

.delivery-edit-layout {
  display: grid;
  grid-template-columns: minmax(420px, 46%) minmax(520px, 1fr);
  gap: 16px;
  min-height: 600px;
}

.delivery-map-section,
.delivery-order-section {
  min-width: 0;
}

.delivery-order-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid #ebeef5;
  padding-left: 16px;
}

.delivery-order-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.customer-order-collapse {
  border: 0;
}

:deep(.customer-order-collapse .el-collapse-item) {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #dfe6f1;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 8px rgb(31 45 61 / 6%);
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

:deep(.customer-order-collapse .el-collapse-item:hover) {
  border-color: #c7d6ea;
  box-shadow: 0 6px 16px rgb(31 45 61 / 10%);
}

:deep(.customer-order-collapse .el-collapse-item.is-active) {
  border-color: #8bbcff;
  box-shadow: 0 8px 20px rgb(64 158 255 / 14%);
}

:deep(.customer-order-collapse .el-collapse-item__header) {
  min-height: 48px;
  height: auto;
  padding: 0 14px;
  border-bottom: 1px solid #edf1f7;
  background: linear-gradient(180deg, #f9fbff 0%, #f3f7fc 100%);
  color: #303133;
}

:deep(.customer-order-collapse .el-collapse-item.is-active .el-collapse-item__header) {
  background: linear-gradient(180deg, #f2f8ff 0%, #eaf3ff 100%);
}

:deep(.customer-order-collapse .el-collapse-item__wrap) {
  border-bottom: 0;
  background: #fff;
}

:deep(.customer-order-collapse .el-collapse-item__content) {
  padding: 12px 14px 14px;
}

.customer-order-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  padding-right: 10px;
  gap: 12px;
}

.customer-order-title-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.customer-order-title-name {
  max-width: 220px;
  overflow: hidden;
  color: #1f2d3d;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-order-title-meta {
  color: #606266;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.customer-order-title-total {
  flex: none;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
}

.section-title {
  margin-bottom: 10px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.delivery-info-grid {
  margin-bottom: 6px;
}

.route-map-panel {
  width: 100%;
}

.route-map-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 13px;
  line-height: 20px;
}

.route-map-summary span:first-child {
  color: #303133;
  font-weight: 600;
}

.route-map {
  width: 100%;
  height: 440px;
  border: 1px solid #dcdfe6;
}

.route-customer-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.route-customer-item {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 46px;
  align-items: stretch;
  column-gap: 6px;
  min-width: 0;
  min-height: 58px;
  padding: 7px 8px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background:
    linear-gradient(90deg, var(--share-fill) 0%, var(--share-fill) var(--share-percent, 0%), transparent var(--share-percent, 0%)),
    var(--share-bg, #fafafa);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.route-customer-item:hover {
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  transform: translateY(-1px);
}

.route-customer-item.is-low-share {
  border-color: #fde2e2;
}

.route-customer-item.is-missing-location {
  border-color: #f3b4b4;
  cursor: default;
}

.route-customer-item.is-missing-location::after {
  position: absolute;
  inset: 0;
  z-index: 0;
  border: 1px dashed rgb(245 108 108 / 45%);
  border-radius: 4px;
  content: '';
  pointer-events: none;
}

.route-customer-share-bg {
  position: absolute;
  right: 56px;
  bottom: -3px;
  z-index: 0;
  color: var(--share-text, rgb(0 0 0 / 12%));
  font-size: 25px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

.route-customer-index {
  position: relative;
  z-index: 1;
  align-self: start;
  color: #606266;
  font-size: 12px;
  line-height: 18px;
}

.route-customer-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.route-customer-name-row {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  gap: 4px;
}

.route-customer-name {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  color: #303133;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  overflow-wrap: anywhere;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.route-customer-share {
  color: #606266;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
}

.route-customer-location-tag {
  position: absolute;
  top: 5px;
  right: 52px;
  z-index: 2;
  border: 1px solid rgb(245 108 108 / 38%);
  border-radius: 10px;
  background: rgb(255 255 255 / 88%);
  color: #c45656;
  font-size: 11px;
  line-height: 16px;
  padding: 0 6px;
  pointer-events: none;
}

.route-customer-action {
  position: relative;
  z-index: 1;
  align-self: start;
  justify-self: end;
  min-width: 40px;
  padding: 0;
}

:deep(.amap-marker-label) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 2px 6px;
  color: #303133;
  font-size: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

@media (max-width: 1280px) {
  .delivery-edit-layout {
    grid-template-columns: 1fr;
  }

  .delivery-order-section {
    border-left: none;
    border-top: 1px solid #ebeef5;
    padding-top: 16px;
    padding-left: 0;
  }
}
</style>
