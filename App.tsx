
import React, { useState, useRef, useEffect } from 'react';
import { Tempo, Voice, SongRequest, GeneratedSong, SongSection } from './types';
import { GENRES, MOODS } from './constants';
import { generateBengaliSong, generateVocalGuide } from './geminiService';

const LOADING_MESSAGES = [
  "সুরের জাল বোনা হচ্ছে...",
  "ছন্দের মিলন ঘটানো হচ্ছে...",
  "শব্দের মালা গাঁথা হচ্ছে...",
  "সংগীতের তাল ঠিক করা হচ্ছে...",
  "গানের কাঠামো তৈরি হচ্ছে...",
  "আপনার জন্য অনন্য সুর সৃষ্টি হচ্ছে...",
  "লিরিক্সে কাব্যিক ভাব আনা হচ্ছে...",
  "সংগীত আয়োজনের শেষ ছোঁয়া দেওয়া হচ্ছে..."
];

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const Header = () => (
  <header className="bg-gradient-to-r from-stone-900 via-red-900 to-stone-900 text-white py-12 px-4 shadow-2xl relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center relative z-10">
      <h1 className="text-6xl font-black mb-4 bengali-serif tracking-tighter text-amber-500 drop-shadow-md">সুরকার প্রো</h1>
      <p className="text-xl opacity-80 font-medium tracking-wide">সুনো এআই স্টাইলে গান তৈরির ডিজিটাল স্টুডিও</p>
    </div>
  </header>
);

const Footer = () => (
  <footer className="mt-20 py-10 bg-stone-950 text-stone-500 text-center border-t border-stone-800">
    <p className="text-sm">© ২০২৪ সুরকার এআই প্রো - বাংলা সংগীতের আধুনিক রূপান্তর</p>
  </footer>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fullSongLoading, setFullSongLoading] = useState(false);
  const [vocalLoadingIdx, setVocalLoadingIdx] = useState<number | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [formState, setFormState] = useState<SongRequest>({
    genre: GENRES[0],
    mood: MOODS[0],
    tempo: Tempo.Medium,
    sampleStyle: '',
    targetDuration: 4,
    isCustomMode: false,
    customLyrics: '',
    voice: Voice.Female
  });

  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let interval: number;
    if (loading) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 99) return 99.5; 
          if (prev >= 90) return prev + 0.1;
          return prev + Math.random() * 8;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'targetDuration' ? parseInt(value) : value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setFormState(prev => ({ ...prev, audioSample: { data: base64String, mimeType: file.type } }));
    };
    reader.readAsDataURL(file);
  };

  const removeAudio = () => {
    setAudioPreviewUrl(null);
    setFormState(prev => ({ ...prev, audioSample: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (formState.isCustomMode && !formState.customLyrics.trim()) {
      alert("অনুগ্রহ করে লিরিক্স প্রদান করুন।");
      return;
    }
    setLoading(true);
    setError(null);
    setSong(null);
    setProgress(0);
    try {
      const result = await generateBengaliSong(formState);
      setProgress(100);
      
      // Small timeout to ensure progress bar finishes visually
      setTimeout(() => {
        setSong(result);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError(`দুঃখিত, গান তৈরিতে সমস্যা হয়েছে: ${err.message || 'অজানা ত্রুটি'}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (song && !loading) {
      document.getElementById('final-song-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [song, loading]);

  const playVocalGuide = async (sectionIdx: number) => {
    if (!song) return;
    setVocalLoadingIdx(sectionIdx);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const base64Audio = await generateVocalGuide(song.sections[sectionIdx].lyrics, formState.voice);
      const audioBytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error("Vocal guide error:", err);
      alert("ভোকাল গাইড তৈরি করা সম্ভব হয়নি।");
    } finally {
      setVocalLoadingIdx(null);
    }
  };

  const playFullSong = async () => {
    if (!song) return;
    setFullSongLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      // Generate audio for all sections
      const allLyrics = song.sections.map(s => `${s.type}: ${s.lyrics}`).join('\n\n');
      const base64Audio = await generateVocalGuide(allLyrics, formState.voice);
      const audioBytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error("Full song error:", err);
      alert("পুরো গানের ভোকাল তৈরি করা সম্ভব হয়নি।");
    } finally {
      setFullSongLoading(false);
    }
  };

  const updateSectionLyrics = (idx: number, newLyrics: string) => {
    if (!song) return;
    const newSections = [...song.sections];
    newSections[idx].lyrics = newLyrics;
    setSong({ ...song, sections: newSections });
  };

  const downloadLyrics = () => {
    if (!song) return;
    const content = `${song.title}\n\n` + song.sections.map(s => `[${s.type}]\n${s.lyrics}\n`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title}_lyrics.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfaf5]">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 -mt-10 relative z-20 pb-20">
        
        {/* Main Studio Panel */}
        <section className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-stone-200 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              </div>
              <h2 className="text-3xl font-bold bengali-serif text-stone-800 tracking-tight">স্টুডিও সেটিংস</h2>
            </div>
            
            <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setFormState(prev => ({...prev, isCustomMode: false}))}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${!formState.isCustomMode ? 'bg-white text-red-700 shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
              >
                অটো মোড
              </button>
              <button 
                onClick={() => setFormState(prev => ({...prev, isCustomMode: true}))}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${formState.isCustomMode ? 'bg-white text-red-700 shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
              >
                কাস্টম লিরিক্স
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Left Column */}
            <div className="md:col-span-4 space-y-8">
              <div>
                <label className="block text-xs font-black text-stone-400 mb-3 uppercase tracking-widest">ধারা (Genre)</label>
                <select 
                  name="genre"
                  value={formState.genre}
                  onChange={handleInputChange}
                  className="w-full p-4 rounded-2xl border-2 border-stone-50 bg-stone-50 focus:border-red-500 focus:bg-white transition-all outline-none cursor-pointer font-medium"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-400 mb-3 uppercase tracking-widest">ভয়েস (Voice)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {id: Voice.Female, label: 'নারী কন্ঠ'},
                    {id: Voice.Male, label: 'পুরুষ কন্ঠ'},
                    {id: Voice.Deep, label: 'গম্ভীর কন্ঠ'},
                    {id: Voice.Energetic, label: 'জোরালো কন্ঠ'}
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setFormState(prev => ({...prev, voice: v.id}))}
                      className={`py-3 text-xs font-bold rounded-xl border-2 transition-all ${formState.voice === v.id ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white text-stone-600 border-stone-100 hover:border-stone-200'}`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-400 mb-3 uppercase tracking-widest">লয় (Tempo)</label>
                <div className="flex gap-2">
                  {[Tempo.Slow, Tempo.Medium, Tempo.Fast].map(t => (
                    <button
                      key={t}
                      onClick={() => setFormState(prev => ({...prev, tempo: t}))}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all ${formState.tempo === t ? 'bg-red-700 text-white border-red-700 shadow-md' : 'bg-white text-stone-600 border-stone-100 hover:border-stone-200'}`}
                    >
                      {t.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-8 space-y-8">
              {formState.isCustomMode ? (
                <div>
                  <label className="block text-xs font-black text-stone-400 mb-3 uppercase tracking-widest">লিরিক্স</label>
                  <textarea 
                    name="customLyrics"
                    placeholder="আপনার গানের কথা এখানে লিখুন..."
                    rows={12}
                    value={formState.customLyrics}
                    onChange={handleInputChange}
                    className="w-full p-6 rounded-3xl border-2 border-stone-50 bg-stone-50 focus:border-red-500 focus:bg-white transition-all outline-none resize-none text-lg leading-relaxed shadow-inner"
                  />
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-black text-stone-400 mb-3 uppercase tracking-widest">শৈলী বর্ণনা (Style Description)</label>
                    <textarea 
                      name="sampleStyle"
                      placeholder="যেমন: আধুনিক পপ সুর, হালকা গিটার এবং তবলার ব্যবহার..."
                      rows={5}
                      value={formState.sampleStyle}
                      onChange={handleInputChange}
                      className="w-full p-6 rounded-3xl border-2 border-stone-50 bg-stone-50 focus:border-red-500 focus:bg-white transition-all outline-none resize-none text-lg leading-relaxed shadow-inner"
                    />
                  </div>
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                    <label className="block text-xs font-black text-stone-400 mb-4 uppercase tracking-widest">অডিও রেফারেন্স (ঐচ্ছিক)</label>
                    {!audioPreviewUrl ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-stone-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-red-400 transition-all group"
                      >
                        <svg className="w-8 h-8 text-stone-300 group-hover:text-red-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">ফাইল ড্রপ বা সিলেক্ট করুন</span>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                      </div>
                    ) : (
                      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-4 relative">
                        <audio src={audioPreviewUrl} controls className="flex-grow h-8" />
                        <button onClick={removeAudio} className="p-2 text-stone-400 hover:text-red-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`px-16 py-6 rounded-2xl font-black text-2xl shadow-2xl transition-all flex items-center gap-4 ${loading ? 'bg-stone-300 cursor-not-allowed text-stone-500' : 'bg-red-700 hover:bg-red-800 text-white hover:-translate-y-1 active:scale-95'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  সংগীত সৃষ্টি হচ্ছে...
                </>
              ) : 'গান তৈরি করুন'}
            </button>
            {loading && (
              <div className="w-full max-w-xl text-center">
                 <p className="text-red-700 font-bold animate-pulse text-sm mb-4">আপনার গানটি তৈরি হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।</p>
                 <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-red-700 h-full transition-all duration-300 ease-out" style={{width: `${progress}%`}}></div>
                 </div>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        <section id="results-section">
          {error && (
            <div className="bg-red-50 border-l-8 border-red-500 p-8 text-red-800 rounded-3xl shadow-xl mb-10 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-2xl font-bold mb-2">ত্রুটি!</h3>
              <p className="font-medium text-lg">{error}</p>
            </div>
          )}

          {song && (
            <div id="final-song-result" className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
              
              {/* Suno Style Music Player Header */}
              <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-stone-700">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="w-48 h-48 bg-stone-800 rounded-3xl shadow-2xl flex-shrink-0 relative overflow-hidden group border border-stone-700">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-24 h-24 text-red-600/30 group-hover:text-red-600/50 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    </div>
                    {fullSongLoading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex gap-1 items-end">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`w-1 bg-red-500 animate-pulse h-${2 + i * 2}`}></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow space-y-4 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                      <span className="px-3 py-1 bg-red-700/20 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-red-900/50">মৌলিক সুর</span>
                      <span className="px-3 py-1 bg-stone-700 text-stone-300 text-[10px] font-black rounded-lg uppercase tracking-widest">{formState.genre}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black bengali-serif text-white tracking-tight">{song.title}</h2>
                    <p className="text-stone-400 font-medium text-lg italic max-w-2xl">
                      {song.arrangement.vocalStyle} কণ্ঠে - লয়: {song.arrangement.bpm} BPM
                    </p>

                    <div className="pt-6 flex flex-wrap justify-center md:justify-start gap-4">
                      <button 
                        onClick={playFullSong}
                        disabled={fullSongLoading}
                        className={`px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-4 shadow-xl ${fullSongLoading ? 'bg-stone-700 text-stone-400' : 'bg-red-700 hover:bg-red-600 text-white active:scale-95'}`}
                      >
                        {fullSongLoading ? (
                          <>ভয়েস তৈরি হচ্ছে...</>
                        ) : (
                          <>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                            পুরো গানটি শুনুন
                          </>
                        )}
                      </button>
                      <button 
                        onClick={downloadLyrics}
                        className="px-8 py-5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-bold transition-all border border-stone-700 active:scale-95"
                      >
                        লিরিক্স ডাউনলোড
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Lyrics Column */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100">
                    <div className="space-y-16">
                      {song.sections.map((section, idx) => (
                        <div key={idx} className="group relative">
                          <div className="flex items-center justify-between mb-8 border-b border-stone-50 pb-4">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-stone-300 font-mono">0{idx + 1}</span>
                              <h4 className="text-2xl font-black text-red-900 bengali-serif">{section.type}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => playVocalGuide(idx)}
                                disabled={vocalLoadingIdx !== null}
                                className={`p-3 rounded-full transition-all ${vocalLoadingIdx === idx ? 'bg-stone-100 text-stone-300 animate-spin' : 'bg-stone-50 text-red-700 hover:bg-red-700 hover:text-white'}`}
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                              </button>
                              <span className="text-[10px] font-black text-stone-400 bg-stone-50 px-2 py-1 rounded-lg">{section.duration}</span>
                            </div>
                          </div>
                          <textarea
                            value={section.lyrics}
                            onChange={(e) => updateSectionLyrics(idx, e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-xl md:text-2xl text-stone-800 leading-relaxed font-medium tracking-tight p-0 resize-none min-h-[120px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-10 border border-stone-800">
                    <h3 className="text-2xl font-black bengali-serif mb-8 border-b border-stone-800 pb-6 text-amber-500">সংগীত প্রযোজনা বিবরণ</h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">বাদ্যযন্ত্র</p>
                        <p className="text-stone-200 text-lg">{song.arrangement.instruments}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">ছন্দ ও তাল</p>
                        <p className="text-stone-200 text-lg">{song.arrangement.beatPattern}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">গতি (BPM)</p>
                          <p className="text-amber-500 text-3xl font-black">{song.arrangement.bpm}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">কণ্ঠস্বর</p>
                          <p className="text-stone-200 font-bold">{song.arrangement.vocalStyle}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">শক্তির বিন্যাস</p>
                        <p className="text-stone-400 italic text-sm">{song.arrangement.energyProgression}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSong(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full mt-10 py-5 bg-stone-800 hover:bg-red-700 text-white rounded-2xl font-black text-lg transition-all border border-stone-700 active:scale-95 shadow-lg"
                    >
                      নতুন গান শুরু করুন
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;
