document.addEventListener('DOMContentLoaded', function() {
    var shippingMethodRadios = document.querySelectorAll('input[name="shippingMethod"]');
    var shippingCostElement = document.querySelector('.shipping-cost');
    var totalPriceElement = document.querySelector('.total-price');
    var subtotal = parseFloat(document.querySelector('.subtotal').textContent);

    shippingMethodRadios.forEach(function(radio) {
        radio.addEventListener('change', function() {
            var shippingCost = parseFloat(this.getAttribute('data-cost'));

            // Update the shipping cost and total price
            shippingCostElement.textContent = shippingCost + '€';
            totalPriceElement.textContent = (subtotal + shippingCost) + '€';
        });
    });
});