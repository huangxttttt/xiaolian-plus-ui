export interface ProductVO extends BaseEntity {
  productId: string | number;
  categoryId: string | number;
  categoryName: string;
  productName: string;
  specification: string;
  supplier: string;
  latestSaleAmount: number;
  latestCostPrice: number;
  remark: string;
}

export interface ProductPriceRecordVO {
  recordId: string | number;
  productId: string | number;
  recordDate: string;
  saleAmount: number;
  costPrice: number;
}

export interface ProductForm extends BaseEntity {
  productId?: string | number;
  categoryId?: string | number;
  productName?: string;
  specification?: string;
  supplier?: string;
  latestSaleAmount?: number;
  latestCostPrice?: number;
  remark?: string;
}

export interface ProductQuery extends PageQuery {
  categoryId?: string | number;
  productName?: string;
  specification?: string;
  supplier?: string;
  params?: any;
}

export interface ProductPriceRecordQuery {
  beginDate?: string;
  endDate?: string;
}
