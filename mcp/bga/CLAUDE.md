# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MCP server for Board Game Arena Studio development. Provides SFTP tools for file management and MySQL tools for database queries, enabling AI assistants to help with BGA game development.

## Commands

```bash
npm run build    # Compile TypeScript to dist/
npm run start    # Run the MCP server
npm run dev      # Watch mode for development
```

Test with MCP inspector:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Architecture

```
src/
├── index.ts      # MCP server entry point, tool definitions and handlers
├── sftp.ts       # SFTP connection management and file operations
├── database.ts   # MySQL connection management and query functions
└── resources.ts  # Resource URI parsing and handlers
```

**index.ts** - Registers tools with the MCP SDK and routes tool calls to the appropriate module. Tools: `sftp_list`, `sftp_read`, `sftp_write`, `sftp_write_base64`, `sftp_delete`, `sftp_mkdir`, `db_query`, `db_tables`, `db_describe`.

**sftp.ts** - Maintains a singleton SFTP connection using ssh2-sftp-client. Reconnects automatically if config changes.

**database.ts** - Maintains a singleton MySQL connection. Only allows read-only queries (SELECT, SHOW, DESCRIBE) for safety.

## Configuration

Copy `.env.example` to `.env` and fill in BGA Studio credentials. The server reads these at runtime via dotenv.
