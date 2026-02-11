
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SongRequest, GeneratedSong, Voice } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Extract JSON from potentially messy model response.
 * Finds the first '{' and last '}' to isolate the JSON object.
 */
const extractJson = (text: string): string => {
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) {
    // If no curly braces, try the original cleaning method
    return text.replace(/```json\n?|```/g, '').trim();
  }
  return text.substring(startIdx, endIdx + 1);
};

export const generateBengaliSong = async (request: SongRequest): Promise<GeneratedSong> => {
  const systemInstruction = `
    আপনি একজন বিশ্বমানের বাঙালি গীতিকার এবং সংগীত পরিচালক। 
    আপনার কাজ হলো ব্যবহারকারীর চাহিদামত একটি পূর্ণাঙ্গ মৌলিক বাংলা গানের কথা এবং সংগীত আয়োজন তৈরি করা।
    ${request.isCustomMode ? 'ব্যবহারকারী তার নিজস্ব লিরিক্স প্রদান করেছেন, আপনার কাজ সেই লিরিক্সের জন্য সঠিক সংগীত আয়োজন (Arrangement) এবং বিভাগ বিভাজন (Sections) করা।' : ''}
    
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

  const userTextPrompt = request.isCustomMode 
    ? `লিরিক্স: ${request.customLyrics}\nধারা: ${request.genre}\nআবেগ: ${request.mood}\nগতি: ${request.tempo}`
    : `ধারা (Genre): ${request.genre}\nআবেগ (Mood): ${request.mood}\nগতি (Tempo): ${request.tempo}\nশৈলী বর্ণনা: ${request.sampleStyle || 'স্বাভাবিক'}\nনির্ধারিত সময়: ${request.targetDuration} মিনিট`;

  const parts: any[] = [{ text: userTextPrompt }];

  if (request.audioSample) {
    parts.push({
      inlineData: {
        data: request.audioSample.data,
        mimeType: request.audioSample.mimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    const cleanedText = extractJson(text);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateVocalGuide = async (text: string, voice: Voice): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `With a melodic and rhythmic tone, recite this Bengali song section: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
