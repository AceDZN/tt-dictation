import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { wordPairsText, firstLanguage, secondLanguage } = await req.json();

    const prompt = `Generate a short, catchy title for a dictation game with the following word pairs (${firstLanguage} - ${secondLanguage}): ${wordPairsText}. plain string without quotation marks. Maximum 4 words.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
    });

    const title = response.choices[0].message.content?.trim() || 'Dictation Game';

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}