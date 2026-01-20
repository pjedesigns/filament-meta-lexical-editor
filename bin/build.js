import esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

const args = new Set(process.argv.slice(2))
const isDev = args.has('--dev')
const isAnalyze = args.has('--analyze')

const distDir = path.resolve('resources/dist')
const manifestPath = path.join(distDir, 'manifest.json')

function ensureDistDir() {
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
    }
}

function cleanOldBuilds() {
    if (!fs.existsSync(distDir)) return

    const files = fs.readdirSync(distDir)
    const hashPattern = /^filament-meta-lexical-editor\.[A-Z0-9a-f]{8}\.(js|css)$/

    for (const file of files) {
        if (hashPattern.test(file)) {
            fs.unlinkSync(path.join(distDir, file))
            console.log(`Removed old build: ${file}`)
        }
    }
}

function writeManifest(partial) {
    ensureDistDir()

    const current = fs.existsSync(manifestPath)
        ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        : {}

    const merged = { ...current, ...partial }
    fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 2), 'utf8')
}

function now() {
    return new Date(Date.now()).toLocaleTimeString()
}

async function compile(options) {
    ensureDistDir()

    if (isDev) {
        writeManifest({
            js: 'filament-meta-lexical-editor.js',
            css: 'filament-meta-lexical-editor.css',
        })
    }

    const context = await esbuild.context(options)

    if (isDev) {
        await context.watch()
    } else {
        const result = await context.rebuild()

        if (result && result.metafile) {
            const outputs = Object.keys(result.metafile.outputs).map((p) => p.replace(/\\/g, '/'))

            const jsOut = outputs
                .map((p) => path.basename(p))
                .find((name) => name.startsWith('filament-meta-lexical-editor.') && name.endsWith('.js'))

            if (jsOut) {
                writeManifest({ js: jsOut })
            }
        }

        await context.dispose()
    }
}

const defaultOptions = {
    define: {
        'process.env.NODE_ENV': isDev ? `'development'` : `'production'`,
    },
    bundle: true,
    mainFields: ['module', 'main'],
    platform: 'neutral',
    treeShaking: true,
    target: ['es2020'],
    format: 'esm',
    sourcemap: isDev,
    sourcesContent: isDev,
    minify: !isDev,
    metafile: !isDev || isAnalyze,
    plugins: [
        {
            name: 'watchPlugin',
            setup(build) {
                build.onStart(() => {
                    const out = build.initialOptions.outfile ?? build.initialOptions.outdir ?? '(no output)'
                    console.log(`Build started at ${now()}: ${out}`)
                })

                build.onEnd(async (result) => {
                    const out = build.initialOptions.outfile ?? build.initialOptions.outdir ?? '(no output)'

                    if (result.errors.length > 0) {
                        console.log(`Build failed at ${now()}: ${out}`, result.errors)
                        return
                    }

                    console.log(`Build finished at ${now()}: ${out}`)

                    if (isDev) {
                        writeManifest({
                            js: 'filament-meta-lexical-editor.js',
                            css: 'filament-meta-lexical-editor.css',
                        })
                    }

                    if (isAnalyze && result.metafile) {
                        const text = await esbuild.analyzeMetafile(result.metafile, { verbose: true })
                        fs.writeFileSync(path.join(distDir, 'meta-lexical-editor.analyze.txt'), text, 'utf8')
                        console.log('Wrote resources/dist/meta-lexical-editor.analyze.txt')
                    }
                })
            },
        },
    ],
}

if (isDev) {
    await compile({
        ...defaultOptions,
        entryPoints: ['./resources/js/index.ts'],
        outfile: './resources/dist/filament-meta-lexical-editor.js',
    })
} else {
    // Clean old hashed builds before creating new ones
    cleanOldBuilds()

    await compile({
        ...defaultOptions,
        entryPoints: ['./resources/js/index.ts'],
        outdir: './resources/dist',
        entryNames: 'filament-meta-lexical-editor.[hash]',
    })
}
