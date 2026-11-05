import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, CheckCircle2, Copy, Loader2, Smartphone } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { NAYAPAY_NAME, NAYAPAY_NUMBER, PRICE_LABEL } from '@/lib/constants';
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/lib/ui';

interface PaymentPageProps {
  onApproved: () => void;
  onBack: () => void;
}

const steps = [
  'NayaPay app kholo.',
  `Is number pe ${PRICE_LABEL} bhejo.`,
  'Payment ke baad jo Transaction ID (TID) mile, wo neeche likho.',
];

const DUPLICATE_TID_CODE = '23505';

export default function PaymentPage({ onApproved, onBack }: PaymentPageProps) {
  const [tid, setTid] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!approved) return;
    const timer = setTimeout(onApproved, 1200);
    return () => clearTimeout(timer);
  }, [approved, onApproved]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(NAYAPAY_NUMBER);
      setCopied(true);
    } catch {
      setError('Number copy nahi ho paya. Ise haath se likh lo.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTid = tid.trim();

    if (cleanTid.length < 4) {
      setError('Pehle sahi NayaPay Transaction ID likho.');
      return;
    }

    setSubmitting(true);
    setError(null);

    let insertError: { code?: string } | null = null;
    try {
      const res = await getSupabase()
        .from('payment_requests')
        .insert({ tid: cleanTid, whatsapp: whatsapp.trim() });
      insertError = res.error;
    } catch {
      insertError = { code: undefined };
    }

    setSubmitting(false);

    if (insertError) {
      setError(
        insertError.code === DUPLICATE_TID_CODE
          ? 'Ye Transaction ID pehle se use ho chuka hai. Sahi TID likho.'
          : 'Payment abhi verify nahi ho paya. Thodi der baad dobara try karo.',
      );
      return;
    }

    setApproved(true);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <section className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            NayaPay Payment
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
            Ek payment, unlimited fun
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-neutral-700">
            Payment karne ke baad TID dalo. Verify hote hi tumhara cartoon banane wala page khul jayega.
          </p>

          <ol className="mt-8 space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="pt-1 leading-relaxed text-neutral-800">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${cardClass} animate-pop-in`}>
          <div className="rounded-2xl border-2 border-dashed border-secondary-300 bg-secondary-50 p-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary-900">{NAYAPAY_NAME}</p>
            <p className="mt-1 text-sm text-neutral-700">NayaPay Number</p>
            <p className="mt-1 font-display text-3xl font-bold tracking-wide text-secondary-900">{NAYAPAY_NUMBER}</p>
            <button
              type="button"
              onClick={copyNumber}
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-secondary-700 transition hover:bg-secondary-100"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copy ho gaya' : 'Number copy karo'}
            </button>
          </div>

          {approved ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-success-50 p-6 text-center animate-pop-in">
              <CheckCircle2 className="h-12 w-12 text-success-500" aria-hidden="true" />
              <p className="font-display text-xl font-semibold text-success-900">Payment mil gayi! Auto approved</p>
              <p className="text-sm text-success-900">Cartoon page khul raha hai...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="tid" className="mb-1.5 block text-sm font-semibold text-neutral-800">
                  Transaction ID (TID)
                </label>
                <input
                  id="tid"
                  type="text"
                  value={tid}
                  onChange={(event) => setTid(event.target.value)}
                  placeholder="Apna NayaPay Transaction ID likho"
                  maxLength={100}
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-semibold text-neutral-800">
                  WhatsApp Number <span className="font-normal text-neutral-500">(optional)</span>
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="Apna WhatsApp Number"
                  maxLength={30}
                  className={inputClass}
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm font-semibold text-error-700">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className={primaryButtonClass}>
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Verify ho raha hai...
                  </>
                ) : (
                  'Verify & Unlock'
                )}
              </button>
              <button type="button" onClick={onBack} className={`${secondaryButtonClass} w-full`}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Wapis Jao
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
