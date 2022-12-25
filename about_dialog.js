const aboutDialog = document.getElementById('dialog-about');
aboutDialog.innerHTML = aboutDialog.innerHTML.replaceAll("%Title%", document.title);

const showAboutButton = document.getElementById('show-about');
const closeAboutButton = document.getElementById('close-about');

showAboutButton.addEventListener('click', () => {
    aboutDialog.showModal();
});

closeAboutButton.addEventListener('click', () => {
    aboutDialog.close();
});
