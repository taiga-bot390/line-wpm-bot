import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LINE bot is running");
});

app.post("/webhook", (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});