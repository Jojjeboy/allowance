#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the new app name from command line arguments
const newName = process.argv[2];
if (!newName) {
  console.error('Usage: node scripts/rename-app.js <new-app-name>');
  process.exit(1);
}

// Capitalize the first letter for titles
const capitalizedName = newName.charAt(0).toUpperCase() + newName.slice(1);

// Function to replace in file
function replaceInFile(filePath, oldStr, newStr) {
  const fullPath = path.join(__dirname, '..', filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(fullPath, content);
    console.log(`Replaced in ${filePath}`);
  }
}

// Replace in package.json
replaceInFile('package.json', '"name": "boiler"', `"name": "${newName}"`);

// Replace in package-lock.json (both occurrences)
replaceInFile('package-lock.json', '"name": "boiler"', `"name": "${newName}"`);

// Replace in vite.config.ts
replaceInFile('vite.config.ts', "name: 'Vue Firebase Boilerplate'", `name: '${capitalizedName} App'`);
replaceInFile('vite.config.ts', "short_name: 'VueBoiler'", `short_name: '${capitalizedName}'`);
replaceInFile('vite.config.ts', "description: 'A minimalist Vue 3 Boilerplate with Firebase Auth'", `description: 'A ${capitalizedName} app with Vue 3 and Firebase Auth'`);
replaceInFile('vite.config.ts', "base: '/boiler/'", `base: '/${newName}/'`);

// Replace in index.html
replaceInFile('index.html', '<title>Vue Firebase Boilerplate</title>', `<title>${capitalizedName} App</title>`);

// Replace in src/views/LoginView.vue
replaceInFile('src/views/LoginView.vue', '<h1>Boilerplate App</h1>', `<h1>${capitalizedName} App</h1>`);
replaceInFile('src/views/LoginView.vue', 'This is a minimal boilerplate application using Vue 3 and Firebase Authentication. It', `This is the ${capitalizedName} application using Vue 3 and Firebase Authentication. It`);

console.log(`App renamed to "${newName}" successfully!`);
