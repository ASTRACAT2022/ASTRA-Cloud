const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/astra-cloud', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Модель конфига
const ConfigSchema = new mongoose.Schema({
  country: String,
  url: String,
  downloads: { type: Number, default: 0 },
});
const Config = mongoose.model('Config', ConfigSchema);

// API для получения конфигов
app.get('/api/configs', async (req, res) => {
  const configs = await Config.find();
  res.json(configs);
});

// API для входа админа
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'astracat' && password === 'astracat') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// API для загрузки конфига
app.post('/api/admin/upload', upload.single('config'), async (req, res) => {
  const config = new Config({
    country: req.file.originalname.split('.')[0],
    url: `/uploads/${req.file.filename}`,
  });
  await config.save();
  res.json(config);
});

module.exports = app;
