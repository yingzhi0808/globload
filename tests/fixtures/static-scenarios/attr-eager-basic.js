import modules from '../basic/*.js' with { type: 'glob', eager: 'true' }

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
      }
    } else {
      serializableOutput[key] = typeof mod
    }
  }
}
console.log(JSON.stringify({ output: serializableOutput, logs: [] }))
