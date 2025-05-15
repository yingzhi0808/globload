import modules from '../nested/**/*.js' with { type: 'glob' }

const serializableOutput = {}
for (const key in modules) {
  if (Object.prototype.hasOwnProperty.call(modules, key)) {
    serializableOutput[key] = typeof modules[key]
  }
}
console.log(JSON.stringify({ output: serializableOutput, logs: [] }))
