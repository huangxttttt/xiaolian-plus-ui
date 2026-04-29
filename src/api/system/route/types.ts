export interface RouteVO extends BaseEntity {
  routeId: string | number;
  routeName: string;
  routeCode: string;
  routeSort: number;
  remark: string;
}

export interface RouteForm extends BaseEntity {
  routeId?: string | number;
  routeName?: string;
  routeCode?: string;
  routeSort?: number;
  remark?: string;
}

export interface RouteQuery extends PageQuery {
  routeName?: string;
  routeCode?: string;
  params?: any;
}
