import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import {
  CustomerVO,
  CustomerForm,
  CustomerQuery,
  CustomerOrderSummaryVO,
  CustomerOrderQuery,
  CustomerRepaymentForm,
  CustomerTopProductVO
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
