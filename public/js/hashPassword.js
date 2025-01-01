document.getElementById('loginForm').addEventListener('submit', async (event) => {
    const password = event.target.password.value;
    // Hash the password
    
    const hashedPassword = CryptoJS.SHA512(password).toString(CryptoJS.enc.Hex);
    // Update the password field with the hashed value before submitting
    event.target.password.value = hashedPassword;
});