async function run() {
  const importType = process.env.GLOB_IMPORT_TYPE || 'prefix_lazy_basic'
  let results = {}
  const logs = []

  const originalConsoleLog = console.log
  console.log = (...args) => {
    logs.push(args.map((arg) => String(arg)).join(' '))
  }

  try {
    switch (importType) {
      case 'prefix_lazy_basic':
        results = await import('glob:./basic/*.js')
        break
      case 'prefix_eager_basic':
        results = await import('glob:./basic/*.js?eager=true')
        break
      case 'prefix_eager_side_effects':
        process.env.ENABLE_EAGER_LOGS = 'true'
        results = await import('glob:./eager/*.js?eager=true')
        delete process.env.ENABLE_EAGER_LOGS
        break
      case 'prefix_lazy_side_effects':
        process.env.ENABLE_EAGER_LOGS = 'true'
        results = await import('glob:./eager/*.js')
        if (results.default && results.default['./eager/data.js'])
          await results.default['./eager/data.js']()
        if (results.default && results.default['./eager/logger.js'])
          await results.default['./eager/logger.js']()
        delete process.env.ENABLE_EAGER_LOGS
        break
      case 'prefix_empty':
        results = await import('glob:./empty/*.js')
        break
      case 'prefix_nested':
        results = await import('glob:./nested/**/*.js')
        break
      case 'attr_lazy_basic':
        results = await import('./basic/*.js', {
          with: { type: 'glob' },
        })
        break
      case 'attr_eager_basic':
        results = await import('./basic/*.js', {
          with: { type: 'glob', eager: 'true' },
        })
        break
      case 'attr_eager_side_effects':
        process.env.ENABLE_EAGER_LOGS = 'true'
        results = await import('./eager/*.js', {
          with: { type: 'glob', eager: 'true' },
        })
        delete process.env.ENABLE_EAGER_LOGS
        break
      case 'attr_lazy_side_effects':
        process.env.ENABLE_EAGER_LOGS = 'true'
        results = await import('./eager/*.js', {
          with: { type: 'glob' },
        })
        if (results.default && results.default['./eager/data.js'])
          await results.default['./eager/data.js']()
        if (results.default && results.default['./eager/logger.js'])
          await results.default['./eager/logger.js']()
        delete process.env.ENABLE_EAGER_LOGS
        break
      case 'attr_empty':
        results = await import('./empty/*.js', {
          with: { type: 'glob' },
        })
        break
      case 'attr_nested':
        results = await import('./nested/**/*.js', {
          with: { type: 'glob' },
        })
        break
      case 'priority_attr_over_prefix_eager':
        results = await import('glob:./basic/user.js?eager=false', {
          with: { type: 'glob', eager: 'true' },
        })
        break
      case 'priority_attr_over_prefix_lazy':
        results = await import('glob:./basic/user.js?eager=true', {
          with: { type: 'glob', eager: 'false' },
        })
        break
      case 'attr_non_existent_path':
        results = await import('./non_existent_dir/non_existent_file-*.js', {
          with: { type: 'glob' },
        })
        break
      case 'prefix_non_existent_path':
        results = await import('glob:./non_existent_dir/non_existent_file-*.js')
        break
      default:
        console.log = originalConsoleLog
        console.error('Unknown import type:', importType)
        process.exit(1)
    }

    const serializableResults = {}
    const modulesToProcess = results.default // Process .default for all cases

    if (typeof modulesToProcess === 'object' && modulesToProcess !== null) {
      for (const key in modulesToProcess) {
        if (Object.hasOwnProperty.call(modulesToProcess, key)) {
          const moduleContent = modulesToProcess[key]
          if (typeof moduleContent === 'function') {
            serializableResults[key] = 'function'
          } else if (typeof moduleContent === 'object' && moduleContent !== null) {
            const mod = moduleContent
            serializableResults[key] = {
              type: 'object',
              hasName: 'name' in mod ? typeof mod.name : undefined,
              hasProductName: 'productName' in mod ? typeof mod.productName : undefined,
              hasId: 'id' in mod ? typeof mod.id : undefined,
              isDefaultString: typeof mod.default === 'string',
              hasDeepData: 'deepData' in mod ? typeof mod.deepData : undefined,
            }
            // Ensure defaultType is added to the object directly
            if (mod.default && typeof mod.default === 'function') {
              serializableResults[key].defaultType = 'function'
            } else if (mod.default !== undefined) {
              serializableResults[key].defaultType = typeof mod.default
            }
          } else {
            serializableResults[key] = typeof moduleContent
          }
        }
      }
    }
    // If modulesToProcess is a function (e.g., lazy empty glob),
    // the loop above won't run, and serializableResults will remain {}, which is correct.

    console.log = originalConsoleLog
    process.stdout.write(JSON.stringify({ output: serializableResults, logs }))
  } catch (error) {
    console.log = originalConsoleLog
    console.error('Error in main-app.js during import type ', importType, '\n', error)
    process.stdout.write(
      JSON.stringify({ error: error.message, stack: error.stack, logs, importType }),
    )
    process.exit(1)
  }
}

run()
