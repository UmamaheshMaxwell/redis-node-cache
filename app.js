const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const NODE_PORT = process.env.NODE_PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

const setResponse = (username, repos) => {
  return `<h2>${username} has ${repos} github repos </h2>`;
};

const getRepos = async (req, res, next) => {
  try {
    console.log("Fetching data .... !!!");
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();

    const totalRepos = data.public_repos;

    // Set data to redis
    client.setex(username, 3600, totalRepos);

    res.send(setResponse(username, totalRepos));
  } catch (error) {
    console.log(error);
    res.status(500);
  }
};

// Cache Middleware

const cache = (req, res, next) => {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
};

app.get("/repos/:username", cache, getRepos);

app.listen(NODE_PORT, () => {
  console.log(`Server listening at PORT ${NODE_PORT}`);
});
