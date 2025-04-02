/**
 * Interface for IFSC documents/events
 */
export interface IFSCDocument {
  _id: string;
  title: string;
  content: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
} 