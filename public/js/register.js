document.getElementById('registrationForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    try {
        // Collect form data
        const form = event.target;
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());

        // Collect screen resolution
        const screenResolution = {
            width: window.screen.width,
            height: window.screen.height,
        };

        // Detect OS
        const getOS = () => {
            const userAgent = window.navigator.userAgent;
            if (userAgent.indexOf("Win") !== -1) return "Windows";
            if (userAgent.indexOf("Mac") !== -1) return "MacOS";
            if (userAgent.indexOf("Linux") !== -1) return "Linux";
            if (userAgent.indexOf("Android") !== -1) return "Android";
            if (userAgent.indexOf("like Mac") !== -1) return "iOS";
            return "Unknown";
        };
        const os = getOS();

        // Combine all data
        const data = {
            ...userData, // Includes username, password, etc.
            screenResolution,
            os,
        };

        // Send data to the backend
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        // Check response status
        if (response.redirected) {
            // Manually handle redirect
            window.location.href = response.url;
        } else {
            const responseData = await response.json();
            if (responseData.error) {
                console.error('Registration error:', responseData.error);
                alert(responseData.error); // Show error to user
            } else {
                // Redirect to login or home if success
                window.location.href = "/login"; // Adjust based on your app
            }
        }
    } catch (err) {
        console.error('An error occurred:', err);
        alert('Something went wrong. Please try again.');
    }
});
