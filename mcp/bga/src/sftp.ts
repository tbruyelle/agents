import SftpClient from 'ssh2-sftp-client';

export interface SftpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface FileInfo {
  name: string;
  type: 'd' | '-' | 'l';
  size: number;
  modifyTime: number;
}

let sftpClient: SftpClient | null = null;
let currentConfig: SftpConfig | null = null;

function getConfig(): SftpConfig {
  const host = process.env.BGA_SFTP_HOST;
  const port = process.env.BGA_SFTP_PORT;
  const username = process.env.BGA_SFTP_USER;
  const password = process.env.BGA_SFTP_PASSWORD;

  if (!host || !port || !username || !password) {
    throw new Error('Missing SFTP configuration. Please set BGA_SFTP_HOST, BGA_SFTP_PORT, BGA_SFTP_USER, and BGA_SFTP_PASSWORD environment variables.');
  }

  return {
    host,
    port: parseInt(port, 10),
    username,
    password,
  };
}

async function getClient(): Promise<SftpClient> {
  const config = getConfig();

  if (sftpClient && currentConfig &&
      currentConfig.host === config.host &&
      currentConfig.username === config.username) {
    return sftpClient;
  }

  if (sftpClient) {
    await sftpClient.end();
  }

  sftpClient = new SftpClient();
  await sftpClient.connect({
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
  });
  currentConfig = config;

  return sftpClient;
}

export async function listFiles(path: string): Promise<FileInfo[]> {
  const client = await getClient();
  const list = await client.list(path);

  return list.map(item => ({
    name: item.name,
    type: item.type as 'd' | '-' | 'l',
    size: item.size,
    modifyTime: item.modifyTime,
  }));
}

export async function readFile(path: string): Promise<string> {
  const client = await getClient();
  const buffer = await client.get(path);

  if (Buffer.isBuffer(buffer)) {
    return buffer.toString('utf-8');
  }

  throw new Error('Unexpected response type from SFTP get');
}

export async function writeFile(path: string, content: string): Promise<void> {
  const client = await getClient();
  const buffer = Buffer.from(content, 'utf-8');
  await client.put(buffer, path);
}

export async function deleteFile(path: string): Promise<void> {
  const client = await getClient();
  await client.delete(path);
}

export async function mkdir(path: string, recursive: boolean = true): Promise<void> {
  const client = await getClient();
  await client.mkdir(path, recursive);
}

export async function exists(path: string): Promise<boolean> {
  const client = await getClient();
  return await client.exists(path) !== false;
}

export async function closeConnection(): Promise<void> {
  if (sftpClient) {
    await sftpClient.end();
    sftpClient = null;
    currentConfig = null;
  }
}
