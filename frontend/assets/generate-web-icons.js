const sharp = require('sharp');

const CREAM_COLOR = '#F5ECD9';
const MOSQUE_SOURCE = './mosque-reference.png';
const ICON_192_OUTPUT = './icon-192.png';
const ICON_512_OUTPUT = './icon-512.png';

async function generateWebIcons() {
  try {
    console.log('Generating web manifest icons...');

    // Generate 192x192 icon
    console.log('Generating icon-192.png...');
    const mosqueResized192 = await sharp(MOSQUE_SOURCE)
      .resize(144, 144, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const icon192 = await sharp({
      create: {
        width: 192,
        height: 192,
        channels: 3,
        background: CREAM_COLOR
      }
    })
    .composite([
      {
        input: mosqueResized192,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(ICON_192_OUTPUT);
    console.log('✅ icon-192.png created');

    // Generate 512x512 icon
    console.log('Generating icon-512.png...');
    const mosqueResized512 = await sharp(MOSQUE_SOURCE)
      .resize(384, 384, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const icon512 = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: CREAM_COLOR
      }
    })
    .composite([
      {
        input: mosqueResized512,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(ICON_512_OUTPUT);
    console.log('✅ icon-512.png created');

    console.log('\n✨ Web manifest icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating web icons:', error);
    process.exit(1);
  }
}

generateWebIcons();
