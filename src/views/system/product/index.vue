<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="商品名称" prop="productName">
              <el-input v-model="queryParams.productName" placeholder="请输入商品名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="商品大类" prop="categoryId">
              <el-select v-model="queryParams.categoryId" placeholder="请选择商品大类" clearable filterable style="width: 200px">
                <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.categoryId" />
              </el-select>
            </el-form-item>
            <el-form-item label="商品规格" prop="specification">
              <el-input v-model="queryParams.specification" placeholder="请输入商品规格" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="提供商" prop="supplier">
              <el-input v-model="queryParams.supplier" placeholder="请输入商品提供商" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:product:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:product:edit']">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:product:remove']">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['system:product:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="productList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="商品名称" align="center" prop="productName" min-width="140" />
        <el-table-column label="商品大类" align="center" prop="categoryName" min-width="120" />
        <el-table-column label="单位" align="center" prop="unit" width="90" />
        <el-table-column label="商品规格" align="center" prop="specification" min-width="120" />
        <el-table-column label="商品提供商" align="center" prop="supplier" min-width="140" />
        <el-table-column label="最近销售金额" align="center" prop="latestSaleAmount" width="130" />
        <el-table-column label="销售成本价格" align="center" prop="latestCostPrice" width="130" />
        <el-table-column label="备注" align="center" prop="remark" min-width="140" />
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="价格走势" placement="top">
              <el-button
                link
                type="primary"
                icon="TrendCharts"
                @click="handlePriceTrend(scope.row)"
                v-hasPermi="['system:product:query']"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:product:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:product:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="560px" append-to-body>
      <el-form ref="productFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="form.productName" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品大类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择商品大类" filterable style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.categoryId" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品规格" prop="specification">
          <el-input v-model="form.specification" placeholder="请输入商品规格" />
        </el-form-item>
        <el-form-item label="商品提供商" prop="supplier">
          <el-input v-model="form.supplier" placeholder="请输入商品提供商" />
        </el-form-item>
        <el-form-item label="最近销售金额" prop="latestSaleAmount">
          <el-input-number v-model="form.latestSaleAmount" :precision="2" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="销售成本价格" prop="latestCostPrice">
          <el-input-number v-model="form.latestCostPrice" :precision="2" :min="0" controls-position="right" style="width: 100%" />
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

    <el-dialog :title="priceDialog.title" v-model="priceDialog.visible" width="900px" append-to-body @closed="disposePriceChart">
      <el-descriptions v-if="priceProduct" :column="4" border>
        <el-descriptions-item label="商品名称">{{ priceProduct.productName }}</el-descriptions-item>
        <el-descriptions-item label="商品规格">{{ priceProduct.specification }}</el-descriptions-item>
        <el-descriptions-item label="提供商">{{ priceProduct.supplier }}</el-descriptions-item>
        <el-descriptions-item label="商品大类">{{ priceProduct.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ priceProduct.unit }}</el-descriptions-item>
      </el-descriptions>

      <el-form class="mt-3" :inline="true">
        <el-form-item label="记录日期">
          <el-date-picker
            v-model="priceDateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handlePriceQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetPriceQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-empty v-if="!priceRecords.length" description="暂无价格记录" />
      <div v-show="priceRecords.length" ref="priceChartRef" style="height: 420px; width: 100%"></div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="priceDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Product" lang="ts">
import * as echarts from 'echarts';
import { listProduct, getProduct, delProduct, addProduct, updateProduct, listProductPriceHistory } from '@/api/system/product';
import { ProductVO, ProductQuery, ProductForm, ProductPriceRecordVO } from '@/api/system/product/types';
import { listProductCategoryOptions } from '@/api/system/productCategory';
import { ProductCategoryVO } from '@/api/system/productCategory/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const productList = ref<ProductVO[]>([]);
const categoryOptions = ref<ProductCategoryVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const priceProduct = ref<ProductVO>();
const priceRecords = ref<ProductPriceRecordVO[]>([]);
const priceDateRange = ref<string[]>([]);

const queryFormRef = ref<ElFormInstance>();
const productFormRef = ref<ElFormInstance>();
const priceChartRef = ref<HTMLElement>();
let priceChart: echarts.ECharts | undefined;

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const priceDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ProductForm = {
  productId: undefined,
  categoryId: undefined,
  productName: undefined,
  specification: undefined,
  supplier: undefined,
  latestSaleAmount: undefined,
  latestCostPrice: undefined,
  remark: undefined
};

const data = reactive<PageData<ProductForm, ProductQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    categoryId: undefined,
    productName: undefined,
    specification: undefined,
    supplier: undefined,
    params: {}
  },
  rules: {
    productName: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }],
    categoryId: [{ required: true, message: '商品大类不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getCategoryOptions = async () => {
  const res = await listProductCategoryOptions();
  categoryOptions.value = res.data;
};

const getList = async () => {
  loading.value = true;
  const res = await listProduct(queryParams.value);
  productList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  productFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: ProductVO[]) => {
  ids.value = selection.map((item) => item.productId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加商品';
};

const handleUpdate = async (row?: ProductVO) => {
  reset();
  const _productId = row?.productId || ids.value[0];
  const res = await getProduct(_productId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改商品';
};

const handlePriceTrend = async (row: ProductVO) => {
  priceProduct.value = row;
  priceDateRange.value = [];
  priceDialog.title = `${row.productName} 价格走势`;
  priceDialog.visible = true;
  await getPriceHistory();
};

const getPriceHistory = async () => {
  if (!priceProduct.value?.productId) {
    return;
  }
  const res = await listProductPriceHistory(priceProduct.value.productId, {
    beginDate: priceDateRange.value?.[0],
    endDate: priceDateRange.value?.[1]
  });
  priceRecords.value = res.data || [];
  await nextTick();
  renderPriceChart();
};

const handlePriceQuery = async () => {
  await getPriceHistory();
};

const resetPriceQuery = async () => {
  priceDateRange.value = [];
  await getPriceHistory();
};

const renderPriceChart = () => {
  if (!priceChartRef.value || !priceRecords.value.length) {
    disposePriceChart();
    return;
  }
  if (!priceChart) {
    priceChart = echarts.init(priceChartRef.value);
    window.addEventListener('resize', resizePriceChart);
  }
  priceChart.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => Number(value || 0).toFixed(2)
    },
    legend: {
      top: 0,
      data: ['销售价', '成本价']
    },
    grid: {
      left: 48,
      right: 24,
      top: 48,
      bottom: 36
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: priceRecords.value.map((item) => item.recordDate)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => Number(value || 0).toFixed(2)
      }
    },
    series: [
      {
        name: '销售价',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: priceRecords.value.map((item) => Number(item.saleAmount || 0))
      },
      {
        name: '成本价',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: priceRecords.value.map((item) => Number(item.costPrice || 0))
      }
    ]
  });
  priceChart.resize();
};

const resizePriceChart = () => {
  priceChart?.resize();
};

const disposePriceChart = () => {
  if (priceChart) {
    window.removeEventListener('resize', resizePriceChart);
    priceChart.dispose();
    priceChart = undefined;
  }
};

const submitForm = () => {
  productFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.productId) {
        await updateProduct(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addProduct(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: ProductVO) => {
  const _productIds = row?.productId || ids.value;
  await proxy?.$modal.confirm('是否确认删除商品编号为"' + _productIds + '"的数据项？').finally(() => (loading.value = false));
  await delProduct(_productIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download(
    'system/product/export',
    {
      ...queryParams.value
    },
    `product_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getCategoryOptions();
  getList();
});

onUnmounted(() => {
  disposePriceChart();
});
</script>
