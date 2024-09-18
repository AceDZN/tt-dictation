import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OutroContentSchema = z.object({
  congratsMessage: z.string(),
});

const ExampleSentenceSchema = z.object({
  sentence: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { title, firstLanguage, secondLanguage, wordPairs } = await req.json();

    // Read the example structure
    const exampleStructurePath = path.join(process.cwd(), 'example_data', 'dictation_structure.json');
    const exampleStructure = JSON.parse(fs.readFileSync(exampleStructurePath, 'utf8'));

    // Create intro slide content programmatically
    const introSlide = JSON.parse(JSON.stringify(exampleStructure.data.structure.slides[0]));
    introSlide.layers = introSlide.layers.filter(layer => layer.id !== 'third_column');

    const totalPairs = wordPairs.length;
    const firstColumnPairs = Math.ceil(Math.min(totalPairs, 12) / 2);
    const secondColumnPairs = Math.min(totalPairs - firstColumnPairs, 6);
    const thirdColumnPairs = totalPairs - firstColumnPairs - secondColumnPairs;

    introSlide.layers = introSlide.layers.map(layer => {
      if (layer.type === 'txt') {
        switch (layer.id) {
          case 'first_column':
            layer.info = wordPairs.slice(0, firstColumnPairs).map(pair => 
              `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;">${pair.first} - ${pair.second}</span></p>\n`
            ).join('');
            break;
          case 'second_column':
            layer.info = wordPairs.slice(firstColumnPairs, firstColumnPairs + secondColumnPairs).map(pair => 
              `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;">${pair.first} - ${pair.second}</span></p>\n`
            ).join('');
            break;
          case 'game_title':
            layer.info = `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;"><strong>${title}</strong></span></p>\n`;
            break;
        }
      }
      return layer;
    });

    if (thirdColumnPairs > 0) {
      const thirdColumnLayer = JSON.parse(JSON.stringify(exampleStructure.data.structure.slides[0].layers.find(layer => layer.id === 'third_column')));
      thirdColumnLayer.info = wordPairs.slice(firstColumnPairs + secondColumnPairs).map(pair => 
        `<p style="direction:rtl;text-align:right;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;">${pair.first} - ${pair.second}</span></p>\n`
      ).join('');
      introSlide.layers.push(thirdColumnLayer);
    }

    // Generate outro slide content
    const outroPrompt = `Generate a congratulatory message for completing the dictation game titled "${title}". The message should be Short and consice and written in ${secondLanguage}. Maximum of 6 words.`;
    const outroResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: zodResponseFormat(OutroContentSchema, "outro_content"),
      messages: [{ role: 'user', content: outroPrompt }],
      max_tokens: 500,
    });
    const outroContent = OutroContentSchema.parse(JSON.parse(outroResponse.choices[0].message.content || '{}'));

    // Generate example sentences for word pairs that don't have them
    const wordPairsWithSentences = await Promise.all(wordPairs.map(async (pair) => {
      if (!pair.sentence) {
        const sentencePrompt = `Generate a simple example sentence in ${secondLanguage} using the word "${pair.second}".`;
        const sentenceResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: zodResponseFormat(ExampleSentenceSchema, "example_sentence"),
          messages: [{ role: 'user', content: sentencePrompt }],
          max_tokens: 100,
        });
        const sentenceContent = ExampleSentenceSchema.parse(JSON.parse(sentenceResponse.choices[0].message.content || '{}'));
        return { ...pair, sentence: sentenceContent.sentence };
      }
      return pair;
    }));

    // Create the dictation structure based on the example
    const dictationStructure = JSON.parse(JSON.stringify(exampleStructure));
    
    // Update the structure with the new content
    dictationStructure.data.structure.slides = [
      introSlide,
      ...wordPairsWithSentences.map(pair => ({
        ...exampleStructure.data.structure.slides[1],
        type: "dictation",
        layers: exampleStructure.data.structure.slides[1].layers.map(layer => {
          if (layer.type === 'txt') {
            switch (layer.id) {
              case 'word_in_first_language':
                return {
                  ...layer,
                  info: `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;">${pair.first}</span></p>\n`
                };
              case 'example_sentence':
                return {
                  ...layer,
                  info: `<p><span style="color: rgb(79, 79, 79);font-size: 48px;font-family: Varela Round;">${pair.sentence}</span></p>\n`
                };
              default:
                return layer;
            }
          }
          return layer;
        }),
        activities: [
          {
            ...exampleStructure.data.structure.slides[1].activities[0],
            shapes: [
              {
                ...exampleStructure.data.structure.slides[1].activities[0].shapes[0],
                id: "word_in_second_language",
                settings: {
                  ...exampleStructure.data.structure.slides[1].activities[0].shapes[0].settings,
                  textAnswerArray: [pair.second]
                }
              }
            ]
          }
        ]
      })),
      {
        ...exampleStructure.data.structure.slides[2],
        type: "outro",
        layers: exampleStructure.data.structure.slides[2].layers.map(layer => {
          if (layer.type === 'txt') {
            return {
              ...layer,
              info: `<p><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;"><strong>${outroContent.congratsMessage}</strong></span></p>\n`
            };
          }
          return layer;
        })
      }
    ];

    // Update other necessary fields in the structure
    dictationStructure.data.album_store.album.fields.name = title;
    dictationStructure.data.album_store.album.fields.description = `Dictation game for ${firstLanguage} to ${secondLanguage}`;
    // Add more field updates as necessary

    // Generate a unique ID for the dictation
    const dictationId = uuidv4();

    // Save the dictation structure to a file
    const filePath = path.join(process.cwd(), 'dictations', `dictation_${dictationId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dictationStructure, null, 2));

    return NextResponse.json({ success: true, dictationId });
  } catch (error) {
    console.error('Error creating dictation:', error);
    return NextResponse.json({ error: 'Failed to create dictation' }, { status: 500 });
  }
}