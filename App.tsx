
import React, { useState, useRef } from 'react';
import { Tempo, SongRequest, GeneratedSong, AudioData } from './types';
import { GENRES, MOODS } from './constants';
import { generateBengaliSong } from './geminiService';

const Header = () => (
  <header className="bg-gradient-to-r from-red-700 to-amber-800 text-white py-8 px-4 shadow-lg mb-8">
    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold mb-2 bengali-serif tracking-tight">সুরকার</h1>
      <p className="text-lg opacity-90 font-light">আপনার ডিজিটাল বাংলা সংগীত রচনা সহকারী</p>
    </div>
  </header>
);

const Footer = () => (
  <footer className="mt-12 py-8 bg-stone-900 text-stone-400 text-center">
    <p>© ২০২৪ সুরকার এআই - বাংলা সংগীতের আধুনিক রূপান্তর</p>
  </footer>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formState, setFormState] = useState<SongRequest>({
    genre: GENRES[1],
    mood: MOODS[2],
    tempo: Tempo.Medium,
    sampleStyle: '',
    targetDuration: 4
  });

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

    // Create a local preview URL
    const url = URL.createObjectURL(file);
    setAudioPreviewUrl(url);

    // Convert to Base64 for API
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setFormState(prev => ({
        ...prev,
        audioSample: {
          data: base64String,
          mimeType: file.type
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeAudio = () => {
    setAudioPreviewUrl(null);
    setFormState(prev => ({ ...prev, audioSample: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateBengaliSong(formState);
      setSong(result);
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError('দুঃখিত, গান তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Sidebar */}
          <section className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-md border border-stone-200 sticky top-4 h-fit">
            <h2 className="text-2xl font-bold mb-6 bengali-serif text-red-800 border-b pb-2">রচনার মানদণ্ড</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">সংগীতের ধারা</label>
                <select 
                  name="genre"
                  value={formState.genre}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">আবেগ / মুড</label>
                <select 
                  name="mood"
                  value={formState.mood}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">লয় / টেম্পো</label>
                <div className="grid grid-cols-3 gap-2">
                  {[Tempo.Slow, Tempo.Medium, Tempo.Fast].map(t => (
                    <button
                      key={t}
                      onClick={() => setFormState(prev => ({...prev, tempo: t}))}
                      className={`py-2 text-xs rounded-lg border transition-all ${formState.tempo === t ? 'bg-red-700 text-white border-red-700 shadow-md' : 'bg-stone-50 text-stone-600 border-stone-300 hover:border-red-400'}`}
                    >
                      {t.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Music Upload Section */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-stone-700 mb-2">সংগীতের নমুনা যোগ করুন (ঐচ্ছিক)</label>
                {!audioPreviewUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 hover:border-red-300 transition-colors"
                  >
                    <svg className="w-8 h-8 text-stone-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                    </svg>
                    <span className="text-xs text-stone-500 font-medium text-center">অডিও ফাইল আপলোড করুন (MP3/WAV)</span>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="audio/*"
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">সংযুক্ত অডিও</span>
                      <button onClick={removeAudio} className="text-red-600 hover:text-red-800 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <audio src={audioPreviewUrl} controls className="w-full h-8 scale-90" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">সময়কাল (মিনিট): {formState.targetDuration}</label>
                <input 
                  type="range"
                  name="targetDuration"
                  min="3"
                  max="10"
                  step="1"
                  value={formState.targetDuration}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-red-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">অতিরিক্ত বর্ণনা</label>
                <textarea 
                  name="sampleStyle"
                  placeholder="যেমন: আধুিনক পপ এবং বাউল সুরের সংমিশ্রণ..."
                  rows={3}
                  value={formState.sampleStyle}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'bg-stone-400 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800 text-white active:scale-95'}`}
              >
                {loading ? 'সুরারোপ হচ্ছে...' : 'গান তৈরি করুন'}
              </button>
            </div>
          </section>

          {/* Result Display */}
          <section className="lg:col-span-2 space-y-8" id="results-section">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded shadow-sm">
                <p>{error}</p>
              </div>
            )}

            {!song && !loading && !error && (
              <div className="bg-white p-12 rounded-2xl shadow-md border border-dashed border-stone-300 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold bengali-serif">এখনও কোনো গান নেই</h3>
                <p className="text-stone-500">আপনার পছন্দ এবং অডিও স্যাম্পল দিয়ে জেনারেট বাটনে ক্লিক করুন।</p>
              </div>
            )}

            {loading && (
              <div className="space-y-6">
                <div className="h-12 bg-stone-200 rounded animate-pulse w-2/3"></div>
                <div className="space-y-4">
                  <div className="h-40 bg-stone-100 rounded animate-pulse"></div>
                  <div className="h-40 bg-stone-100 rounded animate-pulse"></div>
                </div>
              </div>
            )}

            {song && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="bg-white p-8 rounded-2xl shadow-md border border-stone-200">
                  <div className="text-center mb-8">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full mb-2 inline-block">সম্পূর্ণ কম্পোজিশন</span>
                    <h2 className="text-4xl font-bold bengali-serif text-stone-800">{song.title}</h2>
                  </div>

                  <div className="space-y-12">
                    {song.sections.map((section, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-red-200">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-700 border-2 border-white"></div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-bold text-red-900 bengali-serif">[{section.type}]</h4>
                          <span className="text-sm text-stone-500 font-medium italic">সময়কাল: {section.duration}</span>
                        </div>
                        <p className="text-lg text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                          {section.lyrics}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrangement Suggestions */}
                <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 bengali-serif text-amber-400 border-b border-stone-700 pb-3 flex items-center gap-2">
                    সংগীত আয়োজন পরিকল্পনা
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-4">
                      <div>
                        <p className="text-amber-200/60 font-bold uppercase text-[10px] tracking-widest mb-1">প্রস্তাবিত যন্ত্রসমূহ</p>
                        <p className="text-stone-100 font-medium">{song.arrangement.instruments}</p>
                      </div>
                      <div>
                        <p className="text-amber-200/60 font-bold uppercase text-[10px] tracking-widest mb-1">বিট এবং রিদম প্যাটার্ন</p>
                        <p className="text-stone-100 font-medium">{song.arrangement.beatPattern}</p>
                      </div>
                      <div>
                        <p className="text-amber-200/60 font-bold uppercase text-[10px] tracking-widest mb-1">BPM রেঞ্জ</p>
                        <p className="text-stone-100 font-medium">{song.arrangement.bpm}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-amber-200/60 font-bold uppercase text-[10px] tracking-widest mb-1">কণ্ঠস্বর এবং গায়কী</p>
                        <p className="text-stone-100 font-medium">{song.arrangement.vocalStyle}</p>
                      </div>
                      <div>
                        <p className="text-amber-200/60 font-bold uppercase text-[10px] tracking-widest mb-1">এনার্জি প্রগ্রেশন</p>
                        <p className="text-stone-100 font-medium">{song.arrangement.energyProgression}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
