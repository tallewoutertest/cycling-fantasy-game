// Predictions management
let currentRace = null;
let currentPrediction = null;
let top10Candidates = [];
let h2hOptions = null;
let sortableInstance = null;

// Open prediction modal for a race
async function openPredictionModal(raceId) {
    currentRace = races.find(r => r.id === raceId);
    if (!currentRace) return;

    // Load race configuration
    await loadRaceConfiguration(raceId);

    // Load existing prediction if any
    await loadExistingPrediction(raceId);

    // Display modal
    document.getElementById('modal-race-name').textContent = currentRace.name;
    document.getElementById('modal-race-date').textContent =
        new Date(currentRace.date).toLocaleDateString('nl-NL', { dateStyle: 'long' });
    document.getElementById('modal-deadline').textContent =
        `Inschrijven tot: ${new Date(currentRace.registration_deadline).toLocaleString('nl-NL')}`;

    // Setup top 10 sortable list
    setupTop10List();

    // Setup H2H
    setupH2H();

    // Show modal
    document.getElementById('prediction-modal').style.display = 'block';
}

// Close prediction modal
function closePredictionModal() {
    document.getElementById('prediction-modal').style.display = 'none';
    currentRace = null;
    currentPrediction = null;
    selectedRiders = {};

    // Clear form
    document.getElementById('prediction-form').reset();
    document.querySelectorAll('.autocomplete-results').forEach(el => el.innerHTML = '');
}

// Load race configuration (top 10 candidates and H2H)
async function loadRaceConfiguration(raceId) {
    // Load top 10 candidates
    const { data: top10Data, error: top10Error } = await supabase
        .from('top_10_candidates')
        .select(`
            id,
            display_order,
            rider_id,
            riders (id, first_name, last_name, team)
        `)
        .eq('race_id', raceId)
        .order('display_order');

    if (top10Error) {
        console.error('Error loading top 10:', top10Error);
        top10Candidates = [];
    } else {
        top10Candidates = top10Data || [];
    }

    // Load H2H
    const { data: h2hData, error: h2hError } = await supabase
        .from('head_to_head')
        .select(`
            id,
            rider_a_id,
            rider_b_id,
            rider_a:riders!head_to_head_rider_a_id_fkey (id, first_name, last_name, team),
            rider_b:riders!head_to_head_rider_b_id_fkey (id, first_name, last_name, team)
        `)
        .eq('race_id', raceId)
        .single();

    if (h2hError && h2hError.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error loading H2H:', h2hError);
        h2hOptions = null;
    } else {
        h2hOptions = h2hData;
    }
}

// Load existing prediction
async function loadExistingPrediction(raceId) {
    const { data: predData, error: predError } = await supabase
        .from('predictions')
        .select(`
            id,
            prediction_top3 (position, rider_id, riders (id, first_name, last_name)),
            prediction_top10 (predicted_position, rider_id),
            prediction_h2h (selected_rider_id)
        `)
        .eq('user_id', currentUser.id)
        .eq('race_id', raceId)
        .single();

    if (predError && predError.code !== 'PGRST116') {
        console.error('Error loading prediction:', predError);
        currentPrediction = null;
        return;
    }

    currentPrediction = predData;

    // Fill in existing top 3
    if (predData?.prediction_top3) {
        predData.prediction_top3.forEach(item => {
            const inputId = `top3-${item.position}`;
            const input = document.getElementById(inputId);
            if (input && item.riders) {
                input.value = `${item.riders.first_name} ${item.riders.last_name}`;
                selectedRiders[inputId] = item.rider_id;
            }
        });
    }
}

// Setup top 10 sortable list
function setupTop10List() {
    const container = document.getElementById('top10-list');

    if (top10Candidates.length === 0) {
        container.innerHTML = '<p class="info-text">De beheerder moet eerst de top 10 kandidaten configureren voor deze koers.</p>';
        return;
    }

    // Create initial order (from existing prediction or default)
    let orderedCandidates = [...top10Candidates];

    if (currentPrediction?.prediction_top10) {
        // Sort by predicted position
        const predMap = {};
        currentPrediction.prediction_top10.forEach(p => {
            predMap[p.rider_id] = p.predicted_position;
        });

        orderedCandidates.sort((a, b) => {
            const posA = predMap[a.riders.id] || 999;
            const posB = predMap[b.riders.id] || 999;
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

    // Initialize Sortable
    sortableInstance = new Sortable(container, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: function() {
            updatePositionNumbers();
        }
    });
}

// Update position numbers after drag
function updatePositionNumbers() {
    const items = document.querySelectorAll('#top10-list .sortable-item');
    items.forEach((item, index) => {
        item.querySelector('.position-number').textContent = index + 1;
    });
}

// Setup H2H selection
function setupH2H() {
    const container = document.getElementById('h2h-selection');

    if (!h2hOptions || !h2hOptions.rider_a || !h2hOptions.rider_b) {
        container.innerHTML = '<p class="info-text">Geen head-to-head geconfigureerd voor deze koers.</p>';
        return;
    }

    const riderA = h2hOptions.rider_a;
    const riderB = h2hOptions.rider_b;

    // Check existing selection
    let selectedId = null;
    if (currentPrediction?.prediction_h2h?.[0]) {
        selectedId = currentPrediction.prediction_h2h[0].selected_rider_id;
    }

    container.innerHTML = `
        <div class="h2h-options">
            <label class="h2h-option ${selectedId === riderA.id ? 'selected' : ''}">
                <input type="radio" name="h2h" value="${riderA.id}" ${selectedId === riderA.id ? 'checked' : ''}>
                <div class="h2h-rider">
                    <span class="rider-name">${riderA.first_name} ${riderA.last_name}</span>
                    ${riderA.team ? `<span class="rider-team">${riderA.team}</span>` : ''}
                </div>
            </label>
            <div class="h2h-vs">VS</div>
            <label class="h2h-option ${selectedId === riderB.id ? 'selected' : ''}">
                <input type="radio" name="h2h" value="${riderB.id}" ${selectedId === riderB.id ? 'checked' : ''}>
                <div class="h2h-rider">
                    <span class="rider-name">${riderB.first_name} ${riderB.last_name}</span>
                    ${riderB.team ? `<span class="rider-team">${riderB.team}</span>` : ''}
                </div>
            </label>
        </div>
    `;

    // Add change listeners to update visual selection
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            container.querySelectorAll('.h2h-option').forEach(opt => opt.classList.remove('selected'));
            this.closest('.h2h-option').classList.add('selected');
        });
    });
}

// Handle prediction form submission
document.getElementById('prediction-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!currentUser || !currentRace) return;

    // Validate top 3
    const top3Riders = [];
    for (let i = 1; i <= 3; i++) {
        const riderId = selectedRiders[`top3-${i}`];
        if (!riderId) {
            alert(`Selecteer een renner voor positie ${i} in de top 3`);
            return;
        }
        if (top3Riders.includes(riderId)) {
            alert('Je kunt niet dezelfde renner meerdere keren selecteren in de top 3');
            return;
        }
        top3Riders.push(riderId);
    }

    // Get top 10 order
    const top10Items = document.querySelectorAll('#top10-list .sortable-item');
    const top10Order = Array.from(top10Items).map((item, index) => ({
        rider_id: item.dataset.riderId,
        position: index + 1
    }));

    // Get H2H selection
    const h2hRadio = document.querySelector('input[name="h2h"]:checked');
    const h2hSelection = h2hRadio ? h2hRadio.value : null;

    if (h2hOptions && !h2hSelection) {
        alert('Maak een keuze in de head-to-head');
        return;
    }

    // Save prediction
    try {
        // Create or update prediction
        let predictionId = currentPrediction?.id;

        if (predictionId) {
            // Update existing
            const { error: updateError } = await supabase
                .from('predictions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', predictionId);

            if (updateError) throw updateError;

            // Delete old predictions
            await supabase.from('prediction_top3').delete().eq('prediction_id', predictionId);
            await supabase.from('prediction_top10').delete().eq('prediction_id', predictionId);
            await supabase.from('prediction_h2h').delete().eq('prediction_id', predictionId);
        } else {
            // Create new
            const { data: newPred, error: createError } = await supabase
                .from('predictions')
                .insert({
                    user_id: currentUser.id,
                    race_id: currentRace.id
                })
                .select()
                .single();

            if (createError) throw createError;
            predictionId = newPred.id;
        }

        // Insert top 3
        const top3Data = top3Riders.map((riderId, index) => ({
            prediction_id: predictionId,
            rider_id: riderId,
            position: index + 1
        }));
        const { error: top3Error } = await supabase
            .from('prediction_top3')
            .insert(top3Data);
        if (top3Error) throw top3Error;

        // Insert top 10 if configured
        if (top10Order.length > 0) {
            const top10Data = top10Order.map(item => ({
                prediction_id: predictionId,
                rider_id: item.rider_id,
                predicted_position: item.position
            }));
            const { error: top10Error } = await supabase
                .from('prediction_top10')
                .insert(top10Data);
            if (top10Error) throw top10Error;
        }

        // Insert H2H if configured
        if (h2hSelection && h2hOptions) {
            const { error: h2hError } = await supabase
                .from('prediction_h2h')
                .insert({
                    prediction_id: predictionId,
                    h2h_id: h2hOptions.id,
                    selected_rider_id: h2hSelection
                });
            if (h2hError) throw h2hError;
        }

        alert('Voorspelling opgeslagen!');
        closePredictionModal();
        loadPredictionStatus();

    } catch (error) {
        console.error('Error saving prediction:', error);
        alert('Fout bij opslaan: ' + error.message);
    }
});
