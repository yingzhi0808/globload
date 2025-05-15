const logs = []
const originalConsoleLog = console.log
console.log = (...args) => {
  logs.push(args.map((arg) => String(arg)).join(' '))
}

import modules from 'glob:../eager/*.js?eager=true'

console.log = originalConsoleLog // Restore console.log

const serializableOutput = {}
for (const key in modules) {
  if (Object.prototype.hasOwnProperty.call(modules, key)) {
    const mod = modules[key]
    // For side-effect modules, we might just care that they are objects
    serializableOutput[key] = { type: typeof mod }
  }
}

// Output both the module structure and the captured logs
console.log(JSON.stringify({ output: serializableOutput, logs }))
