function callPrompt(message) {
    return new Promise((resolve, reject) => {
        const promptContainer = document.getElementById('prompt-container');
        const promptMessage = document.getElementById('prompt-message');
        const promptInput = document.getElementById('prompt-input');
        const promptOk = document.getElementById('prompt-ok');
        const promptCancel = document.getElementById('prompt-cancel');

        // Set the message
        promptMessage.textContent = message;

        // Show the prompt
        promptContainer.classList.remove('hidden');
        function disableKeypress(e) {
            if (promptContainer.classList.contains('hidden') || document.activeElement === promptInput) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        window.addEventListener('keydown', disableKeypress);
        document.getElementById('canvas').addEventListener('keydown', disableKeypress)

        // Handler for OK button
        function onOk() {
            const userInput = promptInput.value;
            cleanup();
            resolve(userInput);
        }

        // Handler for Cancel button
        function onCancel() {
            cleanup();
            reject(console.log('User cancelled the prompt'));
        }

        // Cleanup function to remove event listeners and hide the prompt
        function cleanup() {
            promptOk.removeEventListener('click', onOk);
            promptCancel.removeEventListener('click', onCancel);
            promptContainer.classList.add('hidden');
            promptInput.value = ''; // Clear the input field
        }

        // Add event listeners
        promptOk.addEventListener('click', onOk);
        promptCancel.addEventListener('click', onCancel);
    });
}
async function applyStringOnHTML(key, affected, type, additionalString) {
    const loc = new Localizator();
    if (type === 'html') {
        affected.innerHTML = await loc.getLocalizedString(key) + additionalString;
        console.log('HTML affected');
    } else if (type === 'title') {
        affected.title = await loc.getLocalizedString(key) + additionalString;
        console.log('Title affected');
    } else {
        throw new Error('Unknown type');
    }
}
function openSettings() {
    document.getElementById('set-modal').classList.remove('hidden')
}
document.getElementById('prompt-close').onclick = () => {document.getElementById('set-modal').classList.add('hidden')}
