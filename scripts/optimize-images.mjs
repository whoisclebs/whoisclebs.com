import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import sharp from 'sharp'

const distDir = 'dist'
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

async function listImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const images = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      images.push(...await listImages(fullPath))
      continue
    }

    if (entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())) {
      images.push(fullPath)
    }
  }

  return images
}

async function optimizeImage(filePath) {
  const extension = extname(filePath).toLowerCase()
  const original = await readFile(filePath)
  let pipeline = sharp(original, { animated: true }).rotate()
  const metadata = await pipeline.metadata()

  if ((metadata.width ?? 0) > 1800) {
    pipeline = pipeline.resize({ width: 1800, withoutEnlargement: true })
  }

  const optimized = await (extension === '.png'
    ? pipeline.png({ compressionLevel: 9, effort: 10, palette: true, quality: 86 }).toBuffer()
    : extension === '.webp'
      ? pipeline.webp({ quality: 82, effort: 6 }).toBuffer()
      : pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer())

  if (optimized.length < original.length) {
    await writeFile(filePath, optimized)
    return original.length - optimized.length
  }

  return 0
}

try {
  await stat(distDir)
  const images = await listImages(distDir)
  const savedBytes = (await Promise.all(images.map(optimizeImage))).reduce((total, saved) => total + saved, 0)
  const savedKb = (savedBytes / 1024).toFixed(1)
  console.log(`Optimized ${images.length} images, saved ${savedKb} KiB`)
} catch (error) {
  if (error.code === 'ENOENT') {
    console.warn(`Skipping image optimization: ${distDir} does not exist`)
  } else {
    throw error
  }
}
