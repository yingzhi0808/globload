# globload

English | [简体中文](./README.zh-CN.md)

A small but powerful Node.js module loader: import multiple files at once using **glob patterns**. It supports:

- Bulk importing modules by file pattern (resolved at runtime, no bundler required)
- Lazy loading (default) and eager loading
- Importing only a specific named export or the default export (`&import=`)
- Importing and parsing YAML directly (`.yaml` / `.yml`)

[![ci](https://github.com/yingzhi0808/globload/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/yingzhi0808/globload/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![npm downloads](https://img.shields.io/npm/dm/globload.svg?style=flat-square)](https://www.npmjs.com/package/globload)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Features & use cases

In Node.js projects, you often want to import all modules under a directory (e.g. services/plugins/routes/configs). Writing a bunch of `import` statements by hand is tedious and easy to miss.

`globload` intercepts imports with the `?glob` query at runtime via **Node.js module hooks**, and expands them into “the aggregated results of importing multiple modules”, so you get:

- Less repetitive imports
- No need to maintain an import list when files are added/removed
- No need for build tools like Vite/Rollup/Webpack, and no extra compilation step

## Install

```bash
# pnpm
pnpm add globload

# npm
npm install globload

# yarn
yarn add globload
```

## Quick start

`globload` needs to register its hook script at Node startup. The recommended way is using `--import`:

```bash
node --import globload your-app.js
```

Then, simply append `?glob` to an import path to trigger expansion.

> Note: “import” here includes both **static imports** (`import ... from "..."`) and **dynamic imports** (`import("...")`).
> In other words, as long as the path includes `?glob`, `globload` will expand it no matter which style you use.

## Import syntax

Assume your project structure looks like this:

```
your-project/
├── src/
│   ├── app.js
│   └── services/
│       ├── user.js
│       └── product.js
└── package.json
```

### Lazy loading (default)

With only `?glob`, the import is lazy: `globload` exports an object whose values are functions; calling a function triggers the actual `import()`.

```ts
// src/app.js
import services from "./services/*.js?glob";

// services is like:
// {
//   'src/services/product.js': () => import('file:///.../src/services/product.js'),
//   'src/services/user.js': () => import('file:///.../src/services/user.js')
// }
// Note: keys are paths relative to process.cwd()

for (const pathKey in services) {
  const mod = await services[pathKey]();
  if (mod.getUser) console.log(mod.getUser());
}
```

The same rule applies to dynamic `import()` (note that dynamic import returns a module namespace object; you need to read `default` from it):

```ts
// src/app.js
const { default: services } = await import("./services/*.js?glob");

for (const pathKey in services) {
  const mod = await services[pathKey]();
  if (mod.getUser) console.log(mod.getUser());
}
```

### Eager loading

Append `&eager` after `?glob` to import all matched modules immediately:

```ts
// src/app.js
import services from "./services/*.js?glob&eager";

// services is like:
// {
//   'src/services/product.js': { ...exports },
//   'src/services/user.js': { ...exports }
// }

for (const pathKey in services) {
  const mod = services[pathKey];
  if (mod.getUser) console.log(mod.getUser());
}
```

### Import only specific exports (`&import=`)

Use `&import=` to select either the default export or a specific named export:

- `?glob&import=default`: take the default export from each module
- `?glob&import=setup`: take the `setup` named export from each module

Lazy + default export:

```ts
import defaults from "./services/*.js?glob&import=default";

for (const pathKey in defaults) {
  const d = await defaults[pathKey](); // returns the default export
  console.log(d);
}
```

Eager + named export:

```ts
import setups from "./services/*.js?glob&eager&import=setup";

for (const pathKey in setups) {
  const setup = setups[pathKey]; // the setup export itself
  if (typeof setup === "function") setup();
}
```

## Import YAML directly (.yaml / .yml)

When a matched file is YAML, `globload` parses its content into a JavaScript object.

Lazy YAML:

```ts
import configs from "./config/*.yaml?glob";

const db = await configs["src/config/database.yaml"]();
console.log(db.host);
```

Eager YAML:

```ts
import configs from "./config/*.yaml?glob&eager";

console.log(configs["src/config/database.yaml"].port);
```

Use `&import=` to read a top-level YAML key:

```ts
import items from "./config/*.yaml?glob&eager&import=user";
// items looks like:
// { 'src/config/database.yaml': 'admin' }
```

For YAML, `&import=default` is equivalent to omitting `&import`, i.e. returning the whole parsed object.

## About import attributes (`with { ... }`)

If you use import attributes in a `globload` import statement (e.g. `with { type: "json" }` for JSON modules), those attributes are forwarded to every dynamic `import()` generated by `globload`.

```ts
import data from "./data/*.json?glob&eager" with { type: "json" };
```

After expansion, it’s roughly equivalent to the following (illustrative; path resolution details omitted). The key point is **the attributes appear on every dynamic import**:

```ts
// Suppose it matches:
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

## How this differs from bundler features

`globload` feels similar to bulk import features provided by frontend bundlers (e.g. Vite’s `import.meta.glob`), but the key difference is:

- `import.meta.glob`: compile-time analysis and transformation; requires a bundling/build pipeline
- `globload`: runtime parsing and loading via Node.js module hooks; no bundler required

So `globload` is a better fit for pure Node.js backend projects, scripts, or any scenario where you don’t want to introduce a build step.

## Compatibility

- **Node.js**: see the `engines.node` field in `package.json` (currently `^18.19.0 || >=20.10.0`).

Issues and PRs are welcome.

