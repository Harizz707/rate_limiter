const express = require("express");

const { createClient } = require("redis");

const app = express();
const PORT = 3000;

//create client object
const redisClient = createClient();
redisClient.on("error", (err) => console.error("Redis error :", err)); //event listener is set up
redisClient.connect().then(() => console.log("Connected to Redis")); //connection success message

//max req user can make instantly
const CAPACITY = 5;
//tokens refilled per second
const REFILL_RATE = 1;

const tokenBucketRateLimiter = async (req, res, next) => {
  //use user's IP as ID
  const userId = req.ip;
  const now = Date.now();

  try {
    const record = await redisClient.get(userId);
    //if new user,create a new bucket ,initialized to max capacity and set timestamp
    //else parse the json string into object
    let bucket = record
      ? JSON.parse(record)
      : { tokens: CAPACITY, lastUpdate: now };

    //subtract the last time user made the req
    const elapsedTime = (now - bucket.lastUpdate) / 1000;
    //use Math.min to not exceed the capacity,update the tokens the user has now in their bucket
    bucket.tokens = Math.min(
      CAPACITY,
      bucket.tokens + elapsedTime * REFILL_RATE,
    );
    bucket.lastUpdate = now;

    if (bucket.tokens >= 1) {
      //consume 1 token and save them to redis
      bucket.tokens--;
      await redisClient.set(userId, JSON.stringify(bucket));
      next();
    } else {
      //if token is 0
      //still save the bucket to update the timestamp
      await redisClient.set(userId, JSON.stringify(bucket));
      res
        .status(429)
        .json({ error: "Too many requests", message: "Limit exceeded" });
    }
  } catch (err) {
    //fail open - allow req even if crashed
    next();
  }
};

app.get("/api/checkout", tokenBucketRateLimiter, (req, res) => {
  res.json({ success: true, message: "Secure pipeline accessed" });
});
app.listen(PORT, () => console.log(`Running on PORT ${PORT} `));
