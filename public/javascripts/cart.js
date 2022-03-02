let calculateCartTotals = (cartItems) => {
    let total = 0;
    for (let i = 0; i < cartItems.length; i++) {
        total += cartItems[i].product.price.amount * cartItems[i].quantity;
    }
    return total;
}


let renderCartItems = (cartItems) => {
    $('#batabestCartItems').empty();
    cartItems.forEach(item => {
        $('#batabestCartItems').append(`
        <tr id="item-${item.product.asin}">
            <td class="product-thumbnail">
                <a href="${item.product.link}"><img src="${item.product.image['URL']}" alt=""></a>
            </td>
            <td class="product-name"><a href="${item.product.link}">${item.product.title}</a></td>
            <td class="product-price"><span class="amount">${item.product.price.raw}</span></td>
            <td class="product-quantity">
                <div class="cart-plus-minus"><input data-asin="${item.product.asin}" type="text" value="${item.quantity}" /></div>
            </td>
            <td id="subtotal-${item.product.asin}" class="product-subtotal"><span class="amount">$${(item.quantity * item.product.price.amount).toFixed(2)}</span></td>
            <td id="remove-${item.product.asin}" class="product-remove"><a class="removeitem" data-asin="${item.product.asin}" href="#"><i data-asin="${item.product.asin}" class="fa fa-times"></i></a></td>
        </tr>`);
    });

}

$(document).ready(function() {
    let cartItems = JSON.parse(localStorage.getItem('batabestCart')) || [];
    renderCartItems(cartItems);
    let subTotal = calculateCartTotals(cartItems);
    $('#cartsubtotal span').text(`$${subTotal.toFixed(2)}`);
    $('.product-quantity input').each((index, element) => {
        $(element).off('change');
        $(element).on('change', (event) => {
            let quantity = parseInt(event.target.value);
            let asin = event.target.dataset.asin;
            for (let i = 0; i < cartItems.length; i++) {
                if (cartItems[i].product.asin == asin) {
                    cartItems[i].quantity = quantity;
                    $(`#subtotal-${asin} span`).text(`$${(quantity * cartItems[i].product.price.amount).toFixed(2)}`)
                }
            }
            localStorage.setItem('batabestCart', JSON.stringify(cartItems));
            let subTotal = calculateCartTotals(cartItems);
            $('#cartsubtotal span').text(`$${subTotal.toFixed(2)}`);
        })
    });

    $('.removeitem').each((index, element) => {
        $(element).off('click');
        $(element).on('click', event => {
            console.log(event.target);
            event.preventDefault();
            let asin = event.target.dataset.asin;
            let filtered = cartItems.filter(item => item.product.asin != asin);
            cartItems = filtered;
            localStorage.setItem('batabestCart', JSON.stringify(cartItems));
            $(`#item-${asin}`).remove();
            let subTotal = calculateCartTotals(cartItems);
            $('#cartsubtotal span').text(`$${subTotal.toFixed(2)}`);
            $('#batabestCart span').text(`(${cartItems.length})`)
        })
    });

    $('#checkoutButton').on('click', event => {
        let baseUrl = "https://www.amazon.ca/gp/aws/cart/add.html/";
        let awsAccessKeyId = 'AKIAJMCINFUQMHBBVNHQ';
        let associateTag = localStorage.getItem('batabest_referrerid') || 'consumerrun01-20';
        let amazonCheckoutUrl = `${baseUrl}?AWSAccessKeyId=${awsAccessKeyId}&AssociateTag=${associateTag}`;
        for (let i = 0; i < cartItems.length; i++) {
            amazonCheckoutUrl += `&ASIN.${i+1}=${cartItems[i].product.asin}&Quantity.${i+1}=${cartItems[i].quantity}`
        }
        amazonCheckoutUrl += `&add=add`;
        window.open(amazonCheckoutUrl, '_blank');
    });
});