var express = require('express');
var router = express.Router();
const axios = require('axios');
const puppeteer = require('puppeteer-core');

var { searchItemsRequest, api, ProductAdvertisingAPIv1 } = require('../amazonapi/sampleSearchItemsApi');

var { getItemsRequest, parseResponse } = require('../amazonapi/sampleGetItemsApi');

var browsers = new Array(10);

var pages = new Array(10);

let openBrowser = async() => {

    for (let i = 0; i < pages.length; i++) {
        browsers[i] = await puppeteer.launch({
            headless: true,
            executablePath: '/opt/homebrew/bin/chromium',
            args: ['--no-sandbox']
        });
        pages[i] = await browsers[i].newPage();
    }
};

openBrowser();

searchItemsRequest['ItemCount'] = 10;

searchItemsRequest['Resources'] = ['Images.Primary.Large', 'ItemInfo.Title', 'Offers.Listings.Price'];


function onSuccess(data, responseType) {
    let resultType = 'SearchResult';
    if (responseType === 'GetItemsResponse') resultType = 'ItemsResult';
    var response = ProductAdvertisingAPIv1[responseType].constructFromObject(data);
    if (response[resultType] !== undefined) {
        var results = response[resultType]['Items'];
        if (results !== undefined) {
            var items = results.map(item => {
                let product = {};
                product.price = {};
                if (item !== undefined) {
                    if (item['ASIN'] !== undefined) {
                        product.asin = item['ASIN'];
                    }
                    if (item['DetailPageURL'] !== undefined) {
                        product.link = item['DetailPageURL']; //`https://www.amazon.ca/dp/${item['ASIN']}?tag=${associateTag}`;
                    }
                    if (
                        item['ItemInfo'] !== undefined &&
                        item['ItemInfo']['Title'] !== undefined &&
                        item['ItemInfo']['Title']['DisplayValue'] !== undefined
                    ) {
                        product.title = item['ItemInfo']['Title']['DisplayValue'];
                    }
                    if (
                        item['Offers'] !== undefined &&
                        item['Offers']['Listings'] !== undefined &&
                        item['Offers']['Listings'][0]['Price'] !== undefined &&
                        item['Offers']['Listings'][0]['Price']['DisplayAmount'] !== undefined
                    ) {
                        product.price.raw = '$' + item['Offers']['Listings'][0]['Price']['Amount'];
                        product.price.amount = item['Offers']['Listings'][0]['Price']['Amount'];
                        product.price.currency = item['Offers']['Listings'][0]['Price']['Currency'];
                    }
                    if (
                        item['Images'] !== undefined &&
                        item['Images']['Primary'] !== undefined &&
                        item['Images']['Primary']['Large'] !== undefined &&
                        item['Images']['Primary']['Large']['URL'] !== undefined
                    ) {
                        product.image = item['Images']['Primary']['Large'];
                    }
                }
                return product;
            });
            return items;
        }

    }
    if (response['Errors'] !== undefined) {
        console.log('Errors:');
        console.log('Complete Error Response: ' + JSON.stringify(response['Errors'], null, 1));
        console.log('Printing 1st Error:');
        var errors = response['Errors'];
        return errors
    }
}

function onError(error) {
    console.log('Error calling PA-API 5.0!');
    console.log('Printing Full Error Object -1:\n' + JSON.stringify(error, null, 1));
    console.log('Status Code: ' + error['status']);
    if (error['response'] !== undefined && error['response']['text'] !== undefined) {
        console.log('Error Object: ' + JSON.stringify(error['response']['text'], null, 1));
        return error;
    }
}


/* GET home page. */
router.get('/', function(req, res, next) {

    res.render('index');

});

function getASIN(searchTerm) {

    let regExp = new RegExp('^[A-Z0-9]{10}$');

    let linkRegExp = new RegExp('\/([A-Z0-9]{10})[\/\?]');

    let linkRegExpOther = new RegExp('\/([A-Z0-9]{10})$');

    if (searchTerm.match(regExp)) {
        return searchTerm.match(regExp).pop();
    }

    if (searchTerm.match(linkRegExp)) {
        return searchTerm.match(linkRegExp).pop();
    }

    if (searchTerm.match(linkRegExpOther)) {
        return searchTerm.match(linkRegExpOther).pop();
    }
    return false;
}


router.get('/search', function(req, res, next) {

    // let searchTerm = req.query.term;

    // let asin = getASIN(searchTerm);

    // let requestType = searchItemsRequest;

    // if (asin) {
    //     requestType = getItemsRequest;
    //     requestType['ItemIds'] = [asin];

    //     api.getItems(requestType).then(
    //         function(data) {
    //             res.render('shop', { searchResults: onSuccess(data, 'GetItemsResponse') });
    //         },
    //         function(error) {
    //             let err = onError(error);
    //             res.render('error', { message: err.message, error: err });
    //         }
    //     );
    // } else {
    //     requestType['Keywords'] = searchTerm;
    //     api.searchItems(requestType).then(
    //         function(data) {
    //             res.render('shop', { searchResults: onSuccess(data, 'SearchItemsResponse') });
    //         },
    //         function(error) {
    //             let err = onError(error);
    //             res.render('error', { message: err.message, error: err });
    //         }
    //     );
    // }
    res.render('shop');

})

router.get('/search/:term/:pagenumber', function(req, res, next) {

    let searchTerm = req.params.term;

    let asin = getASIN(searchTerm);
   
    let requestType = searchItemsRequest;
    if (asin) {
        requestType = getItemsRequest;
        requestType['ItemIds'] = [asin];

        api.getItems(requestType).then(
            function(data) {
                res.json({ searchResults: onSuccess(data, 'GetItemsResponse') });
            },
            function(error) {
                let err = onError(error);
                res.jsonr({ message: err.message, error: err });
            }
        );
    } else {
        requestType['Keywords'] = searchTerm;
        api.searchItems(requestType).then(
            function(data) {
                res.json({ searchResults: onSuccess(data, 'SearchItemsResponse') });
            },
            function(error) {
                let err = onError(error);
                res.json({ message: err.message, error: err });
            }
        );
    }

})


router.get('/reviews/:asin', function(req, res, next) {

    let asin = req.params.asin;
    let reviewUrl = `https://www.amazon.com/product-reviews/${asin}`;

    async function getData(page, index, reviewUrl) {
        try {

            await page.goto(`${reviewUrl}/?pageNumber=${index + 1}`);
            let results = await page.evaluate(() =>
                Array.from(
                    document.querySelectorAll('.a-section .review'),
                    (element) => {
                        let reviewId = element.id;
                        let reviewText = element.querySelector('span[data-hook="review-body"]').innerText;
                        return {
                            reviewId,
                            reviewText
                        }
                    }
                )
            );
            return results;

        } catch (error) {
            console.error(error);
        }
    }



    let reviewPromises = pages.map((page, index) => {
        return getData(page, index, reviewUrl);
    })

    Promise.all(reviewPromises).then(reviews => {
        res.json(reviews.flat());
    })

    // pages.forEach(async(page, index) => {
    //     await page.goto(`${reviewUrl}/?pageNumber=${index + 1}`);
    //     let results = await page.evaluate(() =>
    //         Array.from(
    //             document.querySelectorAll('.a-section .review'),
    //             (element) => {
    //                 let reviewId = element.id;
    //                 let reviewText = element.querySelector('span[data-hook="review-body"]').innerText;
    //                 return {
    //                     reviewId,
    //                     reviewText
    //                 }
    //             }
    //         )
    //     );
    //     console.log(results);
    //     //page.close();
    // });
})

router.get('/invited/:id', function(req, res, next) {
    let id = req.params.id;
    res.render('invited', { userId: id });
})

router.get('/welcome', function(req, res, next) {
    res.render('installed');
})

router.get('/cart', function(req, res, next) {
    res.render('cart');
})

router.get('/wishlist', function(req, res, next) {
    res.render('wishlist');
})


router.get('/store/:storename', (req, res, next) => {
    res.render('store');
})

router.post('/store/products', (req, res, next) => {
    let requestType = getItemsRequest;
    requestType['ItemIds'] = req.body.term;

    api.getItems(requestType).then(
        function(data) {
            res.json({ searchResults: onSuccess(data, 'GetItemsResponse') });
        },
        function(error) {
            let err = onError(error);
            res.json({ message: err.message, error: err });
        }
    );
})

module.exports = router;