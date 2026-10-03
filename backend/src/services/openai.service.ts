import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function testOpenAI() {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: "Say hello to AQPF in one short sentence.",
  });

  return response.output_text;
}