const dotenv = require("dotenv");

dotenv.config();

const DB_URL =
  process.env.DB_URL ||
  "postgres://postgres:postgres@localhost:5432/medusa_db";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  plugins: [
    "medusa-payment-manual",
    // NOTA: @medusajs/admin se instala con el comando manual descrito en docs/
    // Una vez instalado correctamente, descomenta el bloque siguiente:
    // {
    //   resolve: "@medusajs/admin",
    //   options: {
    //     serve: true,
    //     autoRebuild: false,
    //     path: "app",
    //     outDir: "build/admin",
    //     backend: process.env.BACKEND_URL || "http://localhost:9000",
    //   },
    // },
  ],
  projectConfig: {
    database_url: DB_URL,
    database_type: "postgres",
    redis_url: REDIS_URL,
    store_cors: process.env.STORE_CORS || "http://localhost:3000",
    admin_cors: process.env.ADMIN_CORS || "http://localhost:7001",
    jwt_secret: process.env.JWT_SECRET || "supersecret",
    cookie_secret: process.env.COOKIE_SECRET || "supersecret",
  },
  modules: {
    eventBus: {
      resolve: "@medusajs/event-bus-redis",
      options: {
        redisUrl: REDIS_URL,
      },
    },
    cacheService: {
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl: REDIS_URL,
        ttl: 30,
      },
    },
  },
};
