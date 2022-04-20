
const dotenv = require('dotenv').config()

const ADDRESS = process.env.ADDRESS || ''  		/* for example, https://vegaby.herokuapp.com */
const ROOT_URL = process.env.ROOT_URL || ''  		/* Optional e.g. "/vegaby" -- use this to deploy inside a subfolder. */
const PORT = process.env.PORT || 4000			/* Optional PORT number */
const OTM_KEY = process.env.OTM_KEY || ''		/* API key for use with YELP FUsion API */
const GOOGLE_KEY = process.env.GOOGLE_KEY || ''		/* API key for use with Google Maps */

const express = require ('express');      // express framework 
const cors = require('cors');             // Cross Origin Resource Sharing
const fetch = import('node-fetch');      // library for making requests (similar to axios)
const bodyParser = require('body-parser') // middleware to parse JSON data that is sent from the frontend.

const app = express(); // enable express
app.use( express.json() ); // add json capabilities to our express aptestingp
app.use( cors() ); // make express attach CORS headers to responses

/* Serve up static assets, i.e. the Frontend of the site. */
app.use(ROOT_URL+'/', express.static('public')) 

/* The frontend may request the Google API Key via this endpoint. */
app.get(ROOT_URL+'/apikey', (req,res) => {
  /* We will not share our API Key outside of our own domain. */
  if ( req.headers.referer.startsWith(ADDRESS) ){
    res.send({ "Status":"OK", "GOOGLE_KEY":GOOGLE_KEY })
  }
  else{
    res.send({ "Status": "Error", 
	      "Message": "Google API Key is not authorized for this domain." ,
	      "Referer" : req.headers.referer,
	      "Expected" : ADDRESS
     })
  }
})

//Go live
app.listen(PORT,  () => {
    console.log("We are live " );
  });