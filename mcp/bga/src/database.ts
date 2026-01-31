import mysql from 'mysql2/promise';

export interface DbConfig {
  host: string;
  user: string;
  password: string;
  database?: string;
}

export interface TableInfo {
  name: string;
  engine: string;
  rows: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  default: string | null;
  extra: string;
}

let connection: mysql.Connection | null = null;
let currentConfig: DbConfig | null = null;

function getConfig(): DbConfig {
  const host = process.env.BGA_DB_HOST;
  const user = process.env.BGA_DB_USER;
  const password = process.env.BGA_DB_PASSWORD;

  if (!host || !user || !password) {
    throw new Error('Missing database configuration. Please set BGA_DB_HOST, BGA_DB_USER, and BGA_DB_PASSWORD environment variables.');
  }

  return {
    host,
    user,
    password,
  };
}

async function getConnection(): Promise<mysql.Connection> {
  const config = getConfig();

  if (connection && currentConfig &&
      currentConfig.host === config.host &&
      currentConfig.user === config.user) {
    try {
      await connection.ping();
      return connection;
    } catch {
      connection = null;
    }
  }

  if (connection) {
    await connection.end();
  }

  connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
  });
  currentConfig = config;

  return connection;
}

export async function query(sql: string, database?: string): Promise<unknown[]> {
  const conn = await getConnection();

  // Only allow SELECT statements for safety
  const trimmedSql = sql.trim().toUpperCase();
  if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('SHOW') && !trimmedSql.startsWith('DESCRIBE')) {
    throw new Error('Only SELECT, SHOW, and DESCRIBE queries are allowed');
  }

  if (database) {
    await conn.query(`USE \`${database}\``);
  }

  const [rows] = await conn.query(sql);
  return rows as unknown[];
}

export async function listTables(database: string): Promise<TableInfo[]> {
  const conn = await getConnection();
  await conn.query(`USE \`${database}\``);

  const [rows] = await conn.query('SHOW TABLE STATUS');
  const tables = rows as Array<Record<string, unknown>>;

  return tables.map(table => ({
    name: table.Name as string,
    engine: table.Engine as string,
    rows: table.Rows as number,
  }));
}

export async function describeTable(database: string, table: string): Promise<ColumnInfo[]> {
  const conn = await getConnection();
  await conn.query(`USE \`${database}\``);

  const [rows] = await conn.query(`DESCRIBE \`${table}\``);
  const columns = rows as Array<Record<string, unknown>>;

  return columns.map(col => ({
    name: col.Field as string,
    type: col.Type as string,
    nullable: col.Null === 'YES',
    key: col.Key as string,
    default: col.Default as string | null,
    extra: col.Extra as string,
  }));
}

export async function listDatabases(): Promise<string[]> {
  const conn = await getConnection();
  const [rows] = await conn.query('SHOW DATABASES');
  const dbs = rows as Array<Record<string, string>>;
  return dbs.map(row => Object.values(row)[0]);
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
    currentConfig = null;
  }
}
