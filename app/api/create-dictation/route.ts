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

const IntroContentSchema = z.object({
  title: z.string(),
  wordPairsList: z.string(),
  introContent: z.string(),
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

    // Generate intro slide content
    const introPrompt = `Generate content for the intro slide of a dictation game titled "${title}" with word pairs (${firstLanguage} - ${secondLanguage}): ${wordPairs.map(pair => `${pair.first} - ${pair.second}`).join(', ')}. Provide a motivating introduction explaining the game briefly.`;
    const introResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: zodResponseFormat(IntroContentSchema, "intro_content"),
      messages: [{ role: 'user', content: introPrompt }],
      max_tokens: 4000,
    });
    const introContent = IntroContentSchema.parse(JSON.parse(introResponse.choices[0].message.content || '{}'));

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
      {
        ...exampleStructure.data.structure.slides[0],
        type: "intro",
        layers: [
          ...exampleStructure.data.structure.slides[0].layers.slice(0, -1),
          {
            ...exampleStructure.data.structure.slides[0].layers[exampleStructure.data.structure.slides[0].layers.length - 1],
            info: `<p style="text-align:center;direction:rtl;"><span style="color: rgb(79,79,79);font-size: 48px;font-family: Varela Round;"><strong>${introContent.title}</strong></span></p>\n`,
          },
          {
            type: "txt",
            info: introContent.wordPairsList,
            InteractiveLoopType: 0,
            InteractiveShowType: 0,
            transform: [0.8479304313659668, 0, 0, 0.8479304313659668, -248.91859436035156, 50.036190032958984],
            height: 426,
            width: 517,
            interactiveLayerSound: "",
            interactiveToggleShow: false
          },
          {
            type: "txt",
            info: introContent.introContent,
            InteractiveLoopType: 0,
            InteractiveShowType: 0,
            transform: [0.8479304313659668, 0, 0, 0.8479304313659668, 244.89845275878906, 51.890541076660156],
            height: 426,
            width: 517,
            interactiveLayerSound: "",
            interactiveToggleShow: false
          }
        ]
      },
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
    dictationStructure.data.album_store.album.fields.description = introContent.introContent;
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