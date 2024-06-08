const express = require('express');
const { createShortUrl, getOriginalUrl, getAllUrls, getUrlCount } = require('../controllers/urlController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/shorten', authMiddleware, createShortUrl);
router.get('/:shortUrl', getOriginalUrl);
router.get('/urls', authMiddleware, getAllUrls);
router.get('/url-count', authMiddleware, getUrlCount);

module.exports = router;
