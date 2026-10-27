import sharp from 'sharp';

const bgColor = '#F5F9FC';
const sizes = [
  { width: 2732, height: 2732, name: 'splash-2732x2732.png' },
  { width: 1792, height: 1792, name: 'splash-1792x1792.png' }
];

try {
  for (const { width, height, name } of sizes) {
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: bgColor
      }
    })
    .png()
    .toFile(`./assets/${name}`);
    console.log(`Generated ${name}`);
  }
  console.log('All splash screens generated successfully');
} catch (error) {
  console.error('Error generating splash screens:', error);
  process.exit(1);
}
