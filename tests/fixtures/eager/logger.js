export function log(message) {
  console.log(`LOGGER: ${message}`)
  return `Logged: ${message}`
}
// 只有当 ENABLE_EAGER_LOGS 设置为 'true' 时才打印日志
if (process.env.ENABLE_EAGER_LOGS === 'true') {
  log('Eager logger.js initialized') // 副作用
}
