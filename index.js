import express from "express";
import * as line from "@line/bot-sdk";
import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import OpenAI from "openai";

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("LINE bot is running");
});

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calcWPM(wordCount, durationMs) {
  const minutes = durationMs / 1000 / 60;
  if (!minutes || minutes <= 0) return 0;
  return Math.round(wordCount / minutes);
}

async function getAudioContent(messageId) {
  const response = await axios.get(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
  return Buffer.from(response.data);
}

async function transcribeAudio(buffer) {
  const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.m4a`);
  fs.writeFileSync(tempFilePath, buffer);

  try {
    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "gpt-4o-mini-transcribe",
    });
    return result.text;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type !== "message") continue;

      if (event.message.type === "text") {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "Send me a voice message in English. I will transcribe it and show your WPM.",
            },
          ],
        });
      }

      if (event.message.type === "audio") {
        const messageId = event.message.id;
        const durationMs = event.message.duration || 0;

        const audioBuffer = await getAudioContent(messageId);
        const transcript = await transcribeAudio(audioBuffer);

        const words = countWords(transcript);
        const wpm = calcWPM(words, durationMs);

        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text:
                `Transcript:\n${transcript}\n\n` +
                `Words: ${words}\n` +
                `Duration: ${(durationMs / 1000).toFixed(1)} sec\n` +
                `WPM: ${wpm}`,
            },
          ],
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("webhook error:", error?.response?.data || error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});