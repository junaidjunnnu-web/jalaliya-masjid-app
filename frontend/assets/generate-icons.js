const sharp = require('sharp');
const fs = require('fs');

const CREAM_COLOR = '#F5ECD9';
const MOSQUE_SOURCE = './mosque-reference.png';
const ICON_OUTPUT = './icon.png';
const ADAPTIVE_ICON_OUTPUT = './adaptive-icon.png';
const SPLASH_OUTPUT = './splash.png';

async function generateIcons() {
  try {
    console.log('Reading mosque reference image...');
    const mosqueImage = sharp(MOSQUE_SOURCE);
    const mosqueMetadata = await mosqueImage.metadata();
    console.log(`Mosque image size: ${mosqueMetadata.width}x${mosqueMetadata.height}`);

    // Generate icon.png (1024x1024)
    console.log('Generating icon.png...');
    const iconSize = 1024;
    const icon = await sharp({
      create: {
        width: iconSize,
        height: iconSize,
        channels: 3,
        background: CREAM_COLOR
      }
    })
    .composite([
      {
        input: MOSQUE_SOURCE,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(ICON_OUTPUT);
    console.log('✅ icon.png created');

    // Generate adaptive-icon.png (1024x1024 with safe zone)
    console.log('Generating adaptive-icon.png...');
    const adaptiveSize = 1024;
    const safeZoneSize = Math.floor(adaptiveSize * 0.66); // 66% safe zone
    const mosqueResized = await sharp(MOSQUE_SOURCE)
      .resize(safeZoneSize, safeZoneSize, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const adaptiveIcon = await sharp({
      create: {
        width: adaptiveSize,
        height: adaptiveSize,
        channels: 3,
        background: CREAM_COLOR
      }
    })
    .composite([
      {
        input: mosqueResized,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(ADAPTIVE_ICON_OUTPUT);
    console.log('✅ adaptive-icon.png created');

    // Generate splash.png (larger for splash screen)
    console.log('Generating splash.png...');
    const splashSize = 1280;
    const splashMosqueSize = Math.floor(splashSize * 0.4); // Mosque takes up ~40% of splash
    const splashMosque = await sharp(MOSQUE_SOURCE)
      .resize(splashMosqueSize, splashMosqueSize, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const splash = await sharp({
      create: {
        width: splashSize,
        height: splashSize,
        channels: 3,
        background: CREAM_COLOR
      }
    })
    .composite([
      {
        input: splashMosque,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(SPLASH_OUTPUT);
    console.log('✅ splash.png created');

    console.log('\n✨ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
