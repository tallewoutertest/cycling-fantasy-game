// Main app functions

// Cache for score details (to avoid re-fetching)
let scoreDetailCache = {};

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`nav-${tabName}`).classList.add('active');

    // Load content if needed
    if (tabName === 'standings') {
        loadStandings();
    }
}

// Load standings
async function loadStandings() {
    const container = document.getElementById('standings-content');
    container.innerHTML = '<p class="info-text">Klassement laden...</p>';

    try {
        // Load all scores
        const { data: scores, error: scoresError } = await supabase
            .from('scores')
            .select('user_id, race_id, top3_score, top10_score, h2h_score, total_score');

        if (scoresError) throw scoresError;

        if (!scores || scores.length === 0) {
            container.innerHTML = '<p class="info-text">Nog geen uitslagen verwerkt. Het klassement verschijnt na de eerste koers.</p>';
            return;
        }

        // Load races that have results
        const raceIds = [...new Set(scores.map(s => s.race_id))];
        const { data: racesData } = await supabase
            .from('races')
            .select('id, name, date')
            .in('id', raceIds)
            .order('date');

        // Load profiles
        const userIds = [...new Set(scores.map(s => s.user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, nickname')
            .in('id', userIds);

        const nameMap = {};
        (profiles || []).forEach(p => { nameMap[p.id] = p.nickname || p.display_name || 'Onbekend'; });

        const raceMap = {};
        (racesData || []).forEach(r => { raceMap[r.id] = r; });

        // Build total standings
        const totals = {};
        scores.forEach(s => {
            if (!totals[s.user_id]) {
                totals[s.user_id] = { user_id: s.user_id, total: 0, races: 0, raceScores: {} };
            }
            totals[s.user_id].total += s.total_score;
            totals[s.user_id].races += 1;
            totals[s.user_id].raceScores[s.race_id] = s;
        });

        const sortedUsers = Object.values(totals).sort((a, b) => b.total - a.total);
        const sortedRaces = (racesData || []).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Build HTML
        let html = '';

        // Overall standings
        html += '<div class="standings-section">';
        html += '<h3>Algemeen Klassement</h3>';
        html += '<div class="standings-table-wrapper"><table class="standings-table">';
        html += '<thead><tr><th class="pos-col">#</th><th>Speler</th>';
        sortedRaces.forEach(r => {
            html += `<th class="race-col">${r.name}</th>`;
        });
        html += '<th class="total-col">Totaal</th></tr></thead><tbody>';

        sortedUsers.forEach((user, idx) => {
            const isCurrentUser = currentUser && user.user_id === currentUser.id;
            html += `<tr class="${isCurrentUser ? 'current-user' : ''} ${idx < 3 ? 'top-three' : ''}">`;
            html += `<td class="pos-col">`;
            if (idx === 0) html += '<span class="medal gold">1</span>';
            else if (idx === 1) html += '<span class="medal silver">2</span>';
            else if (idx === 2) html += '<span class="medal bronze">3</span>';
            else html += `${idx + 1}`;
            html += '</td>';
            html += `<td class="player-name">${nameMap[user.user_id] || 'Onbekend'}${isCurrentUser ? ' (jij)' : ''}</td>`;

            sortedRaces.forEach(r => {
                const rScore = user.raceScores[r.id];
                if (rScore) {
                    html += `<td class="race-col"><span class="score-clickable" onclick="showScoreDetail('${user.user_id}', '${r.id}', '${nameMap[user.user_id] || 'Onbekend'}', '${r.name}')">${rScore.total_score}</span></td>`;
                } else {
                    html += `<td class="race-col">-</td>`;
                }
            });

            html += `<td class="total-col"><strong>${user.total}</strong></td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        html += '</div>';

        // Scoring explanation
        html += '<div class="scoring-rules">';
        html += '<h3>Puntentelling</h3>';
        html += '<div class="rules-grid">';
        html += '<div class="rule-card"><h4>Top 3 Renners</h4><p>Kies 3 renners. Punten op basis van eindpositie:</p><p>1e: <strong>10 pt</strong>, 2e: <strong>9 pt</strong>, 3e: <strong>8 pt</strong>, ... 10e: <strong>1 pt</strong></p></div>';
        html += '<div class="rule-card"><h4>Rangschikking</h4><p>Exacte positie: <strong>5 pt</strong></p><p>1 ernaast: <strong>3 pt</strong></p><p>2 ernaast: <strong>2 pt</strong></p><p>3 ernaast: <strong>1 pt</strong></p></div>';
        html += '<div class="rule-card"><h4>Head-to-Head</h4><p>Correct: <strong>5 pt</strong></p></div>';
        html += '</div></div>';

        container.innerHTML = html;

    } catch (err) {
        console.error('Error loading standings:', err);
        container.innerHTML = '<p class="info-text">Fout bij laden van het klassement.</p>';
    }
}

// Show detailed score breakdown for a player on a specific race
async function showScoreDetail(userId, raceId, playerName, raceName) {
    const modal = document.getElementById('score-detail-modal');
    const content = document.getElementById('score-detail-content');
    document.getElementById('score-detail-title').textContent = `${playerName} - ${raceName}`;
    content.innerHTML = '<p class="info-text">Laden...</p>';
    modal.style.display = 'block';

    try {
        // Load the user's score for this race
        const { data: scoreData } = await supabase
            .from('scores')
            .select('top3_score, top10_score, h2h_score, total_score')
            .eq('user_id', userId)
            .eq('race_id', raceId)
            .single();

        // Load the user's predictions
        const { data: prediction } = await supabase
            .from('predictions')
            .select(`
                id,
                prediction_top3 (position, rider_id, riders (first_name, last_name)),
                prediction_top10 (predicted_position, rider_id, riders (first_name, last_name)),
                prediction_h2h (selected_rider_id, riders:riders!prediction_h2h_selected_rider_id_fkey (first_name, last_name))
            `)
            .eq('user_id', userId)
            .eq('race_id', raceId)
            .single();

        // Load actual results
        const { data: actualTop3 } = await supabase
            .from('race_results_top3')
            .select('position, rider_id, riders (first_name, last_name)')
            .eq('race_id', raceId)
            .order('position');

        const { data: actualTop10 } = await supabase
            .from('race_results_top10')
            .select('actual_position, rider_id, riders (first_name, last_name)')
            .eq('race_id', raceId)
            .order('actual_position');

        const { data: actualH2H } = await supabase
            .from('race_results_h2h')
            .select('winning_rider_id, riders:riders!race_results_h2h_winning_rider_id_fkey (first_name, last_name)')
            .eq('race_id', raceId)
            .single();

        let html = '';

        // Summary bar
        html += '<div class="score-summary-bar">';
        html += `<div class="score-summary-item"><span class="score-label">Top 3</span><span class="score-value">${scoreData?.top3_score || 0} pt</span></div>`;
        html += `<div class="score-summary-item"><span class="score-label">Rangschikking</span><span class="score-value">${scoreData?.top10_score || 0} pt</span></div>`;
        html += `<div class="score-summary-item"><span class="score-label">H2H</span><span class="score-value">${scoreData?.h2h_score || 0} pt</span></div>`;
        html += `<div class="score-summary-item total"><span class="score-label">Totaal</span><span class="score-value">${scoreData?.total_score || 0} pt</span></div>`;
        html += '</div>';

        // Top 3 detail - combine top 3 and ranking results for position lookup
        const actualTop3Map = {};
        (actualTop3 || []).forEach(r => { actualTop3Map[r.rider_id] = r.position; });
        (actualTop10 || []).forEach(r => {
            if (actualTop3Map[r.rider_id] === undefined) {
                actualTop3Map[r.rider_id] = r.actual_position;
            }
        });
        const predTop3 = (prediction?.prediction_top3 || []).sort((a, b) => a.position - b.position);

        html += '<div class="score-detail-section">';
        html += '<h4>Top 3 Renners</h4>';
        html += '<table class="score-detail-table"><thead><tr><th>Renner</th><th>Eindpositie</th><th>Punten</th></tr></thead><tbody>';

        predTop3.forEach(pred => {
            const predName = pred?.riders ? `${pred.riders.first_name} ${pred.riders.last_name}` : '-';
            const actualPos = actualTop3Map[pred.rider_id];
            let points = 0;
            let pointClass = '';
            let posText = 'Niet in top 10';

            if (actualPos !== undefined && actualPos >= 1 && actualPos <= 10) {
                points = 11 - actualPos;
                posText = `${actualPos}e`;
                pointClass = points >= 8 ? 'points-exact' : points >= 5 ? 'points-partial' : 'points-minor';
            }

            html += `<tr>`;
            html += `<td>${predName}</td>`;
            html += `<td>${posText}</td>`;
            html += `<td class="${pointClass}">${points > 0 ? '+' + points : '0'}</td>`;
            html += `</tr>`;
        });
        html += '</tbody></table></div>';

        // Top 10 detail
        const actualTop10Map = {};
        (actualTop10 || []).forEach(r => { actualTop10Map[r.rider_id] = r.actual_position; });
        const predTop10 = (prediction?.prediction_top10 || []).sort((a, b) => a.predicted_position - b.predicted_position);

        html += '<div class="score-detail-section">';
        html += '<h4>Rangschikking</h4>';
        html += '<table class="score-detail-table"><thead><tr><th>Voorspeld</th><th>Renner</th><th>Werkelijk</th><th>Verschil</th><th>Punten</th></tr></thead><tbody>';

        predTop10.forEach(pred => {
            const riderName = pred.riders ? `${pred.riders.first_name} ${pred.riders.last_name}` : '-';
            const actualPos = actualTop10Map[pred.rider_id];
            let points = 0;
            let pointClass = '';
            let diffText = '-';

            if (actualPos !== undefined) {
                const diff = Math.abs(pred.predicted_position - actualPos);
                diffText = diff === 0 ? 'exact' : `${diff} ernaast`;
                if (diff === 0) { points = 5; pointClass = 'points-exact'; }
                else if (diff === 1) { points = 3; pointClass = 'points-partial'; }
                else if (diff === 2) { points = 2; pointClass = 'points-partial'; }
                else if (diff === 3) { points = 1; pointClass = 'points-minor'; }
            }

            html += `<tr>`;
            html += `<td>${pred.predicted_position}</td>`;
            html += `<td>${riderName}</td>`;
            html += `<td>${actualPos !== undefined ? actualPos : '-'}</td>`;
            html += `<td>${diffText}</td>`;
            html += `<td class="${pointClass}">${points > 0 ? '+' + points : '0'}</td>`;
            html += `</tr>`;
        });
        html += '</tbody></table></div>';

        // H2H detail
        if (prediction?.prediction_h2h?.[0]) {
            const predH2H = prediction.prediction_h2h[0];
            const selectedName = predH2H.riders ? `${predH2H.riders.first_name} ${predH2H.riders.last_name}` : '-';
            const winnerName = actualH2H?.riders ? `${actualH2H.riders.first_name} ${actualH2H.riders.last_name}` : 'Nog onbekend';
            const isCorrect = actualH2H && predH2H.selected_rider_id === actualH2H.winning_rider_id;
            const h2hPoints = isCorrect ? 5 : 0;
            const h2hClass = isCorrect ? 'points-exact' : '';

            html += '<div class="score-detail-section">';
            html += '<h4>Head-to-Head</h4>';
            html += '<table class="score-detail-table"><thead><tr><th>Keuze</th><th>Winnaar</th><th>Punten</th></tr></thead><tbody>';
            html += `<tr>`;
            html += `<td>${selectedName}</td>`;
            html += `<td>${winnerName}</td>`;
            html += `<td class="${h2hClass}">${h2hPoints > 0 ? '+' + h2hPoints : '0'}</td>`;
            html += `</tr>`;
            html += '</tbody></table></div>';
        }

        content.innerHTML = html;

    } catch (err) {
        console.error('Error loading score details:', err);
        content.innerHTML = '<p class="info-text">Fout bij laden van de details.</p>';
    }
}

// Close score detail modal
function closeScoreDetailModal() {
    document.getElementById('score-detail-modal').style.display = 'none';
}

// Show all players' predictions for a race (when "Koers bezig" is clicked)
async function showRacePredictions(raceId, raceName) {
    const modal = document.getElementById('predictions-overview-modal');
    const content = document.getElementById('predictions-overview-content');
    document.getElementById('predictions-overview-title').textContent = raceName + ' — Voorspellingen';
    content.innerHTML = '<p class="info-text">Laden...</p>';
    modal.style.display = 'block';

    try {
        // Load all predictions for this race
        const { data: predictions, error } = await supabase
            .from('predictions')
            .select(`
                user_id,
                prediction_top3 (position, rider_id, riders (first_name, last_name)),
                prediction_top10 (predicted_position, rider_id, riders (first_name, last_name)),
                prediction_h2h (selected_rider_id, riders:riders!prediction_h2h_selected_rider_id_fkey (first_name, last_name))
            `)
            .eq('race_id', raceId);

        if (error) throw error;

        if (!predictions || predictions.length === 0) {
            content.innerHTML = '<p class="info-text">Nog geen voorspellingen voor deze koers.</p>';
            return;
        }

        // Load profiles
        const userIds = predictions.map(p => p.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, nickname')
            .in('id', userIds);

        const nameMap = {};
        (profiles || []).forEach(p => { nameMap[p.id] = p.nickname || p.display_name || 'Onbekend'; });

        let html = '';

        predictions.forEach(pred => {
            const playerName = nameMap[pred.user_id] || 'Onbekend';
            const isMe = currentUser && pred.user_id === currentUser.id;

            html += `<div class="prediction-card ${isMe ? 'is-me' : ''}">`;
            html += `<h4>${playerName}${isMe ? ' (jij)' : ''}</h4>`;

            // Top 3
            const top3 = (pred.prediction_top3 || []).sort((a, b) => a.position - b.position);
            if (top3.length > 0) {
                html += '<div class="pred-section"><span class="pred-label">Top 3:</span>';
                const medals = ['🥇', '🥈', '🥉'];
                html += top3.map(t => `${medals[t.position - 1]} ${t.riders.first_name} ${t.riders.last_name}`).join(', ');
                html += '</div>';
            }

            // Rangschikking
            const top10 = (pred.prediction_top10 || []).sort((a, b) => a.predicted_position - b.predicted_position);
            if (top10.length > 0) {
                html += '<div class="pred-section"><span class="pred-label">Rangschikking:</span>';
                html += top10.map(t => `<span class="pred-pos">${t.predicted_position}.</span> ${t.riders.first_name} ${t.riders.last_name}`).join(', ');
                html += '</div>';
            }

            // H2H
            if (pred.prediction_h2h?.[0]?.riders) {
                const h2h = pred.prediction_h2h[0];
                html += `<div class="pred-section"><span class="pred-label">H2H:</span> ${h2h.riders.first_name} ${h2h.riders.last_name}</div>`;
            }

            html += '</div>';
        });

        content.innerHTML = html;

    } catch (err) {
        console.error('Error loading predictions overview:', err);
        content.innerHTML = '<p class="info-text">Fout bij laden van de voorspellingen.</p>';
    }
}

// Close predictions overview modal
function closePredictionsOverviewModal() {
    document.getElementById('predictions-overview-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const predModal = document.getElementById('prediction-modal');
    const scoreModal = document.getElementById('score-detail-modal');
    const overviewModal = document.getElementById('predictions-overview-modal');
    if (event.target === predModal) {
        closePredictionModal();
    }
    if (event.target === scoreModal) {
        closeScoreDetailModal();
    }
    if (event.target === overviewModal) {
        closePredictionsOverviewModal();
    }
}
