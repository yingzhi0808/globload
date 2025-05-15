import { execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const registerPath = pathToFileURL(path.resolve(process.cwd(), 'dist', 'register.js')).toString()
const mainAppPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'main-app.js')

describe('glob imports with "glob:" prefix', () => {
  it('should lazily load basic modules', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'prefix_lazy_basic' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toEqual([])
    expect(result.output['./basic/user.js']).toBe('function')
    expect(result.output['./basic/product.js']).toBe('function')
  })

  it('should eagerly load basic modules', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'prefix_eager_basic' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toEqual([])
    expect(result.output['./basic/user.js']?.type).toBe('object')
    expect(result.output['./basic/user.js']?.hasName).toBe('string')
    expect(result.output['./basic/product.js']?.type).toBe('object')
    expect(result.output['./basic/product.js']?.isDefaultString).toBe(true)
  })

  it('should execute side effects on eager load for modules in eager/ directory', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'prefix_eager_side_effects' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.logs).toContain('Eager data.js loaded and executed')
    expect(result.logs).toContain('LOGGER: Eager logger.js initialized')
    expect(result.output['./eager/data.js']?.type).toBe('object')
    expect(result.output['./eager/logger.js']?.type).toBe('object')
  })

  it('should not execute side effects on lazy load until module function is called', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'prefix_lazy_side_effects' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output['./eager/data.js']).toBe('function')
    expect(result.output['./eager/logger.js']).toBe('function')
    expect(result.logs).toContain('Eager data.js loaded and executed')
    expect(result.logs).toContain('LOGGER: Eager logger.js initialized')
  })

  it('should return an empty object for empty directories', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'prefix_empty' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output).toEqual({})
  })

  it('should correctly import nested modules', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'prefix_nested' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output['./nested/deep/module.js']).toBe('function')
  })

  it('should return an empty object for non-existent paths with "glob:" prefix', async () => {
    const stdout = execSync(`node --import="${registerPath}" "${mainAppPath}"`, {
      env: { ...process.env, GLOB_IMPORT_TYPE: 'prefix_non_existent_path' },
    })
    const result = JSON.parse(stdout.toString())
    expect(result.output).toEqual({})
    expect(result.logs).toEqual([])
  })
})
