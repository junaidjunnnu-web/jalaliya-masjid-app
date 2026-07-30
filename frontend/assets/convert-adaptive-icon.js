const sharp = require('sharp');
const fs = require('fs');

// Read the adaptive SVG file
const svgBuffer = fs.readFileSync('./assets/adaptive-icon.svg');

// Convert SVG to PNG at 1024x1024 for adaptive icon
sharp(svgBuffer)
  .resize(1024, 1024)
  .png()
  .toFile('./assets/adaptive-icon.png')
  .then(() => {
    console.log('Adaptive icon converted successfully to adaptive-icon.png');
  })
  .catch(err => {
    console.error('Error converting adaptive icon:', err);
  });
