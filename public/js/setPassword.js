document.getElementById('loginForm').addEventListener('submit', async (event) => {

    //check if the password is valid (at least 9 characters, 1 uppercase, 1 lowercase, 1 number)
    const password = event.target.password.value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{9,})/;
    if (!passwordRegex.test(password)) {
        event.preventDefault();
        //change the message class to show the error message
        document.getElementById('message').innerText = 'Password must be at least 9 characters long and contain at least one uppercase letter, one lowercase letter, and one number.';
        return;
    }
    // Hash the password
    
    const hashedPassword = CryptoJS.SHA512(password).toString(CryptoJS.enc.Hex);
    // Update the password field with the hashed value before submitting
    event.target.password.value = hashedPassword;
});