let cartItems = JSON.parse(localStorage.getItem('batabestCart')) || [];
let wishList = JSON.parse(localStorage.getItem('batabestWishList')) || [];
var review_api_url = "http://localhost:3000/getsummary/"

$('#batabestCart span').text(`(${cartItems.length})`);

$('#batabestWishList span').text(`(${wishList.length})`);


async function get_reviews(product_id) {
    var reviews
    url = review_api_url + product_id
    await axios.get(url)
        .then(response => {
            reviews = response
        }).catch(error => {
            console.log(error)
        })
    return reviews
}

function fill_score(){
    $(".progress").each(function() {

        var value = $(this).attr('data-value');
        var left = $(this).find('.progress-left .progress-bar');
        var right = $(this).find('.progress-right .progress-bar');
    
        if (value > 0) {
            if (value <= 50) {
            right.css('transform', 'rotate(' + percentageToDegrees(value) + 'deg)')
            } else {
            right.css('transform', 'rotate(180deg)')
            left.css('transform', 'rotate(' + percentageToDegrees(value - 50) + 'deg)')
            }
        }
    
        })
}

function percentageToDegrees(percentage) {

    return percentage / 100 * 360

    }


let openProductModal = event => {

    // set everything to the default value 
    $('#score').text(0);
    $('#score_reflection').attr('data-value', 0);
    fill_score()
    $("#reviews_section").html('Searching for reviews');




    event.preventDefault();
    let asin = event.target.dataset.asin;

    (async () => {
        var reviews = await get_reviews(asin)
        console.log(reviews.data.data)
        $('#score').text(reviews.data.score);
        $('#score_reflection').attr('data-value', reviews.data.score*10);
        fill_score()

        var reviews_data = reviews.data.data
        // create var to hold texts
        // for loop to go through each of topics 
        var review_cards = ''
        if(typeof reviews_data != "undefined"){
            reviews_data.forEach((eachtopic_data) => {
                review_cards = review_cards.concat(`
                                    <div class='card'>
                                        <div class="card-header" data-toggle="collapse" href="#${eachtopic_data.topic}" role="button" aria-pressed="false">
                                            <b>${eachtopic_data.display_topic}</b>
                                        </div>
                                        <div class="card-body">
                                            <div class="progress">
                                                <div class="progress-bar bg-success" style="width:${eachtopic_data.score}%">
                                                ${eachtopic_data.score}%
                                                </div>
                                                <div class="progress-bar bg-danger" style="width:${100 - eachtopic_data.score}%">
                                                ${100 - eachtopic_data.score}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
    
                                    <div class = "collapse" id = "${eachtopic_data.topic}">
                                        <div class="card">
                                            <div class="card-body">
                                    `)
                eachtopic_data.selected_revs.forEach((each_rev) => {
                    review_cards = review_cards.concat(`
                                            <div>
                                                "... ${each_rev} ..."
                                                <hr>
                                            </div>
                                        `)
                })
                review_cards = review_cards.concat(`
                                     </div>
                                        </div>
                                     </div>
                                    `)
            })
            $("#reviews_section").html(review_cards);
        }
        else{
            $("#reviews_section").html("Not enough reviews for this product");
        }
    })()


    let product = products.filter(product => {
        return product.asin == asin;
    });

    if (product.length) product = product[0];

    console.log(product);

    $('#product_name').text(product.title.substring(0,50));
    // $('.product__modal-content h4 a').text(product.title.substring(0, 50));
    $('.product__modal-content h4 a').attr('target', '_blank');
    $('.product__modal-img img').attr('src', product.image['URL']);
    $('.product__modal-form .pro-cart-btn a.add-cart-btn').attr('href', product.link);
    $('.product__modal-form .pro-cart-btn a.add-cart-btn').attr('target', '_blank');
    $('.product__modal-form .pro-cart-btn a.addtocart').attr('data-asin', product.asin);
    $('.product__modal-price').text(product.price.raw.split('.')[0]);
    $('.product__modal-form .pro-cart-btn a.add-cart-btn').text(`See it on Amazon`);
}

let addToCart = event => {
    event.preventDefault();
    let asin = event.target.dataset.asin;
    for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].product.asin == asin) {
            cartItems[i].quantity++;
            localStorage.setItem('batabestCart', JSON.stringify(cartItems));
            return;
        }
    }
    let product = products.filter(product => product.asin == asin)[0];
    cartItems.push({ product, quantity: 1 });
    localStorage.setItem('batabestCart', JSON.stringify(cartItems));
    $('#batabestCart span').text(`(${cartItems.length})`);
}

let addToWishList = event => {
    event.preventDefault();
    let asin = event.target.dataset.asin;
    for (let i = 0; i < wishList.length; i++) {
        if (wishList[i].asin == asin) {
            return;
        }
    }
    let product = products.filter(product => product.asin == asin)[0];
    wishList.push(product);
    localStorage.setItem('batabestWishList', JSON.stringify(wishList));
    $('#batabestWishList span').text(`(${wishList.length})`);
}

let bataBestAddEventListeners = () => {
    $('a.product__modal').each(function (index, element) {
        $(element).off('click');
        $(element).on('click', openProductModal)
    })
    $('img.product__modal').each(function (index, element) {
        $(element).on('click', openProductModal)
    })

    $('a.addtocart').each(function (index, element) {
        $(element).off('click');
        $(element).on('click', addToCart)
    });
    $('a.addtowishlist').each(function (index, element) {
        $(element).off('click');
        $(element).on('click', addToWishList)
    });
}

let fetchProducts = (term, nextPageNumber, searchType = "search") => {
    let getItems = (searchType, term) => {
        if (searchType == 'store') {
            return fetch('/store/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ term, pageNumber: nextPageNumber })
            })
        }
        return fetch(`/search/${term}/${nextPageNumber}`);
    }

    getItems(searchType, term).then(response => response.json())
        .then(data => {
            if (data.searchResults[0].Code === 'NoResults') {
                return;
            }
            if (data.searchResults !== undefined) {
                let searchResults = data.searchResults.map(product => {
                    let { hostname } = new URL(product.link);
                    if (hostname.includes('amazon.ca')) {
                        product.link = `https://www.amazon.ca/dp/${product.asin}?tag=${associateTag}&linkCode=osi&th=1&psc=1`;
                    }
                    return product;
                });
                products = products.concat(searchResults);
                searchResults.forEach(product => {
                    $('#batabestProducts').append(`<div class="col-xl-4 col-lg-4 col-md-6 col-sm-6 custom-col-10">
                            <div class="product__wrapper mb-60">
                                <div class="product__action transition-3">
                                    <a class="product__modal" href="#" data-asin="${product.asin}" data-toggle="modal" data-target="#productModalId">
                                        <i data-asin="${product.asin}" data-toggle="" class="fal fa-search"></i>
                                    </a>
                                    <a class="addtocart" data-asin="${product.asin}" href="#" data-toggle="tooltip" data-placement="top" title="Add To Cart">
                                        <i data-asin="${product.asin}" class="fal fa-shopping-cart"></i>
                                    </a>
                                    <a data-asin="${product.asin}" class="addtowishlist" href="#" data-toggle="tooltip" data-placement="top" title="Add to Wishlist">
                                        <i data-asin="${product.asin}" class="fal fa-heart"></i>
                                    </a>
                                </div>
                                <div class="product__sale">
                                    <div class="product_price">
                                        ${jQuery.isEmptyObject(product.price) ? '' : product.price.raw.split('.')[0]}
                                    </div>
                                    <div class="triangle-right"></div>
                                </div>
                                <div class="product__thumb">
                                    <a class="w-img" href="#"  class="product__modal" data-asin="${product.asin}" data-toggle="modal" data-target="#productModalId">
                                      <img  href = "#" class="product__modal" data-asin="${product.asin}" data-toggle="modal" data-target="#productModalId" src="${product.image['URL']}" alt="product-img">
                                    </a>
                                </div>
                                <div class="product__content p-relative">
                                    <div class="product__content-inner">
                                        <h4>
                                            <a target="_blank" href="${product.link}">
                                                ${product.title.length > 83 ? product.title.substring(0, 83) + '...' : product.title}
                                            </a>
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>`);
                });
                bataBestAddEventListeners();
            }
        })
}

$(document).ready(function() {

    let batabestInstalled = JSON.parse(localStorage.getItem('batabestInstalled'));
    if (!batabestInstalled) {
        document.getElementById('batabestBrowserAddon').style.display = '';
    }
    console.log("Installed", batabestInstalled);
    bataBestAddEventListeners();

    let nextPageNumber = 1;
    let term = window.location.search.split('=').pop();

    if (term == "") term = 'Trending Products';

    if (window.location.pathname.includes('store')) {
        let storeName = window.location.pathname.split('/').filter(path => path !== "").pop()
        fetch(`http://localhost:5000/store/${storeName}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    term = data.map(product => product.asin);
                    fetchProducts(term, nextPageNumber, "store");
                    nextPageNumber++;
                }
            })
    } else {

        fetchProducts(term, nextPageNumber);
        nextPageNumber++;

    }

    $('#batabestLoadMore').on('click', event => {
        if (window.location.pathname.includes('store')) {
            fetchProducts(term, nextPageNumber, "store");
        } else {
            fetchProducts(term, nextPageNumber);
        }
        nextPageNumber++;
    })
    bataBestAddEventListeners();

})

// reduce size of modal
// make modal and name to be on the same line 
// 