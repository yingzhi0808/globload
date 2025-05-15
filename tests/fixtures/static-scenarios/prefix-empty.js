import modules from 'glob:../empty/*.js'

// For an empty glob, modules should be an empty object
const serializableOutput = modules

console.log(JSON.stringify({ output: serializableOutput, logs: [] }))
