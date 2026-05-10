import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DashboardRankPeriod, DashboardSummary } from '@/api/system/dashboard/types';

export const getDashboardSummary = (rankPeriod: DashboardRankPeriod = 'month', rankMonth?: string): AxiosPromise<DashboardSummary> => {
  return request({
    url: '/system/dashboard/summary',
    method: 'get',
    params: { rankPeriod, rankMonth }
  });
};
