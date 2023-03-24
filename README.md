# ZenWeb Tenant module

[ZenWeb](https://www.npmjs.com/package/zenweb)

多租户多数据库支持

## 安装

```bash
# 生产依赖
npm install @zenweb/tenant @zenweb/mysql @zenweb/repositories

# 开发依赖
npm install @zenorm/generate @zenorm/generate-mysql --save-dev
```

## 配置

在 `package.json` 的 `scripts` 中增加如下代码，用于执行 `dbgen` 命令

```json title="package.json"
{
  "scripts": {
    "dbgen": "zenorm-generate .dbgen.json"
  }
}
```

创建文件 `.dbgen.json` 用于生成数据库结构代码时连接到指定数据库

*提示：运行时并不使用此配置*

```json title=".dbgen.json"
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "",
  "database": "zenorm_test",
  "outputDir": "./model",
  "generateRepositories": true,
  "declareRepositoriesToModules": [
    "@zenweb/core.Core.repositories"
  ]
}
```

### 生成数据库结构代码

运行命令开始生成数据库结构代码
```bash
npm run dbgen
```

## 项目配置

编辑项目入口代码 `src/index.ts`

```ts title="src/index.ts"
import { create } from 'zenweb';
import modTenant, { Tenant } from '@zenweb/tenant';
import { Repositories } from './model';

export const app = create();

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
```

代码中调用

```ts title="src/controller/test.ts"
import { mapping, Context } from 'zenweb';

export class TestController {
  @mappping()
  dbtest(ctx: Context) {
    const { UserRepository } = ctx.repositories;
    return UserRepository.find({ id: 1 }).get();
  }
}
```
