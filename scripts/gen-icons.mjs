import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

const sizes = [180, 192, 512]
for (const size of sizes) {
  await sharp('public/favicon.svg', { density: 384 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`icon-${size}.png written`)
}

await sharp('public/favicon.svg', { density: 384 })
  .resize(180, 180)
  .flatten({ background: '#4740d4' })
  .png()
  .toFile('public/icons/apple-touch-icon.png')
console.log('apple-touch-icon.png written')
