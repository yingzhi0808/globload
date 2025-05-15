import { execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const registerPath = path.resolve(process.cwd(), 'dist', 'register.js')
const mainAppPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'main-app.js')

describe('glob imports with import attributes', () => {
  it('should lazily load basic modules using import attributes', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'attr_lazy_basic' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toEqual([])
    expect(result.output['./basic/user.js']).toBe('function')
    expect(result.output['./basic/product.js']).toBe('function')
  })

  it('should eagerly load basic modules using import attributes', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'attr_eager_basic' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toEqual([])
    expect(result.output['./basic/user.js']?.type).toBe('object')
    expect(result.output['./basic/user.js']?.hasName).toBe('string')
    expect(result.output['./basic/product.js']?.type).toBe('object')
    expect(result.output['./basic/product.js']?.isDefaultString).toBe(true)
  })

  it('should execute side effects on eager load with import attributes', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'attr_eager_side_effects' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toContain('Eager data.js loaded and executed')
    expect(result.logs).toContain('LOGGER: Eager logger.js initialized')
    expect(result.output['./eager/data.js']?.type).toBe('object')
    expect(result.output['./eager/logger.js']?.type).toBe('object')
  })

  it('should NOT execute side effects on lazy load with import attributes until called', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'attr_lazy_side_effects' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output['./eager/data.js']).toBe('function')
    expect(result.output['./eager/logger.js']).toBe('function')
    expect(result.logs).toContain('Eager data.js loaded and executed')
    expect(result.logs).toContain('LOGGER: Eager logger.js initialized')
  })

  it('should return an empty object for empty directories with import attributes', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'attr_empty' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output).toEqual({})
  })

  it('should correctly import nested modules with import attributes', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'attr_nested' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output['./nested/deep/module.js']).toBe('function')
  })

  it('should prioritize import attributes (eager) over glob prefix query (lazy)', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'priority_attr_over_prefix_eager' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toEqual([])
    expect(result.output).toEqual({})
  })

  it('should prioritize import attributes (lazy) over glob prefix query (eager)', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'priority_attr_over_prefix_lazy' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toEqual([])
    expect(result.output).toEqual({})
  })

  it('should return an empty object for non-existent paths with import attributes', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'attr_non_existent_path' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output).toEqual({})
    expect(result.logs).toEqual([])
  })
})
