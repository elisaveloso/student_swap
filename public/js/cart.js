document.addEventListener("DOMContentLoaded", () => {
    const updateQuantity = (input, change) => {
        const itemDiv = input.closest(".item");
        const itemId = itemDiv.dataset.itemId;
        const itemPrice = parseFloat(itemDiv.querySelector(".item-price").innerText);

        let quantity = parseInt(input.value);
        const stock = parseInt(itemDiv.querySelector(".stock span").innerText);

        // Update quantity within limits
        quantity = Math.max(0, Math.min(stock, quantity + change));
        input.value = quantity;

        if (quantity === 0) {
            removeItem(itemId);
        } else {
            updateItem(itemId, quantity, itemPrice);
        }
    };

    const updateItem = async (itemId, quantity, itemPrice) => {
        try {
            const response = await fetch("/update-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ itemId, quantity, itemPrice }),
            });

            if (response.ok) {
                const { itemTotal, itemPrice, totalCartPrice, totalQuantity, discountPercentage } = await response.json();
                console.log(itemTotal, itemPrice, totalCartPrice, discountPercentage);
                // Update the item's total price
                const itemDiv = document.querySelector(`[data-item-id="${itemId}"]`);
                itemDiv.querySelector(".item-total-price").innerText = itemTotal;

                // Update the item's price
                itemDiv.querySelector(".item-price").innerText = `Price: $${itemPrice.toFixed(2)}`;

                // Update the total cart price
                document.getElementById("total-price").innerText = totalCartPrice;

                // Update the total quantity
                const cartQuantity = document.querySelector(".cart-link span");
                cartQuantity.textContent = totalQuantity; // Update cart quantity in header

                // Update the discount percentage
                const discountElement = itemDiv.querySelector(".discount");
                if (discountPercentage > 0) {
                    if (discountElement) {
                        discountElement.innerText = `Discount: ${discountPercentage}%`;
                    } else {
                        const discountP = document.createElement("p");
                        discountP.classList.add("discount");
                        discountP.innerText = `Discount: ${discountPercentage}%`;
                        itemDiv.appendChild(discountP);
                    }
                } else if (discountElement) {
                    discountElement.remove();
                }
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
                const { totalCartPrice, totalQuantity } = await response.json();
                console.log('Total Cart Price:', totalCartPrice);
                console.log('Total Quantity:', totalQuantity);
    
                // Remove the item from the DOM
                const itemDiv = document.querySelector(`[data-item-id="${itemId}"]`);
                itemDiv.remove();
    
                // Update the total cart price
                document.getElementById("total-price").innerText = parseFloat(totalCartPrice).toFixed(2);
    
                // Update the total quantity
                const cartQuantity = document.querySelector(".cart-link span");
                cartQuantity.textContent = totalQuantity; // Update cart quantity in header
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