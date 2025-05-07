// config_mysql.js
module.exports = {
  host:     process.env.DB_HOST
           || process.env.MYSQL_HOST
           || process.env.MYSQLHOST,
  user:     process.env.DB_USER
           || process.env.MYSQL_USER
           || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD
           || process.env.MYSQL_PASSWORD
           || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME
           || process.env.MYSQL_DATABASE
           || process.env.MYSQLDATABASE,
  port:     parseInt(
             process.env.DB_PORT
             || process.env.MYSQL_PORT
             || process.env.MYSQLPORT,
             10
           ) || 3306
};
