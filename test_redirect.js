<<<<<<< HEAD
const axios = require('axios');

async function testRedirect() {
    const url = 'https://dl.flipkart.com/s/fYq4xouuuN';
    try {
        const response = await axios.get(url, {
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        console.log('Final URL:', response.request.res.responseUrl || response.config.url);
    } catch (e) {
        console.error('Redirect failed:', e.message);
    }
}

testRedirect();
=======
const axios = require('axios');

async function testRedirect() {
    const url = 'https://dl.flipkart.com/s/fYq4xouuuN';
    try {
        const response = await axios.get(url, {
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        console.log('Final URL:', response.request.res.responseUrl || response.config.url);
    } catch (e) {
        console.error('Redirect failed:', e.message);
    }
}

testRedirect();
>>>>>>> e61da01 (code update)
