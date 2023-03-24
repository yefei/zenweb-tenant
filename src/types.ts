import * as mysql from 'mysql2';
import { QueryParam } from 'zenorm';
import { Context } from "@zenweb/core";

/**
 * 租户配置描述
 */
export interface Tenant {
  /**
   * 所属数据库服务器名称
   */
  server: string;

  /**
   * 所属数据库名称
   */
  database: string;
};

/**
 * 租户数据库服务器配置
 */
export interface TenantOption {
  /**
   * 取得租户配置
   * - 如果不能找到请使用 `ctx.fail` 抛出异常，或者返回一个默认租户？
   */
  tenantGetter: (ctx: Context) => Tenant | Promise<Tenant>;

  /**
   * zenorm 生成的 Repositories class
   */
  Repositories: { new (query: QueryParam): void; };

  /**
   * 数据库连接池配置
   */
  pools: {
    /**
     * @param server 所属数据库服务器名称，对应 `Tenant.server`
     */
    [server: string]: {
      /**
       * 主数据库(读写) - 必须设置
       */
      MASTER: mysql.PoolOptions;
      /**
       * 从库(只读) - 可选
       */
      SLAVES?: mysql.PoolOptions[];
    },
  };

  /**
   * 挂载到 `Context` 中的属性名
   * @default 'repositories'
   */
  contextProperty?: string;
}
