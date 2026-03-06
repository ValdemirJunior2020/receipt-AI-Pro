// File: server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/api/receipt/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ error: "Missing image file." });
    }

    const imagePath = req.file.path;
    const imageBytes = fs.readFileSync(imagePath);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Read this receipt image. Extract merchant, date, total, currency, and line items if visible. " +
                "Then categorize into one of: Groceries, Dining Out, Transport, Utilities, Shopping, Other. " +
                "Return STRICT JSON only with keys: merchant, date, total, currency, category, line_items, raw_text. " +
                "line_items must be an array of objects with name, qty, price. If a value is unknown, use null or empty array.",
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBytes.toString("base64")}`,
            },
          ],
        },
      ],
    });

    const text = response.output_text || "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    fs.unlinkSync(imagePath);

    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(200).json({
        merchant: null,
        date: null,
        total: null,
        currency: null,
        category: "Other",
        line_items: [],
        raw_text: text,
      });
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return res.json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e?.message || "Receipt analyze failed.",
    });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`ReceiptAI server running on http://localhost:${PORT}`);
});