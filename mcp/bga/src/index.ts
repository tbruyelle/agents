#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

import * as sftp from './sftp.js';
import * as db from './database.js';
import { getFileResource, getSchemaResource, parseFileUri, parseSchemaUri } from './resources.js';

dotenv.config();

const server = new Server(
  {
    name: 'bga-studio',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'sftp_list',
        description: 'List files and directories at a path on BGA Studio',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path to list (e.g., "/mygame")',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'sftp_read',
        description: 'Read the contents of a file from BGA Studio',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to read (e.g., "/mygame/mygame.game.php")',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'sftp_write',
        description: 'Write or update a file on BGA Studio',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to write (e.g., "/mygame/mygame.game.php")',
            },
            content: {
              type: 'string',
              description: 'Content to write to the file',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'sftp_write_base64',
        description: 'Write a binary file (image, etc.) to BGA Studio using base64 encoding',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to write (e.g., "/mygame/img/board.jpg")',
            },
            content: {
              type: 'string',
              description: 'Base64-encoded content of the file',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'sftp_delete',
        description: 'Delete a file from BGA Studio',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to delete',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'sftp_mkdir',
        description: 'Create a directory on BGA Studio',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path to create',
            },
            recursive: {
              type: 'boolean',
              description: 'Create parent directories if they do not exist',
              default: true,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'db_query',
        description: 'Execute a read-only SQL query on BGA Studio database',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'SQL query to execute (SELECT, SHOW, or DESCRIBE only)',
            },
            database: {
              type: 'string',
              description: 'Database name to query',
            },
          },
          required: ['sql', 'database'],
        },
      },
      {
        name: 'db_tables',
        description: 'List all tables in a database',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'Database name',
            },
          },
          required: ['database'],
        },
      },
      {
        name: 'db_describe',
        description: 'Get the schema of a database table',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'Database name',
            },
            table: {
              type: 'string',
              description: 'Table name',
            },
          },
          required: ['database', 'table'],
        },
      },
    ],
  };
});

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'sftp_list': {
        const path = args?.path as string;
        const files = await sftp.listFiles(path);
        const formatted = files.map(f => {
          const typeIcon = f.type === 'd' ? '📁' : '📄';
          const size = f.type === '-' ? ` (${formatSize(f.size)})` : '';
          return `${typeIcon} ${f.name}${size}`;
        }).join('\n');
        return { content: [{ type: 'text', text: formatted || 'Empty directory' }] };
      }

      case 'sftp_read': {
        const path = args?.path as string;
        const content = await sftp.readFile(path);
        return { content: [{ type: 'text', text: content }] };
      }

      case 'sftp_write': {
        const path = args?.path as string;
        const content = args?.content as string;
        await sftp.writeFile(path, content);
        return { content: [{ type: 'text', text: `Successfully wrote to ${path}` }] };
      }

      case 'sftp_write_base64': {
        const path = args?.path as string;
        const content = args?.content as string;
        await sftp.writeFileBase64(path, content);
        return { content: [{ type: 'text', text: `Successfully wrote binary file to ${path}` }] };
      }

      case 'sftp_delete': {
        const path = args?.path as string;
        await sftp.deleteFile(path);
        return { content: [{ type: 'text', text: `Successfully deleted ${path}` }] };
      }

      case 'sftp_mkdir': {
        const path = args?.path as string;
        const recursive = args?.recursive as boolean ?? true;
        await sftp.mkdir(path, recursive);
        return { content: [{ type: 'text', text: `Successfully created directory ${path}` }] };
      }

      case 'db_query': {
        const sql = args?.sql as string;
        const database = args?.database as string;
        const rows = await db.query(sql, database);
        return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
      }

      case 'db_tables': {
        const database = args?.database as string;
        const tables = await db.listTables(database);
        const formatted = tables.map(t => `${t.name} (${t.engine}, ~${t.rows} rows)`).join('\n');
        return { content: [{ type: 'text', text: formatted || 'No tables found' }] };
      }

      case 'db_describe': {
        const database = args?.database as string;
        const table = args?.table as string;
        const columns = await db.describeTable(database, table);
        const formatted = columns.map(c => {
          let line = `${c.name}: ${c.type}`;
          if (c.key === 'PRI') line += ' PRIMARY KEY';
          else if (c.key === 'UNI') line += ' UNIQUE';
          else if (c.key === 'MUL') line += ' INDEX';
          if (!c.nullable) line += ' NOT NULL';
          if (c.default !== null) line += ` DEFAULT ${c.default}`;
          if (c.extra) line += ` ${c.extra}`;
          return line;
        }).join('\n');
        return { content: [{ type: 'text', text: formatted }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
});

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'bga://file/{path}',
        name: 'BGA Game Files',
        description: 'Access game files via SFTP (PHP, JS, CSS, SQL, etc.)',
        mimeType: 'text/plain',
      },
      {
        uri: 'bga://schema/{database}/{table}',
        name: 'Database Schema',
        description: 'Access database table schemas',
        mimeType: 'text/plain',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    const filePath = parseFileUri(uri);
    if (filePath) {
      const { content, mimeType } = await getFileResource(filePath);
      return {
        contents: [{ uri, text: content, mimeType }],
      };
    }

    const schemaInfo = parseSchemaUri(uri);
    if (schemaInfo) {
      const { content, mimeType } = await getSchemaResource(schemaInfo.database, schemaInfo.table);
      return {
        contents: [{ uri, text: content, mimeType }],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read resource: ${message}`);
  }
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Cleanup on exit
process.on('SIGINT', async () => {
  await sftp.closeConnection();
  await db.closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await sftp.closeConnection();
  await db.closeConnection();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BGA Studio MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
