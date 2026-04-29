import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ProductVO, ProductForm, ProductQuery, ProductPriceRecordVO, ProductPriceRecordQuery } from '@/api/system/product/types';

export const listProduct = (query?: ProductQuery): AxiosPromise<ProductVO[]> => {
  return request({
    url: '/system/product/list',
    method: 'get',
    params: query
  });
};

export const getProduct = (productId: string | number): AxiosPromise<ProductVO> => {
  return request({
    url: '/system/product/' + productId,
    method: 'get'
  });
};

export const listProductPriceHistory = (
  productId: string | number,
  query?: ProductPriceRecordQuery
): AxiosPromise<ProductPriceRecordVO[]> => {
  return request({
    url: '/system/product/priceHistory/' + productId,
    method: 'get',
    params: query
  });
};

export const addProduct = (data: ProductForm) => {
  return request({
    url: '/system/product',
    method: 'post',
    data: data
  });
};

export const updateProduct = (data: ProductForm) => {
  return request({
    url: '/system/product',
    method: 'put',
    data: data
  });
};

export const delProduct = (productId: string | number | Array<string | number>) => {
  return request({
    url: '/system/product/' + productId,
    method: 'delete'
  });
};
