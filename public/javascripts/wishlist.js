$(document).ready(function() {
    let wishList = JSON.parse(localStorage.getItem('batabestWishList')) || [];

    let cartItems = JSON.parse(localStorage.getItem('batabestCart')) || [];


    wishList.forEach(item => {
        $('#batabest_wishlist').append(`<tr id="item-${item.asin}">
            <td class="product-thumbnail">
                <a href="${item.link}"><img src="${item.image['URL']}" alt=""></a>
            </td>
            <td class="product-name"><a href="${item.link}">${item.title.substring(0,30)}...</a></td>
            <td class="product-price"><span class="amount">${item.price.raw}</span></td>
            <td class="product-quantity">
                <button data-asin="${item.asin}" class="addtocartbtn os-btn os-btn-black" type="button">Add To Cart</button>
            </td>
            <td class="product-remove"><a class="removefromwishlist" data-asin="${item.asin}" href="#"><i data-asin="${item.asin}" class="fa fa-times"></i></a></td>
        </tr>`);
    });

    $('.addtocartbtn').each((index, element) => {
        $(element).on('click', event => {
            let asin = event.target.dataset.asin;
            let product = wishList.filter(item => item.asin == asin)[0];
            for (let i = 0; i < cartItems.length; i++) {
                if (cartItems[i].product.asin == asin) {
                    console.log(cartItems[i].product.asin)
                    cartItems[i].quantity++;
                    localStorage.setItem('batabestCart', JSON.stringify(cartItems));
                    return;
                }
            }
            cartItems.push({ product, quantity: 1 });
            localStorage.setItem('batabestCart', JSON.stringify(cartItems));
            $('#batabestCart span').text(`(${cartItems.length})`);
        })
    })

    $('.removefromwishlist').each((index, element) => {
        $(element).on('click', event => {
            console.log(event.target)
            event.preventDefault();
            let asin = event.target.dataset.asin;
            let filtered = wishList.filter(item => item.asin != asin);
            wishList = filtered;
            localStorage.setItem('batabestWishList', JSON.stringify(wishList));
            $(`#item-${asin}`).remove();
            $('#batabestWishList span').text(`(${wishList.length})`)
        })
    })
})