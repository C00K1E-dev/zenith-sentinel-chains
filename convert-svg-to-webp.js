import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'genesisNFT.svg',
  'telegramSentinel.svg',
  'AIAuditNFT.svg',
  'aida.svg'
];

const assetsPath = './public/assets';

async function convertSvgToWebp(filename) {
  const inputPath = join(assetsPath, filename);
  const outputPath = join(assetsPath, filename.replace('.svg', '.webp'));
  
  console.log(`Converting ${filename}...`);
  
  try {
    await sharp(inputPath)
      .webp({ quality: 90, effort: 6 })
      .toFile(outputPath);
    
    const inputSize = (readFileSync(inputPath).length / 1024 / 1024).toFixed(2);
    const outputSize = (readFileSync(outputPath).length / 1024 / 1024).toFixed(2);
    
    console.log(`✓ ${filename}: ${inputSize}MB → ${outputSize}MB (${((1 - outputSize/inputSize) * 100).toFixed(1)}% reduction)`);
  } catch (err) {
    console.error(`✗ Failed to convert ${filename}:`, err.message);
  }
}

console.log('Starting SVG to WebP conversion...\n');

for (const file of files) {
  await convertSvgToWebp(file);
}

console.log('\nConversion complete! Update your code to use .webp extensions instead of .svg');
