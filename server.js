const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Twitter = require("twitter");
const mongoose = require("mongoose");
const config = require("./config");
const validator = require("email-validator");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
          console.log(doc.password);
          if (doc.password === req.body.userPassword) {
            res.send("Logging Successful");
          } else {
            res.send("Password Incorrect");
          }
        })
        .catch((err) => {
          res.send("Email incorrect");
        });
    } else {
      userModel
        .findOne({ username: req.body.userCred })
        .then((doc) => {
          console.log(doc.password);
          if (doc.password === req.body.userPassword) {
            res.send("Logging Successful");
          } else {
            res.send("Password Incorrect");
          }
        })
        .catch((err) => {
          res.send("Username incorrect");
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
        res.send(doc.history);
      })
      .catch((err) => {
        res.send(err);
      });
  }
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is Running and Healthy on port " + port);
});
