import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ProductCategoryVO, ProductCategoryForm, ProductCategoryQuery } from '@/api/system/productCategory/types';

export const listProductCategory = (query?: ProductCategoryQuery): AxiosPromise<ProductCategoryVO[]> => {
  return request({
    url: '/system/product/category/list',
    method: 'get',
    params: query
  });
};

export const listProductCategoryOptions = (): AxiosPromise<ProductCategoryVO[]> => {
  return request({
    url: '/system/product/category/options',
    method: 'get'
  });
};

export const getProductCategory = (categoryId: string | number): AxiosPromise<ProductCategoryVO> => {
  return request({
    url: '/system/product/category/' + categoryId,
    method: 'get'
  });
};

export const addProductCategory = (data: ProductCategoryForm) => {
  return request({
    url: '/system/product/category',
    method: 'post',
    data: data
  });
};

export const updateProductCategory = (data: ProductCategoryForm) => {
  return request({
    url: '/system/product/category',
    method: 'put',
    data: data
  });
};

export const delProductCategory = (categoryId: string | number | Array<string | number>) => {
  return request({
    url: '/system/product/category/' + categoryId,
    method: 'delete'
  });
};
