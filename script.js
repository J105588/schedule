document.addEventListener('DOMContentLoaded', () => {
    const modalButtons = document.querySelectorAll('.modal-btn');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    modalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            modal.style.display = 'block';
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            modal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// サイドバーを開く
function openSidebar() {
    document.getElementById('sidebar').style.left = '0';
}

// サイドバーを閉じる
function closeSidebar() {
    document.getElementById('sidebar').style.left = '-250px';
}