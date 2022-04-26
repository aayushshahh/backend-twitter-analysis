const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Twitter = require("twitter");
const mongoose = require("mongoose");
const config = require("./config");
const validator = require("email-validator");
const promBundle = require("express-prom-bundle");
const amqplib = require('amqplib');
var amqp_url = 'amqps://uuyyktdj:SMNgxmbLqcxiE2owMbWoykgtZ8t9a9af@albatross.rmq.cloudamqp.com/uuyyktdj';

const app = express();

'use strict';

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    project_name: "Personality Analysis from Tweets",
    project_type: "test_metrics_labels",
  },
  promClient: {
    collectDefaultMetrics: {},
  },
});

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(metricsMiddleware);

const apiKey = "TzvKlgFTYI8j79S42QVYe0ZDE";
const apiSecretKey = "4xx3WknZVEjphlyOKJiyCngmsKkfEKVLV3H2uYpUEmE3vGRbOc";
const accessToken = "787976257057263617-G0v02VJsj4SjjOMCLWtrhz5npLS75T6";
const accessTokenSecret = "Rj3ZXGYk8Jp8MyS1Zm5kZvvZkJAe0XJY29TCpQQFtb2GH";

let Schema = mongoose.Schema;

let userSchema = new Schema({
  email: {
    type: String,
  },
  username: {
    type: String,
  },
  fullName: {
    type: String,
  },
  password: {
    type: String,
  },
});

let userHistorySchema = new Schema({
  username: {
    type: String,
  },
  history: {
    type: Array,
  },
});

let currentUserSchema = new Schema(
  {
    username: {
      type: String,
    },
    currentActivity: {
      type: String,
    },
  },
  { timestamps: true }
);

let userModel = mongoose.model("users", userSchema);
let userHistoryModel = mongoose.model(
  "user-twituser-history",
  userHistorySchema
);
let currentUserModel = mongoose.model("active-current-user", currentUserSchema);

const dbUrl = config.dbUrl;

var options = {
  keepAlive: true,
  connectTimeoutMS: 30000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(dbUrl, options, (err) => {
  if (err) {
    console.log(err);
  }
});

var client = new Twitter({
  consumer_key: apiKey,
  consumer_secret: apiSecretKey,
  access_token_key: accessToken,
  access_token_secret: accessTokenSecret,
});

app.post("/getTweets", (req, res) => {
  var params = { screen_name: req.body.username };
  client.get(
    "statuses/user_timeline",
    params,
    function (error, tweets, response) {
      if (!error) {
        res.json(tweets);
      } else {
        res.status(503, { error: error });
      }
    }
  );
});

app.post("/signup", (req, res) => {
  if (req) {
    let newUser = new userModel(req.body);
    newUser
      .save()
      .then((doc) => {
        console.log(doc);
        res.send("Logging Successful");
      })
      .catch((err) => {
        console.log(err);
        res.send("Error in mongoDB");
        res.status(500);
      });
  } else {
    res.send("Error in input data");
  }
});

app.post("/login", (req, res) => {
  if (req) {
    if (validator.validate(req.body.userCred)) {
      userModel
        .findOne({ email: req.body.userCred })
        .then((doc) => {
          console.log(doc);
          if (doc.password === req.body.userPassword) {
            var response = {
              message: "Logging Successful",
              data: doc,
            };
            res.send(response);
          } else {
            var response = {
              message: "Password Incorrect",
              data: {},
            };
            res.send(response);
          }
        })
        .catch((err) => {
          var response = {
            message: "Email Incorrect",
            data: {},
          };
          res.send(response);
        });
    } else {
      userModel
        .findOne({ username: req.body.userCred })
        .then((doc) => {
          if (doc.password === req.body.userPassword) {
            console.log(doc);
            var response = {
              message: "Logging Successful",
              data: doc,
            };
            res.send(response);
          } else {
            var response = {
              message: "Password Incorrect",
              data: {},
            };
            res.send(response);
          }
        })
        .catch((err) => {
          var response = {
            message: "Username Incorrect",
            data: {},
          };
          res.send(response);
        });
    }
  }
});

app.post("/addHistory", (req, res) => {
  if (req) {
    userHistoryModel
      .findOne({ username: req.body.username })
      .then((doc) => {
        var tempArr = doc.history;
        tempArr.push(req.body.history);
        console.log(tempArr);
        const payload = {username: req.body.history, history: tempArr};
        console.log("push into the queue");
        //produce(payload);
        userHistoryModel.updateOne(
          { username: req.body.username },
          { history: tempArr },
          (err, doc) => {
            console.log(doc);
          }
        );
        res.send("History Updated");
      })
      .catch((err) => {
        var histArr = [];
        histArr.push(req.body.history);
        var newHistory = new userHistoryModel({
          username: req.body.username,
          history: histArr,
        });
        newHistory.save().then((doc) => {
          console.log(doc);
          res.send("New History Created");
        });
      });
  }
});

app.post("/getHistory", (req, res) => {
  if (req) {
    console.log(req.body);
    
    userHistoryModel
      .findOne({ username: req.body.username })
      .then((doc) => {
        console.log("It is in then yaar");
        console.log(doc);
        if (doc !== null) {
          res.send(doc.history);
        } else {
          res.send([{ twitUsername: "No History", personality: "" }]);
        }
      })
      .catch((err) => {
        console.log("It is error madafaka");
        res.send([{ twitUsername: "No History", personality: "" }]);
      });
  }
});

app.get("/metrics", (req, res) => {
  res.send("Metrics");
});


app.get("/putIntoQueue", (req,res) => {
  console.log("pull from the queue");
  produce("Hello hi bye bye");
  do_consume();
  //createTask("Hello ra");
  res.send("done consuming");
});

async function produce(message){
  console.log("Publishing");
  var conn = await amqplib.connect(amqp_url, "heartbeat=60");
  var ch = await conn.createChannel()
  var exch = 'test_exchange';
  var q = 'test_queue';
  var rkey = 'test_route';
  var msg = message;
  await ch.assertExchange(exch, 'direct', {durable: true}).catch(console.error);
  await ch.assertQueue(q, {durable: true});
  await ch.bindQueue(q, exch, rkey);
  await ch.publish(exch, rkey, Buffer.from(msg));
  setTimeout( function()  {
      ch.close();
      conn.close();},  500 );
}

async function do_consume() {
  var conn = await amqplib.connect(amqp_url, "heartbeat=60");
  var ch = await conn.createChannel()
  var q = 'test_queue';
  await conn.createChannel();
  await ch.assertQueue(q, {durable: true});
  await ch.consume(q, function (msg) {
      console.log(msg.content);
      ch.ack(msg);
      ch.cancel('myconsumer');
      }, {consumerTag: 'myconsumer'});
  setTimeout( function()  {
      ch.close();
      conn.close();},  500 );
}

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is Running and Healthy on port " + port);
});

