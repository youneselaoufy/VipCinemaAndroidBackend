// config_mysql.js
module.exports = {
  host:     process.env.DB_HOST     // if you manually set it…
           || process.env.MYSQL_HOST || process.env.MYSQL_HOST.toLowerCase(), 
  user:     process.env.DB_USER     || process.env.MYSQL_USER,
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME     || process.env.MYSQL_DATABASE,
  port:     parseInt(
             process.env.DB_PORT   || process.env.MYSQL_PORT,
             10
           ) || 3306
};
