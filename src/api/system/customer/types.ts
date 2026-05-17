export interface CustomerVO {
  /**
   * 客户ID
   */
  customerId: string | number;

  /**
   * 客户名称
   */
  name: string;

  /**
   * 客户简称
   */
  alias: string;

  /**
   * 联系电话
   */
  phone: string;

  /**
   * 联系人
   */
  contactName: string;

  /**
   * 配送线路ID
   */
  routeId: string | number;

  /**
   * 配送线路
   */
  routeName: string;

  /**
   * 欠款金额
   */
  debt: number;

  /**
   * 地图定位
   */
  mapLocation: string;

  /**
   * 地图经度
   */
  longitude?: number;

  /**
   * 地图纬度
   */
  latitude?: number;

  /**
   * 地图解析地址
   */
  mapAddress?: string;

  /**
   * 地图服务商
   */
  mapProvider?: string;

  /**
   * 门面照片
   */
  photo: string;

  /**
   * 备注
   */
  remark: string;
}

export interface CustomerOrderSummaryVO {
  /**
   * 订单数量
   */
  orderCount: number;

  /**
   * 总消费额
   */
  totalAmount: number;
}

export interface CustomerTopProductVO {
  /**
   * 商品ID
   */
  productId: string | number;

  /**
   * 商品名称
   */
  productName: string;

  /**
   * 规格
   */
  specification?: string;

  /**
   * 提供商
   */
  supplier?: string;

  /**
   * 累计数量
   */
  totalQuantity: number;

  /**
   * 累计金额
   */
  totalAmount: number;

  /**
   * 下单次数
   */
  orderCount: number;
}

export interface RouteCustomerOrderStatsVO {
  /**
   * 客户ID
   */
  customerId: string | number;

  /**
   * 客户名称
   */
  customerName: string;

  /**
   * 当前客户在该配送地的订单数
   */
  orderCount: number;

  /**
   * 该配送地总订单数
   */
  routeOrderCount: number;

  /**
   * 订单占比百分数
   */
  percentage: number;
}

export interface CustomerOrderQuery extends PageQuery {
  /**
   * 配送开始日期
   */
  beginDate?: string;

  /**
   * 配送结束日期
   */
  endDate?: string;
}

export interface CustomerRepaymentForm {
  /**
   * 还款金额
   */
  amount: number;
}

export interface CustomerForm extends BaseEntity {
  /**
   * 客户ID
   */
  customerId?: string | number;

  /**
   * 客户名称
   */
  name?: string;

  /**
   * 客户简称
   */
  alias?: string;

  /**
   * 联系电话
   */
  phone?: string;

  /**
   * 联系人
   */
  contactName?: string;

  /**
   * 配送线路ID
   */
  routeId?: string | number;

  /**
   * 欠款金额
   */
  debt?: number;

  /**
   * 地图定位
   */
  mapLocation?: string | null;

  /**
   * 地图经度
   */
  longitude?: number | null;

  /**
   * 地图纬度
   */
  latitude?: number | null;

  /**
   * 地图解析地址
   */
  mapAddress?: string | null;

  /**
   * 地图服务商
   */
  mapProvider?: string | null;

  /**
   * 门面照片
   */
  photo?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface CustomerQuery extends PageQuery {
  /**
   * 快速搜索关键字
   */
  keyword?: string;

  /**
   * 客户名称
   */
  name?: string;

  /**
   * 客户简称
   */
  alias?: string;

  /**
   * 联系电话
   */
  phone?: string;

  /**
   * 联系人
   */
  contactName?: string;

  /**
   * 配送线路ID
   */
  routeId?: string | number;

  /**
   * 日期范围参数
   */
  params?: any;
}
