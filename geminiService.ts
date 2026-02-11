
import { GoogleGenAI, Type } from "@google/genai";
import { SongRequest, GeneratedSong } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBengaliSong = async (request: SongRequest): Promise<GeneratedSong> => {
  const systemInstruction = `
    আপনি একজন বিশ্বমানের বাঙালি গীতিকার এবং সংগীত পরিচালক। 
    আপনার কাজ হলো ব্যবহারকারীর চাহিদামত একটি পূর্ণাঙ্গ মৌলিক বাংলা গানের কথা এবং সংগীত আয়োজন তৈরি করা।
    
    কঠোর গঠনতন্ত্র (Strict Structure):
    গানটি অবশ্যই নিচের ক্রমে সাজাতে হবে:
    ১. সূচনা (Intro)
    ২. স্তবক ১ (Verse 1)
    ৩. স্থায়ী (Chorus)
    ৪. স্তবক ২ (Verse 2)
    ৫. স্থায়ী (Chorus)
    ৬. সেতু (Bridge)
    ৭. শেষ স্থায়ী (Final Chorus)

    কঠোর নির্দেশাবলী:
    ১. ভাষা: সম্পূর্ণ বাংলা। কোনো ইংরেজি শব্দ (এমনকি Intro, Chorus, Verse) গানের কথায় বা বিভাগের নামে ব্যবহার করবেন না। 
    ২. সময়কাল: মোট সময়কাল ${request.targetDuration} মিনিটের মধ্যে সীমাবদ্ধ রাখুন। প্রতিটি বিভাগের পাশে সময় উল্লেখ করুন (যেমন: ৪৫ সেকেন্ড)।
    ৩. লিরিক্স: প্রতিটি বিভাগে অন্তত ৪-৮টি লাইন থাকবে। ছন্দ এবং গীতিময়তা বজায় রাখা বাধ্যতামূলক।
    ৪. আউটপুট ফরম্যাট: শুধুমাত্র JSON।
  `;

  const userTextPrompt = `
    ধারা (Genre): ${request.genre}
    আবেগ (Mood): ${request.mood}
    গতি (Tempo): ${request.tempo}
    শৈলী বর্ণনা: ${request.sampleStyle || 'স্বাভাবিক'}
    নির্ধারিত সময়: ${request.targetDuration} মিনিট
    ${request.audioSample ? 'সংযুক্ত অডিওটির তাল ও লয় অনুসরণ করুন।' : ''}
  `;

  const parts: any[] = [{ text: userTextPrompt }];

  if (request.audioSample) {
    parts.push({
      inlineData: {
        data: request.audioSample.data,
        mimeType: request.audioSample.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "বিভাগের নাম (সূচনা, স্তবক, স্থায়ী, সেতু)" },
                duration: { type: Type.STRING },
                lyrics: { type: Type.STRING }
              },
              required: ["type", "duration", "lyrics"]
            }
          },
          arrangement: {
            type: Type.OBJECT,
            properties: {
              instruments: { type: Type.STRING },
              beatPattern: { type: Type.STRING },
              bpm: { type: Type.STRING },
              vocalStyle: { type: Type.STRING },
              energyProgression: { type: Type.STRING }
            },
            required: ["instruments", "beatPattern", "bpm", "vocalStyle", "energyProgression"]
          }
        },
        required: ["title", "sections", "arrangement"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("AI থেকে কোনো সাড়া পাওয়া যায়নি");
  return JSON.parse(text);
};
