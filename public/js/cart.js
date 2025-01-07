document.addEventListener("DOMContentLoaded", () => {
    const updateQuantity = (input, change) => {
        const itemDiv = input.closest(".item");
        const itemId = itemDiv.dataset.itemId;

        let quantity = parseInt(input.value);
        const stock = parseInt(itemDiv.querySelector(".stock span").innerText);

        // Update quantity within limits
        quantity = Math.max(0, Math.min(stock, quantity + change));
        input.value = quantity;

        if (quantity === 0) {
            removeItem(itemId);
        } else {
            updateItem(itemId, quantity);
        }
    };

    const updateItem = async (itemId, quantity) => {
        try {
            const response = await fetch("/update-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ itemId, quantity }),
            });

            if (response.ok) {
                const { itemTotal, totalCartPrice } = await response.json();
                console.log(itemTotal, totalCartPrice);
                // Update the item's total price
                const itemDiv = document.querySelector(`[data-item-id="${itemId}"]`);
                itemDiv.querySelector(".item-total-price").innerText = itemTotal.toFixed(2);

                // Update the total cart price
                document.getElementById("total-price").innerText = totalCartPrice;
            } else {
                alert("Failed to update cart.");
            }
        } catch (error) {
            console.error("Error updating cart:", error);
        }
    };

    const removeItem = async (itemId) => {
        try {
            const response = await fetch("/remove-from-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ itemId }),
            });

            if (response.ok) {
                // Remove the item from the DOM
                const itemDiv = document.querySelector(`[data-item-id="${itemId}"]`);
                itemDiv.remove();

                // Update the total cart price
                const { totalCartPrice } = await response.json();
                document.getElementById("total-price").innerText = totalCartPrice.toFixed(2);
            } else {
                alert("Failed to remove item from cart.");
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    // Add event listeners for increment and decrement buttons
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

    // Handle manual input of quantity
    document.querySelectorAll(".quantity-selector input").forEach((input) => {
        input.addEventListener("change", (e) => {
            const itemId = input.closest(".item").dataset.itemId;
            let quantity = parseInt(input.value);

            const stock = parseInt(
                input.closest(".item").querySelector(".stock span").innerText
            );

            // Quantity should be larger than and at most the stock
            quantity = Math.max(0, Math.min(stock, quantity));
            input.value = quantity;

            // Update on the server
            if (quantity === 0) {
                removeItem(itemId);
            } else {
                updateItem(itemId, quantity);
            }
        });
    });

    // Add event listeners for the remove buttons
    document.querySelectorAll(".remove-item").forEach((button) => {
            button.addEventListener("click", (e) => {
            const itemId = e.target.closest(".item").dataset.itemId;
            removeItem(itemId);
        });
    });
    
});