import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: "Привет! Скажи одно предложение о том, зачем нужна сквозная аналитика."
        }
      ],
      max_tokens: 100
    });
    
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Ошибка:", error.message);
  }
}

test();