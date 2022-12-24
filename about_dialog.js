const showAboutButton = document.getElementById('show-about');
const closeAboutButton = document.getElementById('close-about');
const aboutDialog = document.getElementById('dialog-about');
showAboutButton.addEventListener('click', () => {
    aboutDialog.showModal();
});

closeAboutButton.addEventListener('click', () => {
    aboutDialog.close();
});