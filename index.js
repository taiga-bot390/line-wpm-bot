import express from "express";
import line from "@line/bot-sdk";

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/webhook", line.middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === "message") {

      // とりあえずテスト返信
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "bot is working🔥",
      });

    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("LINE bot is running🔥");
});