# Shared Types

This directory contains shared TypeScript interface definitions and types that are used across the client and server parts of the IFSC application.

## Usage

Import types from this directory using the path alias:

```typescript
import { IFSCDocument } from '@shared/types';
```

## Available Types

### IFSCDocument

Interface for IFSC document/event data:

```typescript
interface IFSCDocument {
  _id: string;         // Unique identifier
  title: string;       // Document title
  content: Record<string, unknown>; // Document content as a JSON object
  tags: string[];      // Array of tags associated with the document
  createdAt: string;   // Creation timestamp (ISO format)
  updatedAt: string;   // Last update timestamp (ISO format)
}
```

## Adding New Types

When adding new shared types:

1. Create a new file for your type definitions (e.g., `newType.ts`)
2. Export the interfaces/types from that file
3. Add an export statement in `index.ts` to re-export the new types
4. Document the new types in this README 