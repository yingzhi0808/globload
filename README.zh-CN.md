# globload

[English](./README.md) | 简体中文

这是一个小而强大的 Node.js 模块加载器：你可以用 **glob 模式**一次性导入多个文件。它支持：

- 按文件模式批量导入模块（运行时解析，不依赖打包器）
- 懒加载（默认）与预加载（eager）
- 仅导入某个具名导出或默认导出（`&import=`）
- 直接导入并解析 YAML（`.yaml`/`.yml`）

[![ci](https://github.com/yingzhi0808/globload/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/yingzhi0808/globload/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![npm downloads](https://img.shields.io/npm/dm/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 功能与适用场景

在 Node.js 项目里，你经常会遇到这样的需求：把某个目录下的所有模块（例如 services/plugins/routes/configs）都导入进来。手写一堆 `import` 既繁琐又容易遗漏。

`globload` 通过 **Node.js 模块加载钩子（module hooks）** 在运行时拦截带 `?glob` 查询参数的 import，并把它展开成“多个模块的导入结果”，从而：

- 减少重复 import
- 文件增删时无需维护导入列表
- 不需要 Vite/Rollup/Webpack 等构建工具，也不需要额外的编译步骤

## 安装

```bash
# pnpm
pnpm add globload

# npm
npm install globload

# yarn
yarn add globload
```

## 快速开始

`globload` 需要在 Node 启动时预加载注册脚本，推荐用 `--import`：

```bash
node --import globload your-app.js
```

之后，你只需要在 import 路径末尾加上 `?glob` 即可触发处理。

> 说明：这里的 “import” 同时包含 **静态导入语句** `import ... from "..."` 和 **动态导入** `import("...")`。
> 也就是说，只要路径里带了 `?glob`，无论你用哪种写法，都会触发 `globload` 的展开逻辑。

## 导入语法

下面假设你的项目结构如下：

```
your-project/
├── src/
│   ├── app.js
│   └── services/
│       ├── user.js
│       └── product.js
└── package.json
```

### 懒加载（默认）

只写 `?glob` 时为懒加载：`globload` 会导出一个对象，其 value 是函数，调用该函数才会触发 `import()`。

```ts
// src/app.js
import services from "./services/*.js?glob";

// services 类似：
// {
//   'src/services/product.js': () => import('file:///.../src/services/product.js'),
//   'src/services/user.js': () => import('file:///.../src/services/user.js')
// }
// 注意：key 是相对于 process.cwd() 的路径

for (const pathKey in services) {
  const mod = await services[pathKey]();
  if (mod.getUser) console.log(mod.getUser());
}
```

同样的规则也适用于动态 `import()`（注意动态导入拿到的是模块命名空间对象，需要从中取 `default`）：

```ts
// src/app.js
const { default: services } = await import("./services/*.js?glob");

for (const pathKey in services) {
  const mod = await services[pathKey]();
  if (mod.getUser) console.log(mod.getUser());
}
```

### 预加载（eager）

在 `?glob` 后追加 `&eager` 可以立即导入所有匹配模块：

```ts
// src/app.js
import services from "./services/*.js?glob&eager";

// services 类似：
// {
//   'src/services/product.js': { ...exports },
//   'src/services/user.js': { ...exports }
// }

for (const pathKey in services) {
  const mod = services[pathKey];
  if (mod.getUser) console.log(mod.getUser());
}
```

### 只导入特定导出（`&import=`）

你可以用 `&import=` 只取默认导出或某个具名导出：

- `?glob&import=default`：取每个模块的默认导出
- `?glob&import=setup`：取每个模块的 `setup` 具名导出

懒加载 + 默认导出：

```ts
import defaults from "./services/*.js?glob&import=default";

for (const pathKey in defaults) {
  const d = await defaults[pathKey](); // 这里返回的是 default export
  console.log(d);
}
```

预加载 + 具名导出：

```ts
import setups from "./services/*.js?glob&eager&import=setup";

for (const pathKey in setups) {
  const setup = setups[pathKey]; // 这里直接是 setup 导出本身
  if (typeof setup === "function") setup();
}
```

## 直接导入 YAML（.yaml / .yml）

当匹配到 YAML 文件时，`globload` 会把其内容解析为 JavaScript 对象。

懒加载 YAML：

```ts
import configs from "./config/*.yaml?glob";

const db = await configs["src/config/database.yaml"]();
console.log(db.host);
```

预加载 YAML：

```ts
import configs from "./config/*.yaml?glob&eager";

console.log(configs["src/config/database.yaml"].port);
```

搭配 `&import=` 读取 YAML 顶层 key：

```ts
import items from "./config/*.yaml?glob&eager&import=user";
// items 形如：
// { 'src/config/database.yaml': 'admin' }
```

`&import=default` 在 YAML 上等价于不传 `&import`，即返回整个解析对象。

## 关于 import attributes（`with { ... }`）

如果你在 `globload` 的 import 语句里使用了 import attributes（例如 JSON 模块的 `with { type: "json" }`），这些 attributes 会被透传到 `globload` 生成的每个动态 `import()` 中。

```ts
import data from "./data/*.json?glob&eager" with { type: "json" };
```

`globload` 展开后大致等价于下面的代码（示意，省略了路径解析等细节），重点是 **attributes 会出现在每一次动态导入上**：

```ts
// 假设匹配到：
// - src/data/user.json
// - src/data/product.json

const data = {
  "src/data/user.json": await import("file:///.../src/data/user.json", {
    with: { type: "json" },
  }),
  "src/data/product.json": await import("file:///.../src/data/product.json", {
    with: { type: "json" },
  }),
};
```

## 与打包器能力的区别

`globload` 的体验类似于前端打包器的批量导入能力（例如 Vite 的 `import.meta.glob`），但二者核心差异是：

- `import.meta.glob`：构建期（compile-time）分析与转换，需要打包/构建流程
- `globload`：运行时（runtime）通过 Node.js module hooks 解析与加载，不依赖打包器

因此 `globload` 更适合纯 Node.js 后端项目、脚本工具、或你不想引入构建流程的场景。

## 兼容性

- **Node.js**：请参考 `package.json` 的 `engines.node` 声明（当前为 `^18.19.0 || >=20.10.0`）。


