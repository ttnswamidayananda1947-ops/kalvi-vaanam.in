const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PROJECT_ID = "kalvi-vaanam-db";
const BASE_URL = "https://kalvivaanam.in";

async function run() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/pdfs?pageSize=1000`;
  const res = await fetch(url);
  const data = await res.json();

  let urls = "";
  if (data.documents) {
    data.documents.forEach(doc => {
      const f = doc.fields;
      const className = f.class.stringValue;
      const subject = encodeURIComponent(f.subject.stringValue);
      const slug = f.slug.stringValue;
      
      urls += `
  <url>
    <loc>${BASE_URL}/download/${className}/${subject}/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>
  ${urls}
</urlset>`;

  fs.writeFileSync("./sitemap.xml", sitemap);
  console.log("Sitemap Updated!");
}

run();
        
