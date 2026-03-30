import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.internal')
    ? false
    : { rejectUnauthorized: false },
})

// Prevent unhandled pool errors from crashing the process
pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message)
})

export const db = drizzle(pool, { schema })
export { schema }
