// Locate elements in the DOM (Document Object Model)
const actionButton = document.getElementById('action-btn');
const resultBox = document.getElementById('result-box');
const fileInput = document.getElementById('file-input');
const fileStatus = document.getElementById('file-status');
const resultText = document.getElementById('result-text');
const loginButton = document.getElementById('login-btn');
const logoutButton = document.getElementById('logout-btn');
const userStatus = document.getElementById('user-status');

const SUPABASE_URL = 'https://owaivsmckmdbqktrjisl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-PpuNLLEnz_BQXxMWL9p7g_1h7ALI2E';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Change this if your backend uses a different route.
const API_URL = '/api/summarize';

let preparedNotes = null;

// Determines which buttons to show based on if the user is logged in or not
function updateAuthDisplay(session) {
    const user = session?.user;

    if (user) {
        userStatus.textContent = `Signed in as ${user.email}`;
        loginButton.hidden = true;
        logoutButton.hidden = false;
    } else {
        userStatus.textContent = 'Not signed in';
        loginButton.hidden = false;
        logoutButton.hidden = true;
    }
}

loginButton.addEventListener('click', async function () {
    const {error} = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error){
        userStatus.textContent = "Login Failed: " + error.message;
    }
    
});

logoutButton.addEventListener('click', async function () {
    const {error} = await supabaseClient.auth.signOut();

    if (error){
        userStatus.textContent = "Logout Failed: " + error.message;
    }
    
});

// Read the selected text file and prepare the data for the backend.
async function prepareFile(file) {
    const content = (await file.text()).trim();

    if (!content) {
        throw new Error('The selected file is empty.');
    }

    return {
        fileName: file.name,
        content: content
    };
}

fileInput.addEventListener('change', async function () {
    const selectedFile = fileInput.files[0];
    preparedNotes = null;
    actionButton.disabled = true;

    if (!selectedFile) {
        fileStatus.textContent = 'No file selected.';
        return;
    }

    try {
        preparedNotes = await prepareFile(selectedFile);
        fileStatus.textContent = `Ready: ${selectedFile.name}`;
        actionButton.disabled = false;
    } catch (error) {
        fileStatus.textContent = error.message;
    }
});

actionButton.addEventListener('click', async function () {
    if (!preparedNotes) return;

    actionButton.disabled = true;
    resultText.textContent = 'Generating summary...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: preparedNotes.content })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data.error || 'The backend could not generate a summary.';
            throw new Error(`Error ${data.status || response.status}: ${message}`);
        }
        
        resultText.textContent = data.result;
    } catch (error) {
        resultText.textContent = error.message;
    } finally {
        actionButton.disabled = false;
    }
});

async function initializeAuth() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        userStatus.textContent = `Authentication error: ${error.message}`;
        return;
    }

    updateAuthDisplay(data.session);
}

supabaseClient.auth.onAuthStateChange(function (_event, session) {
    updateAuthDisplay(session);
});

initializeAuth();