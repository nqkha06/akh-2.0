import { cp, mkdir, rm } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const packageEntry = require.resolve("vscode-material-icons")
const sourceDirectory = resolve(
  dirname(packageEntry),
  "../generated/icons",
)
const targetDirectory = resolve(appRoot, "public/file-icons")

await rm(targetDirectory, { force: true, recursive: true })
await mkdir(targetDirectory, { recursive: true })
await cp(sourceDirectory, targetDirectory, { recursive: true })

console.log("Synced Material file icons to public/file-icons.")
