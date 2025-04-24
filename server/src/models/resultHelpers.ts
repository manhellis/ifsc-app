import { getFullResults } from './fullResults';
import { FullResult } from '../../../shared/types';
import { Top3Podium } from '../../../shared/types/Prediction';

/**
 * Get top 3 podium result from a category's ranking
 * 
 * @param ranking The ranking array from a full result
 * @returns Top3Podium object or null if not enough ranked athletes
 */
function extractPodiumFromRanking(ranking: FullResult['ranking']): Top3Podium | null {
  if (!ranking || ranking.length < 3) {
    return null;
  }
  
  // No need to sort as ranking is already ordered by rank
  const sortedRanking = ranking;
  
  // Get the top 3 athletes
  return {
    first: sortedRanking[0].athlete_id.toString(),
    second: sortedRanking[1].athlete_id.toString(),
    third: sortedRanking[2].athlete_id.toString()
  };
}

/**
 * Get all category results for an event
 * 
 * @param eventId Numeric event ID
 * @returns Array of category results with podium data
 */
export async function getAllCategoryResults(eventId: string): Promise<Array<{
  categoryId: number;
  categoryName: string;
  podium: Top3Podium | null;
}>> {
  // Get all full results for this event
  const fullResults = await getFullResults(eventId);
  if (!fullResults.length) {
    return [];
  }
  
  // Process each category
  return fullResults.map(result => {
    return {
      categoryId: result.cid,
      categoryName: result.dcat,
      podium: extractPodiumFromRanking(result.ranking)
    };
  });
} 