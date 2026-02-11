
import React, { useState, useRef } from 'react';
import { Tempo, SongRequest, GeneratedSong } from './types';
import { GENRES, MOODS } from './constants';
import { generateBengaliSong } from './geminiService';

const Header = () => (
  <header className="bg-gradient-to-r from-stone-900 via-red-900 to-stone-900 text-white py-12 px-4 shadow-2xl relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center relative z-10">
      <h1 className="text-6xl font-black mb-4 bengali-serif tracking-tighter text-amber-500 drop-shadow-md">সুরকার</h1>
      <p className="text-xl opacity-80 font-medium tracking-wide">আপনার নিজস্ব ডিজিটাল বাংলা মিউজিক স্টুডিও</p>
    </div>
  </header>
);

const Footer = () => (
  <footer className="mt-20 py-10 bg-stone-950 text-stone-500 text-center border-t border-stone-800">
    <p className="text-sm">© ২০২৪ সুরকার এআই - বাংলা সংগীতের আধুনিক রূপান্তর</p>
  </footer>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formState, setFormState] = useState<SongRequest>({
    genre: GENRES[0],
    mood: MOODS[0],
    tempo: Tempo.Medium,
    sampleStyle: '',
    targetDuration: 4
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const val = name === 'targetDuration' ? parseInt(value) : value;
    
    if (name === 'targetDuration' && (val as number) > 10) {
      alert('সময়কাল ১০ মিনিটের বেশি হতে পারবে না।');
      return;
    }

    setFormState(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setFormState(prev => ({
        ...prev,
        audioSample: { data: base64String, mimeType: file.type }
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
    <div className="min-h-screen flex flex-col bg-[#fdfaf5]">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 -mt-10 relative z-20">
        
        {/* Top Configuration Panel */}
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 mb-10">
          <div className="flex items-center gap-3 mb-8 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </div>
            <h2 className="text-3xl font-bold bengali-serif text-stone-800">রচনার মানদণ্ড</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-tight">সংগীতের ধারা</label>
                <select 
                  name="genre"
                  value={formState.genre}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-100 bg-stone-50 focus:border-red-500 focus:bg-white transition-all outline-none"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-tight">আবেগ / মুড</label>
                <select 
                  name="mood"
                  value={formState.mood}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-100 bg-stone-50 focus:border-red-500 focus:bg-white transition-all outline-none"
                >
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-tight">লয় / টেম্পো</label>
                <div className="grid grid-cols-3 gap-3">
                  {[Tempo.Slow, Tempo.Medium, Tempo.Fast].map(t => (
                    <button
                      key={t}
                      onClick={() => setFormState(prev => ({...prev, tempo: t}))}
                      className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${formState.tempo === t ? 'bg-red-700 text-white border-red-700 shadow-lg' : 'bg-white text-stone-600 border-stone-100 hover:border-red-200'}`}
                    >
                      {t.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-tight">সময়কাল (মিনিট): {formState.targetDuration}</label>
                <input 
                  type="range"
                  name="targetDuration"
                  min="1"
                  max="10"
                  step="1"
                  value={formState.targetDuration}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-red-700 mt-4"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-tight">অডিও নমুনা (ঐচ্ছিক)</label>
                {!audioPreviewUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all group"
                  >
                    <svg className="w-8 h-8 text-stone-300 group-hover:text-red-400 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                    <span className="text-xs text-stone-400 font-bold uppercase tracking-widest group-hover:text-red-500">ফাইল আপলোড করুন</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 relative group">
                    <button onClick={removeAudio} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <p className="text-[10px] font-black text-red-600 uppercase mb-2">সংযুক্ত অডিও</p>
                    <audio src={audioPreviewUrl} controls className="w-full h-8" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-tight">অতিরিক্ত নোট</label>
                <textarea 
                  name="sampleStyle"
                  placeholder="যেমন: আধুিনক পপ এবং বাউল সুরের সংমিশ্রণ..."
                  rows={2}
                  value={formState.sampleStyle}
                  onChange={handleInputChange}
                  className="w-full p-3.5 rounded-xl border-2 border-stone-100 bg-stone-50 focus:border-red-500 focus:bg-white transition-all outline-none resize-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`px-12 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center gap-4 ${loading ? 'bg-stone-300 cursor-not-allowed text-stone-500' : 'bg-red-700 hover:bg-red-800 text-white hover:-translate-y-1 active:scale-95'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  সুরারোপ হচ্ছে...
                </>
              ) : 'গান তৈরি করুন'}
            </button>
          </div>
        </section>

        {/* Results Display */}
        <section id="results-section">
          {error && (
            <div className="bg-red-50 border-l-8 border-red-500 p-6 text-red-800 rounded-2xl shadow-lg mb-8 animate-bounce">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {!song && !loading && !error && (
            <div className="bg-white p-20 rounded-3xl shadow-sm border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
              </div>
              <h3 className="text-2xl font-bold bengali-serif text-stone-400">আপনার গানটি এখানে প্রদর্শিত হবে</h3>
              <p className="text-stone-300 mt-2">উপরের সেটিংস ঠিক করে "গান তৈরি করুন" বাটনে ক্লিক করুন।</p>
            </div>
          )}

          {loading && (
            <div className="space-y-10">
              <div className="h-16 bg-white/50 rounded-3xl animate-pulse w-1/2 mx-auto"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-96 bg-white/50 rounded-3xl animate-pulse"></div>
                <div className="h-96 bg-white/50 rounded-3xl animate-pulse"></div>
              </div>
            </div>
          )}

          {song && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-stone-100">
                  <div className="text-center mb-12">
                    <span className="px-4 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-widest mb-4 inline-block">সম্পূর্ণ লিরিক্স</span>
                    <h2 className="text-5xl font-black bengali-serif text-stone-900 mb-2">{song.title}</h2>
                    <div className="w-20 h-1.5 bg-red-700 mx-auto rounded-full mt-4"></div>
                  </div>

                  <div className="space-y-16">
                    {song.sections.map((section, idx) => (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-6 border-b border-stone-50 pb-2 group-hover:border-red-100 transition-colors">
                          <h4 className="text-xl font-black text-red-900 bengali-serif flex items-center gap-2">
                            <span className="text-xs text-red-200 font-serif">#{idx + 1}</span>
                            {section.type}
                          </h4>
                          <span className="text-xs font-bold text-stone-400 italic bg-stone-50 px-3 py-1 rounded-lg">সময়: {section.duration}</span>
                        </div>
                        <p className="text-2xl text-stone-800 leading-[1.8] whitespace-pre-wrap font-medium tracking-tight bg-stone-50/50 p-6 rounded-2xl group-hover:bg-white transition-all">
                          {section.lyrics}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-2xl sticky top-8">
                  <div className="flex items-center gap-3 mb-8 border-b border-stone-800 pb-6">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-stone-900">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </div>
                    <h3 className="text-2xl font-bold bengali-serif">সংগীত আয়োজন</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-stone-800/50 p-5 rounded-2xl border border-stone-700">
                      <p className="text-xs font-black text-amber-500 uppercase mb-2 tracking-widest">বাদ্যযন্ত্রসমূহ</p>
                      <p className="text-stone-200">{song.arrangement.instruments}</p>
                    </div>
                    <div className="bg-stone-800/50 p-5 rounded-2xl border border-stone-700">
                      <p className="text-xs font-black text-amber-500 uppercase mb-2 tracking-widest">তালের ধরন</p>
                      <p className="text-stone-200">{song.arrangement.beatPattern}</p>
                    </div>
                    <div className="bg-stone-800/50 p-5 rounded-2xl border border-stone-700">
                      <p className="text-xs font-black text-amber-500 uppercase mb-2 tracking-widest">বিপিএম (BPM)</p>
                      <p className="text-stone-200">{song.arrangement.bpm}</p>
                    </div>
                    <div className="bg-stone-800/50 p-5 rounded-2xl border border-stone-700">
                      <p className="text-xs font-black text-amber-500 uppercase mb-2 tracking-widest">গায়কীর ধরন</p>
                      <p className="text-stone-200">{song.arrangement.vocalStyle}</p>
                    </div>
                    <div className="bg-stone-800/50 p-5 rounded-2xl border border-stone-700">
                      <p className="text-xs font-black text-amber-500 uppercase mb-2 tracking-widest">শক্তির ক্রমবিকাশ</p>
                      <p className="text-stone-200">{song.arrangement.energyProgression}</p>
                    </div>
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
