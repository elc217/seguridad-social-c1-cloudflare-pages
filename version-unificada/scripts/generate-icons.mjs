import sharp from 'sharp';
import fs from 'fs';

const svgPath = './assets/libro.svg';
const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 1024, name: 'icon-1024x1024.png' }
];

try {
  for (const { size, name } of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(`./assets/${name}`);
    console.log(`Generated ${name}`);
  }
  console.log('All icons generated successfully');
} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
}
