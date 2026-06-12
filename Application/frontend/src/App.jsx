import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Leaf, Sun, Droplets, Wind, AlertCircle, ChevronRight,
  Menu, X, MapPin, Calendar, Thermometer, Eye, Gauge,
  Newspaper, RefreshCw, ExternalLink, Clock,
  Volume2, VolumeX, Mic, MicOff, Globe, ChevronDown
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   SUPPORTED LANGUAGES —  13 languages, fully dynamic
   No hardcoded translations. Uses MyMemory free API.
═══════════════════════════════════════════════════════════ */
const SUPPORTED_LANGUAGES = [
  { code: 'en',  name: 'English',    nativeName: 'English',     bcp47: 'en-IN' },
  { code: 'hi',  name: 'Hindi',      nativeName: 'हिंदी',        bcp47: 'hi-IN' },
  { code: 'ta',  name: 'Tamil',      nativeName: 'தமிழ்',        bcp47: 'ta-IN' },
  { code: 'te',  name: 'Telugu',     nativeName: 'తెలుగు',       bcp47: 'te-IN' },
  { code: 'mr',  name: 'Marathi',    nativeName: 'मराठी',        bcp47: 'mr-IN' },
  { code: 'bn',  name: 'Bengali',    nativeName: 'বাংলা',        bcp47: 'bn-IN' },
  { code: 'gu',  name: 'Gujarati',   nativeName: 'ગુજરાતી',      bcp47: 'gu-IN' },
  { code: 'kn',  name: 'Kannada',    nativeName: 'ಕನ್ನಡ',        bcp47: 'kn-IN' },
  { code: 'ml',  name: 'Malayalam',  nativeName: 'മലയാളം',       bcp47: 'ml-IN' },
  { code: 'pa',  name: 'Punjabi',    nativeName: 'ਪੰਜਾਬੀ',       bcp47: 'pa-IN' },
  { code: 'ur',  name: 'Urdu',       nativeName: 'اردو',         bcp47: 'ur-PK' },
  { code: 'or',  name: 'Odia',       nativeName: 'ଓଡ଼ିଆ',        bcp47: 'or-IN' },
  { code: 'as',  name: 'Assamese',   nativeName: 'অসমীয়া',      bcp47: 'as-IN' }
];

// Base English strings — translated dynamically via API
const BASE_STRINGS = {
  appTitle: 'KrishiMadad', tagline: 'An AI-Based Intelligent Agricultural Assistance Platform',
  scanPlant: 'Scan Plant',
  weather: 'Weather',
  news: 'News',
  uploadImage: 'Upload Plant Image',
  analyzing: 'Analyzing your crop…',
  healthy: 'Healthy Plant ✓',
  diseased: 'Disease Detected',
  recommendations: 'Recommendations',
  confidence: 'Confidence',
  scanAnother: 'Scan Another Plant',
  dropImage: 'Drop image here or click to upload',
  apiError: 'Failed to analyze image. Please try again.',
  location: 'Your Location',
  updated: 'Updated',
  weatherError: 'Could not load weather',
  loadingWeather: 'Fetching live weather…',
  forecast: '7-Day Forecast',
  humidity: 'Humidity',
  wind: 'Wind',
  uvIndex: 'UV Index',
  feelsLike: 'Feels Like',
  visibility: 'Visibility',
  pressure: 'Pressure',
  sunrise: 'Sunrise',
  sunset: 'Sunset',
  loadingNews: 'Fetching live news…',
  newsError: 'Could not load news. Tap retry.',
  newsTitle: 'Live Agriculture & Government News',
  newsSubtitle: 'Real-time updates from Google News',
  readMore: 'Read More',
  refresh: 'Refresh',
  justNow: 'Just now',
  minutesAgo: 'min ago',
  hoursAgo: 'hr ago',
  daysAgo: 'd ago',
  source: 'Source',
  voiceOn: 'Voice On',
  voiceOff: 'Voice',
  translating: 'Translating…',
  listenHint: 'Listening…',
  cropHealthy: 'Good news! Your crop is healthy. Keep up the good care.',
  cropDiseased: 'Disease detected in your crop.',
};

/* ═══════════════════════════════════════════════════════════
   TRANSLATION ENGINE — MyMemory free API (no key needed)
   Caches all translations in memory
═══════════════════════════════════════════════════════════ */
const _cache = { en: BASE_STRINGS };

async function translateOne(text, targetLang) {
  if (targetLang === 'en' || !text) return text;
  const ckey = `${targetLang}::${text.slice(0, 50)}`;
  if (_cache[ckey]) return _cache[ckey];
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const res = await fetch(url);
    const d = await res.json();
    const out = d?.responseData?.translatedText || text;
    _cache[ckey] = out;
    return out;
  } catch { return text; }
}

async function translateAll(targetLang) {
  if (targetLang === 'en') return BASE_STRINGS;
  if (_cache[targetLang]) return _cache[targetLang];
  const pairs = Object.entries(BASE_STRINGS);
  // Skip non-translatable keys
  const skip = new Set(['appTitle']);
  const results = await Promise.all(
    pairs.map(async ([k, v]) => [k, skip.has(k) ? v : await translateOne(v, targetLang)])
  );
  const obj = Object.fromEntries(results);
  _cache[targetLang] = obj;
  return obj;
}

/* ═══════════════════════════════════════════════════════════
   VOICE ASSISTANT — 100% browser Web Speech API, no key
═══════════════════════════════════════════════════════════ */
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function getBestVoice(bcp47) {
  const voices = synth.getVoices();
  const lang2 = bcp47.split('-')[0];
  return (
    voices.find(v => v.lang === bcp47) ||
    voices.find(v => v.lang.startsWith(lang2)) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0]
  );
}

function speakText(text, bcp47, onEnd) {
  if (!synth || !text) return;
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = bcp47;
  utt.rate = 0.9;
  utt.pitch = 1.05;
  const applyVoice = () => { const v = getBestVoice(bcp47); if (v) utt.voice = v; };
  applyVoice();
  if (!synth.getVoices().length) synth.addEventListener('voiceschanged', applyVoice, { once: true });
  utt.onend = onEnd;
  utt.onerror = onEnd;
  synth.speak(utt);
}

/* ═══════════════════════════════════════════════════════════
   WEATHER HELPERS
═══════════════════════════════════════════════════════════ */
const WMO = {
  0:{l:'Clear Sky',i:'☀️'},1:{l:'Mainly Clear',i:'🌤️'},2:{l:'Partly Cloudy',i:'⛅'},3:{l:'Overcast',i:'☁️'},
  45:{l:'Foggy',i:'🌫️'},48:{l:'Freezing Fog',i:'🌫️'},51:{l:'Light Drizzle',i:'🌦️'},53:{l:'Drizzle',i:'🌦️'},
  55:{l:'Heavy Drizzle',i:'🌧️'},61:{l:'Slight Rain',i:'🌧️'},63:{l:'Rain',i:'🌧️'},65:{l:'Heavy Rain',i:'🌧️'},
  71:{l:'Slight Snow',i:'❄️'},73:{l:'Snow',i:'❄️'},75:{l:'Heavy Snow',i:'❄️'},
  80:{l:'Showers',i:'🌦️'},81:{l:'Showers',i:'🌧️'},82:{l:'Heavy Showers',i:'⛈️'},
  95:{l:'Thunderstorm',i:'⛈️'},99:{l:'Thunderstorm',i:'⛈️'},
};
const getWMO = c => WMO[c] || { l: 'Unknown', i: '🌡️' };
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  if (!r.ok) throw new Error();
  return r.json();
}

async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const d = await r.json();
    const a = d.address || {};
    return a.city || a.town || a.village || a.county || 'Your Location';
  } catch { return 'Your Location'; }
}

/* ═══════════════════════════════════════════════════════════
   NEWS HELPERS
═══════════════════════════════════════════════════════════ */
const NEWS_QUERIES = [
  'india agriculture farming government scheme',
  'kisan crop MSP india 2025',
  'PM KISAN subsidy irrigation india farmer',
  'india agriculture ministry crop advisory',
];
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

function classifyArticle(title='', desc='') {
  const text = (title+' '+desc).toLowerCase();
  if (/pm.kisan|pmkisan|kisan samman/i.test(text))  return { tag:'PM-KISAN', color:'#166534', bg:'#dcfce7', emoji:'🏛️' };
  if (/msp|minimum support price|procurement/i.test(text)) return { tag:'MSP', color:'#92400e', bg:'#fef3c7', emoji:'📊' };
  if (/subsidy|scheme|yojana|government|ministry/i.test(text)) return { tag:'Scheme', color:'#1e3a5f', bg:'#dbeafe', emoji:'📋' };
  if (/drought|flood|rain|monsoon|irrigation/i.test(text)) return { tag:'Weather', color:'#0369a1', bg:'#e0f2fe', emoji:'🌧️' };
  if (/pest|disease|crop|wheat|rice|paddy|soybean/i.test(text)) return { tag:'Crop', color:'#3f6212', bg:'#ecfccb', emoji:'🌾' };
  if (/market|mandi|price|export|import/i.test(text)) return { tag:'Market', color:'#7c3aed', bg:'#ede9fe', emoji:'📈' };
  if (/fertilizer|pesticide|technology|digital/i.test(text)) return { tag:'Tech', color:'#0f766e', bg:'#ccfbf1', emoji:'🔬' };
  return { tag:'News', color:'#374151', bg:'#f3f4f6', emoji:'📰' };
}

function timeAgo(pubDate, t) {
  if (!pubDate) return '';
  const diff = (Date.now() - new Date(pubDate)) / 1000;
  if (diff < 60)    return t.justNow;
  if (diff < 3600)  return `${Math.floor(diff/60)} ${t.minutesAgo}`;
  if (diff < 86400) return `${Math.floor(diff/3600)} ${t.hoursAgo}`;
  return `${Math.floor(diff/86400)} ${t.daysAgo}`;
}

async function fetchOneQuery(query) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const r = await fetch(RSS2JSON + encodeURIComponent(rssUrl) + '&count=10');
  if (!r.ok) throw new Error();
  const d = await r.json();
  return (d.items || []).map(item => ({
    title: item.title?.replace(/\s*-\s*[^-]+$/, '').trim() || 'Untitled',
    description: item.description?.replace(/<[^>]+>/g, '').slice(0,180) || '',
    link: item.link || '#',
    pubDate: item.pubDate,
    sourceName: item.author || '',
    ...classifyArticle(item.title, item.description),
  }));
}

async function fetchAllNews() {
  const results = await Promise.allSettled(NEWS_QUERIES.map(fetchOneQuery));
  const all = results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
  const seen = new Set();
  return all.filter(a=>{ const k=a.title.toLowerCase().slice(0,60); if(seen.has(k))return false; seen.add(k);return true; })
    .sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate)).slice(0,24);
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function KisanAI() {
  const [lang, setLang]             = useState('en');
  const [t, setT]                   = useState(BASE_STRINGS);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab]   = useState('scan');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  // Voice
  const [voiceOn, setVoiceOn]       = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [listening, setListening]   = useState(false);
  const recognitionRef              = useRef(null);

  // Scan
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [result, setResult]         = useState(null);
  const [scanError, setScanError]   = useState(null);
  const fileRef                     = useRef(null);

  // Weather
  const [weather, setWeather]         = useState(null);
  const [locName, setLocName]         = useState('');
  const [wxLoading, setWxLoading]     = useState(false);
  const [wxError, setWxError]         = useState(null);
  const [wxUpdated, setWxUpdated]     = useState(null);

  // News
  const [news, setNews]             = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError]   = useState(null);
  const [newsUpdated, setNewsUpdated] = useState(null);
  const [newsFilter, setNewsFilter] = useState('All');

  const API_URL = 'http://localhost:5000';
  const langInfo = SUPPORTED_LANGUAGES.find(l=>l.code===lang) || SUPPORTED_LANGUAGES[0];

  /* ── Language change ── */
  useEffect(() => {
    if (lang === 'en') { setT(BASE_STRINGS); return; }
    setTranslating(true);
    translateAll(lang).then(setT).finally(() => setTranslating(false));
  }, [lang]);

  /* ── Re-translate recommendations when language changes ── */
  useEffect(() => {
    if (!result || !result.recommendations?.length) return;
    if (lang === 'en') return; // already English from backend
    Promise.all(result.recommendations.map(rec => translateOne(rec, lang)))
      .then(translatedRecs => setResult(prev => prev ? { ...prev, recommendations: translatedRecs } : prev));
  }, [lang]);

  /* ── Speak helper ── */
  const speak = useCallback((text) => {
    if (!voiceOn || !text) return;
    setSpeaking(true);
    speakText(text, langInfo.bcp47, () => setSpeaking(false));
  }, [voiceOn, langInfo.bcp47]);

  const stopSpeak = useCallback(() => { synth?.cancel(); setSpeaking(false); }, []);

  /* ── Page summary for read-aloud ── */
  const pageSummary = useCallback(() => {
    if (activeTab === 'scan') {
      if (result) {
        const s = result.status==='healthy' ? t.healthy : `${t.diseased}: ${result.disease}`;
        const r = result.recommendations?.join('. ') || '';
        return `${s}. ${t.confidence}: ${result.confidence} percent. ${r ? t.recommendations+': '+r : ''}`;
      }
      return `${t.appTitle}. ${t.tagline}. ${t.dropImage}`;
    }
    if (activeTab === 'weather') {
      const c = weather?.current;
      if (c) return `${t.weather}. ${locName}. Temperature ${Math.round(c.temperature_2m)} degrees. ${getWMO(c.weather_code).l}. ${t.humidity}: ${c.relative_humidity_2m} percent.`;
      return t.loadingWeather;
    }
    if (activeTab === 'news') {
      if (news.length) return `${t.newsTitle}. Top headlines: ${news.slice(0,3).map(n=>n.title).join('. ')}`;
      return t.loadingNews;
    }
    return t.appTitle;
  }, [activeTab, result, weather, news, locName, t]);

  /* ── Voice commands ── */
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = langInfo.bcp47;
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;
    setListening(true);
    rec.onresult = e => {
      const text = Array.from(e.results).map(r=>r[0].transcript).join('').toLowerCase();
      setListening(false);
      if (text.includes('scan') || text.includes('plant') || text.includes('crop'))       { setActiveTab('scan');    speak(t.scanPlant); }
      else if (text.includes('weather') || text.includes('rain') || text.includes('mausam')) { setActiveTab('weather'); speak(t.weather); }
      else if (text.includes('news') || text.includes('samachar'))                         { setActiveTab('news');    speak(t.news); }
      else speak(pageSummary());
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    rec.start();
  }, [langInfo.bcp47, t, speak, pageSummary]);

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  /* ── Auto-speak scan result ── */
  useEffect(() => {
    if (result && voiceOn) {
      const msg = result.status === 'healthy'
        ? (t.cropHealthy || 'Your crop is healthy!')
        : `${t.cropDiseased || 'Disease detected.'} ${result.disease}. ${result.confidence} percent confidence.`;
      setTimeout(() => speak(msg), 500);
    }
  }, [result]);

  /* ── Weather ── */
  useEffect(() => { if (activeTab==='weather' && !weather) loadWeather(); }, [activeTab]);

  const loadWeather = () => {
    setWxLoading(true); setWxError(null);
    const go = (lat, lon) => Promise.all([fetchWeather(lat,lon), reverseGeocode(lat,lon)])
      .then(([d,n]) => { setWeather(d); setLocName(n); setWxUpdated(new Date()); })
      .catch(() => setWxError(t.weatherError))
      .finally(() => setWxLoading(false));
    if (!navigator.geolocation) { go(23.0167, 76.7167); return; }
    navigator.geolocation.getCurrentPosition(p=>go(p.coords.latitude,p.coords.longitude), ()=>go(23.0167,76.7167), {timeout:6000});
  };

  /* ── News ── */
  useEffect(() => { if (activeTab==='news' && !news.length) loadNews(); }, [activeTab]);

  const loadNews = useCallback(async () => {
    setNewsLoading(true); setNewsError(null);
    try { const a = await fetchAllNews(); if (!a.length) throw new Error(); setNews(a); setNewsUpdated(new Date()); }
    catch { setNewsError(t.newsError); }
    finally { setNewsLoading(false); }
  }, [t.newsError]);

  /* ── Scan ── */
  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setScanError(null);
    const reader = new FileReader();
    reader.onload = async ev => {
      setUploadedImage(ev.target.result); setAnalyzing(true);
      if (voiceOn) speak(t.analyzing);
      try {
        const res = await fetch(`${API_URL}/predict`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ image: ev.target.result }),
        });
        if (!res.ok) throw new Error();
        const d = await res.json();
        // Translate recommendations into the currently selected language
        const rawRecs = d.recommendations || [];
        const translatedRecs = lang === 'en'
          ? rawRecs
          : await Promise.all(rawRecs.map(rec => translateOne(rec, lang)));
        setResult({ disease: d.disease_readable||d.disease, confidence:d.confidence, status:d.status, recommendations:translatedRecs });
      } catch { setScanError(t.apiError); if(voiceOn) speak(t.apiError); }
      finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const cur   = weather?.current;
  const daily = weather?.daily;
  const fmt   = iso => iso ? new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '--';
  const allTags = ['All', ...Array.from(new Set(news.map(n=>n.tag)))];
  const visible = newsFilter==='All' ? news : news.filter(n=>n.tag===newsFilter);
  const filteredLangs = SUPPORTED_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(langSearch.toLowerCase())
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--text)',fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800;900&display=swap');
        :root{
          --bg:#f0fdf4;--surface:#fff;--border:#d1fae5;
          --primary:#16a34a;--primary-dark:#166534;--primary-light:#86efac;
          --text:#1a2e1a;--text2:#374151;--text3:#6b7280;
          --shadow:0 4px 24px rgba(22,101,52,.10);--shadow-lg:0 8px 40px rgba(22,101,52,.16);
          --radius:20px;--radius-sm:12px;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin360{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes blob{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(20px,-28px)scale(1.07)}66%{transform:translate(-14px,14px)scale(.94)}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes newsIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ripple{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
        @keyframes wavebar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1.3)}}

        .fade-up{animation:fadeUp .4s ease both}
        .spinning{animation:spin360 1.8s linear infinite}
        .blob{animation:blob 7s infinite;border-radius:9999px;filter:blur(48px);opacity:.17;position:absolute;pointer-events:none;}
        .card{background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow);border:1.5px solid var(--border);transition:box-shadow .25s,transform .25s;}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:11px 22px;border:none;border-radius:var(--radius-sm);font-family:inherit;font-weight:800;font-size:.93rem;cursor:pointer;transition:all .2s;}
        .btn-green{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 4px 16px rgba(34,197,94,.3);}
        .btn-green:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(34,197,94,.42);}
        .btn-blue{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;box-shadow:0 4px 14px rgba(2,132,199,.3);}
        .btn-blue:hover{transform:translateY(-2px);}
        .btn-ghost{background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.25);}
        .btn-ghost:hover{background:rgba(255,255,255,.22);}
        .btn-voice{background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,.3);}
        .btn-voice:hover{transform:translateY(-2px);}
        .btn-voice.on{background:linear-gradient(135deg,#ec4899,#be185d);box-shadow:0 4px 16px rgba(236,72,153,.4);}

        .tab-btn{padding:8px 17px;border-radius:10px;font-family:inherit;font-weight:700;font-size:.92rem;border:none;cursor:pointer;transition:all .2s;background:transparent;color:rgba(255,255,255,.78);}
        .tab-btn.active{background:rgba(255,255,255,.95);color:#166534;}
        .tab-btn:not(.active):hover{background:rgba(255,255,255,.15);}

        .upload-zone{border:2.5px dashed #86efac;border-radius:var(--radius);background:linear-gradient(135deg,#f0fdf4,#ecfdf5);cursor:pointer;transition:all .25s;padding:52px 24px;text-align:center;}
        .upload-zone:hover{border-color:var(--primary);background:#dcfce7;transform:scale(1.01);}

        .weather-hero{background:linear-gradient(140deg,#0c4a6e,#075985 45%,#0369a1);border-radius:var(--radius);color:#fff;position:relative;overflow:hidden;}
        .stat-pill{background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:14px 10px;text-align:center;backdrop-filter:blur(6px);}
        .forecast-day{background:linear-gradient(160deg,#f0fdf4,#dcfce7);border:1.5px solid #bbf7d0;border-radius:16px;padding:14px 6px;text-align:center;transition:all .2s;}
        .forecast-day:hover{transform:translateY(-4px);box-shadow:0 8px 22px rgba(34,197,94,.2);}

        .news-card{background:var(--surface);border-radius:var(--radius);border:1.5px solid var(--border);box-shadow:var(--shadow);padding:22px;transition:all .25s;display:flex;flex-direction:column;gap:10px;animation:newsIn .4s ease both;}
        .news-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:var(--primary-light);}

        .filter-chip{padding:6px 14px;border-radius:30px;border:1.5px solid var(--border);background:var(--surface);font-family:inherit;font-weight:700;font-size:.8rem;cursor:pointer;transition:all .2s;color:var(--text3);}
        .filter-chip.active{background:var(--primary);color:#fff;border-color:var(--primary);}
        .filter-chip:hover:not(.active){border-color:var(--primary);color:var(--primary);}

        .skeleton{background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:400px;animation:shimmer 1.4s infinite;border-radius:10px;}
        .result-healthy{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:var(--radius);padding:24px;}
        .result-diseased{background:linear-gradient(135deg,#fff1f2,#ffe4e6);border:2px solid #fca5a5;border-radius:var(--radius);padding:24px;}

        /* Language picker */
        .lang-drop{position:absolute;right:0;top:calc(100%+8px);background:#fff;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.18);border:1.5px solid #f0fdf4;min-width:220px;z-index:300;overflow:hidden;}
        .lang-search{padding:10px 14px;border:none;border-bottom:1.5px solid #f0fdf4;outline:none;font-family:inherit;font-size:.88rem;width:100%;color:#1a2e1a;}
        .lang-list{max-height:260px;overflow-y:auto;}
        .lang-list::-webkit-scrollbar{width:4px}
        .lang-list::-webkit-scrollbar-thumb{background:#86efac;border-radius:3px}
        .lang-item{display:flex;align-items:center;justify-content:space-between;width:100%;padding:9px 16px;background:transparent;color:#1a2e1a;font-family:inherit;font-weight:500;font-size:.88rem;border:none;cursor:pointer;transition:background .15s;}
        .lang-item:hover{background:#f0fdf4;}
        .lang-item.sel{background:#f0fdf4;font-weight:800;color:#166534;}

        /* Floating voice widget */
        .vwidget{position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
        .vorb{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s;position:relative;box-shadow:0 6px 28px rgba(0,0,0,.22);}
        .vorb-idle{background:linear-gradient(135deg,#a855f7,#7c3aed);}
        .vorb-speak{background:linear-gradient(135deg,#ec4899,#be185d);animation:pulse .7s infinite;}
        .vorb-listen{background:linear-gradient(135deg,#f59e0b,#d97706);}
        .vorb-off{background:linear-gradient(135deg,#6b7280,#4b5563);}
        .vorb-idle::after,.vorb-speak::after,.vorb-listen::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(168,85,247,.35);animation:ripple 1.8s infinite;}
        .vpanel{background:#fff;border-radius:18px;box-shadow:0 12px 48px rgba(0,0,0,.16);border:1.5px solid #e9d5ff;padding:16px 18px;min-width:230px;animation:fadeUp .2s ease;}
        .wbar{width:4px;height:18px;border-radius:3px;background:linear-gradient(180deg,#a855f7,#7c3aed);display:inline-block;animation:wavebar .8s ease-in-out infinite;}

        .translating-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:rgba(255,255,255,.14);border-radius:30px;font-size:.72rem;color:rgba(255,255,255,.9);font-weight:700;border:1px solid rgba(255,255,255,.2);}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#86efac;border-radius:4px}
        @media(max-width:640px){.hide-mob{display:none!important}}
        @media(min-width:641px){.hide-desk{display:none!important}}
      `}</style>

      {/* Blobs */}
      <div className="blob" style={{width:320,height:320,background:'#4ade80',top:60,left:-80}}/>
      <div className="blob" style={{width:280,height:280,background:'#34d399',top:200,right:-60,animationDelay:'2s'}}/>
      <div className="blob" style={{width:240,height:240,background:'#a3e635',bottom:100,left:'40%',animationDelay:'4s'}}/>

      {/* ═══ HEADER ═══ */}
      <header style={{background:'linear-gradient(135deg,#14532d,#166534 45%,#15803d)',boxShadow:'0 4px 32px rgba(20,83,45,.35)',position:'sticky',top:0,zIndex:100}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:66}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{background:'rgba(255,255,255,.14)',borderRadius:12,padding:8,display:'flex'}}>
              <Leaf style={{color:'#86efac',width:26,height:26}}/>
            </div>
            <div>
              <span style={{fontFamily:"'Baloo 2',sans-serif",fontSize:'1.4rem',fontWeight:900,color:'#fff',letterSpacing:'-.5px'}}>{t.appTitle}</span>
              <div style={{fontSize:'.62rem',color:'#86efac',fontWeight:700,letterSpacing:'.6px',marginTop:-2}}>PLANT HEALTH AI</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hide-mob" style={{display:'flex',alignItems:'center',gap:6}}>
            {translating && (
              <span className="translating-pill">
                <span className="spinning" style={{display:'inline-block',width:10,height:10,border:'2px solid rgba(255,255,255,.5)',borderTopColor:'#fff',borderRadius:'50%'}}/>
                {t.translating}
              </span>
            )}
            {['scan','weather','news'].map(tab=>(
              <button key={tab} className={`tab-btn${activeTab===tab?' active':''}`}
                onClick={()=>{setActiveTab(tab); if(voiceOn) speak(tab==='scan'?t.scanPlant:tab==='weather'?t.weather:t.news);}}>
                {tab==='scan'?t.scanPlant:tab==='weather'?t.weather:t.news}
              </button>
            ))}

            {/* Language picker */}
            <div style={{position:'relative',marginLeft:6}}>
              <button className="btn btn-ghost" style={{padding:'7px 13px',fontSize:'.87rem',gap:6}}
                onClick={()=>{setShowLangMenu(!showLangMenu);setLangSearch('');}}>
                <Globe style={{width:14,height:14}}/>{langInfo.nativeName}
                <ChevronDown style={{width:12,height:12,transform:showLangMenu?'rotate(180deg)':'none',transition:'transform .2s'}}/>
              </button>
              {showLangMenu&&(
                <div className="lang-drop">
                  <input className="lang-search" placeholder="Search language…" autoFocus value={langSearch} onChange={e=>setLangSearch(e.target.value)}/>
                  <div className="lang-list">
                    {filteredLangs.map(l=>(
                      <button key={l.code} className={`lang-item${lang===l.code?' sel':''}`}
                        onClick={()=>{setLang(l.code);setShowLangMenu(false);setLangSearch('');}}>
                        <span>{l.nativeName}</span>
                        <span style={{fontSize:'.74rem',color:'#9ca3af'}}>{l.name}</span>
                      </button>
                    ))}
                    {!filteredLangs.length&&<p style={{padding:'12px 16px',color:'#9ca3af',fontSize:'.85rem'}}>No match</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Voice toggle */}
            <button className={`btn btn-voice${voiceOn?' on':''}`} style={{padding:'7px 13px',fontSize:'.83rem'}}
              onClick={()=>{const n=!voiceOn;setVoiceOn(n);if(!n)stopSpeak();}}>
              {voiceOn?<Volume2 style={{width:15,height:15}}/>:<VolumeX style={{width:15,height:15}}/>}
              {voiceOn?t.voiceOn:t.voiceOff}
            </button>
          </nav>

          {/* Mobile burger */}
          <button className="hide-desk" onClick={()=>setShowMobile(!showMobile)}
            style={{background:'rgba(255,255,255,.1)',border:'none',borderRadius:10,padding:8,color:'#fff',cursor:'pointer'}}>
            {showMobile?<X style={{width:22,height:22}}/>:<Menu style={{width:22,height:22}}/>}
          </button>
        </div>

        {showMobile&&(
          <div className="hide-desk fade-up" style={{borderTop:'1px solid rgba(255,255,255,.15)',padding:'12px 20px',display:'flex',flexDirection:'column',gap:8}}>
            {['scan','weather','news'].map(tab=>(
              <button key={tab} className={`tab-btn${activeTab===tab?' active':''}`}
                style={{width:'100%',textAlign:'left',padding:'12px 16px'}}
                onClick={()=>{setActiveTab(tab);setShowMobile(false);}}>
                {tab==='scan'?t.scanPlant:tab==='weather'?t.weather:t.news}
              </button>
            ))}
            <input style={{padding:'8px 12px',borderRadius:9,border:'1.5px solid rgba(255,255,255,.3)',background:'rgba(255,255,255,.1)',color:'#fff',fontFamily:'inherit',fontSize:'.83rem',outline:'none'}}
              placeholder="Search language…" value={langSearch} onChange={e=>setLangSearch(e.target.value)}/>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',maxHeight:120,overflowY:'auto'}}>
              {filteredLangs.map(l=>(
                <button key={l.code} onClick={()=>{setLang(l.code);setShowMobile(false);setLangSearch('');}}
                  style={{padding:'6px 11px',borderRadius:9,border:'1.5px solid rgba(255,255,255,.3)',background:lang===l.code?'rgba(255,255,255,.9)':'rgba(255,255,255,.1)',color:lang===l.code?'#166534':'#fff',fontFamily:'inherit',fontWeight:700,fontSize:'.79rem',cursor:'pointer'}}>
                  {l.nativeName}
                </button>
              ))}
            </div>
            <button className={`btn btn-voice${voiceOn?' on':''}`} style={{width:'100%',justifyContent:'center'}}
              onClick={()=>{const n=!voiceOn;setVoiceOn(n);if(!n)stopSpeak();}}>
              {voiceOn?<Volume2 style={{width:15,height:15}}/>:<VolumeX style={{width:15,height:15}}/>}
              {voiceOn?t.voiceOn:t.voiceOff}
            </button>
          </div>
        )}
      </header>

      {/* ═══ MAIN ═══ */}
      <main style={{maxWidth:1280,margin:'0 auto',padding:'36px 20px 80px',position:'relative',zIndex:1}}>

        {/* ─── SCAN ─── */}
        {activeTab==='scan'&&(
          <div className="fade-up">
            <div style={{textAlign:'center',marginBottom:36}}>
              <h2 style={{fontFamily:"'Baloo 2',sans-serif",fontSize:'clamp(1.6rem,5vw,2.5rem)',fontWeight:900,color:'#14532d',marginBottom:8}}>{t.tagline}</h2>
              <p style={{color:'#4b7a4b',fontSize:'1rem'}}>Upload a photo of your crop to detect diseases instantly</p>
            </div>
            <div style={{maxWidth:680,margin:'0 auto'}}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}}/>
              {!uploadedImage?(
                <div className="upload-zone" onClick={()=>fileRef.current?.click()}>
                  <div style={{fontSize:60,marginBottom:14}}>🌿</div>
                  <h3 style={{fontSize:'1.35rem',fontWeight:900,color:'#166534',marginBottom:8}}>{t.uploadImage}</h3>
                  <p style={{color:'#4b7a4b',marginBottom:22,fontSize:'.93rem'}}>{t.dropImage}</p>
                  <button className="btn btn-green" onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>
                    <Upload style={{width:17,height:17}}/>{t.uploadImage}
                  </button>
                  <p style={{marginTop:14,fontSize:'.75rem',color:'#86a886'}}>Supports JPG, PNG, WebP</p>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:18}}>
                  <div className="card" style={{overflow:'hidden',position:'relative'}}>
                    <img src={uploadedImage} alt="plant" style={{width:'100%',height:300,objectFit:'cover',display:'block'}}/>
                    {analyzing&&(
                      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.55)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14}}>
                        <div className="spinning"><Leaf style={{width:50,height:50,color:'#4ade80'}}/></div>
                        <p style={{color:'#fff',fontWeight:800,fontSize:'1.1rem'}}>{t.analyzing}</p>
                        <div style={{display:'flex',gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#4ade80',animation:'pulse 1.2s infinite',animationDelay:`${i*.3}s`}}/>)}</div>
                      </div>
                    )}
                  </div>
                  {scanError&&(
                    <div style={{background:'#fff1f2',border:'2px solid #fca5a5',borderRadius:16,padding:'16px 18px',display:'flex',gap:10,alignItems:'flex-start'}}>
                      <AlertCircle style={{width:20,height:20,color:'#dc2626',flexShrink:0,marginTop:2}}/>
                      <p style={{color:'#b91c1c',fontSize:'.9rem',fontWeight:700}}>{scanError}</p>
                    </div>
                  )}
                  {result&&!analyzing&&(
                    <div className={`fade-up ${result.status==='healthy'?'result-healthy':'result-diseased'}`}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:14}}>
                        <div>
                          <div style={{fontSize:34,marginBottom:4}}>{result.status==='healthy'?'✅':'⚠️'}</div>
                          <h4 style={{fontWeight:900,fontSize:'1.2rem',color:result.status==='healthy'?'#166534':'#991b1b'}}>
                            {result.status==='healthy'?t.healthy:t.diseased}
                          </h4>
                          {result.status!=='healthy'&&<p style={{fontWeight:800,fontSize:'1.05rem',color:'#dc2626',marginTop:4}}>{result.disease}</p>}
                        </div>
                        <div style={{background:'#fff',borderRadius:12,padding:'10px 16px',border:'1.5px solid var(--border)',textAlign:'center',minWidth:84}}>
                          <p style={{fontSize:'.68rem',color:'#6b7280',fontWeight:700,textTransform:'uppercase',letterSpacing:'.4px'}}>{t.confidence}</p>
                          <p style={{fontSize:'1.9rem',fontWeight:900,color:result.status==='healthy'?'#16a34a':'#dc2626'}}>{result.confidence}%</p>
                        </div>
                      </div>
                      <button className="btn btn-voice" style={{fontSize:'.8rem',padding:'7px 14px',marginBottom:14}}
                        onClick={()=>speak(pageSummary())}>
                        <Volume2 style={{width:14,height:14}}/> Read Result Aloud
                      </button>
                      {result.status!=='healthy'&&result.recommendations?.length>0&&(
                        <div>
                          <p style={{fontWeight:800,marginBottom:9,color:'#1a2e1a'}}>{t.recommendations}:</p>
                          <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:7}}>
                            {result.recommendations.map((rec,i)=>(
                              <li key={i} style={{display:'flex',alignItems:'flex-start',gap:9}}>
                                <ChevronRight style={{width:17,height:17,color:'#16a34a',flexShrink:0,marginTop:2}}/>
                                <span style={{color:'#374151',fontSize:'.9rem'}}>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <button className="btn btn-green" style={{width:'100%',justifyContent:'center',padding:14}}
                    onClick={()=>{setUploadedImage(null);setResult(null);setScanError(null);}}>
                    {t.scanAnother}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── WEATHER ─── */}
        {activeTab==='weather'&&(
          <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:22}}>
            {wxLoading&&<div style={{textAlign:'center',padding:'60px 0'}}><div style={{fontSize:52,marginBottom:14}}>🌤️</div><p style={{fontWeight:700,color:'#166534'}}>{t.loadingWeather}</p></div>}
            {wxError&&!wxLoading&&(
              <div style={{background:'#fff1f2',border:'2px solid #fca5a5',borderRadius:16,padding:20,textAlign:'center'}}>
                <p style={{fontWeight:800,color:'#dc2626',marginBottom:12}}>⚠️ {wxError}</p>
                <button className="btn btn-green" onClick={loadWeather}>{t.refresh}</button>
              </div>
            )}
            {weather&&!wxLoading&&cur&&(
              <>
                <div className="weather-hero" style={{padding:'30px 26px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14,marginBottom:6}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                        <MapPin style={{width:15,height:15,color:'#7dd3fc'}}/>
                        <span style={{fontSize:'.8rem',color:'#bae6fd',fontWeight:600}}>{t.location}</span>
                      </div>
                      <h2 style={{fontFamily:"'Baloo 2',sans-serif",fontSize:'clamp(1.4rem,4vw,2.1rem)',fontWeight:900,color:'#fff',marginBottom:4}}>{locName}</h2>
                      {wxUpdated&&<p style={{fontSize:'.74rem',color:'#93c5fd'}}>{t.updated} · {wxUpdated.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:64,lineHeight:1,marginBottom:3}}>{getWMO(cur.weather_code).i}</div>
                      <div style={{fontSize:'clamp(2rem,5vw,2.8rem)',fontWeight:900,color:'#fff'}}>{Math.round(cur.temperature_2m)}°C</div>
                      <div style={{color:'#bae6fd',fontWeight:600,fontSize:'.9rem'}}>{getWMO(cur.weather_code).l}</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{fontSize:'.78rem',padding:'6px 13px',marginBottom:18}}
                    onClick={()=>speak(pageSummary())}>
                    <Volume2 style={{width:13,height:13}}/> Read Weather Aloud
                  </button>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',gap:9}}>
                    {[
                      {icon:<Droplets style={{width:19,height:19,color:'#7dd3fc'}}/>,label:t.humidity,value:`${cur.relative_humidity_2m}%`},
                      {icon:<Wind style={{width:19,height:19,color:'#a5f3fc'}}/>,label:t.wind,value:`${Math.round(cur.wind_speed_10m)} km/h`},
                      {icon:<Thermometer style={{width:19,height:19,color:'#fda4af'}}/>,label:t.feelsLike,value:`${Math.round(cur.apparent_temperature)}°C`},
                      {icon:<Sun style={{width:19,height:19,color:'#fde68a'}}/>,label:t.uvIndex,value:cur.uv_index??'--'},
                      {icon:<Eye style={{width:19,height:19,color:'#c4b5fd'}}/>,label:t.visibility,value:`${Math.round((cur.visibility||10000)/1000)}km`},
                      {icon:<Gauge style={{width:19,height:19,color:'#6ee7b7'}}/>,label:t.pressure,value:`${Math.round(cur.surface_pressure)}hPa`},
                    ].map((s,i)=>(
                      <div key={i} className="stat-pill">
                        <div style={{marginBottom:5,display:'flex',justifyContent:'center'}}>{s.icon}</div>
                        <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.6)',marginBottom:2,fontWeight:600}}>{s.label}</div>
                        <div style={{fontSize:'.95rem',fontWeight:800,color:'#fff'}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {daily&&(
                  <div className="card" style={{padding:'18px 22px',display:'flex',gap:22,flexWrap:'wrap',alignItems:'center'}}>
                    {[{emoji:'🌅',label:t.sunrise,val:fmt(daily.sunrise?.[0]),color:'#92400e'},{emoji:'🌇',label:t.sunset,val:fmt(daily.sunset?.[0]),color:'#7c3aed'},
                      ...(daily.precipitation_probability_max?.[0]!=null?[{emoji:'🌧️',label:'Rain Chance',val:`${daily.precipitation_probability_max[0]}%`,color:'#0369a1'}]:[])
                    ].map((x,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:9}}>
                        <span style={{fontSize:26}}>{x.emoji}</span>
                        <div><p style={{fontSize:'.68rem',color:'#6b7280',fontWeight:600}}>{x.label}</p><p style={{fontWeight:800,fontSize:'1rem',color:x.color}}>{x.val}</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {daily&&(
                  <div className="card" style={{padding:24}}>
                    <h3 style={{fontFamily:"'Baloo 2',sans-serif",fontWeight:800,fontSize:'1.15rem',color:'#14532d',marginBottom:18,display:'flex',alignItems:'center',gap:9}}>
                      <Calendar style={{width:21,height:21,color:'#16a34a'}}/>{t.forecast}
                    </h3>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:7}}>
                      {daily.time?.map((date,i)=>{
                        const d=new Date(date); const nm=i===0?'Today':DAY_NAMES[d.getDay()]; const wmo=getWMO(daily.weather_code?.[i]);
                        return(
                          <div key={i} className="forecast-day">
                            <p style={{fontSize:'.68rem',fontWeight:800,color:'#166634',marginBottom:5}}>{nm}</p>
                            <div style={{fontSize:24,margin:'4px 0'}}>{wmo.i}</div>
                            <p style={{fontWeight:800,color:'#1a2e1a',fontSize:'.9rem'}}>{Math.round(daily.temperature_2m_max?.[i])}°</p>
                            <p style={{fontSize:'.68rem',color:'#6b7280'}}>{Math.round(daily.temperature_2m_min?.[i])}°</p>
                            {daily.precipitation_probability_max?.[i]>20&&<p style={{fontSize:'.62rem',color:'#0369a1',fontWeight:700,marginTop:2}}>💧{daily.precipitation_probability_max[i]}%</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{textAlign:'center'}}><button className="btn btn-blue" onClick={()=>{setWeather(null);loadWeather();}}><RefreshCw style={{width:15,height:15}}/>{t.refresh}</button></div>
              </>
            )}
          </div>
        )}

        {/* ─── NEWS ─── */}
        {activeTab==='news'&&(
          <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:22}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14}}>
              <div>
                <h2 style={{fontFamily:"'Baloo 2',sans-serif",fontSize:'clamp(1.3rem,4vw,1.9rem)',fontWeight:900,color:'#14532d',marginBottom:4,display:'flex',alignItems:'center',gap:9}}>
                  <Newspaper style={{width:24,height:24,color:'#16a34a'}}/>{t.newsTitle}
                </h2>
                <p style={{color:'#4b7a4b',fontSize:'.85rem',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',display:'inline-block',animation:'pulse 2s infinite'}}/>
                  {t.newsSubtitle}
                  {newsUpdated&&<span style={{color:'#9ca3af'}}> · {t.updated} {newsUpdated.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
                </p>
              </div>
              <div style={{display:'flex',gap:8}}>
                {news.length>0&&(
                  <button className="btn btn-voice" style={{fontSize:'.83rem',padding:'9px 15px'}} onClick={()=>speak(pageSummary())}>
                    <Volume2 style={{width:14,height:14}}/> Read Headlines
                  </button>
                )}
                <button className="btn btn-green" onClick={()=>{setNews([]);loadNews();}} disabled={newsLoading} style={{opacity:newsLoading?.6:1}}>
                  <RefreshCw style={{width:15,height:15,animation:newsLoading?'spin360 1s linear infinite':'none'}}/>{t.refresh}
                </button>
              </div>
            </div>

            {newsLoading&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:18}}>
                {Array(6).fill(0).map((_,i)=>(
                  <div key={i} className="card" style={{padding:22,display:'flex',flexDirection:'column',gap:12}}>
                    <div className="skeleton" style={{height:20,width:'40%'}}/><div className="skeleton" style={{height:22,width:'85%'}}/>
                    <div className="skeleton" style={{height:16,width:'100%'}}/><div className="skeleton" style={{height:16,width:'75%'}}/>
                  </div>
                ))}
              </div>
            )}
            {newsError&&!newsLoading&&(
              <div style={{background:'#fff1f2',border:'2px solid #fca5a5',borderRadius:16,padding:20,textAlign:'center'}}>
                <p style={{fontWeight:800,color:'#dc2626',marginBottom:12}}>⚠️ {newsError}</p>
                <button className="btn btn-green" onClick={loadNews}>{t.refresh}</button>
              </div>
            )}
            {news.length>0&&!newsLoading&&(
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {allTags.map(tag=>(
                  <button key={tag} className={`filter-chip${newsFilter===tag?' active':''}`} onClick={()=>setNewsFilter(tag)}>
                    {tag}{tag!=='All'&&<span style={{marginLeft:4,opacity:.7,fontSize:'.72rem'}}>({news.filter(n=>n.tag===tag).length})</span>}
                  </button>
                ))}
              </div>
            )}
            {visible.length>0&&!newsLoading&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:18}}>
                {visible.map((a,i)=>(
                  <div key={i} className="news-card" style={{animationDelay:`${i*.04}s`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'.72rem',fontWeight:800,padding:'3px 11px',borderRadius:30,background:a.bg,color:a.color}}>{a.tag}</span>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <button style={{background:'none',border:'none',cursor:'pointer',color:'#a855f7',padding:2,display:'flex'}}
                          onClick={()=>speak(a.title+'. '+a.description)} title="Read aloud">
                          <Volume2 style={{width:13,height:13}}/>
                        </button>
                        <span style={{fontSize:'.72rem',color:'#9ca3af',fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
                          <Clock style={{width:11,height:11}}/>{timeAgo(a.pubDate,t)}
                        </span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                      <span style={{fontSize:26,flexShrink:0,marginTop:2}}>{a.emoji}</span>
                      <a href={a.link} target="_blank" rel="noopener noreferrer">
                        <h3 style={{fontWeight:800,fontSize:'.98rem',color:'#1a2e1a',lineHeight:1.45,cursor:'pointer',transition:'color .2s'}}
                          onMouseEnter={e=>e.target.style.color='#16a34a'} onMouseLeave={e=>e.target.style.color='#1a2e1a'}>
                          {a.title}
                        </h3>
                      </a>
                    </div>
                    {a.description&&<p style={{fontSize:'.84rem',color:'#4b5563',lineHeight:1.6,flex:1}}>{a.description}…</p>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:6,borderTop:'1px solid #f0fdf4',marginTop:'auto'}}>
                      <span style={{fontSize:'.72rem',color:'#9ca3af',fontWeight:600}}>{a.sourceName}</span>
                      <a href={a.link} target="_blank" rel="noopener noreferrer"
                        style={{display:'flex',alignItems:'center',gap:4,fontSize:'.78rem',fontWeight:800,color:'#16a34a',textDecoration:'none'}}>
                        {t.readMore}<ExternalLink style={{width:12,height:12}}/>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!newsLoading&&!newsError&&visible.length===0&&news.length>0&&(
              <div style={{textAlign:'center',padding:'40px 0',color:'#6b7280'}}>
                <div style={{fontSize:44,marginBottom:10}}>🔍</div>
                <p style={{fontWeight:700}}>No articles in this category yet.</p>
                <button className="btn btn-green" style={{marginTop:14}} onClick={()=>setNewsFilter('All')}>Show All</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{background:'linear-gradient(135deg,#14532d,#166534)',color:'#fff',padding:'26px 20px',textAlign:'center',position:'relative',zIndex:1}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:5}}>
          <Leaf style={{width:19,height:19,color:'#86efac'}}/>
          <span style={{fontFamily:"'Baloo 2',sans-serif",fontWeight:900,fontSize:'1.1rem'}}>{t.appTitle}</span>
        </div>
        <p style={{color:'#86efac',fontSize:'.82rem',marginBottom:4}}>{t.tagline}</p>
        <p style={{color:'rgba(255,255,255,.4)',fontSize:'.72rem'}}>
         
        </p>
      </footer>

      {/* ═══ FLOATING VOICE ASSISTANT ═══ */}
      <div className="vwidget">
        {voiceOn&&(
          <div className="vpanel">
            <p style={{fontSize:'.8rem',fontWeight:900,color:'#1a2e1a',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              🎙️ Voice Assistant
              <span style={{fontSize:'.68rem',background:'#f3e8ff',color:'#7c3aed',padding:'2px 8px',borderRadius:20,fontWeight:700}}>
                {langInfo.nativeName}
              </span>
            </p>

            {/* Waveform when speaking */}
            {speaking&&(
              <div style={{display:'flex',alignItems:'center',gap:3,marginBottom:10,height:26}}>
                {[0,1,2,3,4,5].map(i=>(
                  <span key={i} className="wbar" style={{animationDelay:`${i*0.1}s`,height:16+Math.random()*8}}/>
                ))}
                <span style={{fontSize:'.71rem',color:'#7c3aed',fontWeight:700,marginLeft:8}}>Speaking…</span>
              </div>
            )}

            {/* Listening pulse */}
            {listening&&(
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'#f59e0b',animation:'pulse .5s infinite'}}/>
                <span style={{fontSize:'.72rem',color:'#d97706',fontWeight:700}}>{t.listenHint}</span>
              </div>
            )}

            <div style={{display:'flex',gap:7}}>
              <button style={{flex:1,padding:'8px 10px',borderRadius:10,border:'1.5px solid #e9d5ff',background:speaking?'#f5f3ff':'#fff',color:'#7c3aed',fontFamily:'inherit',fontWeight:800,fontSize:'.75rem',cursor:'pointer',display:'flex',alignItems:'center',gap:5,justifyContent:'center',transition:'all .2s'}}
                onClick={()=>speaking?stopSpeak():speak(pageSummary())}>
                {speaking?<><VolumeX style={{width:12,height:12}}/>Stop</>:<><Volume2 style={{width:12,height:12}}/>Read Page</>}
              </button>
              <button style={{flex:1,padding:'8px 10px',borderRadius:10,border:'1.5px solid #fde68a',background:listening?'#fffbeb':'#fff',color:listening?'#d97706':'#92400e',fontFamily:'inherit',fontWeight:800,fontSize:'.75rem',cursor:'pointer',display:'flex',alignItems:'center',gap:5,justifyContent:'center',transition:'all .2s'}}
                onClick={()=>listening?stopListening():startListening()}>
                {listening?<><MicOff style={{width:12,height:12}}/>Stop</>:<><Mic style={{width:12,height:12}}/>Command</>}
              </button>
            </div>
            <p style={{fontSize:'.65rem',color:'#9ca3af',marginTop:8,lineHeight:1.5}}>
              💬 Say "scan", "weather", or "news" to navigate
            </p>
          </div>
        )}

        {/* Orb button */}
        <button
          className={`vorb ${!voiceOn?'vorb-off':speaking?'vorb-speak':listening?'vorb-listen':'vorb-idle'}`}
          onClick={()=>{
            if(!voiceOn){
              setVoiceOn(true);
              setTimeout(()=>speakText(`${BASE_STRINGS.appTitle} voice assistant is ready. Say scan, weather, or news.`, langInfo.bcp47, ()=>setSpeaking(false)),300);
              setSpeaking(true);
            } else if(speaking){ stopSpeak(); }
            else { startListening(); }
          }}
          title={!voiceOn?'Enable Voice':speaking?'Stop':'Say a command'}
        >
          {!voiceOn   && <VolumeX style={{width:22,height:22,color:'#fff'}}/>}
          {voiceOn && !speaking && !listening && <Mic style={{width:22,height:22,color:'#fff'}}/>}
          {voiceOn && speaking  && <Volume2 style={{width:22,height:22,color:'#fff'}}/>}
          {voiceOn && listening && <Mic style={{width:22,height:22,color:'#fff',animation:'pulse .6s infinite'}}/>}
        </button>
      </div>
    </div>
  );
}
