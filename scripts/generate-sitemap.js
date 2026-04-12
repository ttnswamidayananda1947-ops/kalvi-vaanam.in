const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PROJECT_ID = "kalvi-vaanam-db";
const BASE_URL = "https://kalvivaanam.in";
const API_KEY = process.env.FIRESTORE_API_KEY;
const URLS_PER_FILE = 1000;

const CLASS_SUBJECTS = {
  "6":  ["tamil","english","maths","science","social"],
  "7":  ["tamil","english","maths","science","social"],
  "8":  ["tamil","english","maths","science","social"],
  "9":  ["tamil","english","maths","science","social"],
  "10": ["tamil","english","maths","science","social"],
  "11": ["tamil","english","maths","physics","chemistry","computerscience","computer application","accountancy","statistics","biology"],
  "12": ["tamil","english","maths","physics","chemistry","computerscience","computer application","accountancy","statistics","biology"]
};

async function getAllPdfs(className, subject) {
  let allDocs = [];
  let nextPageToken = null;
  do {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/classes/${className}/subjects/${encodeURIComponent(subject)}/pdfs?key=${API_KEY}&pageSize=300`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.documents) allDocs = allDocs.concat(data.documents);
    nextPageToken = data.nextPageToken || null;
  } while (nextPageToken);
  return allDocs;
}

async function run() {
  let allUrls = [`  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>`];

  for (const [className, subjects] of Object.entries(CLASS_SUBJECTS)) {
    for (const subject of subjects) {
      const docs = await getAllPdfs(className, subject);
      docs.forEach(doc => {
        const f = doc.fields;
        const slug = f?.slug?.stringValue || f?.id?.stringValue || "";
        if (slug) {
          allUrls.push(`  <url>
    <loc>${BASE_URL}/download/${className}/${encodeURIComponent(subject)}/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
        }
      });
    }
  }

  const chunks = [];
  for (let i = 0; i < allUrls.length; i += URLS_PER_FILE) {
    chunks.push(allUrls.slice(i, i + URLS_PER_FILE));
  }

  chunks.forEach((chunk, index) => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk.join('\n')}
</urlset>`;
    fs.writeFileSync(`./sitemap-${index + 1}.xml`, content);
  });

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks.map((_, i) => `  <sitemap>
    <loc>${BASE_URL}/sitemap-${i + 1}.xml</loc>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  fs.writeFileSync('./sitemap.xml', sitemapIndex);
  console.log(`Done! ${chunks.length} sitemap files, ${allUrls.length} total URLs!`);
}

run();
