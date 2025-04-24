// scoring.ts
import { PointsByPlace } from "@shared/types/Prediction";
import { Top3Podium, PodiumScoreDetail } from "@shared/types/Prediction";

export function calculatePodiumScore(
    actual: Top3Podium,
    guess: Top3Podium,
    rules: { exact: PointsByPlace }
): PodiumScoreDetail {
    const pointsByPlace = {
        first: guess.first === actual.first ? rules.exact.first : 0,
        second: guess.second === actual.second ? rules.exact.second : 0,
        third: guess.third === actual.third ? rules.exact.third : 0,
    };
    const total =
        pointsByPlace.first + pointsByPlace.second + pointsByPlace.third;
    return {
        calculatedAt: new Date().toISOString(),
        pointsByPlace,
        total,
    };
}
