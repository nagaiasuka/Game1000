// CocoaPods captures Node's UTF-8 path as binary. Decode it before the
// Hermes podspec uses it in a project path containing Japanese characters.
// RN 0.86 already fixes local file URLs; only the Hermes output needs fixing.
const fs = require('node:fs');
const path = require('node:path');
const root = path.dirname(require.resolve('react-native/package.json'));
const file = path.join(root, 'sdks', 'hermes-engine', 'hermes-engine.podspec');
const source = fs.readFileSync(file, 'utf8');
const before = '__dir__]).strip';
const after = '__dir__]).force_encoding(Encoding::UTF_8).strip';

if (source.includes(before)) {
  fs.writeFileSync(file, source.replaceAll(before, after));
  console.log('Fixed Hermes Unicode path handling for local iOS builds.');
} else if (!source.includes(after)) {
  throw new Error('Review the Hermes Unicode path workaround after updating React Native.');
}
