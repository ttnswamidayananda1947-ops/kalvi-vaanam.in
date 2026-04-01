const BASE_URL = 'https://kalvivaanam.in';

function generateSiteMap(pdfs) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${BASE_URL}</loc>
       <priority>1.0</priority>
     </url>
     ${pdfs.map(({ class: className, subject, slug }) => {
       return `
       <url>
           <loc>${`${BASE_URL}/download/${className}/${encodeURIComponent(subject)}/${slug}`}</loc>
           <changefreq>weekly</changefreq>
           <priority>0.7</priority>
       </url>
     `;
     }).join('')}
   </urlset>
 `;
}

// இதுதான் மேஜிக்: ஒவ்வொரு முறை கூகுள் இந்த பக்கத்தை அழைக்கும் போதும் 
// இது Firestore-ல் இருந்து லேட்டஸ்ட் டேட்டாவை எடுக்கும்.
export async function getServerSideProps({ res }) {
  const PROJECT_ID = "kalvi-vaanam-db";
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/pdfs?pageSize=1000`;

  const request = await fetch(url);
  const data = await request.json();
  const pdfs = data.documents ? data.documents.map(doc => ({
    class: doc.fields.class.stringValue,
    subject: doc.fields.subject.stringValue,
    slug: doc.fields.slug.stringValue
  })) : [];

  const sitemap = generateSiteMap(pdfs);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function SiteMap() {}
