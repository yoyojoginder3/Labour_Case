import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');

// Permissive CORS and caching headers for reliable loading across all browsers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static assets from dist
app.use(express.static(distDir, {
  maxAge: '1h',
  etag: true
}));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Building application, please wait...');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`GSRTC Surat App running on port ${port}`);
});
