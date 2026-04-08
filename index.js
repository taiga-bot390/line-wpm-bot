import express from "express";
import axios from "axios";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("LINE bot is running");
});

async function replyMessage(replyToken, text) {
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken,
      messages: [{ type: "text", text }],
    },
    {
      headers: {
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function calcWPM(words, durationMs) {
  const minutes = durationMs / 1000 / 60;
  return Math.round(words / minutes);
}

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  const events = req.body.events;

  for (const event of events) {
    if (event.type !== "message") continue;

    if (event.message.type === "text") {
      await replyMessage(event.replyToken, "Send voice!");
    }

    if (event.message.type === "audio") {
      const duration = event.message.duration;

      // 仮でテキスト（あとで音声処理にする）
      const fakeText = "this is a sample sentence for testing";

      const words = countWords(fakeText);
      const wpm = calcWPM(words, duration);

      await replyMessage(
        event.replyToken,
        `Words: ${words}\nDuration: ${duration}ms\nWPM: ${wpm}`
      );
    }
  }
});

app.listen(3000);