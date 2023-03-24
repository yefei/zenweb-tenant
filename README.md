# ZenWeb Tenant module

[ZenWeb](https://www.npmjs.com/package/zenweb)

多租户多数据库支持

## 安装

```bash
npm install @zenweb/mysql @zenweb/orm
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
import modMySQL from '@zenweb/mysql';
import modORM from '@zenweb/orm';
import { Repositories } from './model';

export const app = create();

/**
 * 租户配置描述
 */
interface TenantConfig {
  /**
   * 所属数据库服务器
   */
  server: string;

  /**
   * 所属数据库名称
   */
  dbname: string;
};

/**
 * 租户配置信息
 */
const tenantsConfig: { [domain: string]: TenantConfig } = {
  'a.demo.com': {
    server: 'S1',
    dbname: 'db_1',
  },
  'b.demo.com': {
    server: 'S2',
    dbname: 'db_2',
  },
};

app.setup(modMySQL({
  pools: {
    // 数据库服务器设置
    S1_MASTER: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectionLimit: 100,
    },
    S2_MASTER: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectionLimit: 100,
    },
  },
  // 使用 Context 初始化连接池
  withContext: true,
  // 所属数据库服务器切换
  getPoolConnectionBeforeWithContext: ctx => {
    const tennat = tenantsConfig[ctx.host];
    if (!tennat) {
      throw new Error('Tennat not exists: ' + ctx.host);
    }
    return opt => {
      console.log(opt);
      return {
        // 将原有选择规则增加前缀
        pattern: tennat.server + '_' + (opt?.pattern || '*'),
        selector: opt?.selector,
      }
    };
  },
  // 所属数据库切换 (复用连接池)
  getPoolConnectionAfterWithContext: ctx => {
    const tennat = tenantsConfig[ctx.host];
    return conn => new Query(conn).query('USE `' + tennat.dbname + '`');
  },
}));

// 设置 ORM
app.setup(modORM({
  contextQuery: (ctx) => ctx.mysql,
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
