import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { getToken } from '@/utils/auth';
import {
  CustomerVO,
  CustomerForm,
  CustomerQuery,
  CustomerOrderSummaryVO,
  CustomerOrderQuery,
  CustomerRepaymentForm,
  CustomerTopProductVO,
  RouteCustomerOrderStatsVO
} from '@/api/system/customer/types';
import { CustomerOrderVO } from '@/api/system/deliveryOrder/types';

/**
 * 查询客户档案列表
 * @param query
 * @returns {*}
 */

export const listCustomer = (query?: CustomerQuery): AxiosPromise<CustomerVO[]> => {
  return request({
    url: '/system/customer/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询客户档案详细
 * @param customerId
 */
export const getCustomer = (customerId: string | number): AxiosPromise<CustomerVO> => {
  return request({
    url: '/system/customer/' + customerId,
    method: 'get'
  });
};

/**
 * 查询客户订单记录
 * @param customerId
 */
export const getCustomerOrders = (customerId: string | number, query?: CustomerOrderQuery): AxiosPromise<CustomerOrderVO[]> => {
  return request({
    url: '/system/customer/' + customerId + '/orders',
    method: 'get',
    params: query
  });
};

/**
 * 查询客户订单汇总
 * @param customerId
 */
export const getCustomerOrderSummary = (
  customerId: string | number,
  query?: Pick<CustomerOrderQuery, 'beginDate' | 'endDate'>
): AxiosPromise<CustomerOrderSummaryVO> => {
  return request({
    url: '/system/customer/' + customerId + '/orders/summary',
    method: 'get',
    params: query
  });
};

/**
 * 查询客户常购商品排行
 * @param customerId
 */
export const getCustomerTopProducts = (customerId: string | number): AxiosPromise<CustomerTopProductVO[]> => {
  return request({
    url: '/system/customer/' + customerId + '/top-products',
    method: 'get'
  });
};

/**
 * 查询配送地客户订单占比
 * @param routeId
 */
export const getRouteCustomerOrderStats = (routeId: string | number): AxiosPromise<RouteCustomerOrderStatsVO[]> => {
  return fetch(`${import.meta.env.VITE_APP_BASE_API}/system/customer/route/${routeId}/order-stats`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + getToken(),
      clientid: import.meta.env.VITE_APP_CLIENT_ID
    }
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.msg || '查询配送地客户订单占比失败');
    }
    return result;
  }) as AxiosPromise<RouteCustomerOrderStatsVO[]>;
};

/**
 * 客户订单还款
 * @param orderId
 * @param data
 */
export const repayCustomerOrder = (orderId: string | number, data: CustomerRepaymentForm) => {
  return request({
    url: '/system/customer/orders/' + orderId + '/repay',
    method: 'put',
    data
  });
};

/**
 * 新增客户档案
 * @param data
 */
export const addCustomer = (data: CustomerForm) => {
  return request({
    url: '/system/customer',
    method: 'post',
    data: data
  });
};

/**
 * 修改客户档案
 * @param data
 */
export const updateCustomer = (data: CustomerForm) => {
  return request({
    url: '/system/customer',
    method: 'put',
    data: data
  });
};

/**
 * 删除客户档案
 * @param customerId
 */
export const delCustomer = (customerId: string | number | Array<string | number>) => {
  return request({
    url: '/system/customer/' + customerId,
    method: 'delete'
  });
};
