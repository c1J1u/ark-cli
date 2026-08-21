#!/usr/bin/env node
/**
 * Build DSH plugin tarballs from an external source tree and this repo's metadata.
 *
 * The source code lives in a private repository; this public repo only stores
 * plugin metadata (package.json, cordis.patch.yml, README, LICENSE). This script
 * overlays the two trees in a temp directory, builds, and packs.
 *
 * Usage:
 *   node scripts/build.mjs <path-to-source-dsh-plugins>
 *
 * Example:
 *   node scripts/build.mjs /tmp/dsh-plugins-src
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const pluginsRoot = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const sourceRoot = process.argv[2]

if (!sourceRoot) {
  console.error('Usage: node scripts/build.mjs <path-to-source-dsh-plugins>')
  process.exit(1)
}

const distDir = path.join(pluginsRoot, 'dist')
const plugins = ['ark-plan-api', 'ark-managed-agents']

fs.mkdirSync(distDir, { recursive: true })

for (const plugin of plugins) {
  const srcDir = path.resolve(sourceRoot, plugin)
  const metaDir = path.join(pluginsRoot, plugin)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `dsh-build-${plugin}-`))

  console.log(`\n==> ${plugin} (working in ${tmpDir})`)

  // 1. Copy metadata from this repo (public)
  for (const file of ['package.json', 'cordis.patch.yml', 'README.md', 'LICENSE']) {
    const from = path.join(metaDir, file)
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(tmpDir, file))
    }
  }

  // 2. Copy source code from the private source tree
  if (plugin === 'ark-plan-api') {
    fs.copyFileSync(path.join(srcDir, 'index.js'), path.join(tmpDir, 'index.js'))
  } else if (plugin === 'ark-managed-agents') {
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'client'), { recursive: true })
    fs.copyFileSync(path.join(srcDir, 'src', 'index.ts'), path.join(tmpDir, 'src', 'index.ts'))
    fs.copyFileSync(path.join(srcDir, 'src', 'mcp-server.ts'), path.join(tmpDir, 'src', 'mcp-server.ts'))
    fs.copyFileSync(path.join(srcDir, 'client', 'client.js'), path.join(tmpDir, 'client', 'client.js'))
    fs.copyFileSync(path.join(srcDir, 'tsconfig.json'), path.join(tmpDir, 'tsconfig.json'))
  }

  // 3. Build TypeScript when needed
  if (plugin === 'ark-managed-agents') {
    console.log(`    installing build deps...`)
    execSync('npm install --ignore-scripts', { cwd: tmpDir, stdio: 'inherit' })
    console.log(`    compiling TypeScript...`)
    execSync('npx tsc -p tsconfig.json', { cwd: tmpDir, stdio: 'inherit' })
  }

  // 4. Pack
  console.log(`    packing...`)
  execSync('npm pack --pack-destination ' + distDir, { cwd: tmpDir, stdio: 'inherit' })
}

console.log(`\n==> packed to ${distDir}`)
