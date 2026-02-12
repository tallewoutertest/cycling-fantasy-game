// Main app functions

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
            .select('id, display_name')
            .in('id', userIds);

        const nameMap = {};
        (profiles || []).forEach(p => { nameMap[p.id] = p.display_name || 'Onbekend'; });

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
                html += `<td class="race-col">${rScore ? rScore.total_score : '-'}</td>`;
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
        html += '<div class="rule-card"><h4>Top 3</h4><p>Exacte positie: <strong>10 pt</strong></p><p>In top 3, verkeerde positie: <strong>5 pt</strong></p></div>';
        html += '<div class="rule-card"><h4>Top 10 Ranking</h4><p>Exacte positie: <strong>5 pt</strong></p><p>1 positie ernaast: <strong>3 pt</strong></p><p>2 posities ernaast: <strong>2 pt</strong></p><p>3 posities ernaast: <strong>1 pt</strong></p></div>';
        html += '<div class="rule-card"><h4>Head-to-Head</h4><p>Correct: <strong>5 pt</strong></p></div>';
        html += '</div></div>';

        container.innerHTML = html;

    } catch (err) {
        console.error('Error loading standings:', err);
        container.innerHTML = '<p class="info-text">Fout bij laden van het klassement.</p>';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('prediction-modal');
    if (event.target === modal) {
        closePredictionModal();
    }
}
