# globload

This is a small yet powerful Node.js module loader that allows you to dynamically import multiple files using glob patterns.

[![Test](https://github.com/yingzhi0808/globload/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/yingzhi0808/globload/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![npm downloads](https://img.shields.io/npm/dm/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Features

In Node.js projects, you sometimes need to import all modules within a directory (e.g., a series of services, plugins, or configuration files). Manually writing `import` statements for each file is tedious and error-prone, especially when files change frequently.

`globload` solves this problem by providing a concise glob syntax, allowing you to:

- **Dynamic Import**: Import modules based on file pattern matching.
- **Stay Clean**: Reduce redundant import statements.
- **Flexible Control**: Supports lazy loading and eager loading.
- **No Build Tools Needed**: Unlike similar features provided by some bundlers, `globload` works directly in the Node.js runtime via module hooks, requiring no extra build steps.

## Installation

```bash
# pnpm
pnpm add globload

# npm
npm install globload

# yarn
yarn add globload
```

## How to Use

`globload` utilizes Node.js module hooks. To enable it, you need to preload `globload`'s registration script via the `--import` flag when starting your Node.js application.

```bash
node --import globload your-app.js
```

### Import Syntax Examples

To use `globload`, you need to append the `?glob` query parameter to the end of your import path string. This will instruct `globload` to process the import.

Assume your project structure is as follows:

```
your-project/
├── src/
│   ├── app.js
│   └── services/
│       ├── user.js
│       └── product.js
└── package.json
```

#### Lazy Loading (Default)

When only `?glob` is used, modules are imported lazily. This means `globload` exports an object where the values are functions that return dynamic `import()` calls.

```typescript
// src/app.js
import services from "./services/*.js?glob";

// services will be an object like this:
// {
//   'src/services/product.js': () => import('file:///path/to/your-project/src/services/product.js'),
//   'src/services/user.js': () => import('file:///path/to/your-project/src/services/user.js')
// }
// Note: Keys are paths relative to process.cwd().

for (const pathKey in services) {
	const service = await services[pathKey](); // Call the function to load the module
	// Assuming user.js exports a function named 'getUser'
	if (service.getUser) {
	  console.log('Module content (getUser):', service.getUser());
	}
}
```

#### Eager Loading

To eagerly load modules (i.e., load all matching modules immediately), append the `eager` parameter after `?glob` (e.g., `?glob&eager`).

```typescript
// src/app.js
import services from './services/*.js?glob&eager';

// services will be an object like this (modules are already loaded):
// {
//   'src/services/product.js': { /* product exports */ },
//   'src/services/user.js': { /* user exports */ }
// }
// Note: Keys are paths relative to process.cwd().

for (const pathKey in services) {
  const service = services[pathKey]; // Module is already loaded, access directly
  // Assuming user.js exports a function named 'getUser'
  if (service.getUser) {
    console.log('Module content (getUser):', service.getUser());
  }
}
```

### Importing Specific Exports (New Feature!)

 `globload` allows you to import only specific named or default exports from the matched modules by using the `&import=` query parameter.

**Syntax:**

- `?glob&import=default`: Imports the default export from each module.
- `?glob&import=namedExport`: Imports the export named `namedExport` from each module.

**Lazy Loading with `&import=default`:**

```typescript
// src/app.js
// Assuming each service file has a default export
import serviceDefaults from "./services/*.js?glob&import=default";

// serviceDefaults will be an object like this:
// {
//   'src/services/product.js': () => import('file:///path/to/your-project/src/services/product.js').then(m => m.default),
//   'src/services/user.js': () => import('file:///path/to/your-project/src/services/user.js').then(m => m.default)
// }

for (const pathKey in serviceDefaults) {
	const defaultExportContent = await serviceDefaults[pathKey](); 
	// defaultExportContent is now the actual default export of the module
	console.log(defaultExportContent);
}
```

**Eager Loading with `&import=setup` (a named export):**

```typescript
// src/app.js
// Assuming each service file has a named export 'setup'
import serviceSetups from './services/*.js?glob&eager&import=setup';

// serviceSetups will be an object like this:
// {
//   'src/services/product.js': /* content of product.js's 'setup' export */,
//   'src/services/user.js': /* content of user.js's 'setup' export */
// }

for (const pathKey in serviceSetups) {
  const setupFunction = serviceSetups[pathKey]; 
  // setupFunction is now the actual 'setup' export from the module
  if (typeof setupFunction === 'function') {
    setupFunction();
  }
}
```

### Regarding Import Attributes

If you use `import attributes` (e.g., `with { type: "json" }`) in your `globload` import statement, these attributes will be passed to each individual dynamic import generated by `globload`. This is useful for importing module types that require specific import attributes, such as JSON modules.

```typescript
// Assuming you have a data directory containing multiple JSON files
// src/app.js
import data from './data/*.json?glob&eager' with { type: 'json' };

// data will be an object where each JSON file is already loaded as a module
// {
//   'src/data/config.json': { default: { /* parsed JSON content */ } },
//   'src/data/userPreferences.json': { default: { /* parsed JSON content */ } }
// }
```

### Advanced Path Matching

This library uses [tinyglobby](https://github.com/SuperchupuDev/tinyglobby) internally to parse and match glob patterns. `tinyglobby` supports common glob patterns.

## Differences from Bundlers

The functionality provided by `globload` is similar to features in some modern frontend bundlers.

For example, [Vite](https://vitejs.dev/)'s `import.meta.glob` feature allows importing multiple modules using glob patterns. However, `import.meta.glob` is a **compile-time** feature that relies on Vite's build process to analyze and transform code. In contrast, `globload` dynamically resolves and loads modules at **runtime** via Node.js module loader hooks, **without needing any build or bundling tools**. This makes `globload` well-suited for pure Node.js backend projects, scripts, or any scenario where you don't want to introduce a complex build process.

Other mainstream bundlers like Rollup and Webpack also support using partial glob patterns in the standard `import()` dynamic import syntax, then perform code splitting during the build.

## Compatibility

- **Node.js**: Please refer to the [`engines`](https://github.com/yingzhi0808/globload/blob/main/package.json#L57) field in `package.json` for specific declarations.
