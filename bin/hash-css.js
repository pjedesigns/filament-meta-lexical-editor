import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const args = new Set(process.argv.slice(2))
const isDev = args.has('--dev')

const distDir = path.resolve('resources/dist')
const manifestPath = path.join(distDir, 'manifest.json')

function ensureDistDir() {
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
    }
}

function readManifest() {
    if (!fs.existsSync(manifestPath)) return {}
    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    } catch {
        return {}
    }
}

function writeManifest(partial) {
    ensureDistDir()
    const current = readManifest()
    const merged = { ...current, ...partial }
    fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 2), 'utf8')
}

ensureDistDir()

if (isDev) {
    writeManifest({
        css: 'filament-meta-lexical-editor.css',
    })
    console.log('Dev mode: manifest css set to filament-meta-lexical-editor.css')
    process.exit(0)
}

const cssFile = path.join(distDir, 'filament-meta-lexical-editor.css')

if (!fs.existsSync(cssFile)) {
    console.error('CSS file not found:', cssFile)
    process.exit(1)
}

const buf = fs.readFileSync(cssFile)
const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 8)
const hashedName = `filament-meta-lexical-editor.${hash}.css`
const hashedPath = path.join(distDir, hashedName)

fs.writeFileSync(hashedPath, buf)

writeManifest({ css: hashedName })

console.log('Wrote', `resources/dist/${hashedName}`, 'and updated manifest.json')
