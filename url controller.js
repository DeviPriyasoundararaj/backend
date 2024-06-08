const Url = require('../models/Url');
const { nanoid } = require('nanoid');

exports.createShortUrl = async (req, res) => {
    const { originalUrl } = req.body;
    const shortUrl = nanoid(7);

    try {
        const url = new Url({ originalUrl, shortUrl, createdBy: req.user.id });
        await url.save();

        res.status(201).json(url);
    } catch (error) {
        res.status(500).json({ message: 'URL creation failed', error });
    }
};

exports.getOriginalUrl = async (req, res) => {
    const { shortUrl } = req.params;

    try {
        const url = await Url.findOne({ shortUrl });

        if (!url) return res.status(404).json({ message: 'URL not found' });

        url.clickCount += 1;
        await url.save();

        res.redirect(url.originalUrl);
    } catch (error) {
        res.status(500).json({ message: 'Redirect failed', error });
    }
};

exports.getAllUrls = async (req, res) => {
    try {
        const urls = await Url.find({ createdBy: req.user.id });
        res.json({ urls });
    } catch (error) {
        res.status(500).json({ message: 'Fetching URLs failed', error });
    }
};

exports.getUrlCount = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const urlCount = await Url.countDocuments({
            createdBy: req.user.id,
            createdAt: {
                $gte: new Date(startDate),
                $lt: new Date(endDate),
            },
        });

        res.json({ count: urlCount });
    } catch (error) {
        res.status(500).json({ message: 'Fetching URL count failed', error });
    }
};
