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
   * 客户位置
   */
  address: string;

  /**
   * 地图定位
   */
  mapLocation: string;

  /**
   * 常用商品
   */
  commonProducts: string;

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
   * 客户位置
   */
  address?: string;

  /**
   * 地图定位
   */
  mapLocation?: string;

  /**
   * 常用商品
   */
  commonProducts?: string;

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
