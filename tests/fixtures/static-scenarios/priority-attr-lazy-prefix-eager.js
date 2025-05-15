import modules from 'glob:../basic/user.js?eager=true' with { type: 'glob', eager: 'false' }

// Expecting modules to be an empty object
console.log(JSON.stringify({ output: modules, logs: [] }))
