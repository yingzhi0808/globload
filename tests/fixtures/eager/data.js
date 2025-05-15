export const id = 'data123'
export const value = { nested: true }
// 只有当 ENABLE_EAGER_LOGS 设置为 'true' 时才打印日志
if (process.env.ENABLE_EAGER_LOGS === 'true') {
  console.log('Eager data.js loaded and executed') // 副作用
}
