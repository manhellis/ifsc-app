/**
 * Shared type definitions for the IFSC application
 * This file serves as the central export point for all shared interfaces
 */

export * from './ifscDocument';
export * from './events';
// Re-export with different name to avoid naming collision
export type { CategoryRound as ResultCategoryRound } from './fullResults';
// Export other types from fullResults
export type { RankingEntry, FullResult } from './fullResults';
export * from './Prediction';
export * from './userTypes';