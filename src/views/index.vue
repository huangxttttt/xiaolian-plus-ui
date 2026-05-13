<template>
  <div class="dashboard-page">
    <section class="metric-grid">
      <article class="metric-panel">
        <div>
          <p class="metric-label">今日营业额</p>
          <p class="metric-value">{{ money(summary.todaySales.amount) }}</p>
          <p class="metric-meta">已归档 {{ money(summary.todaySales.archivedAmount) }} · 未归档 {{ money(summary.todaySales.unarchivedAmount) }}</p>
          <p class="metric-compare">
            昨日 {{ money(summary.todaySales.previousAmount) }} · {{ compareText(summary.todaySales.amount, summary.todaySales.previousAmount) }}
          </p>
        </div>
        <div class="sparkline">
          <div ref="todaySalesChartRef" class="sparkline-chart"></div>
          <span>{{ trendLabel(summary.todaySales.trend, '近7日') }}</span>
        </div>
      </article>

      <article class="metric-panel">
        <div>
          <p class="metric-label">本月营业额</p>
          <p class="metric-value">{{ money(summary.monthSales.amount) }}</p>
          <p class="metric-meta">{{ summary.monthSales.orderCount }} 单 · {{ summary.monthSales.customerCount }} 户客户</p>
          <p class="metric-compare">
            上月 {{ money(summary.monthSales.previousAmount) }} · {{ compareText(summary.monthSales.amount, summary.monthSales.previousAmount) }}
          </p>
        </div>
        <div class="sparkline">
          <div ref="monthSalesChartRef" class="sparkline-chart"></div>
          <span>{{ trendLabel(summary.monthSales.trend, '每日') }}</span>
        </div>
      </article>

      <article class="metric-panel">
        <div>
          <p class="metric-label">今年营业额</p>
          <p class="metric-value">{{ money(summary.yearSales.amount) }}</p>
          <p class="metric-meta">{{ summary.yearSales.orderCount }} 单 · {{ summary.yearSales.customerCount }} 户客户</p>
          <p class="metric-compare">
            去年 {{ money(summary.yearSales.previousAmount) }} · {{ compareText(summary.yearSales.amount, summary.yearSales.previousAmount) }}
          </p>
        </div>
        <div class="sparkline">
          <div ref="yearSalesChartRef" class="sparkline-chart"></div>
          <span>{{ trendLabel(summary.yearSales.trend, '每月') }}</span>
        </div>
      </article>

      <article class="metric-panel order-panel actionable-panel" @click="openTodayOrders">
        <div>
          <p class="metric-label">今日下单客户</p>
          <p class="metric-value">{{ summary.todayOrders.customerCount }} 户</p>
          <p class="metric-meta">{{ summary.todayOrders.orderCount }} 笔订单 · 点击查看</p>
        </div>
        <div class="order-icon">
          <el-icon><UserFilled /></el-icon>
        </div>
      </article>
    </section>

    <section class="profit-overview">
      <article v-for="item in profitOverviewItems" :key="item.label" class="profit-card">
        <div>
          <p class="profit-label">{{ item.label }}</p>
          <strong :class="profitClass(item.data.profitAmount)">{{ money(item.data.profitAmount) }}</strong>
        </div>
        <div class="profit-meta">
          <span>营业额 {{ money(item.data.salesAmount) }}</span>
          <span>成本 {{ money(item.data.costAmount) }}</span>
          <span>毛利率 {{ formatNumber(item.data.profitRate) }}%</span>
        </div>
      </article>
    </section>

    <section class="rank-toolbar">
      <div>
        <h2>经营排行</h2>
        <p>{{ rankPeriodText }}已归档配货数据</p>
      </div>
      <div class="rank-actions">
        <el-date-picker
          v-if="rankPeriod === 'month'"
          v-model="rankMonth"
          type="month"
          value-format="YYYY-MM"
          format="YYYY年MM月"
          placeholder="选择月份"
          :clearable="false"
          size="small"
          style="width: 138px"
          @change="loadSummary"
        />
        <el-radio-group v-model="rankPeriod" size="small" @change="loadSummary">
          <el-radio-button label="month">本月排行</el-radio-button>
          <el-radio-button label="year">今年排行</el-radio-button>
        </el-radio-group>
      </div>
    </section>

    <section class="rank-grid" v-loading="rankLoading">
      <article class="rank-panel">
        <header class="rank-header">
          <div>
            <h2>客户订货额排行</h2>
            <p>按{{ rankPeriodText }}订单金额占比，展示前 10 个客户。</p>
          </div>
          <strong>TOP 10</strong>
        </header>
        <div class="rank-content">
          <div class="donut-wrap">
            <div class="echart-donut">
              <div ref="customerChartRef" class="rank-chart"></div>
              <div class="chart-center">
                <span>TOP10 总额</span>
                <strong>{{ money(customerRankTotal) }}</strong>
              </div>
            </div>
          </div>
          <div class="rank-list">
            <el-empty v-if="!summary.customerRanks.length" description="暂无排行数据" />
            <div v-for="(item, index) in summary.customerRanks" :key="item.customerName" class="rank-item">
              <i :style="{ background: rankColor(index) }" />
              <div class="rank-main">
                <strong>{{ index + 1 }}. {{ item.customerName }}</strong>
                <span>{{ item.orderCount || 0 }} 单 · {{ item.routeName || '-' }}</span>
              </div>
              <div class="rank-side">
                <strong>{{ money(item.amount) }}</strong>
                <span>{{ formatNumber(item.percent) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="rank-panel">
        <header class="rank-header">
          <div>
            <h2>商品出货量排行</h2>
            <p>按{{ rankPeriodText }}商品数量占比，展示前 10 个商品。</p>
          </div>
          <strong>TOP 10</strong>
        </header>
        <div class="rank-content">
          <div class="donut-wrap">
            <div class="echart-donut">
              <div ref="productChartRef" class="rank-chart"></div>
              <div class="chart-center">
                <span>TOP10 数量</span>
                <strong>{{ formatNumber(productRankTotal) }}</strong>
              </div>
            </div>
          </div>
          <div class="rank-list">
            <el-empty v-if="!summary.productRanks.length" description="暂无排行数据" />
            <div v-for="(item, index) in summary.productRanks" :key="`${item.productName}-${item.specification}`" class="rank-item">
              <i :style="{ background: rankColor(index) }" />
              <div class="rank-main">
                <strong>{{ index + 1 }}. {{ item.productName }} {{ item.specification || '' }}</strong>
                <span>{{ item.orderCount || 0 }} 单 · 出货额 {{ money(item.amount) }}</span>
              </div>
              <div class="rank-side">
                <strong>{{ formatNumber(item.quantity) }} 件</strong>
                <span>{{ formatNumber(item.percent) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="profit-rank-grid" v-loading="rankLoading">
      <article class="rank-panel profit-rank-panel">
        <header class="rank-header compact-header">
          <div>
            <h2>客户毛利 TOP 10</h2>
            <p>按{{ rankPeriodText }}客户毛利排序，查看最赚钱的客户。</p>
          </div>
          <strong>毛利</strong>
        </header>
        <div class="profit-rank-list">
          <el-empty v-if="!summary.customerProfitRanks.length" description="暂无毛利数据" />
          <div v-for="(item, index) in summary.customerProfitRanks" :key="`customer-profit-${item.name}`" class="profit-rank-item">
            <i :style="{ background: rankColor(index) }" />
            <div class="profit-rank-main">
              <strong>{{ index + 1 }}. {{ item.name || '-' }}</strong>
              <span>{{ item.orderCount || 0 }} 单 · {{ item.subName || '-' }} · 毛利率 {{ formatNumber(item.profitRate) }}%</span>
            </div>
            <div class="profit-rank-side">
              <strong>{{ money(item.profitAmount) }}</strong>
              <span>销售 {{ money(item.salesAmount) }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="rank-panel profit-rank-panel">
        <header class="rank-header compact-header">
          <div>
            <h2>商品毛利 TOP 10</h2>
            <p>按{{ rankPeriodText }}商品毛利排序，识别高贡献商品。</p>
          </div>
          <strong>毛利</strong>
        </header>
        <div class="profit-rank-list">
          <el-empty v-if="!summary.productProfitRanks.length" description="暂无毛利数据" />
          <div v-for="(item, index) in summary.productProfitRanks" :key="`product-profit-${item.name}-${item.subName}`" class="profit-rank-item">
            <i :style="{ background: rankColor(index) }" />
            <div class="profit-rank-main">
              <strong>{{ index + 1 }}. {{ item.name || '-' }} {{ item.subName || '' }}</strong>
              <span>{{ formatNumber(item.quantity) }} 件 · {{ item.orderCount || 0 }} 单 · 毛利率 {{ formatNumber(item.profitRate) }}%</span>
            </div>
            <div class="profit-rank-side">
              <strong>{{ money(item.profitAmount) }}</strong>
              <span>销售 {{ money(item.salesAmount) }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="rank-panel profit-rank-panel route-profit-panel">
        <header class="rank-header compact-header">
          <div>
            <h2>路线盈利统计</h2>
            <p>按{{ rankPeriodText }}配货路线汇总毛利，辅助安排配送重点。</p>
          </div>
          <strong>路线</strong>
        </header>
        <div class="profit-rank-list route-rank-list">
          <el-empty v-if="!summary.routeProfitRanks.length" description="暂无路线盈利数据" />
          <div v-for="(item, index) in summary.routeProfitRanks" :key="`route-profit-${item.name}`" class="profit-rank-item">
            <i :style="{ background: rankColor(index) }" />
            <div class="profit-rank-main">
              <strong>{{ index + 1 }}. {{ item.name || '未设置路线' }}</strong>
              <span>{{ item.orderCount || 0 }} 单 · 销售 {{ money(item.salesAmount) }} · 成本 {{ money(item.costAmount) }}</span>
            </div>
            <div class="profit-rank-side">
              <strong>{{ money(item.profitAmount) }}</strong>
              <span>毛利率 {{ formatNumber(item.profitRate) }}%</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <el-dialog v-model="todayOrderDialog.visible" title="今日订单详情" width="1120px" append-to-body>
      <div v-loading="todayOrderLoading" class="today-order-dialog">
        <div class="today-order-summary">
          <div>
            <span>配送日期</span>
            <strong>{{ todayOrderDate || '-' }}</strong>
          </div>
          <div>
            <span>配货单</span>
            <strong>{{ todayDeliveryCount }} 单</strong>
          </div>
          <div>
            <span>客户订单</span>
            <strong>{{ todayCustomerOrderCount }} 笔</strong>
          </div>
          <div>
            <span>订单总额</span>
            <strong>{{ money(todayOrderTotalAmount) }}</strong>
          </div>
        </div>

        <el-empty v-if="!todayOrderLoading && !todayOrderDetails.length" description="今日暂无订单" />

        <el-collapse v-else v-model="todayOrderActiveNames" class="today-order-collapse">
          <el-collapse-item v-for="delivery in todayOrderDetails" :key="delivery.deliveryId" :name="String(delivery.deliveryId)">
            <template #title>
              <div class="today-delivery-title">
                <strong>{{ delivery.routeName || '-' }}</strong>
                <span>{{ delivery.deliveryDate }}</span>
                <el-tag size="small" :type="delivery.status === '已归档' ? 'success' : 'warning'">{{ delivery.status }}</el-tag>
                <span>{{ delivery.customerOrders?.length || 0 }} 户</span>
                <span>涉及配送地 {{ deliveryRouteNames(delivery) }}</span>
                <span>合计 {{ money(delivery.totalAmount) }}</span>
                <span class="today-title-spacer"></span>
                <el-button
                  v-if="delivery.status !== '已归档'"
                  class="today-action-button"
                  type="primary"
                  icon="CircleCheck"
                  @click.stop="handleArchive(delivery)"
                >
                  归档
                </el-button>
                <el-button class="today-print-button" type="primary" icon="Printer" @click.stop="handlePrint(delivery)">打印全部</el-button>
              </div>
            </template>

            <el-table :data="delivery.customerOrders || []" border size="small" class="today-customer-table">
              <el-table-column type="expand" width="42">
                <template #default="{ row }">
                  <el-table :data="row.items || []" border size="small" class="today-item-table">
                    <el-table-column label="商品" prop="productName" min-width="160" />
                    <el-table-column label="规格" prop="specification" width="110" />
                    <el-table-column label="提供商" prop="supplier" min-width="120" />
                    <el-table-column label="数量" prop="quantity" width="90" align="right" />
                    <el-table-column label="销售价" width="100" align="right">
                      <template #default="scope">{{ formatAmount(scope.row.salePrice) }}</template>
                    </el-table-column>
                    <el-table-column label="成本价" width="100" align="right">
                      <template #default="scope">{{ formatAmount(scope.row.costPrice) }}</template>
                    </el-table-column>
                    <el-table-column label="金额" width="110" align="right">
                      <template #default="scope">{{ formatAmount(scope.row.amount) }}</template>
                    </el-table-column>
                    <el-table-column label="备注" prop="remark" min-width="120" />
                  </el-table>
                </template>
              </el-table-column>
              <el-table-column label="客户名称" prop="customerName" min-width="150" />
              <el-table-column label="配送地" prop="routeName" width="110">
                <template #default="scope">{{ scope.row.routeName || delivery.routeName || '-' }}</template>
              </el-table-column>
              <el-table-column label="联系电话" prop="customerPhone" width="140" />
              <el-table-column label="商品数" width="90" align="center">
                <template #default="scope">{{ customerOrderItemCount(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="小计" width="120" align="right">
                <template #default="scope">{{ formatAmount(scope.row.totalAmount) }}</template>
              </el-table-column>
              <el-table-column label="实收" width="120" align="right">
                <template #default="scope">{{ delivery.status === '已归档' ? formatAmount(scope.row.receivedAmount) : '-' }}</template>
              </el-table-column>
              <el-table-column label="未收" width="120" align="right">
                <template #default="scope">{{ delivery.status === '已归档' ? formatAmount(scope.row.unpaidAmount) : '-' }}</template>
              </el-table-column>
              <el-table-column label="备注" prop="remark" min-width="150" />
              <el-table-column label="操作" width="90" align="center" fixed="right">
                <template #default="scope">
                  <el-button link type="primary" icon="Printer" @click="handlePrint(delivery, scope.row.orderId)">打印</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>
      <template #footer>
        <el-button type="primary" icon="Plus" @click="openDeliveryOrderCreate">新增配货装车</el-button>
        <el-button @click="todayOrderDialog.visible = false">关闭</el-button>
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

<script setup name="Index" lang="ts">
import * as echarts from 'echarts';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { UserFilled } from '@element-plus/icons-vue';
import { getDashboardSummary } from '@/api/system/dashboard';
import { archiveDeliveryOrder, getDeliveryOrder, listDeliveryOrder } from '@/api/system/deliveryOrder';
import {
  DashboardCustomerRank,
  DashboardMetric,
  DashboardProductRank,
  DashboardProfitMetric,
  DashboardRankPeriod,
  DashboardSummary,
  DashboardTrendPoint
} from '@/api/system/dashboard/types';
import { CustomerOrderVO, DeliveryOrderVO } from '@/api/system/deliveryOrder/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const palette = ['#0f766e', '#14b8a6', '#f59e0b', '#6366f1', '#8b5cf6', '#ef4444', '#0284c7', '#84cc16', '#f97316', '#64748b'];

const emptyMetric = (): DashboardMetric => ({
  amount: 0,
  previousAmount: 0,
  archivedAmount: 0,
  unarchivedAmount: 0,
  orderCount: 0,
  customerCount: 0,
  trend: []
});

const emptyProfitMetric = (): DashboardProfitMetric => ({
  salesAmount: 0,
  costAmount: 0,
  profitAmount: 0,
  profitRate: 0
});

const summary = reactive<DashboardSummary>({
  todaySales: emptyMetric(),
  monthSales: emptyMetric(),
  yearSales: emptyMetric(),
  todayOrders: {
    customerCount: 0,
    orderCount: 0
  },
  todayProfit: emptyProfitMetric(),
  monthProfit: emptyProfitMetric(),
  yearProfit: emptyProfitMetric(),
  customerRanks: [],
  productRanks: [],
  customerProfitRanks: [],
  productProfitRanks: [],
  routeProfitRanks: []
});

const rankPeriod = ref<DashboardRankPeriod>('month');
const rankMonth = ref('');
const rankLoading = ref(false);
const todayOrderLoading = ref(false);
const todayOrderDate = ref('');
const todayOrderDetails = ref<DeliveryOrderVO[]>([]);
const todayOrderActiveNames = ref<string[]>([]);
const todayOrderDialog = reactive({
  visible: false
});

interface ArchiveReceiptRow {
  orderId: string | number;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  receivedAmount: number;
}

const archiveDialog = reactive({
  visible: false,
  title: ''
});
const archiveData = ref<DeliveryOrderVO>();
const archiveReceipts = ref<ArchiveReceiptRow[]>([]);
const archiveLoading = ref(false);

const rankPeriodText = computed(() => {
  if (rankPeriod.value === 'year') {
    return '今年';
  }
  return rankMonth.value ? `${rankMonth.value.replace('-', '年')}月` : '本月';
});
const profitOverviewItems = computed(() => [
  { label: '今日盈利', data: summary.todayProfit },
  { label: '本月盈利', data: summary.monthProfit },
  { label: '今年盈利', data: summary.yearProfit }
]);
const todayDeliveryCount = computed(() => todayOrderDetails.value.length);
const todayCustomerOrderCount = computed(() => todayOrderDetails.value.reduce((sum, item) => sum + Number(item.customerOrders?.length || 0), 0));
const todayOrderTotalAmount = computed(() => todayOrderDetails.value.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0));
const archiveTotalAmount = computed(() => archiveReceipts.value.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0));
const archiveReceivedAmount = computed(() => archiveReceipts.value.reduce((sum, item) => sum + Number(item.receivedAmount || 0), 0));
const archiveUnpaidAmount = computed(() => archiveReceipts.value.reduce((sum, item) => sum + calcArchiveUnpaid(item), 0));
const todaySalesChartRef = ref<HTMLElement>();
const monthSalesChartRef = ref<HTMLElement>();
const yearSalesChartRef = ref<HTMLElement>();
const customerChartRef = ref<HTMLElement>();
const productChartRef = ref<HTMLElement>();
let todaySalesChart: echarts.ECharts | undefined;
let monthSalesChart: echarts.ECharts | undefined;
let yearSalesChart: echarts.ECharts | undefined;
let customerChart: echarts.ECharts | undefined;
let productChart: echarts.ECharts | undefined;

const money = (value?: number) => `¥${formatNumber(value)}`;
const formatAmount = (value?: number) => Number(value || 0).toFixed(2);

const formatNumber = (value?: number) => {
  const num = Number(value || 0);
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2
  });
};

const compareText = (current?: number, previous?: number) => {
  const diff = Number(current || 0) - Number(previous || 0);
  if (diff === 0) return '持平';
  return `${diff > 0 ? '新增' : '减少'} ${money(Math.abs(diff))}`;
};

const customerRankTotal = computed(() => summary.customerRanks.reduce((sum, item) => sum + Number(item.amount || 0), 0));
const productRankTotal = computed(() => summary.productRanks.reduce((sum, item) => sum + Number(item.quantity || 0), 0));

const rankColor = (index: number) => palette[index % palette.length];
const profitClass = (value?: number) => (Number(value || 0) < 0 ? 'is-loss' : 'is-profit');
const customerOrderItemCount = (order: CustomerOrderVO) => order.items?.length || 0;
const deliveryRouteNames = (delivery: DeliveryOrderVO) => {
  const names = Array.from(new Set((delivery.customerOrders || []).map((order) => order.routeName).filter(Boolean)));
  if (!names.length) {
    return delivery.routeName || '-';
  }
  return names.join('、');
};

const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentMonth = () => getCurrentDate().slice(0, 7);

const openTodayOrders = async () => {
  todayOrderDialog.visible = true;
  todayOrderLoading.value = true;
  todayOrderDate.value = getCurrentDate();
  try {
    const listRes = (await listDeliveryOrder({
      pageNum: 1,
      pageSize: 999,
      deliveryDate: todayOrderDate.value
    })) as any;
    const rows = (listRes.rows || []) as DeliveryOrderVO[];
    const detailResults = await Promise.all(rows.map((item) => getDeliveryOrder(item.deliveryId)));
    todayOrderDetails.value = detailResults.map((res: any) => res.data).filter(Boolean);
    todayOrderActiveNames.value = todayOrderDetails.value.map((item) => String(item.deliveryId));
  } finally {
    todayOrderLoading.value = false;
  }
};

const openDeliveryOrderCreate = () => {
  todayOrderDialog.visible = false;
  router.push({
    path: '/orderManage/deliveryOrder',
    query: {
      action: 'add',
      deliveryDate: todayOrderDate.value || getCurrentDate()
    }
  });
};

const handleArchive = async (row: DeliveryOrderVO) => {
  if (!row.deliveryId || row.status === '已归档') return;
  const res = await getDeliveryOrder(row.deliveryId);
  archiveData.value = res.data;
  archiveReceipts.value = (res.data.customerOrders || []).map((order) => ({
    orderId: order.orderId!,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    totalAmount: Number(order.totalAmount || 0),
    receivedAmount: 0
  }));
  archiveDialog.title = `${row.deliveryDate} ${row.routeName || ''} 归档确认`;
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
  await Promise.all([loadSummary(), todayOrderDialog.visible ? openTodayOrders() : Promise.resolve()]);
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

const trendLabel = (points: DashboardTrendPoint[], suffix: string) => {
  if (!points.length) return suffix;
  const first = points[0]?.label;
  const last = points[points.length - 1]?.label;
  return first === last ? `${last} ${suffix}` : `${first} ~ ${last}`;
};

const normalizeSparkline = (points: DashboardTrendPoint[]) => {
  if (!points.length) {
    return {
      labels: ['', ''],
      values: [0, 0]
    };
  }
  if (points.length === 1) {
    const value = Number(points[0].amount || 0);
    return {
      labels: [points[0].label, points[0].label],
      values: [value, value]
    };
  }
  return {
    labels: points.map((item) => item.label),
    values: points.map((item) => Number(item.amount || 0))
  };
};

const renderSparkline = (
  chartRef: Ref<HTMLElement | undefined>,
  chart: echarts.ECharts | undefined,
  points: DashboardTrendPoint[],
  color: string
) => {
  if (!chartRef.value) return chart;
  const instance = chart || echarts.init(chartRef.value);
  const data = normalizeSparkline(points);
  instance.setOption({
    animation: true,
    grid: {
      top: 8,
      right: 4,
      bottom: 8,
      left: 4
    },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      confine: true,
      formatter: (params: any) => {
        const item = params?.[0];
        return item ? `${item.axisValue}<br/>营业额：${money(item.data)}` : '';
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.labels,
      show: false
    },
    yAxis: {
      type: 'value',
      show: false,
      min: (value: { min: number; max: number }) => {
        if (value.min === value.max) return value.min - 1;
        return value.min;
      },
      max: (value: { min: number; max: number }) => {
        if (value.min === value.max) return value.max + 1;
        return value.max;
      }
    },
    series: [
      {
        type: 'line',
        data: data.values,
        smooth: false,
        symbol: 'circle',
        symbolSize: points.length <= 1 ? 0 : 4,
        showSymbol: points.length > 1,
        lineStyle: {
          width: 2,
          color
        },
        itemStyle: {
          color
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 3
          }
        }
      }
    ]
  });
  instance.resize();
  return instance;
};

const renderSparklineCharts = () => {
  todaySalesChart = renderSparkline(todaySalesChartRef, todaySalesChart, summary.todaySales.trend, '#0f766e');
  monthSalesChart = renderSparkline(monthSalesChartRef, monthSalesChart, summary.monthSales.trend, '#f59e0b');
  yearSalesChart = renderSparkline(yearSalesChartRef, yearSalesChart, summary.yearSales.trend, '#0f766e');
};

const buildCustomerChartData = () =>
  summary.customerRanks.map((item, index) => ({
    name: item.customerName,
    value: Number(item.amount || 0),
    itemStyle: { color: rankColor(index) },
    orderCount: item.orderCount || 0,
    routeName: item.routeName || '-',
    percent: Number(item.percent || 0)
  }));

const buildProductChartData = () =>
  summary.productRanks.map((item, index) => ({
    name: `${item.productName}${item.specification ? ` ${item.specification}` : ''}`,
    value: Number(item.quantity || 0),
    itemStyle: { color: rankColor(index) },
    amount: Number(item.amount || 0),
    orderCount: item.orderCount || 0,
    percent: Number(item.percent || 0)
  }));

const renderRankCharts = () => {
  renderCustomerChart();
  renderProductChart();
};

const renderCustomerChart = () => {
  if (!customerChartRef.value) return;
  if (!customerChart) {
    customerChart = echarts.init(customerChartRef.value);
  }
  customerChart.setOption({
    color: palette,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data as DashboardCustomerRank & { routeName: string; percent: number };
        return `${params.marker}${params.name}<br/>金额：${money(params.value)}<br/>订单：${data.orderCount || 0} 单<br/>线路：${data.routeName || '-'}<br/>占比：${formatNumber(data.percent)}%`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['56%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        stillShowZeroSum: false,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 18,
            shadowColor: 'rgba(15, 118, 110, 0.22)'
          }
        },
        data: buildCustomerChartData()
      }
    ]
  });
  customerChart.resize();
};

const renderProductChart = () => {
  if (!productChartRef.value) return;
  if (!productChart) {
    productChart = echarts.init(productChartRef.value);
  }
  productChart.setOption({
    color: palette,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data as DashboardProductRank & { amount: number; percent: number };
        return `${params.marker}${params.name}<br/>数量：${formatNumber(params.value)} 件<br/>出货额：${money(data.amount)}<br/>订单：${data.orderCount || 0} 单<br/>占比：${formatNumber(data.percent)}%`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['56%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        stillShowZeroSum: false,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 18,
            shadowColor: 'rgba(15, 118, 110, 0.22)'
          }
        },
        data: buildProductChartData()
      }
    ]
  });
  productChart.resize();
};

const resizeRankCharts = () => {
  todaySalesChart?.resize();
  monthSalesChart?.resize();
  yearSalesChart?.resize();
  customerChart?.resize();
  productChart?.resize();
};

const disposeRankCharts = () => {
  window.removeEventListener('resize', resizeRankCharts);
  todaySalesChart?.dispose();
  monthSalesChart?.dispose();
  yearSalesChart?.dispose();
  customerChart?.dispose();
  productChart?.dispose();
  todaySalesChart = undefined;
  monthSalesChart = undefined;
  yearSalesChart = undefined;
  customerChart = undefined;
  productChart = undefined;
};

const loadSummary = async () => {
  if (rankPeriod.value === 'month' && !rankMonth.value) {
    rankMonth.value = getCurrentMonth();
  }
  rankLoading.value = true;
  try {
    const res = await getDashboardSummary(rankPeriod.value, rankPeriod.value === 'month' ? rankMonth.value : undefined);
    Object.assign(summary, res.data);
    await nextTick();
    renderSparklineCharts();
    renderRankCharts();
  } finally {
    rankLoading.value = false;
  }
};

onMounted(() => {
  rankMonth.value = getCurrentMonth();
  window.addEventListener('resize', resizeRankCharts);
  loadSummary();
});

onUnmounted(() => {
  disposeRankCharts();
});
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: calc(100vh - 84px);
  padding: 16px;
  background: #f5f8f7;
  color: #102a2a;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-panel,
.rank-panel {
  background: #fff;
  border: 1px solid #dbe5e1;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.metric-panel {
  min-height: 128px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 16px;
}

.metric-label,
.metric-meta,
.metric-compare,
.rank-header p,
.rank-main span,
.rank-side span,
.sparkline span,
.chart-center span {
  color: #5b6f6b;
}

.metric-label {
  margin: 0 0 4px;
  font-size: 13px;
}

.metric-value {
  margin: 0 0 8px;
  font-size: 29px;
  line-height: 1;
  font-weight: 800;
  color: #071b1b;
}

.metric-meta,
.metric-compare {
  margin: 3px 0 0;
  font-size: 13px;
}

.metric-compare {
  color: #0f766e;
}

.sparkline {
  width: 112px;
  min-width: 112px;
  text-align: right;
}

.sparkline-chart {
  display: block;
  width: 104px;
  height: 54px;
  margin-left: auto;
}

.sparkline span {
  font-size: 12px;
}

.order-panel {
  padding-right: 20px;
}

.actionable-panel {
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.actionable-panel:hover {
  border-color: #9ccfc4;
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.12);
  transform: translateY(-1px);
}

.order-icon {
  width: 76px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #f0e8ff;
  color: #8b5cf6;
  font-size: 42px;
}

.today-order-dialog {
  min-height: 240px;
}

.today-order-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.today-order-summary div {
  min-height: 70px;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid #dbe5e1;
  border-radius: 6px;
  background: #f7fbfa;
}

.today-order-summary span {
  color: #5b6f6b;
  font-size: 12px;
}

.today-order-summary strong {
  color: #071b1b;
  font-size: 20px;
}

.today-order-collapse {
  border-top: 1px solid #e3ebe8;
}

.today-delivery-title {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 16px;
  color: #334155;
}

.today-delivery-title strong {
  min-width: 90px;
  color: #071b1b;
}

.today-title-spacer {
  flex: 1;
}

.today-action-button {
  height: 28px;
  padding: 0 14px;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.18);
}

.today-print-button {
  height: 28px;
  padding: 0 14px;
  font-weight: 600;
}

.today-customer-table {
  margin: 6px 0 10px;
}

.today-item-table {
  width: calc(100% - 32px);
  margin: 8px 16px 10px;
}

.profit-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.profit-card {
  min-height: 104px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
  border: 1px solid #dbe5e1;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.profit-label {
  margin: 0 0 8px;
  color: #5b6f6b;
  font-size: 13px;
}

.profit-card strong {
  display: block;
  font-size: 28px;
  line-height: 1;
}

.profit-card strong.is-profit {
  color: #005245;
}

.profit-card strong.is-loss {
  color: #dc2626;
}

.profit-meta {
  min-width: 150px;
  display: grid;
  justify-items: end;
  gap: 6px;
  color: #5b6f6b;
  font-size: 12px;
  text-align: right;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.rank-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  padding: 0 2px;
}

.rank-toolbar h2 {
  margin: 0 0 4px;
  font-size: 16px;
  line-height: 1.2;
}

.rank-toolbar p {
  margin: 0;
  color: #5b6f6b;
  font-size: 12px;
}

.rank-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.rank-panel {
  min-height: 420px;
  padding: 18px 22px 20px;
}

.rank-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.rank-header h2 {
  margin: 0 0 6px;
  font-size: 18px;
  line-height: 1.2;
}

.rank-header p {
  margin: 0;
  font-size: 13px;
}

.rank-header strong {
  color: #005245;
  font-size: 20px;
}

.rank-content {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  align-items: center;
  gap: 28px;
}

.donut-wrap {
  display: flex;
  justify-content: center;
}

.echart-donut {
  position: relative;
  width: 170px;
  height: 170px;
}

.rank-chart {
  width: 170px;
  height: 170px;
  cursor: pointer;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  align-content: center;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #fff;
  pointer-events: none;
  text-align: center;
}

.chart-center strong {
  margin-top: 4px;
  color: #005245;
  font-size: 20px;
}

.rank-list {
  max-height: 330px;
  overflow-y: auto;
  padding-right: 10px;
}

.rank-item {
  min-height: 56px;
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e3ebe8;
}

.rank-item i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.rank-main {
  min-width: 0;
}

.rank-main strong,
.rank-main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-main strong {
  font-size: 14px;
}

.rank-main span {
  margin-top: 3px;
  font-size: 12px;
}

.rank-side {
  min-width: 92px;
  text-align: right;
}

.rank-side strong {
  color: #005245;
  font-size: 14px;
}

.rank-side span {
  margin-left: 8px;
  font-size: 12px;
}

.profit-rank-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.profit-rank-panel {
  min-height: 360px;
}

.compact-header {
  margin-bottom: 12px;
}

.compact-header h2 {
  font-size: 17px;
}

.profit-rank-list {
  max-height: 284px;
  overflow-y: auto;
  padding-right: 8px;
}

.profit-rank-item {
  min-height: 66px;
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e3ebe8;
}

.profit-rank-item i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.profit-rank-main {
  min-width: 0;
}

.profit-rank-main strong,
.profit-rank-main span,
.profit-rank-side span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profit-rank-main strong,
.profit-rank-main span {
  display: block;
}

.profit-rank-main strong {
  font-size: 14px;
}

.profit-rank-main span {
  margin-top: 4px;
  color: #5b6f6b;
  font-size: 12px;
}

.profit-rank-side {
  min-width: 96px;
  text-align: right;
}

.profit-rank-side strong,
.profit-rank-side span {
  display: block;
}

.profit-rank-side strong {
  color: #005245;
  font-size: 14px;
}

.profit-rank-side span {
  margin-top: 4px;
  color: #5b6f6b;
  font-size: 12px;
}

@media (max-width: 1280px) {
  .metric-grid,
  .rank-grid,
  .profit-overview,
  .profit-rank-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .route-profit-panel {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .metric-grid,
  .rank-grid,
  .profit-overview,
  .profit-rank-grid,
  .rank-content {
    grid-template-columns: 1fr;
  }

  .route-profit-panel {
    grid-column: auto;
  }

  .rank-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .rank-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .metric-panel {
    min-height: 118px;
  }

  .profit-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .profit-meta {
    justify-items: start;
    text-align: left;
  }

  .today-order-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
