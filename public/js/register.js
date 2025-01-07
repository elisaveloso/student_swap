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
        let response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        // Check response status
        if (response.redirected) {
            // Manually handle redirect
            console.log("Redirecting to:", response.url);
            window.location.href = response.url;
        }
        
        //if it's not a redirect, then the user already exists
        else if (response.status === 200) {
            // Manually handle error
            console.log("Registration failed");
            const error = await response.text();
            document.getElementById('message').innerText = "A user with that email already exists";
        }
    }
    catch (error) {
        console.error("Error:", error);
    }
});
