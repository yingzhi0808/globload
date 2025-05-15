import modules from '../empty/*.js' with { type: 'glob' }

const serializableOutput = modules
console.log(JSON.stringify({ output: serializableOutput, logs: [] }))
