const { writeFile, mkdir, stat } = require('fs/promises');
const path = require('path');
const https = require('https');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const TARGET_FILE = path.join(PUBLIC_DIR, 'nz-spot-data.csv');
const BASE_URL = 'https://emidatasets.blob.core.windows.net/publicdata/Datasets/Wholesale/DispatchAndPricing/FinalEnergyPrices';
const MAX_DAYS_BACK = 14;

function formatNZDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

async function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function ensureDirectory(dir) {
  try {
    await stat(dir);
  } catch (error) {
    await mkdir(dir, { recursive: true });
  }
}

async function main() {
  await ensureDirectory(PUBLIC_DIR);

  const today = new Date();
  let fileContent = null;
  let downloadedUrl = null;

  for (let offset = 0; offset <= MAX_DAYS_BACK; offset += 1) {
    const day = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000);
    const dateKey = formatNZDate(day);
    const fileName = `${dateKey}_FinalEnergyPrices.csv`;
    const url = `${BASE_URL}/${fileName}`;

    process.stdout.write(`Checking ${url}... `);
    const content = await fetchCsv(url);
    if (content) {
      process.stdout.write('FOUND\n');
      fileContent = content;
      downloadedUrl = url;
      break;
    }
    process.stdout.write('NOT FOUND\n');
  }

  if (!fileContent) {
    throw new Error(`Could not download any NZ spot data file from the last ${MAX_DAYS_BACK + 1} days.`);
  }

  await writeFile(TARGET_FILE, fileContent);
  console.log(`Saved NZ spot data to ${TARGET_FILE}`);
  console.log(`Source file: ${downloadedUrl}`);
}

main().catch(error => {
  console.error('ERROR:', error.message || error);
  process.exit(1);
});
