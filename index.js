var express = require('express');
var router = express.Router();

/* GET home page. */
// Import required modules and set up the MongoDB connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/urlShortenerDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define the schema for shortened URLs
const urlSchema = new mongoose.Schema({
  shortUrl: { type: String, unique: true },
  destinationUrl: String,
  expirationDate: Date,
});

// Create the URL model based on the schema
const UrlModel = mongoose.model('Url', urlSchema);

// Method 1: Shorten Url (Destination Url) → Short Url
async function shortenUrl(destinationUrl) {
  try {
    const newShortUrl = generateUniqueShortUrl(); 
    const newUrl = new UrlModel({
      shortUrl: newShortUrl,
      destinationUrl,
      expirationDate: new Date(Date.now() + DEFAULT_EXPIRY_TIME), // Set a default expiration time for the shortened URL
    });
    await newUrl.save();
    return newShortUrl;
  } catch (error) {
    console.error('Error shortening URL:', error);
    return null;
  }
}

// Method 2: Update short url (Short Url, Destination Url) → Boolean
async function updateShortUrl(shortUrl, destinationUrl) {
  try {
    const updatedUrl = await UrlModel.findOneAndUpdate({ shortUrl }, { destinationUrl });
    return updatedUrl !== null;
  } catch (error) {
    console.error('Error updating short URL:', error);
    return false;
  }
}

// Method 3: Get Destination Url (Short Url) → Destination Url
async function getDestinationUrl(shortUrl) {
  try {
    const url = await UrlModel.findOne({ shortUrl });
    return url ? url.destinationUrl : null;
  } catch (error) {
    console.error('Error getting destination URL:', error);
    return null;
  }
}

// Method 4: Update Expiry (Short Url, Days to add in expiry) → Boolean
async function updateExpiry(shortUrl, daysToAdd) {
  try {
    const url = await UrlModel.findOne({ shortUrl });
    if (url) {
      url.expirationDate = new Date(url.expirationDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      await url.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating URL expiry:', error);
    return false;
  }
}

// Express.js route to handle redirection
app.get('/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  const destinationUrl = await getDestinationUrl(shortUrl);
  if (destinationUrl) {
    res.redirect(destinationUrl);
  } else {
    res.status(404).send('URL not found');
  }
});


module.exports = router;