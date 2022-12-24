const showSettingsButton = document.getElementById('show-settings');
const closeSettingsButton = document.getElementById('close-settings');
const settingsDialog = document.getElementById('dialog-settings');
showSettingsButton.addEventListener('click', () => {
    settingsDialog.showModal();
});

closeSettingsButton.addEventListener('click', () => {
    settingsDialog.close();
});