import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeliveryArchiveForm, DeliveryOrderVO, DeliveryOrderForm, DeliveryOrderQuery } from '@/api/system/deliveryOrder/types';

export const listDeliveryOrder = (query?: DeliveryOrderQuery): AxiosPromise<DeliveryOrderVO[]> => {
  return request({
    url: '/system/deliveryOrder/list',
    method: 'get',
    params: query
  });
};

export const getDeliveryOrder = (deliveryId: string | number): AxiosPromise<DeliveryOrderVO> => {
  return request({
    url: '/system/deliveryOrder/' + deliveryId,
    method: 'get'
  });
};

export const addDeliveryOrder = (data: DeliveryOrderForm) => {
  return request({
    url: '/system/deliveryOrder',
    method: 'post',
    data: data
  });
};

export const updateDeliveryOrder = (data: DeliveryOrderForm) => {
  return request({
    url: '/system/deliveryOrder',
    method: 'put',
    data: data
  });
};

export const archiveDeliveryOrder = (deliveryId: string | number, data: DeliveryArchiveForm) => {
  return request({
    url: '/system/deliveryOrder/' + deliveryId + '/archive',
    method: 'put',
    data
  });
};

export const delDeliveryOrder = (deliveryId: string | number | Array<string | number>) => {
  return request({
    url: '/system/deliveryOrder/' + deliveryId,
    method: 'delete'
  });
};
