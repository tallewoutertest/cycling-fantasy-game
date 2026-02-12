// Scoring system for Cycling Fantasy Game
// Points:
// - Top 3: Exact position = 10pts, In top 3 but wrong position = 5pts
// - Top 10: Exact = 5pts, Off by 1 = 3pts, Off by 2 = 2pts, Off by 3 = 1pt
// - H2H: Correct = 5pts

function calculateTop3Score(predictedTop3, actualTop3) {
    let score = 0;
    // predictedTop3: [{rider_id, position}], actualTop3: [{rider_id, position}]
    const actualMap = {};
    actualTop3.forEach(r => { actualMap[r.rider_id] = r.position; });

    predictedTop3.forEach(pred => {
        const actualPos = actualMap[pred.rider_id];
        if (actualPos !== undefined) {
            if (actualPos === pred.position) {
                score += 10; // Exact position
            } else {
                score += 5; // In top 3 but wrong position
            }
        }
    });

    return score;
}

function calculateTop10Score(predictedTop10, actualTop10) {
    let score = 0;
    // predictedTop10: [{rider_id, predicted_position}], actualTop10: [{rider_id, actual_position}]
    const actualMap = {};
    actualTop10.forEach(r => { actualMap[r.rider_id] = r.actual_position; });

    predictedTop10.forEach(pred => {
        const actualPos = actualMap[pred.rider_id];
        if (actualPos !== undefined) {
            const diff = Math.abs(pred.predicted_position - actualPos);
            if (diff === 0) score += 5;
            else if (diff === 1) score += 3;
            else if (diff === 2) score += 2;
            else if (diff === 3) score += 1;
        }
    });

    return score;
}

function calculateH2HScore(selectedRiderId, winningRiderId) {
    if (!selectedRiderId || !winningRiderId) return 0;
    return selectedRiderId === winningRiderId ? 5 : 0;
}
