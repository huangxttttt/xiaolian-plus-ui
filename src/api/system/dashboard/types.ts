export type DashboardRankPeriod = 'month' | 'year';

export interface DashboardTrendPoint {
  label: string;
  amount: number;
}

export interface DashboardMetric {
  amount: number;
  previousAmount: number;
  archivedAmount: number;
  unarchivedAmount: number;
  orderCount: number;
  customerCount: number;
  trend: DashboardTrendPoint[];
}

export interface DashboardTodayOrder {
  customerCount: number;
  orderCount: number;
}

export interface DashboardProfitMetric {
  salesAmount: number;
  costAmount: number;
  profitAmount: number;
  profitRate: number;
}

export interface DashboardCustomerRank {
  customerName: string;
  routeName: string;
  orderCount: number;
  amount: number;
  percent: number;
}

export interface DashboardProductRank {
  productName: string;
  specification: string;
  orderCount: number;
  quantity: number;
  amount: number;
  percent: number;
}

export interface DashboardProfitRank {
  name: string;
  subName: string;
  orderCount: number;
  quantity: number;
  salesAmount: number;
  costAmount: number;
  profitAmount: number;
  profitRate: number;
  percent: number;
}

export interface DashboardSummary {
  todaySales: DashboardMetric;
  monthSales: DashboardMetric;
  yearSales: DashboardMetric;
  todayOrders: DashboardTodayOrder;
  todayProfit: DashboardProfitMetric;
  monthProfit: DashboardProfitMetric;
  yearProfit: DashboardProfitMetric;
  customerRanks: DashboardCustomerRank[];
  productRanks: DashboardProductRank[];
  customerProfitRanks: DashboardProfitRank[];
  productProfitRanks: DashboardProfitRank[];
  routeProfitRanks: DashboardProfitRank[];
}
