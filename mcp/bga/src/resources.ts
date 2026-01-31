import { readFile } from './sftp.js';
import { describeTable } from './database.js';

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export async function getFileResource(path: string): Promise<{ content: string; mimeType: string }> {
  const content = await readFile(path);
  const mimeType = getMimeType(path);
  return { content, mimeType };
}

export async function getSchemaResource(database: string, table: string): Promise<{ content: string; mimeType: string }> {
  const columns = await describeTable(database, table);

  const schemaText = columns.map(col => {
    let line = `${col.name}: ${col.type}`;
    if (col.key === 'PRI') line += ' PRIMARY KEY';
    else if (col.key === 'UNI') line += ' UNIQUE';
    else if (col.key === 'MUL') line += ' INDEX';
    if (!col.nullable) line += ' NOT NULL';
    if (col.default !== null) line += ` DEFAULT ${col.default}`;
    if (col.extra) line += ` ${col.extra}`;
    return line;
  }).join('\n');

  return {
    content: `Table: ${database}.${table}\n\n${schemaText}`,
    mimeType: 'text/plain',
  };
}

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    'php': 'application/x-php',
    'js': 'application/javascript',
    'css': 'text/css',
    'sql': 'application/sql',
    'json': 'application/json',
    'html': 'text/html',
    'tpl': 'text/html',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
  };

  return mimeTypes[ext || ''] || 'text/plain';
}

export function parseFileUri(uri: string): string | null {
  const match = uri.match(/^bga:\/\/file\/(.+)$/);
  return match ? match[1] : null;
}

export function parseSchemaUri(uri: string): { database: string; table: string } | null {
  const match = uri.match(/^bga:\/\/schema\/([^/]+)\/(.+)$/);
  return match ? { database: match[1], table: match[2] } : null;
}
