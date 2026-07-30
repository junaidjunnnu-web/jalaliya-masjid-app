require('dotenv').config();
const express = require('express');
const cors = require('cors');

const familyRoutes = require('./routes/families');
const committeeRoutes = require('./routes/committee');
const madrasaRoutes = require('./routes/madrasa');
const namazRoutes = require('./routes/namaz');
const announcementRoutes = require('./routes/announcements');
const eventRoutes = require('./routes/events');
const galleryRoutes = require('./routes/gallery');
const collectionRoutes = require('./routes/collections');
const expenseRoutes = require('./routes/expenses');
const feeRoutes = require('./routes/fees');
const duesRoutes = require('./routes/dues');

const app = express();

// CORS configuration for Vercel web app and native app
app.use(cors({
  origin: [
    'https://jalaliya-masjid-app.vercel.app',
    'https://*.vercel.app',
    'exp://*',
    'http://localhost:*',
    'http://192.168.*:*',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jalaliya Juma Masjid API is running' });
});

// Routes
app.use('/api/families', familyRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/madrasa', madrasaRoutes);
app.use('/api/namaz', namazRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dues', duesRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Jalaliya Juma Masjid API running on port ${PORT}`);
});
