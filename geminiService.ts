
import { GoogleGenAI, Type } from "@google/genai";
import { SongRequest, GeneratedSong } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBengaliSong = async (request: SongRequest): Promise<GeneratedSong> => {
  const systemInstruction = `
    আপনি একজন পেশাদার বাঙালি গীতিকার এবং সুরকার। 
    আপনার কাজ হলো ব্যবহারকারীর দেওয়া তথ্যের ভিত্তিতে একটি সম্পূর্ণ মৌলিক বাংলা গান তৈরি করা। 
    যদি ব্যবহারকারী কোনো অডিও স্যাম্পল (audio sample) প্রদান করেন, তবে সেই স্যাম্পলের ছন্দ, গতি এবং মুড বিশ্লেষণ করে গানের কথা এবং সুরের পরিকল্পনা করুন।
    
    কঠোর নির্দেশাবলী:
    ১. ভাষা: শুধুমাত্র বাংলা। কোনো ইংরেজি বা হিন্দি শব্দ ব্যবহার করবেন না। (এমনকি 'Intro', 'Chorus' এর বদলে 'সূচনা', 'স্থায়ী' ব্যবহার করুন)।
    ২. সময়কাল: কমপক্ষে ৩ মিনিট এবং সর্বোচ্চ ১০ মিনিট। প্রতি বিভাগের পাশে সময় উল্লেখ করুন।
    ৩. গঠন: [সূচনা], [স্তবক ১], [স্থায়ী], [স্তবক ২], [স্থায়ী], [সেতু (যদি ৬ মিনিটের বেশি হয়)], [শেষ স্থায়ী]।
    ৪. ছন্দ এবং গীতিময়তা বজায় রাখুন।
    ৫. আউটপুট অবশ্যই JSON ফরম্যাটে হতে হবে।
  `;

  const userTextPrompt = `
    ধারা (Genre): ${request.genre}
    আবেগ (Mood): ${request.mood}
    গতি (Tempo): ${request.tempo}
    ব্যবহারকারীর বর্ণনা: ${request.sampleStyle || 'নেই'}
    কাঙ্ক্ষিত সময়কাল: ${request.targetDuration} মিনিট
    ${request.audioSample ? 'সংযুক্ত অডিও স্যাম্পলটির ওপর ভিত্তি করে গানটি তৈরি করুন।' : ''}
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
                type: { type: Type.STRING, description: "বিভাগের নাম (যেমন: সূচনা, স্তবক, স্থায়ী)" },
                duration: { type: Type.STRING, description: "সময়কাল (যেমন: ৩০ সেকেন্ড)" },
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
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};
