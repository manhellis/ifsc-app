// scoring.ts
import { PointsByPlace } from "@shared/types/Prediction";
import { Top3Podium, PodiumScoreDetail } from "@shared/types/Prediction";

export function calculatePodiumScore(
    actual: Top3Podium,
    guess: Top3Podium,
    rules: { exact: PointsByPlace, inPodium?: PointsByPlace }
): PodiumScoreDetail {
    const pointsByPlace = {
        first: guess.first === actual.first ? rules.exact.first : 0,
        second: guess.second === actual.second ? rules.exact.second : 0,
        third: guess.third === actual.third ? rules.exact.third : 0,
    };
    
    // Add bonus points for athletes in the wrong position but still in top 3
    if (rules.inPodium) {
        // Check if first place guess is in the podium but wrong position
        if (pointsByPlace.first === 0 && 
            (guess.first === actual.second || guess.first === actual.third)) {
            pointsByPlace.first = rules.inPodium.first;
        }
        
        // Check if second place guess is in the podium but wrong position
        if (pointsByPlace.second === 0 && 
            (guess.second === actual.first || guess.second === actual.third)) {
            pointsByPlace.second = rules.inPodium.second;
        }
        
        // Check if third place guess is in the podium but wrong position
        if (pointsByPlace.third === 0 && 
            (guess.third === actual.first || guess.third === actual.second)) {
            pointsByPlace.third = rules.inPodium.third;
        }
    }
    
    const total =
        pointsByPlace.first + pointsByPlace.second + pointsByPlace.third;
    return {
        calculatedAt: new Date().toISOString(),
        pointsByPlace,
        total,
    };
}
