const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Read metadata from the same modules loaded by routes/index.jsx. Components
// are not executed: the accepted syntax is deliberately limited and fails shut.
const directory = path.resolve(__dirname, '../client/src/routes');
const routes = fs.readdirSync(directory).filter(file => /^s.*\.jsx$/.test(file)).sort().flatMap(file => {
  const source = fs.readFileSync(path.join(directory, file), 'utf8')
    .replace(/^import .*;\r?$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/element\s*:\s*<[A-Za-z][^>]*\/>/g, 'element: null')
    .replace(/export default /g, 'globalThis.inventory = ');
  const context = {};
  vm.runInNewContext(source, context, { timeout: 1000, filename: file });
  if (!Array.isArray(context.inventory)) throw new Error(`Missing route array: ${file}`);
  return context.inventory.map(({ path, roles, public: isPublic }) => ({ path, roles, public: isPublic, source: file }));
});
const output = path.resolve(__dirname, '../docs/screenshots/audit/route-inventory.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(routes, null, 2) + '\n');
console.log(`Exported ${routes.length} routes from actual client metadata.`);
