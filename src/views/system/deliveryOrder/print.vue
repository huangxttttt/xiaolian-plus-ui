<template>
  <div class="print-preview">
    <div class="print-toolbar">
      <div>
        <h2>销售单打印预览</h2>
        <p v-if="deliveryData">
          {{ deliveryData.deliveryDate }} · {{ deliveryData.routeName }} · 当前打印 {{ printableOrders.length }} / {{ deliveryData.customerOrders?.length || 0 }} 户
        </p>
      </div>
      <div class="toolbar-actions">
        <el-radio-group v-model="printScope" size="small">
          <el-radio-button label="all">全部客户</el-radio-button>
          <el-radio-button label="selected">选择客户</el-radio-button>
        </el-radio-group>
        <el-select
          v-if="printScope === 'selected'"
          v-model="selectedOrderIds"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择客户"
          style="width: 260px"
        >
          <el-option
            v-for="order in deliveryData?.customerOrders || []"
            :key="String(order.orderId || order.customerId)"
            :label="order.customerName || '-'"
            :value="String(order.orderId || order.customerId)"
          />
        </el-select>
        <el-button icon="Refresh" @click="loadData">刷新</el-button>
        <el-button type="primary" icon="Printer" @click="professionalPrintPage">{{ printScope === 'selected' ? '专业打印选中' : '专业打印全部' }}</el-button>
        <el-button @click="closePage">关闭</el-button>
      </div>
    </div>

    <div v-loading="loading" class="print-body">
      <el-empty v-if="!loading && !deliveryData" description="未找到配货单" />
      <el-empty v-else-if="!loading && !deliveryData?.customerOrders?.length" description="该配货单暂无客户订单" />
      <el-empty v-else-if="!loading && !printablePages.length" description="请选择要打印的客户" />

      <section
        v-for="(page, index) in printablePages"
        :key="page.key"
        class="sale-page"
        :class="{ 'is-last': index === printablePages.length - 1 }"
      >
        <header class="invoice-header">
          <div class="customer-info">
            <p>客户名称：<strong>{{ page.order.customerName || '-' }}</strong></p>
            <p>联系电话：{{ page.order.customerPhone || '' }}</p>
          </div>
          <div class="invoice-title">
            <h1>小莲粮油销售单</h1>
            <p>录单日期：{{ deliveryData?.deliveryDate || '-' }}</p>
            <p>电话：13599653816&nbsp;&nbsp;13605001715</p>
          </div>
          <div class="invoice-meta">
            <p>第 {{ page.pageNo }}/{{ page.pageTotal }} 页</p>
            <p>单据编号：{{ buildOrderNo(page.order) }}</p>
          </div>
        </header>

        <table class="sale-table">
          <thead>
            <tr>
              <th class="code">编号</th>
              <th>货品名称</th>
              <th class="spec">规格</th>
              <th class="unit">单位</th>
              <th class="qty">数量</th>
              <th class="price">单价</th>
              <th class="amount">金额</th>
              <th class="remark-col">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in normalizedItems(page)" :key="item.key">
              <td class="center">{{ item.source ? productCode(item.source, item.absoluteIndex) : '' }}</td>
              <td>{{ item.source?.productName || '' }}</td>
              <td class="center">{{ item.source?.specification || '' }}</td>
              <td class="center">{{ item.source ? unitName(item.source) : '' }}</td>
              <td class="center">{{ item.source ? formatNumber(item.source.quantity) : '' }}</td>
              <td class="center">{{ item.source ? trimAmount(item.source.salePrice) : '' }}</td>
              <td class="center">{{ item.source ? trimAmount(item.source.amount ?? calcItemAmount(item.source)) : '' }}</td>
              <td>{{ item.source?.remark || '' }}</td>
            </tr>
            <tr v-if="page.isLast" class="total-row">
              <td>金额合计</td>
              <td>（大写）</td>
              <td colspan="2">{{ amountInChinese(calcOrderTotal(page.order)) }}</td>
              <td class="center">{{ formatNumber(totalQuantity(page.order)) }}</td>
              <td>（小写）</td>
              <td class="center">{{ trimAmount(calcOrderTotal(page.order)) }}</td>
              <td></td>
            </tr>
            <tr v-else class="total-row">
              <td colspan="7">本客户销售单未完，转下页</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div v-if="page.isLast" class="invoice-footer">
          <div class="signature-row">
            <span>收货人：</span>
          </div>
        </div>
        <div v-else class="invoice-footer continuation-footer">
          <p>续页</p>
        </div>

        <p v-if="page.isLast && (page.order.remark || deliveryData?.remark)" class="remark">备注：{{ page.order.remark || deliveryData?.remark }}</p>
      </section>
    </div>
  </div>
</template>

<script setup name="DeliveryOrderPrint" lang="ts">
import { getDeliveryOrder } from '@/api/system/deliveryOrder';
import { CustomerOrderVO, DeliveryOrderItemVO, DeliveryOrderVO } from '@/api/system/deliveryOrder/types';
import { saveAs } from 'file-saver';

type LodopInstance = {
  PRINT_INITA: (...args: any[]) => void;
  SET_PRINT_PAGESIZE: (...args: any[]) => void;
  ADD_PRINT_HTM: (...args: any[]) => void;
  SET_PRINT_STYLEA?: (...args: any[]) => void;
  SET_PRINT_MODE?: (...args: any[]) => void;
  PREVIEW: () => void;
  PRINT?: () => void;
  NewPageA?: () => void;
};

declare global {
  interface Window {
    getLodop?: (...args: any[]) => LodopInstance;
    CLODOP?: LodopInstance;
    LODOP?: LodopInstance;
  }
}

interface PrintableItem {
  key: string;
  source?: DeliveryOrderItemVO;
  absoluteIndex: number;
}

interface PrintablePage {
  key: string;
  order: CustomerOrderVO;
  items: DeliveryOrderItemVO[];
  pageNo: number;
  pageTotal: number;
  startIndex: number;
  isLast: boolean;
}

const route = useRoute();
const loading = ref(false);
const deliveryData = ref<DeliveryOrderVO>();
const printScope = ref<'all' | 'selected'>('all');
const selectedOrderIds = ref<string[]>([]);
const detailRowsPerPage = 8;

const orderKey = (order: CustomerOrderVO) => String(order.orderId || order.customerId);

const printableOrders = computed(() => {
  const orders = deliveryData.value?.customerOrders || [];
  if (printScope.value === 'all') {
    return orders;
  }
  const selected = new Set(selectedOrderIds.value);
  return orders.filter((order) => selected.has(orderKey(order)));
});

const printablePages = computed<PrintablePage[]>(() => {
  return printableOrders.value.flatMap((order) => {
    const items = order.items || [];
    const pageTotal = Math.max(Math.ceil(items.length / detailRowsPerPage), 1);
    return Array.from({ length: pageTotal }, (_, pageIndex) => {
      const startIndex = pageIndex * detailRowsPerPage;
      return {
        key: `${orderKey(order)}-${pageIndex + 1}`,
        order,
        items: items.slice(startIndex, startIndex + detailRowsPerPage),
        pageNo: pageIndex + 1,
        pageTotal,
        startIndex,
        isLast: pageIndex + 1 === pageTotal
      };
    });
  });
});

const formatAmount = (value?: number) => {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const trimAmount = (value?: number) => {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const formatNumber = (value?: number) => {
  const num = Number(value || 0);
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2
  });
};

const productCode = (item: DeliveryOrderItemVO, index: number) => {
  const value = item.productId || item.itemId || index + 1;
  return String(value).padStart(4, '0').slice(-4);
};

const unitName = (item: DeliveryOrderItemVO) => {
  const name = item.productName || '';
  if (name.includes('油')) return '桶';
  if (name.includes('米') || name.includes('糖')) return '袋';
  return '件';
};

const buildOrderNo = (order: CustomerOrderVO) => {
  const date = (deliveryData.value?.deliveryDate || '').slice(5).replace('-', '');
  return `XS-${date}-${String(order.orderId || order.customerId || '').padStart(5, '0')}`;
};

const normalizedItems = (page: PrintablePage): PrintableItem[] => {
  const items = page.items.map((item, index) => ({
    key: String(item.itemId || `${item.productId}-${index}`),
    source: item,
    absoluteIndex: page.startIndex + index
  }));
  const blankRows = Math.max(detailRowsPerPage - items.length, 0);
  return items.concat(
    Array.from({ length: blankRows }, (_, index) => ({
      key: `blank-${page.key}-${index}`,
      absoluteIndex: page.startIndex + items.length + index
    }))
  );
};

const totalQuantity = (order: CustomerOrderVO) => {
  return order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
};

const amountInChinese = (value?: number) => {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const sections = ['', '万', '亿'];
  const integer = Math.floor(Number(value || 0));
  if (!integer) return '零元整';

  const sectionToChinese = (section: number) => {
    let str = '';
    let unitIndex = 0;
    let zero = true;
    while (section > 0) {
      const digit = section % 10;
      if (digit === 0) {
        if (!zero) {
          zero = true;
          str = digits[0] + str;
        }
      } else {
        zero = false;
        str = digits[digit] + units[unitIndex] + str;
      }
      unitIndex += 1;
      section = Math.floor(section / 10);
    }
    return str;
  };

  let num = integer;
  let sectionIndex = 0;
  let result = '';
  let needZero = false;
  while (num > 0) {
    const section = num % 10000;
    if (section) {
      const sectionText = sectionToChinese(section) + sections[sectionIndex];
      result = (needZero ? digits[0] : '') + sectionText + result;
      needZero = section < 1000;
    } else if (result) {
      needZero = true;
    }
    sectionIndex += 1;
    num = Math.floor(num / 10000);
  }
  return `${result}元整`;
};

const calcItemAmount = (item: DeliveryOrderItemVO) => Number(item.quantity || 0) * Number(item.salePrice || 0);

const calcOrderTotal = (order: CustomerOrderVO) => {
  return order.items?.reduce((sum, item) => sum + Number(item.amount ?? calcItemAmount(item)), 0) || 0;
};

const escapeHtml = (value?: string | number) => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(value ?? '').replace(/[&<>"']/g, (char) => map[char]);
};

const renderPrintRows = (page: PrintablePage) => {
  const rows = normalizedItems(page)
    .map((item) => {
      const source = item.source;
      return `
        <tr>
          <td class="center">${source ? escapeHtml(productCode(source, item.absoluteIndex)) : ''}</td>
          <td>${source ? escapeHtml(source.productName) : ''}</td>
          <td class="center">${source ? escapeHtml(source.specification) : ''}</td>
          <td class="center">${source ? escapeHtml(unitName(source)) : ''}</td>
          <td class="center">${source ? escapeHtml(formatNumber(source.quantity)) : ''}</td>
          <td class="center">${source ? escapeHtml(trimAmount(source.salePrice)) : ''}</td>
          <td class="center">${source ? escapeHtml(trimAmount(source.amount ?? calcItemAmount(source))) : ''}</td>
          <td>${source ? escapeHtml(source.remark) : ''}</td>
        </tr>
      `;
    })
    .join('');

  const totalRow = page.isLast
    ? `
      <tr class="total-row">
        <td>金额合计</td>
        <td>（大写）</td>
        <td colspan="2">${escapeHtml(amountInChinese(calcOrderTotal(page.order)))}</td>
        <td class="center">${escapeHtml(formatNumber(totalQuantity(page.order)))}</td>
        <td>（小写）</td>
        <td class="center">${escapeHtml(trimAmount(calcOrderTotal(page.order)))}</td>
        <td></td>
      </tr>
    `
    : `
      <tr class="total-row">
        <td colspan="7">本客户销售单未完，转下页</td>
        <td></td>
      </tr>
    `;

  return `${rows}${totalRow}`;
};

const renderPrintPage = (page: PrintablePage) => {
  const remark = page.isLast && (page.order.remark || deliveryData.value?.remark) ? `<p class="remark">备注：${escapeHtml(page.order.remark || deliveryData.value?.remark)}</p>` : '';
  const footer = page.isLast
    ? '<div class="invoice-footer"><div class="signature-row"><span>收货人：</span></div></div>'
    : '<div class="invoice-footer continuation-footer"><p>续页</p></div>';

  return `
    <section class="sale-page">
      <table class="invoice-head-table">
        <tbody>
          <tr>
            <td class="customer-info">
              <p>客户名称：<strong>${escapeHtml(page.order.customerName || '-')}</strong></p>
              <p>联系电话：${escapeHtml(page.order.customerPhone)}</p>
            </td>
            <td class="invoice-title">
              <h1>小莲粮油销售单</h1>
              <p>录单日期：${escapeHtml(deliveryData.value?.deliveryDate || '-')}</p>
              <p>电话：13599653816&nbsp;&nbsp;13605001715</p>
            </td>
            <td class="invoice-meta">
              <p>第 ${page.pageNo}/${page.pageTotal} 页</p>
              <p>单据编号：${escapeHtml(buildOrderNo(page.order))}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <table class="sale-table">
        <thead>
          <tr>
            <th class="code">编号</th>
            <th>货品名称</th>
            <th class="spec">规格</th>
            <th class="unit">单位</th>
            <th class="qty">数量</th>
            <th class="price">单价</th>
            <th class="amount">金额</th>
            <th class="remark-col">备注</th>
          </tr>
        </thead>
        <tbody>${renderPrintRows(page)}</tbody>
      </table>
      ${footer}
      ${remark}
    </section>
  `;
};

const lodopPrintStyle = `
  * {
    box-sizing: border-box;
  }

  body {
    width: 241mm;
    height: 134mm;
    margin: 0;
    padding: 0;
    color: #1e3f7a;
    background: #fff;
    font-family: 'KaiTi', 'SimSun', serif;
  }

  .invoice-head-table {
    width: 100%;
    margin: 0 0 3px;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .invoice-head-table td {
    padding: 0;
    border: 0;
    vertical-align: top;
  }

  .sale-page {
    width: 241mm;
    height: 134mm;
    margin: 0;
    padding: 4mm 8mm 2mm;
    overflow: hidden;
    background: #fffef6;
    color: #1e3f7a;
  }

  .customer-info p,
  .invoice-title p,
  .invoice-meta p {
    margin: 0 0 3px;
    font-size: 13px;
    line-height: 1.1;
  }

  .customer-info strong {
    font-weight: 700;
  }

  .invoice-title {
    text-align: center;
  }

  .invoice-title h1 {
    margin: 0 0 5px;
    font-size: 22px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0;
  }

  .invoice-meta {
    text-align: right;
  }

  .sale-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    color: #1e3f7a;
    font-size: 13px;
  }

  .sale-table th,
  .sale-table td {
    height: 6.3mm;
    padding: 1px 4px;
    border: 1px solid #4f66a3;
    line-height: 1.05;
    text-align: left;
    vertical-align: middle;
  }

  .sale-table th {
    height: 5.8mm;
    font-weight: 700;
    text-align: center;
  }

  .sale-table .code {
    width: 13mm;
  }

  .sale-table .spec {
    width: 26mm;
  }

  .sale-table .unit {
    width: 12mm;
  }

  .sale-table .qty {
    width: 13mm;
  }

  .sale-table .price {
    width: 16mm;
  }

  .sale-table .amount {
    width: 18mm;
  }

  .sale-table .remark-col {
    width: 25mm;
  }

  .center {
    text-align: center !important;
  }

  .total-row td {
    height: 6.2mm;
    font-weight: 700;
  }

  .invoice-footer {
    font-size: 13px;
  }

  .signature-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 3px;
  }

  .signature-row span {
    display: block;
    width: 68mm;
    min-height: 7mm;
  }

  .remark {
    margin: 2px 0 0;
    font-size: 12px;
  }
`;

const renderLodopHtml = (page: PrintablePage) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>${lodopPrintStyle}</style>
    </head>
    <body>${renderPrintPage(page)}</body>
  </html>
`;

const loadLodopScript = (src: string) => {
  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    let done = false;
    const finish = (success: boolean) => {
      if (done) return;
      done = true;
      resolve(success);
    };
    script.src = src;
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    document.body.appendChild(script);
    window.setTimeout(() => finish(false), 1500);
  });
};

const getLodopInstance = async () => {
  if (window.getLodop) return window.getLodop();
  if (window.CLODOP) return window.CLODOP;
  if (window.LODOP) return window.LODOP;

  const scriptUrls = ['http://localhost:8000/CLodopfuncs.js', 'http://localhost:18000/CLodopfuncs.js'];
  for (const url of scriptUrls) {
    await loadLodopScript(url);
    if (window.getLodop) return window.getLodop();
    if (window.CLODOP) return window.CLODOP;
    if (window.LODOP) return window.LODOP;
  }
  return undefined;
};

const showLodopInstallGuide = async () => {
  try {
    await ElMessageBox.confirm(
      `
        <div style="line-height: 1.8; text-align: left;">
          <p style="margin: 0 0 8px;">当前电脑未检测到 C-Lodop/LODOP 本地打印服务。</p>
          <p style="margin: 0;">针式连续纸需要本地打印服务控制纸张、方向和走纸，浏览器无法静默自动安装。</p>
          <p style="margin: 8px 0 0;">安装并启动后，重新点击“专业打印”即可。</p>
        </div>
      `,
      '需要安装打印服务',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '去下载安装',
        cancelButtonText: '稍后处理',
        type: 'warning'
      }
    );
    window.open('http://www.lodop.net/download.html', '_blank');
  } catch {
    // 用户选择稍后处理时不需要额外提示。
  }
};

const professionalPrintPage = async () => {
  const pages = printablePages.value;
  if (!pages.length) return;

  const lodop = await getLodopInstance();
  if (!lodop) {
    await showLodopInstallGuide();
    return;
  }

  lodop.PRINT_INITA(0, 0, '241mm', '140mm', '小莲粮油销售单');
  lodop.SET_PRINT_PAGESIZE(1, 2410, 1400, '二联二等分241x140');
  lodop.SET_PRINT_MODE?.('PRINT_PAGE_PERCENT', 'Full-Width');

  pages.forEach((page, index) => {
    if (index > 0) {
      lodop.NewPageA?.();
    }
    lodop.ADD_PRINT_HTM('5mm', '0mm', '241mm', '134mm', renderLodopHtml(page));
    lodop.SET_PRINT_STYLEA?.(0, 'Horient', 1);
    lodop.SET_PRINT_STYLEA?.(0, 'Vorient', 1);
  });

  lodop.PREVIEW();
};

const excelSheetName = (page: PrintablePage, index: number) => {
  const rawName = `${page.order.customerName || '客户'}-${page.pageNo}`.replace(/[\\/?*\[\]:]/g, '').slice(0, 26);
  return `${rawName || '销售单'}${index + 1}`;
};

const excelCell = (value?: string | number, styleId = 'text', mergeAcross?: number) => {
  const type = typeof value === 'number' ? 'Number' : 'String';
  const merge = mergeAcross ? ` ss:MergeAcross="${mergeAcross}"` : '';
  return `<Cell ss:StyleID="${styleId}"${merge}><Data ss:Type="${type}">${escapeHtml(value)}</Data></Cell>`;
};

const excelBlankCell = (styleId = 'grid') => `<Cell ss:StyleID="${styleId}"><Data ss:Type="String"></Data></Cell>`;

const renderExcelRows = (page: PrintablePage) => {
  const itemRows = normalizedItems(page)
    .map((item) => {
      const source = item.source;
      if (!source) {
        return `<Row ss:Height="24">${Array.from({ length: 8 }, () => excelBlankCell()).join('')}</Row>`;
      }
      return `
        <Row ss:Height="24">
          ${excelCell(productCode(source, item.absoluteIndex), 'centerGrid')}
          ${excelCell(source.productName, 'grid')}
          ${excelCell(source.specification, 'centerGrid')}
          ${excelCell(unitName(source), 'centerGrid')}
          ${excelCell(Number(source.quantity || 0), 'numberGrid')}
          ${excelCell(Number(source.salePrice || 0), 'numberGrid')}
          ${excelCell(Number(source.amount ?? calcItemAmount(source)), 'numberGrid')}
          ${excelCell(source.remark, 'grid')}
        </Row>
      `;
    })
    .join('');

  const totalRow = page.isLast
    ? `
      <Row ss:Height="26">
        ${excelCell('金额合计', 'totalGrid')}
        ${excelCell('（大写）', 'totalGrid')}
        ${excelCell(amountInChinese(calcOrderTotal(page.order)), 'totalGrid', 1)}
        ${excelCell(Number(totalQuantity(page.order)), 'totalNumberGrid')}
        ${excelCell('（小写）', 'totalGrid')}
        ${excelCell(Number(calcOrderTotal(page.order)), 'totalNumberGrid')}
        ${excelBlankCell('totalGrid')}
      </Row>
    `
    : `
      <Row ss:Height="26">
        ${excelCell('本客户销售单未完，转下页', 'totalGrid', 6)}
        ${excelBlankCell('totalGrid')}
      </Row>
    `;

  return `${itemRows}${totalRow}`;
};

const renderExcelWorksheet = (page: PrintablePage, index: number) => {
  const remark = page.isLast && (page.order.remark || deliveryData.value?.remark) ? page.order.remark || deliveryData.value?.remark : '';
  return `
    <Worksheet ss:Name="${escapeHtml(excelSheetName(page, index))}">
      <Table ss:ExpandedColumnCount="8" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="22">
        <Column ss:Width="46" />
        <Column ss:Width="155" />
        <Column ss:Width="110" />
        <Column ss:Width="48" />
        <Column ss:Width="54" />
        <Column ss:Width="64" />
        <Column ss:Width="76" />
        <Column ss:Width="118" />
        <Row ss:Height="28">
          ${excelCell(`客户名称：${page.order.customerName || '-'}`, 'headLeft', 1)}
          ${excelCell('小莲粮油销售单', 'title', 3)}
          ${excelCell(`第 ${page.pageNo}/${page.pageTotal} 页`, 'headRight', 1)}
        </Row>
        <Row ss:Height="22">
          ${excelCell(`联系电话：${page.order.customerPhone || ''}`, 'headLeft', 1)}
          ${excelCell(`录单日期：${deliveryData.value?.deliveryDate || '-'}`, 'headCenter', 3)}
          ${excelCell(`单据编号：${buildOrderNo(page.order)}`, 'headRight', 1)}
        </Row>
        <Row ss:Height="22">
          ${excelBlankCell('plain')}
          ${excelBlankCell('plain')}
          ${excelCell('电话：13599653816  13605001715', 'headCenter', 3)}
          ${excelBlankCell('plain')}
          ${excelBlankCell('plain')}
        </Row>
        <Row ss:Height="6">${Array.from({ length: 8 }, () => excelBlankCell('plain')).join('')}</Row>
        <Row ss:Height="24">
          ${excelCell('编号', 'tableHead')}
          ${excelCell('货品名称', 'tableHead')}
          ${excelCell('规格', 'tableHead')}
          ${excelCell('单位', 'tableHead')}
          ${excelCell('数量', 'tableHead')}
          ${excelCell('单价', 'tableHead')}
          ${excelCell('金额', 'tableHead')}
          ${excelCell('备注', 'tableHead')}
        </Row>
        ${renderExcelRows(page)}
        <Row ss:Height="22">
          ${excelBlankCell('plain')}
          ${excelBlankCell('plain')}
          ${excelBlankCell('plain')}
          ${excelBlankCell('plain')}
          ${excelBlankCell('plain')}
          ${excelCell('收货人：', 'headCenter', 2)}
          ${excelBlankCell('plain')}
        </Row>
        <Row ss:Height="22">
          ${excelCell(remark ? `备注：${remark}` : '', 'plain', 7)}
        </Row>
      </Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
        <PageSetup>
          <Layout x:Orientation="Landscape" />
          <Header x:Margin="0" />
          <Footer x:Margin="0" />
          <PageMargins x:Bottom="0.15" x:Left="0.15" x:Right="0.15" x:Top="0.15" />
        </PageSetup>
        <Print>
          <ValidPrinterInfo />
          <FitWidth>1</FitWidth>
          <FitHeight>1</FitHeight>
          <HorizontalResolution>600</HorizontalResolution>
          <VerticalResolution>600</VerticalResolution>
        </Print>
        <Selected />
        <Panes />
        <ProtectObjects>False</ProtectObjects>
        <ProtectScenarios>False</ProtectScenarios>
      </WorksheetOptions>
    </Worksheet>
  `;
};

const exportExcelPrint = () => {
  const pages = printablePages.value;
  if (!pages.length) return;

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
        <Author>小莲粮油</Author>
      </DocumentProperties>
      <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
        <WindowHeight>9000</WindowHeight>
        <WindowWidth>16000</WindowWidth>
        <ProtectStructure>False</ProtectStructure>
        <ProtectWindows>False</ProtectWindows>
      </ExcelWorkbook>
      <Styles>
        <Style ss:ID="plain">
          <Font ss:FontName="宋体" ss:Size="11" ss:Color="#1E3F7A" />
        </Style>
        <Style ss:ID="text">
          <Font ss:FontName="宋体" ss:Size="11" ss:Color="#1E3F7A" />
          <Alignment ss:Vertical="Center" />
        </Style>
        <Style ss:ID="headLeft">
          <Font ss:FontName="宋体" ss:Size="12" ss:Bold="1" ss:Color="#1E3F7A" />
          <Alignment ss:Vertical="Center" />
        </Style>
        <Style ss:ID="headCenter">
          <Font ss:FontName="宋体" ss:Size="12" ss:Bold="1" ss:Color="#1E3F7A" />
          <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
        </Style>
        <Style ss:ID="headRight">
          <Font ss:FontName="宋体" ss:Size="12" ss:Bold="1" ss:Color="#1E3F7A" />
          <Alignment ss:Horizontal="Right" ss:Vertical="Center" />
        </Style>
        <Style ss:ID="title">
          <Font ss:FontName="宋体" ss:Size="20" ss:Bold="1" ss:Color="#1E3F7A" />
          <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
        </Style>
        <Style ss:ID="grid">
          <Font ss:FontName="宋体" ss:Size="11" ss:Color="#1E3F7A" />
          <Alignment ss:Vertical="Center" ss:WrapText="1" />
          <Borders>
            <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F66A3" />
            <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F66A3" />
            <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F66A3" />
            <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F66A3" />
          </Borders>
        </Style>
        <Style ss:ID="centerGrid" ss:Parent="grid">
          <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" />
        </Style>
        <Style ss:ID="numberGrid" ss:Parent="grid">
          <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
          <NumberFormat ss:Format="0.##" />
        </Style>
        <Style ss:ID="tableHead" ss:Parent="centerGrid">
          <Font ss:FontName="宋体" ss:Size="12" ss:Bold="1" ss:Color="#1E3F7A" />
        </Style>
        <Style ss:ID="totalGrid" ss:Parent="grid">
          <Font ss:FontName="宋体" ss:Size="11" ss:Bold="1" ss:Color="#1E3F7A" />
          <Alignment ss:Vertical="Center" ss:WrapText="1" />
        </Style>
        <Style ss:ID="totalNumberGrid" ss:Parent="numberGrid">
          <Font ss:FontName="宋体" ss:Size="11" ss:Bold="1" ss:Color="#1E3F7A" />
        </Style>
      </Styles>
      ${pages.map(renderExcelWorksheet).join('')}
    </Workbook>`;

  const blob = new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
  saveAs(blob, `小莲粮油销售单_${deliveryData.value?.deliveryDate || new Date().getTime()}.xls`);
};

const loadData = async () => {
  const deliveryId = route.params.deliveryId as string;
  if (!deliveryId) return;
  loading.value = true;
  try {
    const res = await getDeliveryOrder(deliveryId);
    deliveryData.value = res.data;
    const queryOrderId = route.query.orderId;
    const queryOrderIds = Array.isArray(queryOrderId) ? queryOrderId : queryOrderId ? [queryOrderId] : [];
    if (queryOrderIds.length) {
      printScope.value = 'selected';
      selectedOrderIds.value = queryOrderIds.map(String);
    }
  } finally {
    loading.value = false;
  }
};

const printPage = () => {
  const pages = printablePages.value;
  if (!pages.length) return;

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  document.body.appendChild(printFrame);

  const printStyle = `
    @page {
      size: 241mm 140mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 241mm;
      height: auto;
      min-height: 0;
      margin: 0;
      padding: 0;
      background: #fff;
    }

    body {
      color: #1e3f7a;
      font-family: 'KaiTi', 'SimSun', serif;
    }

    .invoice-head-table {
      width: 100%;
      margin: 0 0 3px;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .invoice-head-table td {
      padding: 0;
      border: 0;
      vertical-align: top;
    }

    .sale-page {
      width: 241mm;
      height: 140mm;
      margin: 0;
      padding: 5mm 8mm 3mm;
      overflow: hidden;
      background: #fffef6;
      color: #1e3f7a;
      page-break-after: auto;
      page-break-inside: avoid;
      break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sale-page + .sale-page {
      page-break-before: always;
    }

    .invoice-header {
      display: grid;
      grid-template-columns: 1fr 1.3fr 1fr;
      align-items: start;
      gap: 12px;
      margin-bottom: 3px;
    }

    .customer-info p,
    .invoice-title p,
    .invoice-meta p {
      margin: 0 0 3px;
      font-size: 13px;
      line-height: 1.1;
    }

    .customer-info strong {
      font-weight: 700;
    }

    .invoice-title {
      text-align: center;
    }

    .invoice-title h1 {
      margin: 0 0 5px;
      font-size: 22px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: 0;
    }

    .invoice-meta {
      text-align: right;
    }

    .sale-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      color: #1e3f7a;
      font-size: 13px;
    }

    .sale-table th,
    .sale-table td {
      height: 6.3mm;
      padding: 1px 4px;
      border: 1px solid #4f66a3;
      line-height: 1.05;
      text-align: left;
      vertical-align: middle;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .sale-table th {
      height: 5.8mm;
      font-weight: 700;
      text-align: center;
    }

    .sale-table .code {
      width: 13mm;
    }

    .sale-table .spec {
      width: 26mm;
    }

    .sale-table .unit {
      width: 12mm;
    }

    .sale-table .qty {
      width: 13mm;
    }

    .sale-table .price {
      width: 16mm;
    }

    .sale-table .amount {
      width: 18mm;
    }

    .sale-table .remark-col {
      width: 25mm;
    }

    .center {
      text-align: center !important;
    }

    .total-row td {
      height: 6.2mm;
      font-weight: 700;
    }

    .invoice-footer {
      font-size: 13px;
    }

    .signature-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 3px;
    }

    .signature-row span {
      display: block;
      width: 68mm;
      min-height: 7mm;
    }

    .continuation-footer {
      min-height: 12mm;
    }

    .remark {
      margin: 2px 0 0;
      font-size: 12px;
    }
  `;

  const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!printDocument) {
    printFrame.remove();
    return;
  }

  printDocument.open();
  printDocument.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title></title>
        <style>${printStyle}</style>
      </head>
      <body>
        ${pages.map(renderPrintPage).join('')}
      </body>
    </html>
  `);
  printDocument.close();

  window.setTimeout(() => {
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    window.setTimeout(() => {
      printFrame.remove();
    }, 1000);
  }, 100);
};

const closePage = () => {
  window.close();
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.print-preview {
  min-height: 100vh;
  background: #eef3f2;
  color: #1e3f7a;
}

.print-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid #d9e2df;
  background: #fff;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.08);
  color: #111827;
}

.print-toolbar h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.print-toolbar p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-body {
  padding: 24px;
}

.sale-page {
  width: 241mm;
  min-height: 140mm;
  margin: 0 auto 18px;
  padding: 9mm 11mm 8mm;
  box-sizing: border-box;
  background: #fffef6;
  border: 1px solid #8ea0ca;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  font-family: 'KaiTi', 'SimSun', serif;
}

.sale-page + .sale-page {
  page-break-before: always;
}

.invoice-header {
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr;
  align-items: start;
  gap: 12px;
  margin-bottom: 4px;
}

.customer-info p,
.invoice-title p,
.invoice-meta p {
  margin: 0 0 5px;
  font-size: 17px;
  line-height: 1.2;
}

.customer-info strong {
  font-weight: 700;
}

.invoice-title {
  text-align: center;
}

.invoice-title h1 {
  margin: 0 0 8px;
  font-size: 30px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0;
}

.invoice-meta {
  text-align: right;
}

.sale-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: #1e3f7a;
  font-size: 17px;
}

.sale-table th,
.sale-table td {
  height: 7.2mm;
  padding: 2px 6px;
  border: 1px solid #4f66a3;
  line-height: 1.15;
  text-align: left;
  vertical-align: middle;
}

.sale-table th {
  height: 7mm;
  font-weight: 700;
  text-align: center;
}

.sale-table .code {
  width: 13mm;
}

.sale-table .spec {
  width: 26mm;
}

.sale-table .unit {
  width: 12mm;
}

.sale-table .qty {
  width: 13mm;
}

.sale-table .price {
  width: 16mm;
}

.sale-table .amount {
  width: 18mm;
}

.sale-table .remark-col {
  width: 25mm;
}

.center {
  text-align: center !important;
}

.total-row td {
  height: 7.2mm;
  font-weight: 700;
}

.invoice-footer {
  font-size: 18px;
}

.invoice-footer p {
  margin: 7px 0 0;
  font-weight: 700;
}

.signature-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}

.signature-row span {
  display: block;
  width: 68mm;
  min-height: 7mm;
}

.continuation-footer {
  min-height: 20mm;
}

.remark {
  margin: 4px 0 0;
  font-size: 15px;
}

@media print {
  @page {
    size: 241mm 140mm;
    margin: 0;
  }

  :global(html),
  :global(body) {
    width: 241mm;
    height: auto;
    min-height: 0 !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  :global(#app),
  :global(.app-wrapper),
  :global(.main-container),
  :global(.app-main) {
    width: auto !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  :global(.fixed-header),
  :global(.sidebar-container),
  :global(#tags-view-container) {
    display: none !important;
  }

  :global(.fixed-header + .app-main),
  :global(.hasTagsView .app-main) {
    padding-top: 0 !important;
    min-height: 0 !important;
  }

  .print-preview {
    width: 241mm;
    min-height: 0;
    height: auto;
    margin: 0;
    padding: 0;
    background: #fff;
    overflow: visible;
  }

  .print-toolbar {
    display: none;
  }

  .print-body {
    width: 241mm;
    padding: 0;
    overflow: visible;
  }

  .sale-page {
    width: 241mm;
    height: 140mm;
    max-width: none;
    min-height: 0;
    margin: 0;
    padding: 5mm 8mm 3mm;
    box-sizing: border-box;
    overflow: hidden;
    border: 0;
    box-shadow: none;
    page-break-before: auto;
    page-break-after: auto;
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .sale-page + .sale-page {
    page-break-before: always;
  }

  .invoice-header {
    margin-bottom: 3px;
  }

  .customer-info p,
  .invoice-title p,
  .invoice-meta p {
    margin-bottom: 3px;
    font-size: 13px;
    line-height: 1.1;
  }

  .invoice-title h1 {
    margin-bottom: 5px;
    font-size: 22px;
  }

  .sale-table {
    font-size: 13px;
  }

  .sale-table th,
  .sale-table td {
    height: 6.3mm;
    padding: 1px 4px;
    line-height: 1.05;
  }

  .sale-table th {
    height: 5.8mm;
  }

  .total-row td {
    height: 6.2mm;
  }

  .invoice-footer {
    font-size: 13px;
  }

  .signature-row {
    margin-top: 3px;
  }

  .remark {
    margin-top: 2px;
    font-size: 12px;
  }

  .sale-table,
  .sale-table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
</style>
