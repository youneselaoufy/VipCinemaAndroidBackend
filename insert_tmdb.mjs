// insert_tmdb.mjs (version MySQL)
import fetch from 'node-fetch';
import mysql from 'mysql2/promise';
import config from './config_mysql.js';

const API_KEY = '17f97fb3319b9e6f62ffe6a5eb45087a';

async function fetchTrailerUrl(movieId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await res.json();

    const trailer = data.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : "";
  } catch (error) {
    console.error(`Erreur trailer pour movieId ${movieId}:`, error.message);
    return "";
  }
}

async function fetchAndInsertMovies() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=fr-FR&page=1`);
    const data = await res.json();
    const movies = data.results;

    console.log("Nombre de films récupérés :", movies.length);

    const conn = await mysql.createConnection(config);

    const insertQuery = `
      REPLACE INTO films (
        id, title, overview, release_date, poster_path, backdrop_path,
        original_language, vote_average, vote_count, popularity, trailer_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const movie of movies) {
      const trailerUrl = await fetchTrailerUrl(movie.id);

      await conn.execute(insertQuery, [
        movie.id,
        movie.title,
        movie.overview,
        movie.release_date,
        movie.poster_path,
        movie.backdrop_path,
        movie.original_language,
        movie.vote_average,
        movie.vote_count,
        movie.popularity,
        trailerUrl
      ]);
    }

    console.log("✅ Films insérés avec succès dans MySQL !");
    await conn.end();
  } catch (error) {
    console.error("Erreur lors de l'insertion TMDb:", error.message);
  }
}

fetchAndInsertMovies();
