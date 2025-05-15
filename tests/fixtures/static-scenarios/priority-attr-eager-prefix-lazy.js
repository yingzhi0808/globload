import modules from 'glob:../basic/user.js?eager=false' with { type: 'glob', eager: 'true' }

// 根据 globload 的当前行为和测试名称"resulting in empty"，
// 我们期望 modules.default 是一个空对象。
const output = modules.default || {}
const logs = [] // 静态导入场景下，副作用日志不由脚本捕获

console.log(JSON.stringify({ output, logs }))
