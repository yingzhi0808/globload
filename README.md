# globload

欢迎使用 `globload`！这是一个小巧而强大的 Node.js 模块加载器，它允许您使用 glob 模式动态导入多个文件。

[![npm version](https://img.shields.io/npm/v/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![npm downloads](https://img.shields.io/npm/dm/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 为什么选择 globload?

在 Node.js 项目中，有时您需要导入一个目录下的所有模块（例如，一系列服务、插件或配置文件）。手动为每个文件编写 `import` 语句既繁琐又容易出错，尤其是在文件经常变动的情况下。

`globload` 通过提供一种简洁的 glob 语法，解决了这个问题，让您可以：

- **动态导入**: 根据文件模式匹配导入模块。
- **保持整洁**: 减少冗余的 import 语句。
- **灵活控制**: 支持懒加载 (lazy loading) 和急切加载 (eager loading)。
- **两种语法**: 您可以选择使用 `glob:` 前缀或者更现代的 `import attributes`。
- **无需构建工具**: 与某些打包工具提供的类似功能不同，`globload` 直接在 Node.js 运行时通过模块钩子工作，无需额外的构建步骤。

## 安装

```bash
# pnpm
pnpm add globload

# npm
npm install globload

# yarn
yarn add globload
```

## 如何使用

`globload` 利用了 Node.js 的模块钩子。要启用它，您需要在启动 Node.js 应用程序时通过 `--import` 标志来预加载 `globload` 的注册脚本。

```bash
node --import globload your-app.js
```

### 导入语法示例

假设您的项目结构如下:

```
your-project/
├── src/
│   ├── app.js
│   └── services/
│       ├── userService.js
│       └── productService.js
└── package.json
```

#### 1. 使用 `glob:` 前缀

**懒加载 (默认)**:

```typescript
// src/app.js
import allServices from 'glob:./services/*.js'

async function main() {
  // allServices 会是类似这样的对象:
  // {
  //   './services/productService.js': () => import('./services/productService.js'),
  //   './services/userService.js': () => import('./services/userService.js')
  // }

  // 所有懒加载的服务模块:
  for (const path in allServices) {
    console.log(`模块路径: ${path}`)
    // 模块是异步加载的，需要调用函数并等待 Promise
    const serviceModule = await allServices[path]()
    console.log(`模块内容 (someExport):`, serviceModule.someExport)
    // 在这里可以使用 serviceModule 中的其他导出
  }

  // 如果您只想加载特定的模块：
  if (allServices['./services/userService.js']) {
    const userService = await allServices['./services/userService.js']()
    console.log('\n特定用户服务 (someExport):', userService.someExport)
  }
}
main()
```

**急切加载**:

```typescript
// src/app.js
import eagerServices from 'glob:./services/*.js?eager=true'

// eagerServices 会是类似这样的对象 (模块已加载):
// {
//   './services/productService.js': { /* productService exports */ },
//   './services/userService.js': { /* userService exports */ }
// }

// 所有急切加载的服务模块:
for (const path in eagerServices) {
  console.log(`模块路径: ${path}`)
  // 模块已加载，直接访问
  const serviceModule = eagerServices[path]
  console.log(`模块内容 (someExport):`, serviceModule.someExport)
  // 在这里可以使用 serviceModule 中的其他导出
}

// 直接访问特定模块：
console.log(
  '\n特定用户服务 (直接访问 someExport):',
  eagerServices['./services/userService.js'].someExport,
)
```

#### 2. 使用 Import Attributes

**懒加载 (默认)**:

```typescript
// src/app.js
// 确保您的 Node.js 版本和配置支持 import attributes
import allServices from './services/*.js' with { type: 'glob' }

async function main() {
  // allServices 的结构与使用 glob: 前缀的懒加载模式相同

  // 所有懒加载的服务模块:
  for (const path in allServices) {
    console.log(`模块路径: ${path}`)
    const serviceModule = await allServices[path]()
    console.log(`模块内容 (someExport):`, serviceModule.someExport)
  }

  if (allServices['./services/userService.js']) {
    const userService = await allServices['./services/userService.js']()
    console.log('\n特定用户服务 (Import Attributes, someExport):', userService.someExport)
  }
}
main()
```

**急切加载**:

```typescript
// src/app.js
// 确保您的 Node.js 版本和配置支持 import attributes
import eagerServices from './services/*.js' with { type: 'glob', eager: 'true' }

// eagerServices 的结构与使用 glob: 前缀的急切加载模式相同

// 所有急切加载的服务模块:
for (const path in eagerServices) {
  console.log(`模块路径: ${path}`)
  const serviceModule = eagerServices[path]
  console.log(`模块内容 (someExport):`, serviceModule.someExport)
}

// 直接访问特定模块:
console.log(
  '\n特定用户服务 (Import Attributes, 直接访问 someExport):',
  eagerServices['./services/userService.js'].someExport,
)
```

**使用 `glob:` 前缀的注意事项**:

- 键名中的路径 (如 `'./services/userService.js'`) 是相对于导入 `globload` 模块的那个文件的。
- `globload` 遵循以下优先级：如果一个导入语句同时使用了 `with { type: 'glob' }` 属性和 `glob:` 前缀，则会优先处理 `with { type: 'glob' }` 属性指定的模式和选项。

### 高级路径匹配

本库底层使用 [fast-glob](https://github.com/mrmlnc/fast-glob) 来解析和匹配 glob 模式。对于 `fast-glob` 所支持的完整语法和高级选项，请直接参考其官方文档：
[https://github.com/mrmlnc/fast-glob](https://github.com/mrmlnc/fast-glob)

您可以通过在 `glob:` 前缀的查询参数中，或者在使用导入属性 (Import Attributes) 时的属性中，传递 `fast-glob` 支持的选项。例如，要启用 `dot` 选项（匹配以点开头的文件/目录）：

**使用 `glob:` 前缀:**

```typescript
import allIncludingDotFiles from 'glob:./**/*?dot=true'
// 或急切加载
import allIncludingDotFilesEager from 'glob:./**/*?dot=true&eager=true'
```

**使用导入属性 (Import Attributes):**

```typescript
import allIncludingDotFiles from './**/*' with { type: 'glob', dot: 'true' }
// 或急切加载
import allIncludingDotFilesEager from './**/*' with { type: 'glob', dot: 'true', eager: 'true' }
```

_(注意: `fast-glob` 的布尔值选项通常接受实际的布尔值。当通过 URL 查询参数或导入属性（通常解析为字符串）传递时，我们的加载器目前会将 `'true'` 字符串视作布尔值 `true`。对于其他 `fast-glob` 选项，请参考其文档以了解期望的值类型。)_

## 与打包工具的区别

`globload` 提供的功能与一些现代前端打包工具中的特性相似，但核心区别在于其**运行时**的本质。

例如，[Vite](https://vitejs.dev/) 的 `import.meta.glob` 功能允许使用 glob 模式导入多个模块。然而，`import.meta.glob` 是一个**编译时**特性，它依赖 Vite 的构建过程来分析和转换代码。相比之下，`globload` 通过 Node.js 的模块加载器钩子在运行时动态解析和加载模块，**无需任何构建或打包工具**。这使得 `globload` 非常适合纯 Node.js 后端项目、脚本，或任何不希望引入复杂构建流程的场景。

其他主流打包工具如 Rollup 和 Webpack，也支持在标准的 `import()` 动态导入语法中使用部分 glob 模式，然后在构建时进行代码拆分。

## 兼容性

- **Node.js**: 请参考 `package.json` 中 `engines` 字段的具体声明。
