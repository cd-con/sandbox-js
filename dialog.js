const showButton = document.getElementById('show-settings');
const closeButton = document.getElementById('close-settings');
const dialog = document.getElementById('dialog');
// "Update details" button opens the <dialog> modally
showButton.addEventListener('click', () => {
    dialog.showModal();
});

closeButton.addEventListener('click', () => {
    dialog.close();
});