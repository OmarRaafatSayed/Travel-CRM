import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enFilePath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');
const arFilePath = path.join(__dirname, 'src', 'i18n', 'locales', 'ar.json');

// Function to recursively set a value in a nested object
const set = (obj, p, value) => {
  const pathParts = p.split('.');
  let current = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (current[part] === undefined || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  const lastPart = pathParts[pathParts.length - 1];
  if (typeof current[lastPart] === 'object' && current[lastPart] !== null) {
    current[lastPart]['_'] = value;
  } else {
    current[lastPart] = value;
  }
};

// Function to recursively get a value from a nested object
const get = (obj, p) => {
  return p.split('.').reduce((acc, key) => acc && acc[key], obj);
};

// Function to get all .tsx files in src
const getSourceFiles = async () => {
  return await glob('src/**/*.tsx');
};

// Function to extract keys from files
const extractKeys = (files) => {
  const keys = new Set();
  const regex = /t\(['"]([a-z0-9_]+\.[a-z0-9_.]+[^'"]*)['"]\)/g;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1]);
    }
  });

  return Array.from(keys);
};

// Main function to manage translations
const manageTranslations = async () => {
  try {
    console.log('Starting translation management...');

    // 1. Extract keys
    const files = await getSourceFiles();
    const extractedKeys = extractKeys(files);
    console.log(`Found ${extractedKeys.length} unique keys.`);

    // 2. Read existing translation files
    const enData = JSON.parse(fs.readFileSync(enFilePath, 'utf-8'));
    const arData = JSON.parse(fs.readFileSync(arFilePath, 'utf-8'));

    // 3. Merge new keys and translate
    let enAdded = 0;
    let arAdded = 0;

    extractedKeys.forEach(key => {
      if (get(enData, key) === undefined) {
        set(enData, key, key.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        enAdded++;
      }
      if (get(arData, key) === undefined) {
        set(arData, key, '');
        arAdded++;
      }
    });

    console.log(`Added ${enAdded} new keys to en.json`);
    console.log(`Added ${arAdded} new keys to ar.json`);

    // 4. Write updated files
    fs.writeFileSync(enFilePath, JSON.stringify(enData, null, 2));
    fs.writeFileSync(arFilePath, JSON.stringify(arData, null, 2));

    console.log('Translation files updated successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
  }
};

manageTranslations();
