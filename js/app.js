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

// Load standings (placeholder for now)
async function loadStandings() {
    const container = document.getElementById('standings-content');
    container.innerHTML = '<p class="info-text">Klassement functionaliteit komt binnenkort beschikbaar.</p>';

    // TODO: Implement standings calculation based on results
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('prediction-modal');
    if (event.target === modal) {
        closePredictionModal();
    }
}
