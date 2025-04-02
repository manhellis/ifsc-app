# IFSC App

A full-stack application with Elysia backend, MongoDB database, and Vite React frontend.

## Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [MongoDB](https://www.mongodb.com/try/download/community) - NoSQL database

## Setup

1. Clone the repository
2. Install dependencies:

```bash
bun run install:all
```

This will install dependencies for the root project, client, and server.

## Environment Variables

Create a `.env` file in the server directory:

```env
# Server
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=ifsc-app
```

## Development

Run both client and server in development mode:

```bash
bun run dev
```

Run only the client:

```bash
bun run dev:client
```

Run only the server:

```bash
bun run dev:server
```

## Build

Build the client application:

```bash
bun run build
```

## Project Structure

```
ifsc-app/
├── client/            # React frontend
│   ├── public/        # Static files
│   ├── src/           # React source code
│   └── package.json   # Client dependencies
├── server/            # Elysia backend
│   ├── src/           # Server source code
│   │   ├── models/    # MongoDB models
│   │   ├── routes/    # API routes
│   │   ├── db.ts      # Database connection
│   │   └── index.ts   # Main server file
│   └── package.json   # Server dependencies
└── package.json       # Root dependencies and scripts
``` 