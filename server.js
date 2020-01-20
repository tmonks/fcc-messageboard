'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const expect      = require('chai').expect;
const cors        = require('cors');
const helmet      = require('helmet');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const mongoose        = require('mongoose');
const dbConfig = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true
}


const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

// allow our site to be run in an iframe only on our own pages
app.use(helmet.frameguard({ action: 'sameorigin' }));
// disable DNS prefetching
app.use(helmet.dnsPrefetchControl());
// allow site to set the referrer for own pages
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));


// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); //Parse URL-encoded bodies

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//Sample Front-end

    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start database, server and tests!

mongoose.connect(process.env.DB, dbConfig)
  .then(result => {
    console.log("Database connected");
    app.listen(process.env.PORT || 3000, function () {
      console.log("Listening on port " + process.env.PORT);
      if(process.env.NODE_ENV==='test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch(e) {
            const error = e;
              console.log('Tests are not valid:');
              console.log(error);
          }
        }, 1500);
      }
    });
  
  
}).catch(err => console.log("Error connecting database", err));

module.exports = app; //for testing
