export interface DeliveryOrderItemVO {
  itemId?: string | number;
  orderId?: string | number;
  categoryId?: string | number;
  categoryName?: string;
  productPath?: Array<string | number>;
  productId?: string | number;
  productName?: string;
  specification?: string;
  supplier?: string;
  quantity?: number;
  salePrice?: number;
  costPrice?: number;
  amount?: number;
  remark?: string;
}

export interface CustomerOrderVO {
  orderId?: string | number;
  deliveryId?: string | number;
  deliveryDate?: string;
  routeName?: string;
  deliveryStatus?: string;
  customerId?: string | number;
  customerName?: string;
  customerAlias?: string;
  customerPhone?: string;
  totalAmount?: number;
  receivedAmount?: number;
  unpaidAmount?: number;
  remark?: string;
  items: DeliveryOrderItemVO[];
}

export interface DeliveryOrderVO extends BaseEntity {
  deliveryId: string | number;
  deliveryDate: string;
  routeId: string | number;
  routeName: string;
  totalAmount: number;
  status: string;
  remark: string;
  customerOrders: CustomerOrderVO[];
}

export interface DeliveryOrderForm extends BaseEntity {
  deliveryId?: string | number;
  deliveryDate?: string;
  routeId?: string | number;
  status?: string;
  remark?: string;
  customerOrders: CustomerOrderVO[];
}

export interface DeliveryOrderQuery extends PageQuery {
  deliveryDate?: string;
  routeId?: string | number;
  status?: string;
  params?: any;
}

export interface DeliveryArchiveReceipt {
  orderId: string | number;
  receivedAmount: number;
}

export interface DeliveryArchiveForm {
  receipts: DeliveryArchiveReceipt[];
}
