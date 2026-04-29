export interface ProductCategoryVO extends BaseEntity {
  categoryId: string | number;
  categoryName: string;
  categorySort: number;
  remark: string;
}

export interface ProductCategoryForm extends BaseEntity {
  categoryId?: string | number;
  categoryName?: string;
  categorySort?: number;
  remark?: string;
}

export interface ProductCategoryQuery extends PageQuery {
  categoryName?: string;
  params?: any;
}
