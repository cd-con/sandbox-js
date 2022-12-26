// Настройки
const showSettingsButton = document.getElementById('show-settings');
const closeSettingsButton = document.getElementById('close-settings');
const settingsDialog = document.getElementById('dialog-settings');

// About
const showAboutButton = document.getElementById('show-about');
const closeAboutButton = document.getElementById('close-about');
const aboutDialog = document.getElementById('dialog-about');


// Настройки
showSettingsButton.addEventListener('click', () => {
    settingsDialog.showModal();
});

closeSettingsButton.addEventListener('click', () => {
    settingsDialog.close();
});


// About
showAboutButton.addEventListener('click', () => {
    aboutDialog.showModal();
});

closeAboutButton.addEventListener('click', () => {
    aboutDialog.close();
});