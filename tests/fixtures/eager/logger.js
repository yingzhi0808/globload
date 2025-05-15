export function log(message) {
  console.log(`LOGGER: ${message}`)
  return `Logged: ${message}`
}

if (process.env.ENABLE_EAGER_LOGS === 'true') {
  log('Eager logger.js initialized')
}
