import { SetupFunction } from '@zenweb/core';
import modMySQL, { MySQLOption } from '@zenweb/mysql';
import modRepositories from '@zenweb/repositories';
import * as mysql from 'mysql2';
import { Tenant, TenantOption } from './types';
export { Tenant, TenantOption };

/**
 * 当前上下文取得的租户信息
 */
const TENANT = Symbol('tenant');

/**
 * 生成租户数据库配置信息
 */
export function makeTenantMySQLOption(option: TenantOption): MySQLOption {
  // 重组配置
  const pools: { [group: string]: mysql.PoolOptions } = {};
  for (const [server, poolConfig] of Object.entries(option.pools)) {
    pools[`${server}_MASTER`] = poolConfig.MASTER;
    if (poolConfig.SLAVES) {
      let i = 1;
      for (const slave of poolConfig.SLAVES) {
        pools[`${server}_SLAVE${i}`] = slave;
        i++;
      }
    }
  }
  return {
    pools,
    // 使用 Context 初始化连接池
    withContext: true,
    // 所属数据库服务器切换
    getPoolConnectionBeforeWithContext: ctx => {
      return async opt => {
        if (!ctx[TENANT]) {
          ctx[TENANT] = await option.tenantGetter(ctx);
        }
        return {
          // 将原有选择规则增加前缀
          pattern: ctx[TENANT].server + '_' + (opt?.pattern || 'MASTER'),
          selector: opt?.selector,
        }
      };
    },
    // 所属数据库切换 (复用连接池)
    getPoolConnectionAfterWithContext: ctx => {
      return conn => new Promise<void>((resolve, reject) => {
        conn.query('USE `' + ctx[TENANT].database + '`', err => {
          if (err) reject(err);
          else resolve();
        })
      });
    },
  };
}

export default function setup(option: TenantOption): SetupFunction {
  return function tenant(setup) {
    setup.debug('option: %o', option);
    setup.core.setup(modMySQL(makeTenantMySQLOption(option)));
    setup.core.setup(modRepositories({
      contextQuery: ctx => ctx.mysql,
      Repositories: option.Repositories,
      contextProperty: option.contextProperty,
    }));
  }
}

declare module '@zenweb/core' {
  interface Context {
    [TENANT]: Tenant;
  }
}
