const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const dbConfig = require('./config_mysql');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database MySQL
const connection = mysql.createConnection(dbConfig);
connection.connect(err => {
  if (err) {
    console.error("❌ MySQL connection error:", err.message);
    process.exit(1);
  }
  console.log("✅ MySQL connected!");
});

// Static files
app.use('/VIPCinema/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token is missing.' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token.' });
    req.user = decoded;
    next();
  });
};

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}${ext}`);
  }
});
const upload = multer({ storage });

// API Router
const apiRouter = express.Router();

// 🔹 Get all films
apiRouter.get('/films', (req, res) => {
  connection.query('SELECT * FROM films ORDER BY popularity DESC LIMIT 20', (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur récupération films.' });
    res.json(results);
  });
});

// 🔹 Register
apiRouter.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur recherche email.' });
    if (results.length > 0) return res.status(409).json({ message: 'Email déjà utilisé.' });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Erreur hash mot de passe.' });
      connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash], err => {
        if (err) return res.status(500).json({ message: 'Erreur enregistrement utilisateur.' });
        res.status(201).json({ message: 'Compte créé avec succès.' });
      });
    });
  });
});

// 🔹 Login
apiRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur.' });
    if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ message: 'Mot de passe incorrect.' });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: 'Connexion réussie.', token });
    });
  });
});

// 🔹 Rent a film
apiRouter.post('/rent', verifyToken, (req, res) => {
  const { filmId } = req.body;
  if (!filmId) return res.status(400).json({ message: 'ID du film requis.' });

  connection.query('SELECT COUNT(*) AS count FROM rentals WHERE user_id = ? AND return_date IS NULL', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur.' });

    if (results[0].count >= 5) return res.status(400).json({ message: 'Maximum 5 films loués.' });

    connection.query('SELECT * FROM rentals WHERE user_id = ? AND film_id = ? AND return_date IS NULL', [req.user.id, filmId], (err, rows) => {
      if (err) return res.status(500).json({ message: 'Erreur vérification location.' });
      if (rows.length > 0) return res.status(400).json({ message: 'Film déjà loué.' });

      connection.query('INSERT INTO rentals (user_id, film_id, rental_date) VALUES (?, ?, NOW())', [req.user.id, filmId], err => {
        if (err) return res.status(500).json({ message: 'Erreur location film.' });
        res.json({ message: 'Film loué avec succès.' });
      });
    });
  });
});

// 🔹 Return a film
apiRouter.post('/return', verifyToken, (req, res) => {
  const { filmId } = req.body;
  connection.query(
    'UPDATE rentals SET return_date = NOW() WHERE user_id = ? AND film_id = ? AND return_date IS NULL',
    [req.user.id, filmId],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Erreur retour film.' });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Aucune location active trouvée.' });
      res.json({ message: 'Film retourné avec succès.' });
    }
  );
});

// 🔹 View profile
apiRouter.get('/profile', verifyToken, (req, res) => {
  connection.query('SELECT name, email, profile_picture FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur.' });
    if (results.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(results[0]);
  });
});

// 🔹 Rented movies
apiRouter.get('/rented-movies', verifyToken, (req, res) => {
  connection.query(
    `SELECT f.id AS film_id, f.title, f.poster_path, r.rental_date
     FROM rentals r
     JOIN films f ON f.id = r.film_id
     WHERE r.user_id = ? AND r.return_date IS NULL
     ORDER BY r.rental_date DESC`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Erreur récupération films loués.' });
      res.json(results);
    }
  );
});

// 🔹 Upload profile picture
apiRouter.post('/upload-profile-picture', verifyToken, upload.single('profilePicture'), (req, res) => {
  const imagePath = `/uploads/${req.file.filename}`;
  connection.query('UPDATE users SET profile_picture = ? WHERE id = ?', [imagePath, req.user.id], err => {
    if (err) return res.status(500).json({ message: 'Erreur upload photo.' });
    res.json({ message: 'Photo de profil mise à jour.', path: imagePath });
  });
});

// 🔹 Update profile
apiRouter.put('/update-profile', verifyToken, (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Nom et email requis.' });

  const updateUser = () => {
    connection.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id], err => {
      if (err) return res.status(500).json({ message: 'Erreur mise à jour.' });
      res.json({ message: 'Profil mis à jour.' });
    });
  };

  if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Erreur hash mot de passe.' });
      connection.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id], err => {
        if (err) return res.status(500).json({ message: 'Erreur mise à jour mot de passe.' });
        updateUser();
      });
    });
  } else {
    updateUser();
  }
});

// Test API
apiRouter.get('/', (req, res) => {
  res.send('API is working!');
});

// Mount API
app.use('/VIPCinema/api', apiRouter);
app.use('/VIPCinema', express.static(path.join(__dirname)));

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
