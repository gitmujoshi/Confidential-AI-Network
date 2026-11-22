const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../../..');

function namesIn(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return [...text.matchAll(/^(?:#\s*)?([A-Z][A-Z0-9_]+)\s*=/gm)].map((match) => match[1]);
}

describe('deployment hub lists every common env parameter', () => {
  const hub = fs.readFileSync(path.join(root, 'docs/deployment/README.md'), 'utf8');

  it.each([
    'config/examples/config.env.example',
    'secrets.env.example',
  ])('names every parameter from %s', (file) => {
    const missing = namesIn(file).filter((name) => !hub.includes(`\`${name}\``));
    expect(missing).toEqual([]);
  });
});
