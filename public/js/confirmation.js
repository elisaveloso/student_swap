async function updateCartQuantity() {
    try {
        const response = await fetch("/update-cart-quantity", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const { totalQuantity } = await response.json();
            console.log('Total Quantity:', totalQuantity);

            // Update the total quantity
            const cartQuantity = document.querySelector(".cart-link span");
            cartQuantity.textContent = totalQuantity; // Update cart quantity in header
        } else {
            alert("Failed to update cart amount.");
        }
    } catch (error) {
        console.error("Error updating cart amount:", error);
    }
}

updateCartQuantity();