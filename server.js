const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Twitter = require("twitter");
const mongoose = require("mongoose");
const config = require("./config");
const validator = require("email-validator");
const promBundle = require("express-prom-bundle");

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
        const name = createTask(payload);
        purgueQueue(name);
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
  purgueQueue("projects/finalproject-334519/locations/us-central1/queues/fse/tasks/56068740278537775551");
  //createTask("Hello ra");
  res.send("done dequeuing");
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is Running and Healthy on port " + port);
});



const {CloudTasksClient} = require('@google-cloud/tasks');

const Gcpclient = new CloudTasksClient();

async function createTask(data) {
  console.log("in createTask");
  const project = 'finalproject-334519';
  const queue = 'fse';
  const location = 'us-central1';
  const keyFilename = 'finalproject-334519-fd300744a52b.json'
  const payload = data;
  inSeconds = 0;

  const parent = Gcpclient.queuePath(project, location, queue);

  const task = {
    appEngineHttpRequest: {
      httpMethod: 'POST',
      relativeUri: '/log_payload',
    },
  };

  if (payload) {
    task.appEngineHttpRequest.body = Buffer.from(payload).toString('base64');
  }

  if (inSeconds) {
    task.scheduleTime = {
      seconds: inSeconds + Date.now() / 1000,
    };
  }

  console.log('Sending task:');
  console.log(task);
  const request = {parent: parent, task: task};
  const [response] = await Gcpclient.createTask(request);
  const name = response.name;
  console.log(`Created task ${name}`);
  return name;
}

async function purgueQueue(queue_name){
  const project = "finalproject-334519";
  const region = "us-central1"
  const queue = "fse"
  const name = queue_name

  const request = {
    name,
  };
  const response = await Gcpclient.getTask(request);
  console.log(response);
}

// async function listQueues() {
//   const parent = Gcpclient.locationPath(project, location);

//   // list all fo the queues
//   const [queues] = await Gcpclient.listQueues({parent});

//   if (queues.length > 0) {
//     console.log('Queues:');
//     queues.forEach(queue => {
//       console.log(`  ${queue.name}`);
//     });
//   } else {
//     console.log('No queues found!');
//   }
// }
