// init_db.js (version MySQL)
const mysql = require('mysql2');
const config = require('./config_mysql');

const connection = mysql.createConnection(config);

connection.connect(err => {
  if (err) throw err;
  console.log('✅ Connexion MySQL établie.');

  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      profile_picture TEXT
    )`;

  const createFilms = `
    CREATE TABLE IF NOT EXISTS films (
      id INT PRIMARY KEY,
      title TEXT,
      overview TEXT,
      release_date TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      original_language TEXT,
      vote_average FLOAT,
      vote_count INT,
      popularity FLOAT,
      trailer_url TEXT
    )`;

  const createRentals = `
    CREATE TABLE IF NOT EXISTS rentals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      film_id INT,
      rental_date TEXT,
      return_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (film_id) REFERENCES films(id)
    )`;

  connection.query(createUsers, err => {
    if (err) throw err;
    console.log("✔ Table 'users' créée.");
  });

  connection.query(createFilms, err => {
    if (err) throw err;
    console.log("✔ Table 'films' créée.");
  });

  connection.query(createRentals, err => {
    if (err) throw err;
    console.log("✔ Table 'rentals' créée.");
  });

  connection.end();
});
