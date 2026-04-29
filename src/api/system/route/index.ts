import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { RouteVO, RouteForm, RouteQuery } from '@/api/system/route/types';

export const listRoute = (query?: RouteQuery): AxiosPromise<RouteVO[]> => {
  return request({
    url: '/system/route/list',
    method: 'get',
    params: query
  });
};

export const listRouteOptions = (): AxiosPromise<RouteVO[]> => {
  return request({
    url: '/system/route/options',
    method: 'get'
  });
};

export const getRoute = (routeId: string | number): AxiosPromise<RouteVO> => {
  return request({
    url: '/system/route/' + routeId,
    method: 'get'
  });
};

export const addRoute = (data: RouteForm) => {
  return request({
    url: '/system/route',
    method: 'post',
    data: data
  });
};

export const updateRoute = (data: RouteForm) => {
  return request({
    url: '/system/route',
    method: 'put',
    data: data
  });
};

export const delRoute = (routeId: string | number | Array<string | number>) => {
  return request({
    url: '/system/route/' + routeId,
    method: 'delete'
  });
};
