// Admin Panel JavaScript
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

    const raceData = {
        name: document.getElementById('race-name').value.trim(),
        date: document.getElementById('race-date').value,
        registration_deadline: document.getElementById('race-deadline').value,
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

    showRaceTab('participants');
    await loadRaceParticipants();
    await loadRaceTop10();
    await loadRaceH2H();
}

function closeRaceDetail() {
    document.getElementById('race-detail-modal').style.display = 'none';
    currentRaceDetail = null;
}

function showRaceTab(tabName) {
    document.querySelectorAll('.race-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

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
        container.innerHTML = '<p class="info-text">Nog geen top 10 kandidaten. Voeg er 10 toe.</p>';
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

    if (count >= 10) {
        alert('Je kunt maximaal 10 kandidaten toevoegen');
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

// Initialize
document.addEventListener('DOMContentLoaded', initAdmin);
