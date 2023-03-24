import { Core } from '@zenweb/core';
import modTenant, { Tenant } from '../src';
import { Repositories } from './model';

const app = new Core();

/**
 * 租户配置信息
 */
const tenantsConfig: { [id: string]: Tenant } = {
  'a.demo.com': {
    server: 'S1',
    database: 'db_1',
  },
  'b.demo.com': {
    server: 'S2',
    database: 'db_2',
  },
};

app.setup(modTenant({
  tenantGetter: ctx => {
    const tenant = tenantsConfig[ctx.host];
    if (!tenant) {
      throw new Error('Tennat not exists: ' + ctx.host);
    }
    return tenant;
  },
  pools: {
    S1: {
      MASTER: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '123456',
        charset: 'utf8mb4',
        timezone: '+08:00',
        connectionLimit: 100,
      },
    },
    S2: {
      MASTER: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        charset: 'utf8mb4',
        timezone: '+08:00',
        connectionLimit: 100,
      },
    },
  },
  Repositories,
}));

app.setup(function test(setup) {
  setup.middleware(async ctx => {
    const { UserRepository } = ctx.repositories;
    ctx.body = await UserRepository.of('MASTER').find().all();
  })
});

app.start();
