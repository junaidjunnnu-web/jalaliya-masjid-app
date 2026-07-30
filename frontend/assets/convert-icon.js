const sharp = require('sharp');
const fs = require('fs');

// Read the SVG file
const svgBuffer = fs.readFileSync('./assets/icon.svg');

// Convert SVG to PNG at 1024x1024
sharp(svgBuffer)
  .resize(1024, 1024)
  .png()
  .toFile('./assets/icon.png')
  .then(() => {
    console.log('Icon converted successfully to icon.png');
  })
  .catch(err => {
    console.error('Error converting icon:', err);
  });
