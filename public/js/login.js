document.addEventListener('DOMContentLoaded', function() {
    // Call the function when the form is submitted
    document.querySelector("form").onsubmit = function(event) {
        // Get email value
        const email = document.getElementById("email").value;
        console.log(email);
        console.log(validateEmail(email));
        // Validate email
        if (validateEmail(email)) {
            document.getElementById("error").textContent = "";
            hashPassword(event);
        } else {
            document.getElementById("error").textContent = "Email is invalid";
            event.preventDefault();
        }
    };

    // Function to validate email
    function validateEmail(email) {
        if (email.includes("@") && email.length >= 5) {
            return true;
        }
        return false;
    }

    function hashPassword(event) {
        const password = event.target.password.value;
        // Hash the password
        const hashedPassword = CryptoJS.SHA512(password).toString(CryptoJS.enc.Hex);
        // Update the password field with the hashed value before submitting
        event.target.password.value = hashedPassword;
        //submit the form
        event.target.submit();
    }
});