import modules from '../non_existent_path/*.js' with { type: 'glob' }

// Expecting modules to be an empty object
console.log(JSON.stringify({ output: modules, logs: [] }))
