/**
 * PWA Icon Generator Script
 * 
 * Run this script to generate PWA icons in all required sizes.
 * Uses a simple gradient design with the MindPal logo.
 * 
 * Requirements: sharp package
 * Install: npm install sharp
 * Run: node generate-icons.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon
function generateSVG(size) {
  const fontSize = Math.floor(size * 0.5);
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central"
  >🧠</text>
</svg>`;
  return svg;
}

// Generate icons for all sizes
console.log('🎨 Generating PWA icons...\n');

sizes.forEach(size => {
  const svg = generateSVG(size);
  
  // For this simple version, we'll just save SVG files
  // In production, you'd want to convert to PNG using sharp or similar
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);
  
  fs.writeFileSync(svgFilepath, svg);
  console.log(`✓ Generated ${svgFilename}`);
});

console.log('\n✅ Icon generation complete!');
console.log('📝 Note: For production, convert SVG to PNG using:');
console.log('   npm install sharp');
console.log('   // Then use sharp to convert SVG to PNG\n');

// Generate a simple HTML file to view icons
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>MindPal PWA Icons</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    h1 { color: #6366f1; }
    .icons { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
    .icon-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .icon-card img { width: 100%; max-width: 128px; height: auto; }
    .icon-card p { margin: 10px 0 0; color: #666; }
  </style>
</head>
<body>
  <h1>🧠 MindPal PWA Icons</h1>
  <p>All icon sizes generated for Progressive Web App</p>
  <div class="icons">
    ${sizes.map(size => `
      <div class="icon-card">
        <img src="icon-${size}x${size}.svg" alt="${size}x${size}">
        <p>${size}x${size}px</p>
      </div>
    `).join('')}
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(iconsDir, 'preview.html'), htmlContent);
console.log('🎨 Preview file created: public/icons/preview.html\n');
