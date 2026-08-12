// =========================================================
// One-off migration runner:
//   1. Applies sql/schema.sql
//   2. Seeds the first admin account from .env
//
// Usage: npm run migrate
// =========================================================

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function migrate() {
  const schemaSql = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8'
  );

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log(`Connected to database: ${process.env.DB_NAME}`);

    console.log('Applying schema...');
    await connection.query(schemaSql);
    console.log('Schema applied successfully.');

    const [existingAdmins] = await connection.query(
      'SELECT id FROM admins LIMIT 1'
    );

    if (
      existingAdmins.length === 0 &&
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD
    ) {
      const saltRounds =
        Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

      const passwordHash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        saltRounds
      );

      await connection.query(
        `INSERT INTO admins
        (full_name, email, password_hash)
        VALUES (?, ?, ?)`,
        [
          'Portal Administrator',
          process.env.ADMIN_EMAIL,
          passwordHash
        ]
      );

      console.log(
        `Seeded admin account: ${process.env.ADMIN_EMAIL}`
      );
    } else {
      console.log(
        'Admin account already exists or ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping seed.'
      );
    }
  } finally {
    await connection.end();
  }
}

migrate()
  .then(() => {
    console.log('Migration complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });












// // =========================================================
// // One-off migration runner:
// //   1. Applies sql/schema.sql (creates the database/tables)
// //   2. Seeds the first admin account from .env, if none exist
// //
// // Usage:  npm run migrate
// // =========================================================
// require('dotenv').config();
// const fs = require('fs');
// const path = require('path');
// const mysql = require('mysql2/promise');
// const bcrypt = require('bcryptjs');

// async function migrate() {
//   const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

//   // A dedicated connection (not the app pool) so we can enable
//   // multipleStatements just for this one-off script.
//   const connection = await mysql.createConnection({
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT) || 3306,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     multipleStatements: true
//   });

//   try {
//     console.log('Applying schema...');
//     await connection.query(schemaSql);
//     console.log('Schema applied successfully.');

//     await connection.changeUser({ database: process.env.DB_NAME });

//     const [existingAdmins] = await connection.query('SELECT id FROM admins LIMIT 1');
//     if (existingAdmins.length === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
//       const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
//       const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, saltRounds);

//       await connection.query(
//         'INSERT INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)',
//         ['Portal Administrator', process.env.ADMIN_EMAIL, passwordHash]
//       );
//       console.log(`Seeded admin account: ${process.env.ADMIN_EMAIL}`);
//     } else {
//       console.log('Admin account already exists or ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping seed.');
//     }
//   } finally {
//     await connection.end();
//   }
// }

// migrate()
//   .then(() => {
//     console.log('Migration complete.');
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error('Migration failed:', err);
//     process.exit(1);
//   });
