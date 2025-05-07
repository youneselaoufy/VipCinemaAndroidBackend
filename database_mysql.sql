-- Script SQL pour créer les tables dans MySQL

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  profile_picture TEXT
);

CREATE TABLE films (
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
);

CREATE TABLE rentals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  film_id INT,
  rental_date TEXT,
  return_date TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (film_id) REFERENCES films(id)
);
