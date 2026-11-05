import { useState } from 'react';
import { CheckCircle2, Crown, Loader2, Play, RotateCcw, Sparkles, Video } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { CARTOON_DURATIONS, CARTOON_STYLES } from '@/lib/constants';
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/lib/ui';
import type { Access } from '@/lib/types';

interface CartoonPageProps {
  access: Exclude<Access, 'guest'>;
}

interface CartoonResult {
  story: string;
  style: string;
  duration: string;
  videoUrl: string;
  demo: boolean;
}

const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const DURATION_DELAY_MS: Record<string, number> = {
  '15 Second Video': 3000,
  '30 Second Video': 4000,
  '1 Minute Video': 5000,
  '2 Minute Video': 7000,
  '5 Minute Video': 9000,
  '10 Minute Video': 12000,
};

export default function CartoonPage({ access }: CartoonPageProps) {
  const [story, setStory] = useState('');
  const [style, setStyle] = useState<string>(CARTOON_STYLES[0]);
  const [duration, setDuration] = useState<string>(CARTOON_DURATIONS[0]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CartoonResult | null>(null);

  const isAdmin = access === 'admin';

  const handleGenerate = async () => {
    const cleanStory = story.trim();
    if (cleanStory === '') {
      setError('Pehle kahani to likho!');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const request = { story: cleanStory, style, duration };

    // Try to persist to Supabase, but don't block the demo on failure.
    let dbSaved = false;
    try {
      const res = await getSupabase().from('cartoon_requests').insert(request);
      dbSaved = !res.error;
    } catch {
      dbSaved = false;
    }

    const delay = DURATION_DELAY_MS[duration] ?? 5000;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(95, Math.round((elapsed / delay) * 100));
      setProgress(pct);
    }, 200);

    await new Promise((resolve) => setTimeout(resolve, delay));
    clearInterval(interval);
    setProgress(100);

    setResult({
      ...request,
      videoUrl: DEMO_VIDEO_URL,
      demo: !dbSaved,
    });
    setGenerating(false);
  };

  const resetForm = () => {
    setStory('');
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <div className="animate-fade-up">
        {isAdmin ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1.5 text-sm font-semibold text-warning-900">
            <Crown className="h-4 w-4" aria-hidden="true" />
            Welcome Admin! Tum FREE cartoon bana sakte ho.
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-success-100 px-3 py-1.5 text-sm font-semibold text-success-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Welcome! Payment approved.
          </span>
        )}
        <h1 className="mt-5 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">Apna cartoon banao</h1>
        <p className="mt-2 text-lg text-neutral-700">Kahani likho, style aur length chuno, aur request bhej do.</p>
      </div>

      <section className={`${cardClass} mt-8 animate-fade-up`}>
        <div className="space-y-5">
          <div>
            <label htmlFor="story" className="mb-1.5 block text-sm font-semibold text-neutral-800">
              Kahani
            </label>
            <textarea
              id="story"
              rows={4}
              value={story}
              onChange={(event) => setStory(event.target.value)}
              maxLength={2000}
              placeholder="Kahani likho... Jaise: Ek bacha biryani kha ke superhero ban jata hai"
              className={`${inputClass} resize-y leading-relaxed`}
            />
            <p className="mt-1.5 text-right text-xs text-neutral-500">{story.length}/2000</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="style" className="mb-1.5 block text-sm font-semibold text-neutral-800">
                Style
              </label>
              <select id="style" value={style} onChange={(event) => setStyle(event.target.value)} className={inputClass}>
                {CARTOON_STYLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="mb-1.5 block text-sm font-semibold text-neutral-800">
                Video ki length
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className={inputClass}
              >
                {CARTOON_DURATIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm font-semibold text-error-700">
              {error}
            </p>
          )}

          {generating && (
            <div className="rounded-2xl bg-primary-50 p-5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />
                <span className="text-sm font-semibold text-primary-800">
                  Tera cartoon ban raha hai... {progress}%
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-primary-100">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button type="button" onClick={handleGenerate} disabled={generating} className={primaryButtonClass}>
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Tera cartoon ban raha hai...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Generate Cartoon Video
              </>
            )}
          </button>
        </div>
      </section>

      {result && (
        <section className={`${cardClass} mt-6 animate-pop-in`} aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-100 text-success-700">
              <Video className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-semibold text-neutral-900">Tera cartoon ready hai!</h2>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl bg-neutral-900">
            <video
              src={result.videoUrl}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full"
              poster="https://images.pexels.com/photos/5847518/pexels-photo-5847518.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            >
              <track kind="captions" />
            </video>
          </div>

          {result.demo && (
            <p className="mt-4 rounded-xl bg-accent-100 px-4 py-3 text-sm font-semibold text-warning-900">
              <Play className="mr-1 inline h-4 w-4" aria-hidden="true" />
              Demo mode: Ye sample cartoon video hai. Full AI generation jald live hoga.
            </p>
          )}

          <dl className="mt-5 space-y-3 text-neutral-800">
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Kahani</dt>
              <dd className="leading-relaxed">{result.story}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Style</dt>
              <dd>{result.style}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Length</dt>
              <dd>{result.duration}</dd>
            </div>
          </dl>
          <button type="button" onClick={resetForm} className={`${secondaryButtonClass} mt-6 w-full`}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Nayi kahani likho
          </button>
        </section>
      )}
    </main>
  );
}
