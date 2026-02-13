// Races management
let races = [];
let allRiders = [];

// Load all races from database
async function loadRaces() {
    const { data, error } = await supabase
        .from('races')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error('Error loading races:', error);
        return;
    }

    races = data || [];
    displayRaces();
}

// Display races in the UI
function displayRaces() {
    const container = document.getElementById('races-list');

    if (races.length === 0) {
        container.innerHTML = '<p class="info-text">Nog geen koersen beschikbaar. De beheerder moet koersen toevoegen.</p>';
        return;
    }

    const now = new Date();
    const upcomingRaces = races.filter(race => new Date(race.registration_deadline) > now);
    const pastRaces = races.filter(race => new Date(race.registration_deadline) <= now);

    let html = '';

    if (upcomingRaces.length > 0) {
        html += '<h3>Aankomende Koersen</h3>';
        upcomingRaces.forEach(race => {
            html += createRaceCard(race, true);
        });
    }

    if (pastRaces.length > 0) {
        html += '<h3>Gesloten Koersen</h3>';
        pastRaces.forEach(race => {
            html += createRaceCard(race, false);
        });
    }

    container.innerHTML = html;

    // Load prediction status for each race
    loadPredictionStatus();
    loadUserScores();
}

// Create HTML for a race card
function createRaceCard(race, isOpen) {
    const raceDate = new Date(race.date);
    const deadline = new Date(race.registration_deadline);
    const formattedDate = raceDate.toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedDeadline = deadline.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });

    const monumentBadge = race.is_monument ? '<span class="badge monument">Monument</span>' : '';

    return `
        <div class="race-card ${!isOpen ? 'closed' : ''}" data-race-id="${race.id}">
            <div class="race-header">
                <h3>${race.name} ${monumentBadge}</h3>
                <span class="race-date">${formattedDate}</span>
            </div>
            <div class="race-info">
                <p><strong>Inschrijven tot:</strong> ${formattedDeadline}</p>
                <div class="race-actions">
                    ${isOpen
                        ? `<button onclick="openPredictionModal('${race.id}')" class="btn-primary">
                             <span class="prediction-status" id="status-${race.id}">Voorspelling Invullen</span>
                           </button>`
                        : `<span class="status-badge bezig" id="race-status-${race.id}" onclick="showRacePredictions('${race.id}', '${race.name.replace(/'/g, "\\'")}')">Koers bezig</span>`
                    }
                    <span class="score-badge" id="score-${race.id}" style="display:none;"></span>
                </div>
            </div>
        </div>
    `;
}

// Load user scores for closed races and update race status
async function loadUserScores() {
    // Load races that have results (scores exist) to update status badges
    const { data: scoredRaces } = await supabase
        .from('scores')
        .select('race_id')
        .limit(1000);

    const racesWithResults = new Set((scoredRaces || []).map(s => s.race_id));

    // Update status badges: "Koers bezig" -> "Uitslag bekend" if results exist
    racesWithResults.forEach(raceId => {
        const statusEl = document.getElementById(`race-status-${raceId}`);
        if (statusEl) {
            const race = races.find(r => r.id === raceId);
            const raceName = race ? race.name.replace(/'/g, "\\'") : '';
            statusEl.textContent = 'Uitslag bekend';
            statusEl.classList.remove('bezig');
            statusEl.classList.add('uitslag');
            statusEl.onclick = function() { showRacePredictions(raceId, raceName); };
        }
    });

    if (!currentUser) return;

    const { data, error } = await supabase
        .from('scores')
        .select('race_id, top3_score, top10_score, h2h_score, total_score')
        .eq('user_id', currentUser.id);

    if (data) {
        data.forEach(score => {
            const el = document.getElementById(`score-${score.race_id}`);
            if (el) {
                el.textContent = `${score.total_score} punten`;
                el.style.display = 'inline-flex';
            }
        });
    }
}

// Check if user has already made predictions for races
async function loadPredictionStatus() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('predictions')
        .select('race_id')
        .eq('user_id', currentUser.id);

    if (data) {
        data.forEach(pred => {
            const statusEl = document.getElementById(`status-${pred.race_id}`);
            if (statusEl) {
                statusEl.innerHTML = '✓ Voorspelling Bewerken';
                statusEl.parentElement.classList.add('has-prediction');
            }
        });
    }
}

// Load all riders for autocomplete
async function loadAllRiders() {
    if (allRiders.length > 0) return; // Already loaded

    const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('last_name');

    if (error) {
        console.error('Error loading riders:', error);
        return;
    }

    allRiders = data || [];
}

// Search riders for autocomplete
let selectedRiders = {}; // Store selected rider objects by input ID

async function searchRiders(input, resultsId) {
    await loadAllRiders();

    const query = input.value.toLowerCase().trim();
    const resultsDiv = document.getElementById(resultsId);

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    const filtered = allRiders.filter(rider => {
        const fullName = `${rider.first_name} ${rider.last_name}`.toLowerCase();
        return fullName.includes(query);
    }).slice(0, 10); // Limit to 10 results

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<div class="autocomplete-item">Geen renners gevonden</div>';
        return;
    }

    resultsDiv.innerHTML = filtered.map(rider => `
        <div class="autocomplete-item" onclick="selectRider('${rider.id}', '${rider.first_name}', '${rider.last_name}', '${input.id}', '${resultsId}')">
            ${rider.first_name} ${rider.last_name}
            ${rider.team ? `<span class="rider-team">${rider.team}</span>` : ''}
        </div>
    `).join('');
}

// Select a rider from autocomplete
function selectRider(riderId, firstName, lastName, inputId, resultsId) {
    const input = document.getElementById(inputId);
    const resultsDiv = document.getElementById(resultsId);

    input.value = `${firstName} ${lastName}`;
    selectedRiders[inputId] = riderId;
    resultsDiv.innerHTML = '';
}

// Close autocomplete when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.input-group')) {
        document.querySelectorAll('.autocomplete-results').forEach(div => {
            div.innerHTML = '';
        });
    }
});
