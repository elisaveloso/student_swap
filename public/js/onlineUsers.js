document.addEventListener("DOMContentLoaded", () => {
    const updateOnlineCount = async () => {
        try {
            const response = await fetch('/online-users');
            const data = await response.json();
            document.getElementById('onlineCount').innerText = data.onlineCount;
        } catch (err) {
            console.error('Error fetching online user count:', err);
        }
    };

    // Update every 5 seconds
    setInterval(updateOnlineCount, 5000);

    // Initial load
    updateOnlineCount();
});
