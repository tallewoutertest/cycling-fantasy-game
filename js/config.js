// Supabase Configuration
// BELANGRIJK: Vervang deze waarden met je eigen Supabase project credentials
// Deze vind je in: Supabase Dashboard -> Project Settings -> API

const SUPABASE_URL = 'https://qrwegdkpzgalohlrcfmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd2VnZGtwemdhbG9obHJjZm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDI4MTMsImV4cCI6MjA4NjQ3ODgxM30.lzbeubbM-rwG095cGhzkFjWl0ZR8gn851fnKgbVJiug';

// Globale Supabase client variabele
var supabase;

// Initialiseer Supabase wanneer de pagina geladen is
(function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client geïnitialiseerd');
    } else {
        console.error('Supabase library is niet geladen. Controleer de CDN link in index.html');
    }
})();
