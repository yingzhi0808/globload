import modules from 'glob:../non_existent_path/*.js'

// Expecting modules to be an empty object
console.log(JSON.stringify({ output: modules, logs: [] }))
