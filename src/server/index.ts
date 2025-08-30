import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import db from './database';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message: Buffer) => {
    // When a message is received, broadcast it to all clients.
    console.log('received: %s', message);
    broadcast(message.toString());
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// API endpoints
app.get('/api/screens', (req, res) => {
  const screens = db.prepare('SELECT * FROM screens').all();
  res.json(screens);
});

interface ErrorWithCode {
  code: string;
}

const hasCode = (error: unknown): error is ErrorWithCode => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

app.post('/api/screens', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Screen name is required' });
  }
  try {
    const stmt = db.prepare('INSERT INTO screens (name) VALUES (?)');
    const info = stmt.run(name);
    res.status(201).json({ id: info.lastInsertRowid, name });
  } catch (error: unknown) {
    if (hasCode(error) && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Screen name already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Media API endpoints
app.get('/api/media', (req, res) => {
  try {
    const media = db.prepare('SELECT * FROM media').all();
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/media', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { originalname, mimetype, filename } = req.file;

  try {
    const stmt = db.prepare('INSERT INTO media (name, type, path) VALUES (?, ?, ?)');
    const info = stmt.run(originalname, mimetype, `/uploads/${filename}`);
    res.status(201).json({ id: info.lastInsertRowid, name: originalname, type: mimetype, path: `/uploads/${filename}` });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/media/:id', (req, res) => {
  const { id } = req.params;
  try {
    // First, get the file path from the database
    const file = db.prepare('SELECT path FROM media WHERE id = ?').get(id) as { path: string };
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Then, delete the file from the filesystem
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Finally, delete the record from the database
    const stmt = db.prepare('DELETE FROM media WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes > 0) {
      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found in database' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export const broadcast = (message: string) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
};
