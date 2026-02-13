// Admin Panel JavaScript

// Convert a datetime-local input value (e.g. "2025-03-06T09:00") to an ISO string
// with the correct local timezone offset, so Supabase stores the intended time.
function localDatetimeToISO(datetimeLocalValue) {
    if (!datetimeLocalValue) return datetimeLocalValue;
    const date = new Date(datetimeLocalValue);
    return date.toISOString();
}

let currentUser = null;
let allRiders = [];
let allRaces = [];
let currentRaceDetail = null;
let selectedH2HRiders = { a: null, b: null };

// Initialize admin panel
async function initAdmin() {
    if (!supabase) {
        console.error('Supabase client niet beschikbaar');
        alert('Kan geen verbinding maken met de database. Herlaad de pagina.');
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = '../index.html';
        return;
    }

    currentUser = session.user;

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, display_name')
        .eq('id', currentUser.id)
        .single();

    if (!profile || !profile.is_admin) {
        document.getElementById('auth-check').style.display = 'flex';
        return;
    }

    document.getElementById('user-name').textContent = profile.display_name || currentUser.email;
    document.getElementById('admin-container').style.display = 'block';

    loadRaces();
    loadAllRiders();
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = '../index.html';
}

// Tab Navigation
function showAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`nav-${tabName}`).classList.add('active');

    if (tabName === 'results') {
        loadResultsRaces();
    }
}

// ====== RACES MANAGEMENT ======

function showAddRaceForm() {
    document.getElementById('add-race-form').style.display = 'block';
}

function hideAddRaceForm() {
    document.getElementById('add-race-form').style.display = 'none';
    document.getElementById('race-form').reset();
}

// Load all races
async function loadRaces() {
    const { data, error } = await supabase
        .from('races')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error('Error loading races:', error);
        return;
    }

    allRaces = data || [];
    displayRaces();
}

// Display races
function displayRaces() {
    const container = document.getElementById('races-list');

    if (allRaces.length === 0) {
        container.innerHTML = '<p class="info-text">Nog geen koersen. Voeg de eerste koers toe!</p>';
        return;
    }

    container.innerHTML = allRaces.map(race => {
        const raceDate = new Date(race.date).toLocaleDateString('nl-NL', { dateStyle: 'long' });
        const deadline = new Date(race.registration_deadline).toLocaleString('nl-NL');

        return `
            <div class="data-item">
                <div class="data-item-info">
                    <h4>${race.name} ${race.is_monument ? '⭐' : ''}</h4>
                    <p>Datum: ${raceDate} | Deadline: ${deadline}</p>
                </div>
                <div class="data-item-actions">
                    <button class="btn-config" onclick="openRaceDetail('${race.id}')">Configureren</button>
                    <button class="btn-delete" onclick="deleteRace('${race.id}')">Verwijderen</button>
                </div>
            </div>
        `;
    }).join('');
}

// Add race form submission
document.getElementById('race-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const deadlineInput = document.getElementById('race-deadline').value;
    const raceData = {
        name: document.getElementById('race-name').value.trim(),
        date: document.getElementById('race-date').value,
        registration_deadline: localDatetimeToISO(deadlineInput),
        is_monument: document.getElementById('race-monument').checked,
        created_by: currentUser.id
    };

    const { error } = await supabase
        .from('races')
        .insert([raceData]);

    if (error) {
        alert('Fout bij toevoegen koers: ' + error.message);
    } else {
        alert('Koers toegevoegd!');
        hideAddRaceForm();
        loadRaces();
    }
});

// Delete race
async function deleteRace(raceId) {
    if (!confirm('Weet je zeker dat je deze koers wilt verwijderen? Alle voorspellingen gaan verloren.')) {
        return;
    }

    const { error } = await supabase
        .from('races')
        .delete()
        .eq('id', raceId);

    if (error) {
        alert('Fout bij verwijderen: ' + error.message);
    } else {
        alert('Koers verwijderd');
        loadRaces();
    }
}

// ====== RIDERS MANAGEMENT ======

function showAddRiderForm() {
    document.getElementById('add-rider-form').style.display = 'block';
}

function hideAddRiderForm() {
    document.getElementById('add-rider-form').style.display = 'none';
    document.getElementById('rider-form').reset();
}

function showBulkImport() {
    document.getElementById('bulk-import-section').style.display = 'block';
}

function hideBulkImport() {
    document.getElementById('bulk-import-section').style.display = 'none';
    document.getElementById('bulk-riders').value = '';
}

// Load all riders
async function loadAllRiders() {
    const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('last_name');

    if (error) {
        console.error('Error loading riders:', error);
        return;
    }

    allRiders = data || [];
    displayRiders();
}

// Display riders
function displayRiders(filtered = null) {
    const container = document.getElementById('riders-list');
    const ridersToShow = filtered || allRiders;

    if (ridersToShow.length === 0) {
        container.innerHTML = '<p class="info-text">Geen renners gevonden.</p>';
        return;
    }

    container.innerHTML = `<div class="riders-grid">${ridersToShow.map(rider => `
        <div class="rider-card">
            <div class="rider-card-info">
                <h4>${rider.first_name} ${rider.last_name}</h4>
                <p>${rider.team || 'Geen team'} ${rider.nationality ? `| ${rider.nationality}` : ''}</p>
            </div>
            <button class="btn-delete" onclick="deleteRider('${rider.id}')">×</button>
        </div>
    `).join('')}</div>`;
}

// Filter riders
function filterRiders() {
    const query = document.getElementById('rider-search').value.toLowerCase();
    if (!query) {
        displayRiders();
        return;
    }

    const filtered = allRiders.filter(r => {
        const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
        const team = (r.team || '').toLowerCase();
        return fullName.includes(query) || team.includes(query);
    });

    displayRiders(filtered);
}

// Add rider form submission
document.getElementById('rider-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const riderData = {
        first_name: document.getElementById('rider-firstname').value.trim(),
        last_name: document.getElementById('rider-lastname').value.trim(),
        nationality: document.getElementById('rider-nationality').value.trim() || null,
        team: document.getElementById('rider-team').value.trim() || null,
        uci_id: document.getElementById('rider-uci').value.trim() || null
    };

    const { error } = await supabase
        .from('riders')
        .insert([riderData]);

    if (error) {
        alert('Fout bij toevoegen renner: ' + error.message);
    } else {
        alert('Renner toegevoegd!');
        hideAddRiderForm();
        loadAllRiders();
    }
});

// Bulk import riders
async function processBulkImport() {
    const text = document.getElementById('bulk-riders').value.trim();
    if (!text) {
        alert('Plak eerst renners in het tekstveld');
        return;
    }

    const lines = text.split('\n').filter(l => l.trim());
    const riders = [];

    for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 1) continue;

        const nameParts = parts[0].split(' ');
        const lastName = nameParts.pop();
        const firstName = nameParts.join(' ');

        riders.push({
            first_name: firstName,
            last_name: lastName,
            team: parts[1] || null,
            nationality: parts[2] || null
        });
    }

    if (riders.length === 0) {
        alert('Geen geldige renners gevonden');
        return;
    }

    const { error } = await supabase
        .from('riders')
        .insert(riders);

    if (error) {
        alert('Fout bij importeren: ' + error.message);
    } else {
        alert(`${riders.length} renners geïmporteerd!`);
        hideBulkImport();
        loadAllRiders();
    }
}

// Delete rider
async function deleteRider(riderId) {
    if (!confirm('Renner verwijderen?')) return;

    const { error } = await supabase
        .from('riders')
        .delete()
        .eq('id', riderId);

    if (error) {
        alert('Fout bij verwijderen: ' + error.message);
    } else {
        loadAllRiders();
    }
}

// ====== RACE DETAIL MODAL ======

async function openRaceDetail(raceId) {
    currentRaceDetail = allRaces.find(r => r.id === raceId);
    if (!currentRaceDetail) return;

    document.getElementById('detail-race-name').textContent = currentRaceDetail.name;
    document.getElementById('race-detail-modal').style.display = 'block';

    // Fill in edit form
    document.getElementById('edit-race-name').value = currentRaceDetail.name;
    document.getElementById('edit-race-date').value = currentRaceDetail.date;
    // Convert deadline to datetime-local format (local time)
    const deadline = new Date(currentRaceDetail.registration_deadline);
    const pad = (n) => String(n).padStart(2, '0');
    const localDeadline = `${deadline.getFullYear()}-${pad(deadline.getMonth() + 1)}-${pad(deadline.getDate())}T${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;
    document.getElementById('edit-race-deadline').value = localDeadline;
    document.getElementById('edit-race-monument').checked = currentRaceDetail.is_monument;

    showRaceTab('details');
    await loadRaceParticipants();
    await loadRaceTop10();
    await loadRaceH2H();
}

function closeRaceDetail() {
    document.getElementById('race-detail-modal').style.display = 'none';
    currentRaceDetail = null;
}

function showRaceTab(tabName) {
    const modal = document.getElementById('race-detail-modal');
    modal.querySelectorAll('.race-tab-content').forEach(tab => tab.classList.remove('active'));
    modal.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`race-tab-${tabName}`).classList.add('active');
    document.getElementById(`tab-btn-${tabName}`).classList.add('active');
}

// Participants
async function loadRaceParticipants() {
    const { data, error } = await supabase
        .from('race_riders')
        .select('*, riders(*)')
        .eq('race_id', currentRaceDetail.id);

    if (error) {
        console.error('Error loading participants:', error);
        return;
    }

    const container = document.getElementById('participants-list');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="info-text">Nog geen deelnemers toegevoegd</p>';
        return;
    }

    container.innerHTML = data.map(p => `
        <div class="participant-chip">
            <span class="name">${p.riders.first_name} ${p.riders.last_name}</span>
            <span class="remove" onclick="removeParticipant('${p.id}')">×</span>
        </div>
    `).join('');
}

function searchParticipants() {
    const input = document.getElementById('add-participant-search');
    const query = input.value.toLowerCase().trim();
    const resultsDiv = document.getElementById('participant-results');

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    const filtered = allRiders.filter(r => {
        const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
        return fullName.includes(query);
    }).slice(0, 10);

    resultsDiv.innerHTML = filtered.map(r => `
        <div class="autocomplete-item" onclick="addParticipant('${r.id}', '${r.first_name}', '${r.last_name}')">
            ${r.first_name} ${r.last_name}
            ${r.team ? `<span class="rider-team">${r.team}</span>` : ''}
        </div>
    `).join('');
}

async function addParticipant(riderId, firstName, lastName) {
    document.getElementById('add-participant-search').value = '';
    document.getElementById('participant-results').innerHTML = '';

    const { error } = await supabase
        .from('race_riders')
        .insert({ race_id: currentRaceDetail.id, rider_id: riderId });

    if (error) {
        alert('Fout bij toevoegen: ' + error.message);
    } else {
        loadRaceParticipants();
    }
}

async function removeParticipant(raceRiderId) {
    const { error } = await supabase
        .from('race_riders')
        .delete()
        .eq('id', raceRiderId);

    if (error) {
        alert('Fout bij verwijderen: ' + error.message);
    } else {
        loadRaceParticipants();
    }
}

// Top 10
let top10Sortable = null;

async function loadRaceTop10() {
    const { data, error } = await supabase
        .from('top_10_candidates')
        .select('*, riders(*)')
        .eq('race_id', currentRaceDetail.id)
        .order('display_order');

    if (error) {
        console.error('Error loading top 10:', error);
        return;
    }

    const container = document.getElementById('top10-list');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="info-text">Nog geen kandidaten. Voeg er 5 toe.</p>';
        return;
    }

    container.innerHTML = data.map((item, index) => `
        <div class="sortable-item" data-candidate-id="${item.id}" data-rider-id="${item.rider_id}">
            <span class="position-number">${index + 1}</span>
            <span class="rider-name">${item.riders.first_name} ${item.riders.last_name}</span>
            ${item.riders.team ? `<span class="rider-team">${item.riders.team}</span>` : ''}
            <span class="remove" onclick="removeTop10Candidate('${item.id}')">×</span>
            <span class="drag-handle">⋮⋮</span>
        </div>
    `).join('');

    // Initialize sortable
    if (top10Sortable) top10Sortable.destroy();
    top10Sortable = new Sortable(container, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: saveTop10Order
    });
}

function searchTop10Candidates() {
    const input = document.getElementById('add-top10-search');
    const query = input.value.toLowerCase().trim();
    const resultsDiv = document.getElementById('top10-results');

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    const filtered = allRiders.filter(r => {
        const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
        return fullName.includes(query);
    }).slice(0, 10);

    resultsDiv.innerHTML = filtered.map(r => `
        <div class="autocomplete-item" onclick="addTop10Candidate('${r.id}')">
            ${r.first_name} ${r.last_name}
            ${r.team ? `<span class="rider-team">${r.team}</span>` : ''}
        </div>
    `).join('');
}

async function addTop10Candidate(riderId) {
    document.getElementById('add-top10-search').value = '';
    document.getElementById('top10-results').innerHTML = '';

    // Get current count
    const { count } = await supabase
        .from('top_10_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('race_id', currentRaceDetail.id);

    if (count >= 5) {
        alert('Je kunt maximaal 5 kandidaten toevoegen');
        return;
    }

    const { error } = await supabase
        .from('top_10_candidates')
        .insert({
            race_id: currentRaceDetail.id,
            rider_id: riderId,
            display_order: count + 1
        });

    if (error) {
        alert('Fout bij toevoegen: ' + error.message);
    } else {
        loadRaceTop10();
    }
}

async function removeTop10Candidate(candidateId) {
    const { error } = await supabase
        .from('top_10_candidates')
        .delete()
        .eq('id', candidateId);

    if (error) {
        alert('Fout bij verwijderen: ' + error.message);
    } else {
        loadRaceTop10();
    }
}

async function saveTop10Order() {
    const items = document.querySelectorAll('#top10-list .sortable-item');
    const updates = Array.from(items).map((item, index) => ({
        id: item.dataset.candidateId,
        display_order: index + 1
    }));

    for (const update of updates) {
        await supabase
            .from('top_10_candidates')
            .update({ display_order: update.display_order })
            .eq('id', update.id);
    }
}

// Head to Head
async function loadRaceH2H() {
    const { data, error } = await supabase
        .from('head_to_head')
        .select(`
            *,
            rider_a:riders!head_to_head_rider_a_id_fkey(*),
            rider_b:riders!head_to_head_rider_b_id_fkey(*)
        `)
        .eq('race_id', currentRaceDetail.id)
        .single();

    const currentDiv = document.getElementById('current-h2h');

    if (error || !data) {
        currentDiv.className = 'empty';
        currentDiv.textContent = 'Nog geen H2H geconfigureerd';
        selectedH2HRiders = { a: null, b: null };
        document.getElementById('h2h-rider-a').value = '';
        document.getElementById('h2h-rider-b').value = '';
        return;
    }

    currentDiv.className = '';
    currentDiv.innerHTML = `
        <strong>Huidige H2H:</strong><br>
        ${data.rider_a.first_name} ${data.rider_a.last_name} VS ${data.rider_b.first_name} ${data.rider_b.last_name}
    `;

    selectedH2HRiders.a = data.rider_a;
    selectedH2HRiders.b = data.rider_b;
    document.getElementById('h2h-rider-a').value = `${data.rider_a.first_name} ${data.rider_a.last_name}`;
    document.getElementById('h2h-rider-b').value = `${data.rider_b.first_name} ${data.rider_b.last_name}`;
}

function searchH2H(side) {
    const input = document.getElementById(`h2h-rider-${side}`);
    const query = input.value.toLowerCase().trim();
    const resultsDiv = document.getElementById(`h2h-results-${side}`);

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    const filtered = allRiders.filter(r => {
        const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
        return fullName.includes(query);
    }).slice(0, 10);

    resultsDiv.innerHTML = filtered.map(r => `
        <div class="autocomplete-item" onclick="selectH2HRider('${side}', '${r.id}', '${r.first_name}', '${r.last_name}')">
            ${r.first_name} ${r.last_name}
            ${r.team ? `<span class="rider-team">${r.team}</span>` : ''}
        </div>
    `).join('');
}

function selectH2HRider(side, riderId, firstName, lastName) {
    const rider = allRiders.find(r => r.id === riderId);
    selectedH2HRiders[side] = rider;
    document.getElementById(`h2h-rider-${side}`).value = `${firstName} ${lastName}`;
    document.getElementById(`h2h-results-${side}`).innerHTML = '';
}

async function saveH2H() {
    if (!selectedH2HRiders.a || !selectedH2HRiders.b) {
        alert('Selecteer beide renners');
        return;
    }

    if (selectedH2HRiders.a.id === selectedH2HRiders.b.id) {
        alert('Selecteer twee verschillende renners');
        return;
    }

    // Delete existing H2H
    await supabase
        .from('head_to_head')
        .delete()
        .eq('race_id', currentRaceDetail.id);

    // Insert new
    const { error } = await supabase
        .from('head_to_head')
        .insert({
            race_id: currentRaceDetail.id,
            rider_a_id: selectedH2HRiders.a.id,
            rider_b_id: selectedH2HRiders.b.id
        });

    if (error) {
        alert('Fout bij opslaan: ' + error.message);
    } else {
        alert('H2H opgeslagen!');
        loadRaceH2H();
    }
}

// ====== EDIT RACE DETAILS ======

document.getElementById('edit-race-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!currentRaceDetail) return;

    const editDeadlineInput = document.getElementById('edit-race-deadline').value;
    const updatedData = {
        name: document.getElementById('edit-race-name').value.trim(),
        date: document.getElementById('edit-race-date').value,
        registration_deadline: localDatetimeToISO(editDeadlineInput),
        is_monument: document.getElementById('edit-race-monument').checked
    };

    if (!updatedData.name || !updatedData.date || !updatedData.registration_deadline) {
        alert('Vul alle verplichte velden in');
        return;
    }

    const { error } = await supabase
        .from('races')
        .update(updatedData)
        .eq('id', currentRaceDetail.id);

    if (error) {
        alert('Fout bij opslaan: ' + error.message);
    } else {
        alert('Koers bijgewerkt!');
        // Update local data
        Object.assign(currentRaceDetail, updatedData);
        document.getElementById('detail-race-name').textContent = updatedData.name;
        // Refresh races list
        loadRaces();
    }
});

// ====== RESULTS MANAGEMENT ======

let currentResultsRace = null;
let resultSelectedRiders = {};
let resultsTop10Sortable = null;

// Load races for results entry
function loadResultsRaces() {
    const container = document.getElementById('results-race-list');
    if (!allRaces || allRaces.length === 0) {
        container.innerHTML = '<p class="info-text">Nog geen koersen beschikbaar.</p>';
        return;
    }

    // Show races sorted by date (most recent first), only past deadline
    const now = new Date();
    const pastRaces = allRaces.filter(r => new Date(r.registration_deadline) <= now);
    const upcomingRaces = allRaces.filter(r => new Date(r.registration_deadline) > now);

    let html = '';
    if (pastRaces.length > 0) {
        html += '<h3 style="color: var(--text); margin-bottom: 15px;">Gesloten Koersen (uitslag invoeren)</h3>';
        pastRaces.forEach(race => {
            const raceDate = new Date(race.date).toLocaleDateString('nl-NL', { dateStyle: 'long' });
            html += `
                <div class="data-item">
                    <div class="data-item-info">
                        <h4>${race.name} ${race.is_monument ? '⭐' : ''}</h4>
                        <p>Datum: ${raceDate}</p>
                    </div>
                    <div class="data-item-actions">
                        <button class="btn-config" onclick="openResultsModal('${race.id}')">Uitslag Invoeren</button>
                    </div>
                </div>
            `;
        });
    }

    if (upcomingRaces.length > 0) {
        html += '<h3 style="color: var(--text-muted); margin: 25px 0 15px;">Aankomende Koersen (nog niet beschikbaar)</h3>';
        upcomingRaces.forEach(race => {
            const raceDate = new Date(race.date).toLocaleDateString('nl-NL', { dateStyle: 'long' });
            html += `
                <div class="data-item" style="opacity: 0.5;">
                    <div class="data-item-info">
                        <h4>${race.name}</h4>
                        <p>Datum: ${raceDate} — Inschrijving nog open</p>
                    </div>
                </div>
            `;
        });
    }

    if (!html) {
        html = '<p class="info-text">Nog geen koersen beschikbaar.</p>';
    }

    container.innerHTML = html;
}

// Open results modal
async function openResultsModal(raceId) {
    currentResultsRace = allRaces.find(r => r.id === raceId);
    if (!currentResultsRace) return;

    document.getElementById('results-race-name').textContent = currentResultsRace.name + ' — Uitslag';
    document.getElementById('results-modal').style.display = 'block';
    document.getElementById('scoring-status').innerHTML = '';
    resultSelectedRiders = {};

    showResultsTab('top3');
    await loadExistingResultsTop3();
    await loadResultsTop10();
    await loadResultsH2H();
}

function closeResultsModal() {
    document.getElementById('results-modal').style.display = 'none';
    currentResultsRace = null;
    resultSelectedRiders = {};
}

function showResultsTab(tabName) {
    document.querySelectorAll('#results-modal .race-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('#results-modal .tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`results-tab-${tabName}`).classList.add('active');
    document.getElementById(`tab-btn-res-${tabName}`).classList.add('active');
}

// Search riders for result entry
function searchResultRider(input, resultsId) {
    const query = input.value.toLowerCase().trim();
    const resultsDiv = document.getElementById(resultsId);

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    const filtered = allRiders.filter(r => {
        const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
        return fullName.includes(query);
    }).slice(0, 10);

    resultsDiv.innerHTML = filtered.map(r => `
        <div class="autocomplete-item" onclick="selectResultRider('${r.id}', '${r.first_name}', '${r.last_name}', '${input.id}', '${resultsId}')">
            ${r.first_name} ${r.last_name}
            ${r.team ? `<span class="rider-team">${r.team}</span>` : ''}
        </div>
    `).join('');
}

function selectResultRider(riderId, firstName, lastName, inputId, resultsId) {
    document.getElementById(inputId).value = `${firstName} ${lastName}`;
    resultSelectedRiders[inputId] = riderId;
    document.getElementById(resultsId).innerHTML = '';
}

// Load existing top 3 results
async function loadExistingResultsTop3() {
    const { data, error } = await supabase
        .from('race_results_top3')
        .select('position, rider_id, riders(id, first_name, last_name)')
        .eq('race_id', currentResultsRace.id)
        .order('position');

    if (data && data.length > 0) {
        data.forEach(item => {
            const inputId = `result-top3-${item.position}`;
            const input = document.getElementById(inputId);
            if (input && item.riders) {
                input.value = `${item.riders.first_name} ${item.riders.last_name}`;
                resultSelectedRiders[inputId] = item.rider_id;
            }
        });
    } else {
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`result-top3-${i}`).value = '';
        }
    }
}

// Save top 3 results
async function saveResultsTop3() {
    const riders = [];
    for (let i = 1; i <= 3; i++) {
        const riderId = resultSelectedRiders[`result-top3-${i}`];
        if (!riderId) {
            alert(`Selecteer een renner voor positie ${i}`);
            return;
        }
        if (riders.includes(riderId)) {
            alert('Je kunt niet dezelfde renner meerdere keren selecteren');
            return;
        }
        riders.push(riderId);
    }

    // Delete existing
    await supabase.from('race_results_top3').delete().eq('race_id', currentResultsRace.id);

    // Insert new
    const data = riders.map((riderId, idx) => ({
        race_id: currentResultsRace.id,
        rider_id: riderId,
        position: idx + 1
    }));

    const { error } = await supabase.from('race_results_top3').insert(data);
    if (error) {
        alert('Fout bij opslaan: ' + error.message);
    } else {
        alert('Top 3 uitslag opgeslagen!');
    }
}

// Load top 10 results (using the configured candidates)
async function loadResultsTop10() {
    // Load configured top 10 candidates
    const { data: candidates, error: candError } = await supabase
        .from('top_10_candidates')
        .select('*, riders(*)')
        .eq('race_id', currentResultsRace.id)
        .order('display_order');

    const container = document.getElementById('results-top10-list');

    if (!candidates || candidates.length === 0) {
        container.innerHTML = '<p class="info-text">Geen kandidaten geconfigureerd voor deze koers.</p>';
        return;
    }

    // Load existing results
    const { data: existingResults } = await supabase
        .from('race_results_top10')
        .select('rider_id, actual_position')
        .eq('race_id', currentResultsRace.id);

    let orderedCandidates = [...candidates];

    if (existingResults && existingResults.length > 0) {
        const posMap = {};
        existingResults.forEach(r => { posMap[r.rider_id] = r.actual_position; });
        orderedCandidates.sort((a, b) => {
            const posA = posMap[a.riders.id] || 999;
            const posB = posMap[b.riders.id] || 999;
            return posA - posB;
        });
    }

    container.innerHTML = orderedCandidates.map((candidate, index) => {
        const rider = candidate.riders;
        return `
            <div class="sortable-item" data-rider-id="${rider.id}">
                <span class="position-number">${index + 1}</span>
                <span class="rider-name">${rider.first_name} ${rider.last_name}</span>
                ${rider.team ? `<span class="rider-team">${rider.team}</span>` : ''}
                <span class="drag-handle">⋮⋮</span>
            </div>
        `;
    }).join('');

    if (resultsTop10Sortable) resultsTop10Sortable.destroy();
    resultsTop10Sortable = new Sortable(container, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: function() {
            const items = container.querySelectorAll('.sortable-item');
            items.forEach((item, idx) => {
                item.querySelector('.position-number').textContent = idx + 1;
            });
        }
    });
}

// Save top 10 results
async function saveResultsTop10() {
    const items = document.querySelectorAll('#results-top10-list .sortable-item');
    if (items.length === 0) {
        alert('Geen kandidaten om op te slaan');
        return;
    }

    // Delete existing
    await supabase.from('race_results_top10').delete().eq('race_id', currentResultsRace.id);

    const data = Array.from(items).map((item, idx) => ({
        race_id: currentResultsRace.id,
        rider_id: item.dataset.riderId,
        actual_position: idx + 1
    }));

    const { error } = await supabase.from('race_results_top10').insert(data);
    if (error) {
        alert('Fout bij opslaan: ' + error.message);
    } else {
        alert('Top 10 volgorde opgeslagen!');
    }
}

// Load H2H results
async function loadResultsH2H() {
    const container = document.getElementById('results-h2h-selection');

    // Load H2H config
    const { data: h2hConfig, error: h2hError } = await supabase
        .from('head_to_head')
        .select(`
            id,
            rider_a:riders!head_to_head_rider_a_id_fkey(id, first_name, last_name, team),
            rider_b:riders!head_to_head_rider_b_id_fkey(id, first_name, last_name, team)
        `)
        .eq('race_id', currentResultsRace.id)
        .single();

    if (h2hError || !h2hConfig || !h2hConfig.rider_a || !h2hConfig.rider_b) {
        container.innerHTML = '<p class="info-text">Geen head-to-head geconfigureerd voor deze koers.</p>';
        return;
    }

    // Check existing result
    const { data: existingH2H } = await supabase
        .from('race_results_h2h')
        .select('winning_rider_id')
        .eq('race_id', currentResultsRace.id)
        .single();

    const winnerId = existingH2H?.winning_rider_id || null;
    const riderA = h2hConfig.rider_a;
    const riderB = h2hConfig.rider_b;

    container.innerHTML = `
        <div class="h2h-options">
            <label class="h2h-option ${winnerId === riderA.id ? 'selected' : ''}">
                <input type="radio" name="result-h2h" value="${riderA.id}" data-h2h-id="${h2hConfig.id}"
                       ${winnerId === riderA.id ? 'checked' : ''}>
                <div class="h2h-rider">
                    <span class="rider-name">${riderA.first_name} ${riderA.last_name}</span>
                    ${riderA.team ? `<span class="rider-team">${riderA.team}</span>` : ''}
                </div>
            </label>
            <div class="h2h-vs">VS</div>
            <label class="h2h-option ${winnerId === riderB.id ? 'selected' : ''}">
                <input type="radio" name="result-h2h" value="${riderB.id}" data-h2h-id="${h2hConfig.id}"
                       ${winnerId === riderB.id ? 'checked' : ''}>
                <div class="h2h-rider">
                    <span class="rider-name">${riderB.first_name} ${riderB.last_name}</span>
                    ${riderB.team ? `<span class="rider-team">${riderB.team}</span>` : ''}
                </div>
            </label>
        </div>
    `;

    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            container.querySelectorAll('.h2h-option').forEach(opt => opt.classList.remove('selected'));
            this.closest('.h2h-option').classList.add('selected');
        });
    });
}

// Save H2H result
async function saveResultsH2H() {
    const selected = document.querySelector('input[name="result-h2h"]:checked');
    if (!selected) {
        alert('Selecteer de winnaar van de H2H');
        return;
    }

    const winnerId = selected.value;
    const h2hId = selected.dataset.h2hId;

    // Delete existing
    await supabase.from('race_results_h2h').delete().eq('race_id', currentResultsRace.id);

    const { error } = await supabase.from('race_results_h2h').insert({
        race_id: currentResultsRace.id,
        h2h_id: h2hId,
        winning_rider_id: winnerId
    });

    if (error) {
        alert('Fout bij opslaan: ' + error.message);
    } else {
        alert('H2H uitslag opgeslagen!');
    }
}

// ====== SCORE CALCULATION ======

async function calculateScores() {
    if (!currentResultsRace) return;

    const statusDiv = document.getElementById('scoring-status');
    statusDiv.innerHTML = '<p style="color: var(--primary);">Punten berekenen...</p>';

    try {
        const raceId = currentResultsRace.id;

        // Load actual results
        const [resTop3, resTop10, resH2H] = await Promise.all([
            supabase.from('race_results_top3').select('rider_id, position').eq('race_id', raceId),
            supabase.from('race_results_top10').select('rider_id, actual_position').eq('race_id', raceId),
            supabase.from('race_results_h2h').select('winning_rider_id').eq('race_id', raceId).single()
        ]);

        const actualTop3 = resTop3.data || [];
        const actualTop10 = resTop10.data || [];
        const h2hWinner = resH2H.data?.winning_rider_id || null;

        if (actualTop3.length === 0) {
            statusDiv.innerHTML = '<p style="color: var(--error);">Vul eerst de top 3 uitslag in!</p>';
            return;
        }

        // Combine top 3 results with top 10 results for the top 3 scoring lookup
        // This allows scoring riders that are in the top 3 OR the ranking candidates
        const allResultPositions = [...actualTop3];
        actualTop10.forEach(r => {
            if (!allResultPositions.find(a => a.rider_id === r.rider_id)) {
                allResultPositions.push({ rider_id: r.rider_id, position: r.actual_position });
            }
        });

        // Load all predictions for this race
        const { data: predictions, error: predError } = await supabase
            .from('predictions')
            .select(`
                id,
                user_id,
                prediction_top3 (rider_id, position),
                prediction_top10 (rider_id, predicted_position),
                prediction_h2h (selected_rider_id)
            `)
            .eq('race_id', raceId);

        if (predError) {
            statusDiv.innerHTML = `<p style="color: var(--error);">Fout bij laden voorspellingen: ${predError.message}</p>`;
            return;
        }

        if (!predictions || predictions.length === 0) {
            statusDiv.innerHTML = '<p style="color: var(--text-muted);">Geen voorspellingen gevonden voor deze koers.</p>';
            return;
        }

        // Delete existing scores for this race
        await supabase.from('scores').delete().eq('race_id', raceId);

        // Calculate scores for each user
        const scoreRows = [];
        for (const pred of predictions) {
            const top3Score = calculateTop3Score(pred.prediction_top3 || [], allResultPositions);
            const top10Score = calculateTop10Score(pred.prediction_top10 || [], actualTop10);
            const selectedH2H = pred.prediction_h2h?.[0]?.selected_rider_id || null;
            const h2hScore = calculateH2HScore(selectedH2H, h2hWinner);

            scoreRows.push({
                user_id: pred.user_id,
                race_id: raceId,
                top3_score: top3Score,
                top10_score: top10Score,
                h2h_score: h2hScore,
                total_score: top3Score + top10Score + h2hScore
            });
        }

        const { error: insertError } = await supabase.from('scores').insert(scoreRows);

        if (insertError) {
            statusDiv.innerHTML = `<p style="color: var(--error);">Fout bij opslaan scores: ${insertError.message}</p>`;
            return;
        }

        // Show results summary
        // Load user names
        const userIds = scoreRows.map(s => s.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);

        const nameMap = {};
        (profiles || []).forEach(p => { nameMap[p.id] = p.display_name || 'Onbekend'; });

        const sorted = scoreRows.sort((a, b) => b.total_score - a.total_score);

        let summaryHtml = `<h4 style="color: var(--success); margin: 15px 0;">Punten berekend voor ${scoreRows.length} speler(s)!</h4>`;
        summaryHtml += '<table class="scores-table"><thead><tr><th>#</th><th>Speler</th><th>Top 3</th><th>Rangschikking</th><th>H2H</th><th>Totaal</th></tr></thead><tbody>';

        sorted.forEach((s, idx) => {
            summaryHtml += `<tr>
                <td>${idx + 1}</td>
                <td>${nameMap[s.user_id] || 'Onbekend'}</td>
                <td>${s.top3_score}</td>
                <td>${s.top10_score}</td>
                <td>${s.h2h_score}</td>
                <td><strong>${s.total_score}</strong></td>
            </tr>`;
        });

        summaryHtml += '</tbody></table>';
        statusDiv.innerHTML = summaryHtml;

    } catch (err) {
        console.error('Score calculation error:', err);
        statusDiv.innerHTML = `<p style="color: var(--error);">Onverwachte fout: ${err.message}</p>`;
    }
}

// Close autocomplete when clicking outside in results modal
document.addEventListener('click', function(e) {
    if (!e.target.closest('.input-group')) {
        document.querySelectorAll('#results-modal .autocomplete-results').forEach(div => {
            div.innerHTML = '';
        });
    }
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const resultsModal = document.getElementById('results-modal');
    if (event.target === resultsModal) {
        closeResultsModal();
    }
    const raceDetailModal = document.getElementById('race-detail-modal');
    if (event.target === raceDetailModal) {
        closeRaceDetail();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', initAdmin);
