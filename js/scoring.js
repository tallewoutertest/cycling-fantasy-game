// Scoring system for Flitsende Fietsers
// Points:
// - Top 3: Pick 3 riders. Points based on actual finish: 1st=10pt, 2nd=9pt, 3rd=8pt... 10th=1pt, outside top 10=0pt
// - Rangschikking (5 riders): Exact = 5pts, Off by 1 = 3pts, Off by 2 = 2pts, Off by 3 = 1pt
// - H2H: Correct = 5pts

function calculateTop3Score(predictedTop3, actualTop3) {
    let score = 0;
    // predictedTop3: [{rider_id, position}] (user's 3 picks)
    // actualTop3: [{rider_id, position}] (actual race results, position 1-10+)
    // Points: rider finished 1st = 10pt, 2nd = 9pt, ..., 10th = 1pt, outside top 10 = 0pt
    const actualMap = {};
    actualTop3.forEach(r => { actualMap[r.rider_id] = r.position; });

    predictedTop3.forEach(pred => {
        const actualPos = actualMap[pred.rider_id];
        if (actualPos !== undefined && actualPos >= 1 && actualPos <= 10) {
            score += (11 - actualPos); // 1st=10, 2nd=9, ..., 10th=1
        }
    });

    return score;
}

function calculateTop10Score(predictedTop10, actualTop10) {
    let score = 0;
    // Works for any number of riders (now 5 instead of 10)
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
