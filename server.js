const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
require('dotenv').config()

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Mongo is connecting..."))
  .catch((err) => console.log(err.message));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded({ extended: false }));

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, required: true },
    log: [
      {
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { type: Date, required: true },
      },
    ],
  })
);

// create new user
app.post("/api/users", (req, res) => {
  let username = req.body.username;

  var user = new User({
    username
  });

  user.save((err, data) => {
    if (err) return console.error(err);
    console.log(data);
    res.send({
      username: username,
      _id: data._id,
    });
  });
});

// show new user
app.get("/api/users", async (req, res) => {
  const user = await User.find().select("_id username");
  if (!user) return res.status(404).send("User not found.");

  res.send(user);
});

// create new  excercise
app.post("/api/users/:_id/exercises", async (req, res, next) => {

  let user = await User.findById(req.params._id);
  if (!user) return res.status(404).send("User not found.");

  const { description, duration } = req.body;

  let date = new Date(req.body.date);
  if (date.toString() === "Invalid Date") {
    date = new Date();
  }
  user.log.push({ description, duration: parseInt(duration), date })
  user = await user.save();

  res.send({ _id: user._id, username: user.username, description, duration: parseInt(duration), date: date.toDateString() });
});

// retrive information of excercise

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = parseInt(req.query.limit);

  User.findById({ _id: userId }, (err, user) => {
    if (err) return console.log(err);


    let log = user.log.map((item) => {
      return {
        description: item.description,
        duration: item.duration,
        date: item.date.toDateString(),
      };
    });

    if (from) {
      const fromDate = new Date(from);
      log = log.filter((exe) => new Date(exe.data) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      log = log.filter((exe) => new Date(exe.data) <= toDate);
    }
    if (limit) {
      log = log.slice(0, limit);
    }

    console.log(from, to, limit);
    let count = log.length;

    res.send({ username: user.username, count: count, _id: userId, log: log });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
