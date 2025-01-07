document.addEventListener("DOMContentLoaded", () => {
    const updateQuantity = (input, change) => {
        let currentValue = parseInt(input.value);
        const stockId = input.id.replace("quantity-", "stock-");
        const stock = parseInt(document.getElementById(stockId).innerText);

        // Update quantity within limits
        currentValue = Math.max(1, Math.min(stock, currentValue + change));
        input.value = currentValue;
    };

    // Handle increment and decrement buttons
    document.querySelectorAll(".increment").forEach((button) => {
        button.addEventListener("click", (e) => {
            const input = e.target.closest(".quantity-selector").querySelector("input");
            updateQuantity(input, 1);
        });
    });

    document.querySelectorAll(".decrement").forEach((button) => {
        button.addEventListener("click", (e) => {
            const input = e.target.closest(".quantity-selector").querySelector("input");
            updateQuantity(input, -1);
        });
    });

    // Handle Add to Cart button
    document.querySelectorAll(".add-to-cart").forEach((button) => {
        button.addEventListener("click", async (e) => {
            const productId = e.target.dataset.productId;
            const quantity = document.getElementById(`quantity-${productId}`).value;
            
            // Send data to backend
            const response = await fetch("/add-to-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: parseInt(productId),
                    quantity: parseInt(quantity),
                }),
            });

            // If user is not logged in, redirect to login page
            if (response.redirected) {
                window.location.href = response.url;
            } else if (response.ok) {
                const data = await response.json();
                const cartQuantity = document.querySelector(".cart-link span");
                cartQuantity.textContent = data.totalQuantity; // Update cart quantity in header
                alert("Product added to cart!");
            } else {
                alert("Failed to add product to cart.");
            }
        });
    });
});
