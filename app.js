// Locate elements in the DOM (Document Object Model)
const actionButton = document.getElementById('action-btn');
const resultBox = document.getElementById('result-box');
const fileInput = document.getElementById('file-input');
const fileStatus = document.getElementById('file-status');
const resultText = document.getElementById('result-text');

// Change this if your backend uses a different route.
const API_URL = '/api/summarize';

let preparedNotes = null;

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
            body: JSON.stringify(preparedNotes)
        });

        if (!response.ok) {
            throw new Error('The backend could not generate a summary.');
        }

        const data = await response.json();
        resultText.textContent = data.summary;
    } catch (error) {
        resultText.textContent = error.message;
    } finally {
        actionButton.disabled = false;
    }
});
