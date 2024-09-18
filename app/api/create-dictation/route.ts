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

export async function POST(req: NextRequest) {
  try {
    const { title, firstLanguage, secondLanguage, wordPairs } = await req.json();

    // Read the example structure
    const exampleStructurePath = path.join(process.cwd(), 'example_data', 'dictation_structure.json');
    const exampleStructure = JSON.parse(fs.readFileSync(exampleStructurePath, 'utf8'));

    // Create intro slide content programmatically
    const introSlide = JSON.parse(JSON.stringify(exampleStructure.data.structure.slides[0]));
    introSlide.layers = introSlide.layers.map(layer => {
      if (layer.type === 'txt') {
        if (layer.info.includes('${firstLanguageGameTitle}')) {
          layer.info = `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;"><strong>${title}</strong></span></p>\n`;
        } else if (layer.info.includes('${langagueOneWord1}')) {
          const wordPairLayers = [];
          for (let i = 0; i < wordPairs.length; i += 6) {
            const layerWordPairs = wordPairs.slice(i, i + 6);
            const layerContent = layerWordPairs.map((pair, index) => 
              `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;">${pair.first} - ${pair.second}</span></p>\n`
            ).join('');
            wordPairLayers.push({
              ...layer,
              info: layerContent
            });
          }
          return wordPairLayers;
        }
      }
      return layer;
    }).flat();

    // Generate outro slide content
    const outroPrompt = `Generate a congratulatory message for completing the dictation game titled "${title}". The message should be encouraging and positive.`;
    const outroResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: zodResponseFormat(OutroContentSchema, "outro_content"),
      messages: [{ role: 'user', content: outroPrompt }],
      max_tokens: 4000,
    });
    const outroContent = OutroContentSchema.parse(JSON.parse(outroResponse.choices[0].message.content || '{}'));

    // Create the dictation structure based on the example
    const dictationStructure = JSON.parse(JSON.stringify(exampleStructure));
    
    // Update the structure with the new content
    dictationStructure.data.structure.slides = [
      introSlide,
      ...wordPairs.map(pair => ({
        ...exampleStructure.data.structure.slides[1],
        type: "dictation",
        layers: [
          ...exampleStructure.data.structure.slides[1].layers.slice(0, -1),
          {
            ...exampleStructure.data.structure.slides[1].layers[exampleStructure.data.structure.slides[1].layers.length - 1],
            info: `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;">${pair.first}</span></p>\n`,
          }
        ],
        activities: [
          {
            ...exampleStructure.data.structure.slides[1].activities[0],
            shapes: [
              {
                ...exampleStructure.data.structure.slides[1].activities[0].shapes[0],
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
        layers: [
          ...exampleStructure.data.structure.slides[2].layers.slice(0, -1),
          {
            ...exampleStructure.data.structure.slides[2].layers[exampleStructure.data.structure.slides[2].layers.length - 1],
            info: `<p><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;"><strong>${outroContent.congratsMessage}</strong></span></p>\n`,
          }
        ]
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