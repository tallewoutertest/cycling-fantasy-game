// Authentication functions
let currentUser = null;

// Check authentication state on load
async function initAuth() {
    if (!supabase) {
        console.error('Supabase client niet beschikbaar');
        showAuthMessage('Kan geen verbinding maken. Herlaad de pagina.', true);
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        currentUser = session.user;
        await loadUserProfile();
        showApp();
    } else {
        showAuth();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            loadUserProfile();
            showApp();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showAuth();
        }
    });
}

// Show authentication screen
function showAuth() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

// Show main app
function showApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    loadRaces();
}

// Switch between login and register forms
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    clearAuthMessage();
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    clearAuthMessage();
}

// Display auth messages
function showAuthMessage(message, isError = false) {
    const messageEl = document.getElementById('auth-message');
    messageEl.textContent = message;
    messageEl.className = isError ? 'message error' : 'message success';
    messageEl.style.display = 'block';
}

function clearAuthMessage() {
    document.getElementById('auth-message').style.display = 'none';
}

// Login function
async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showAuthMessage('Vul alle velden in', true);
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        showAuthMessage('Inloggen mislukt: ' + error.message, true);
    } else {
        showAuthMessage('Succesvol ingelogd!');
        // App will update via auth state listener
    }
}

// Register function
async function register() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (!name || !email || !password) {
        showAuthMessage('Vul alle velden in', true);
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Wachtwoord moet minimaal 6 tekens bevatten', true);
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                display_name: name
            }
        }
    });

    if (error) {
        showAuthMessage('Registratie mislukt: ' + error.message, true);
    } else {
        // Update profile with display name
        if (data.user) {
            await supabase
                .from('profiles')
                .update({ display_name: name })
                .eq('id', data.user.id);
        }

        showAuthMessage('Account aangemaakt! Je kunt nu inloggen.');
        setTimeout(() => showLogin(), 2000);
    }
}

// Logout function
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert('Uitloggen mislukt: ' + error.message);
    }
}

// Load user profile
async function loadUserProfile() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (data) {
        const displayName = data.display_name || currentUser.email;
        document.getElementById('user-name').textContent = displayName;
        document.getElementById('profile-name').value = data.display_name || '';

        // Store admin status
        currentUser.isAdmin = data.is_admin;
    }
}

// Update profile
async function updateProfile() {
    const newName = document.getElementById('profile-name').value.trim();

    if (!newName) {
        alert('Vul een naam in');
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', currentUser.id);

    if (error) {
        alert('Profiel bijwerken mislukt: ' + error.message);
    } else {
        alert('Profiel bijgewerkt!');
        loadUserProfile();
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wacht even om er zeker van te zijn dat supabase geladen is
    if (typeof supabase === 'undefined') {
        console.error('Supabase is niet geïnitialiseerd!');
        showAuthMessage('Er is een technisch probleem. Herlaad de pagina.', true);
        return;
    }
    initAuth();
});
