export const id = 'data123'
export const value = { nested: true }

if (process.env.ENABLE_EAGER_LOGS === 'true') {
  console.log('Eager data.js loaded and executed')
}
