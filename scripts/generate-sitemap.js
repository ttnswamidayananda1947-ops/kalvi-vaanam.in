const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PROJECT_ID = "kalvi-vaanam-db";
const BASE_URL = "https://kalvivaanam.in";

async function run() {
  // சப்-கலெக்ஷன்களில் உள்ள அனைத்து 'pdfs' ஆவணங்களையும் எடுக்க Structured Query பயன்படுத்துகிறோம்
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: "pdfs" }]
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(queryBody)
  });
  
  const data = await res.json();

  let urls = "";
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item.document) {
        const f = item.document.fields;
        // உங்கள் டேட்டாபேஸில் உள்ள ஃபீல்ட் பெயர்கள் இங்கே சரியாக இருக்க வேண்டும்
        const className = f.class?.stringValue || "";
        const subject = encodeURIComponent(f.subject?.stringValue || "");
        const slug = f.slug?.stringValue || f.id?.stringValue || "";
        
        if (className && subject && slug) {
          urls += `
  <url>
    <loc>${BASE_URL}/download/${className}/${subject}/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }
      }
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}</loc><priority>1.0</priority></url>
  ${urls}
</urlset>`;

  fs.writeFileSync("./sitemap.xml", sitemap);
  console.log("Sitemap Updated with " + (data.length - 1) + " links!");
}

run();
