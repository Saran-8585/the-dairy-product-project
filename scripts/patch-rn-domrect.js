const fs = require('fs');
const path = require('path');

const RN_DIR = path.resolve(__dirname, '..', 'node_modules', 'react-native');

function patchFile(relativePath, replacements) {
  const filePath = path.join(RN_DIR, relativePath);
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-rn-domrect] SKIP: ${relativePath} not found`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const { from, to } of replacements) {
    if (!content.includes(from)) {
      console.log(`[patch-rn-domrect] WARN: pattern not found in ${relativePath}: ${from.substring(0, 40)}`);
      continue;
    }
    content = content.replaceAll(from, to);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[patch-rn-domrect] PATCHED: ${relativePath}`);
}

// DOMRectReadOnly: replace private fields #x,#y,#width,#height with _x,_y,_width,_height
patchFile(
  'src/private/webapis/geometry/DOMRectReadOnly.js',
  [
    { from: '#x', to: '_x' },
    { from: '#y', to: '_y' },
    { from: '#width', to: '_width' },
    { from: '#height', to: '_height' },
  ],
);

// DOMRectList: replace private field #length with _length
patchFile(
  'src/private/webapis/geometry/DOMRectList.js',
  [{ from: '#length', to: '_length' }],
);
