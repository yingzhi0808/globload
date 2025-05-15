const logs = []
const originalConsoleLog = console.log
console.log = (...args) => {
  logs.push(args.map((arg) => String(arg)).join(' '))
}

import modules from '../eager/*.js' with { type: 'glob', eager: 'true' }

console.log = originalConsoleLog // Restore console.log

const serializableOutput = {}
for (const key in modules) {
  if (Object.prototype.hasOwnProperty.call(modules, key)) {
    const mod = modules[key]
    serializableOutput[key] = { type: typeof mod }
  }
}
console.log(JSON.stringify({ output: serializableOutput, logs }))
