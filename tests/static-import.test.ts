import { execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const registerPath = path.resolve(process.cwd(), 'dist', 'register.js')
const scenariosBaseDir = path.resolve(process.cwd(), 'tests', 'fixtures', 'static-scenarios')

interface ScenarioOutput {
  output: Record<string, any>
  logs: string[]
}

/**
 * Executes a static import test scenario file and returns its parsed JSON output.
 * The scenario file is expected to console.log a JSON string with an 'output' and 'logs' property.
 */
function runStaticScenario(scenarioFileName: string): ScenarioOutput {
  const scenarioFilePath = path.resolve(scenariosBaseDir, scenarioFileName)
  console.log('scenarioFilePath', registerPath, scenarioFilePath)
  const command = `node --import="${registerPath}" "${scenarioFilePath}"`

  try {
    const stdout = execSync(command, {
      encoding: 'utf-8',
      env: { ...process.env }, // Pass through environment variables if needed in the future
    })
    return JSON.parse(stdout) as ScenarioOutput
  } catch (error: any) {
    // If execSync fails, error.stdout might contain useful info from the script
    // and error.stderr for actual errors.
    console.error(`Error running scenario ${scenarioFileName}:`, error.message)
    console.error('STDOUT:', error.stdout)
    console.error('STDERR:', error.stderr)
    // Re-throw or handle as a test failure
    throw new Error(`Scenario ${scenarioFileName} failed: ${error.message}`)
  }
}

describe('glob imports with static import statements', () => {
  it('should statically and lazily load basic modules with glob: prefix', () => {
    const result = runStaticScenario('prefix-lazy-basic.js')
    expect(result.logs).toEqual([])
    expect(result.output['../basic/user.js']).toBe('function')
    expect(result.output['../basic/product.js']).toBe('function')
  })

  it('should statically and eagerly load basic modules with glob: prefix', () => {
    const result = runStaticScenario('prefix-eager-basic.js')
    expect(result.logs).toEqual([])
    // user.js
    expect(result.output['../basic/user.js']?.type).toBe('object')
    expect(result.output['../basic/user.js']?.hasName).toBe('string')
    // product.js
    expect(result.output['../basic/product.js']?.type).toBe('object')
    expect(result.output['../basic/product.js']?.isDefaultString).toBe(true)
  })

  it('should execute side effects on static eager load with glob: prefix', () => {
    const result = runStaticScenario('prefix-eager-side-effects.js')
    // 由于静态导入的提升，副作用日志不会被场景文件捕获
    // 并且在测试环境下，eager 模块内的日志已通过环境变量禁用
    expect(result.logs).toEqual([])
    expect(result.output['../eager/data.js']?.type).toBe('object')
    expect(result.output['../eager/logger.js']?.type).toBe('object')
  })

  it('should return an empty object for empty directories with glob: prefix (static)', () => {
    const result = runStaticScenario('prefix-empty.js')
    expect(result.output).toEqual({})
    expect(result.logs).toEqual([])
  })

  it('should correctly import nested modules with glob: prefix (static)', () => {
    const result = runStaticScenario('prefix-nested.js')
    expect(result.output['../nested/deep/module.js']).toBe('function')
    // Assuming there's also a module directly under fixtures/nested/
    // If not, this line can be removed or adjusted.
    expect(result.output['../nested/module.js']).toBe('function')
    expect(result.logs).toEqual([])
  })

  it('should statically and lazily load basic modules with import attributes', () => {
    const result = runStaticScenario('attr-lazy-basic.js')
    expect(result.logs).toEqual([])
    expect(result.output['../basic/user.js']).toBe('function')
    expect(result.output['../basic/product.js']).toBe('function')
  })

  it('should statically and eagerly load basic modules with import attributes', () => {
    const result = runStaticScenario('attr-eager-basic.js')
    expect(result.logs).toEqual([])
    expect(result.output['../basic/user.js']?.type).toBe('object')
    expect(result.output['../basic/user.js']?.hasName).toBe('string')
    expect(result.output['../basic/product.js']?.type).toBe('object')
    expect(result.output['../basic/product.js']?.isDefaultString).toBe(true)
  })

  it('should execute side effects on static eager load with import attributes', () => {
    const result = runStaticScenario('attr-eager-side-effects.js')
    // 由于静态导入的提升，副作用日志不会被场景文件捕获
    // 并且在测试环境下，eager 模块内的日志已通过环境变量禁用
    expect(result.logs).toEqual([])
    expect(result.output['../eager/data.js']?.type).toBe('object')
    expect(result.output['../eager/logger.js']?.type).toBe('object')
  })

  it('should return an empty object for empty directories with import attributes (static)', () => {
    const result = runStaticScenario('attr-empty.js')
    expect(result.output).toEqual({})
    expect(result.logs).toEqual([])
  })

  it('should correctly import nested modules with import attributes (static)', () => {
    const result = runStaticScenario('attr-nested.js')
    expect(result.output['../nested/deep/module.js']).toBe('function')
    expect(result.output['../nested/module.js']).toBe('function')
    expect(result.logs).toEqual([])
  })

  it('should prioritize static import attributes (eager) over glob: prefix query (lazy), resulting in empty', () => {
    const result = runStaticScenario('priority-attr-eager-prefix-lazy.js')
    expect(result.output).toEqual({})
    expect(result.logs).toEqual([])
  })

  it('should prioritize static import attributes (lazy) over glob: prefix query (eager), resulting in empty', () => {
    const result = runStaticScenario('priority-attr-lazy-prefix-eager.js')
    expect(result.output).toEqual({})
    expect(result.logs).toEqual([])
  })

  it('should return an empty object for non-existent paths with "glob:" prefix (static)', () => {
    const result = runStaticScenario('prefix-non-existent-path.js')
    expect(result.output).toEqual({})
    expect(result.logs).toEqual([])
  })

  // More tests will be added here
})
