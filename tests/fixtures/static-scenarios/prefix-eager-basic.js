import modules from 'glob:../basic/*.js?eager=true'

const serializableOutput = {}
for (const key in modules) {
  if (Object.prototype.hasOwnProperty.call(modules, key)) {
    const mod = modules[key]
    if (typeof mod === 'object' && mod !== null) {
      serializableOutput[key] = {
        type: 'object',
        hasName: 'name' in mod ? typeof mod.name : undefined,
        hasProductName: 'productName' in mod ? typeof mod.productName : undefined,
        isDefaultString: typeof mod.default === 'string',
        // Add other properties you expect from basic modules if necessary
      }
    } else {
      serializableOutput[key] = typeof mod // Should not happen for eager basic
    }
  }
}

console.log(JSON.stringify({ output: serializableOutput, logs: [] }))
