const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PROJECT_ID = "kalvi-vaanam-db";
const BASE_URL = "https://kalvivaanam.in";
const API_KEY = process.env.FIRESTORE_API_KEY;

const CLASS_SUBJECTS = {
  "6":  ["tamil","english","maths","science","social"],
  "7":  ["tamil","english","maths","science","social"],
  "8":  ["tamil","english","maths","science","social"],
  "9":  ["tamil","english","maths","science","social"],
  "10": ["tamil","english","maths","science","social"],
  "11": ["tamil","english","maths","physics","chemistry","computerscience"],
  "12": ["tamil","english","maths","physics","chemistry","computerscience"]
};

async function getPdfs(className, subject) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/classes/${className}/subjects/${subject}/pdfs?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.documents || [];
}

async function run() {
  let urls = "";
  let count = 0;

  for (const [className, subjects] of Object.entries(CLASS_SUBJECTS)) {
    for (const subject of subjects) {
      const docs = await getPdfs(className, subject);
      docs.forEach(doc => {
        const f = doc.fields;
        const slug = f?.slug?.stringValue || f?.id?.stringValue || "";
        if (slug) {
          urls += `
  <url>
    <loc>${BASE_URL}/download/${className}/${subject}/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          count++;
        }
      });
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>
  ${urls}
</urlset>`;

  fs.writeFileSync("./sitemap.xml", sitemap);
  console.log(`Sitemap Updated with ${count} PDF links!`);
}

run();
