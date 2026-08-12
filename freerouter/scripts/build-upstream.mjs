import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const root = new URL('..', import.meta.url)
const packageDir = new URL('../node_modules/freerouter/', import.meta.url)
const buildRoot = fileURLToPath(new URL('../.build/', import.meta.url))
await mkdir(buildRoot, { recursive: true })
const temporaryDir = await mkdtemp(join(buildRoot, 'freerouter-build-'))

try {
  await exec('git', ['clone', '--depth', '1', 'https://github.com/takkekatechie/FreeRouter.git', temporaryDir], {
    cwd: root,
    maxBuffer: 10 * 1024 * 1024,
  })
  await exec('npm', ['install', '--include=dev', '--ignore-scripts', '--no-package-lock'], {
    cwd: temporaryDir,
    maxBuffer: 10 * 1024 * 1024,
  })
  await exec('node', ['node_modules/tsup/dist/cli-default.js'], {
    cwd: temporaryDir,
    maxBuffer: 10 * 1024 * 1024,
  })
  await cp(new URL('dist/', `file://${temporaryDir}/`), new URL('dist/', packageDir), { recursive: true })

  const distDir = fileURLToPath(new URL('../node_modules/freerouter/dist/', import.meta.url))
  const chunkFiles = await readdir(distDir)
  let baseProviderChunk
  for (const file of chunkFiles) {
    if (!file.startsWith('chunk-') || !file.endsWith('.js')) continue
    if ((await readFile(join(distDir, file), 'utf8')).includes('var BaseProvider = class')) {
      baseProviderChunk = file
      break
    }
  }

  if (baseProviderChunk === undefined) {
    throw new Error('[FreeRouter] Built package does not contain BaseProvider')
  }

  const chunkPath = join(distDir, baseProviderChunk)
  const chunkSource = await readFile(chunkPath, 'utf8')
  if (!chunkSource.includes('export { BaseProvider }')) {
    await writeFile(chunkPath, `${chunkSource}\nexport { BaseProvider }\n`, 'utf8')
  }

  const providerIndex = join(distDir, 'providers/index.js')
  const providerIndexSource = await readFile(providerIndex, 'utf8')
  await writeFile(
    providerIndex,
    `${providerIndexSource}\nexport { BaseProvider } from '../${baseProviderChunk}'\n`,
    'utf8',
  )

  const rootIndex = join(distDir, 'index.js')
  const rootIndexSource = await readFile(rootIndex, 'utf8')
  await writeFile(
    rootIndex,
    `${rootIndexSource}\nexport { BaseProvider } from './${baseProviderChunk}'\n`,
    'utf8',
  )
} finally {
  await rm(temporaryDir, { recursive: true, force: true })
}
