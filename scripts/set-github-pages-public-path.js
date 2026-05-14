const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

appJson.expo.web = appJson.expo.web || {};
appJson.expo.web.publicPath = '/Segeluhr/';

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log('Set expo.web.publicPath to /Segeluhr/ for GitHub Pages build.');
