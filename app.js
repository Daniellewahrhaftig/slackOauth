const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = 3000;
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

// Slack OAuth Start
app.get("/install", (req, res) => {
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=channels:read,chat:write&redirect_uri=${REDIRECT_URI}`;
  res.redirect(slackAuthUrl);
});

// Handle OAuth Callback
app.get("/oauth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code missing");
  }

  try {
    const tokenResponse = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      null,
      {
        params: {
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
        },
      }
    );

    if (!tokenResponse.data.ok) {
      return res.status(400).send("Failed to exchange code for token");
    }

    const accessToken = tokenResponse.data.access_token;
    res.send(`Slack OAuth Success! Access Token: ${accessToken}`);
  } catch (err) {
    console.error("Error during OAuth callback:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Test API Call
app.get("/post-message", async (req, res) => {
  const { token, channel, text } = req.query;

  if (!token || !channel || !text) {
    return res.status(400).send("Missing required parameters");
  }

  try {
    const response = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel,
        text,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.ok) {
      return res
        .status(400)
        .send(`Failed to post message: ${response.data.error}`);
    }

    res.send("Message posted successfully!");
  } catch (err) {
    console.error("Error posting message:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

