'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { SegmentedPill } from '@/components/journey/SegmentedPill';
import { Button } from '@/components/ui/Button';
import { dataClient } from '@/lib/dataClient';
import type { GenderId } from '@/lib/journeyState';
import { validateIdNumber, type IdDocType } from '@/lib/idFormat';
import { WizardStepAbout } from './WizardStepAbout';
import { WizardStepServices } from './WizardStepServices';
import { WizardStepVerify } from './WizardStepVerify';
import { WizardStepPreview } from './WizardStepPreview';
import { WizardSuccess } from './WizardSuccess';
import { payWithRazorpay } from '@/lib/razorpayClient';

const STEPS = ['About', 'Services', 'Verify', 'Preview'];

interface WizardData {
  name: string;
  city: string;
  gender: GenderId | '';
  dateOfBirth?: string;
  bio: string;
  activities: string[];
  rate: number;
  photoFile: File | null;
  photoUrl?: string;
  idFile: File | null;
  idPhotoUrl?: string;
  backgroundConsent: boolean;
  platonicAck: boolean;
  // Document-validation fields (step 2)
  idDocType:   IdDocType | null;
  idDocNumber: string;
  ocrMatched:  boolean | null;
}

const INIT: WizardData = {
  name: '', city: '', gender: '', dateOfBirth: '', bio: '',
  activities: [], rate: 499,
  photoFile: null, photoUrl: '', idFile: null, idPhotoUrl: '',
  backgroundConsent: false, platonicAck: false,
  idDocType: null, idDocNumber: '', ocrMatched: null,
};

export function ApplyWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(INIT);
  const [accountName, setAccountName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const reduced = useEffectiveReducedMotion();

  useEffect(() => {
    let cancelled = false;

    // Load unlocked subscription status
    void dataClient
      .getUnlocked()
      .then((u) => {
        if (!cancelled) setIsUnlocked(!!u);
      })
      .catch(() => {});

    // Load pre-existing draft or submitted application
    void dataClient
      .getApplication()
      .then((app) => {
        if (cancelled || !app) return;
        if (app.status === 'submitted') {
          setSubmitted(true);
        }
        // Pre-fill saved draft details so progress is never lost on refresh or login
        setData((d) => ({
          ...d,
          name: d.name || app.name || '',
          city: d.city || app.city || '',
          gender: d.gender || (app.gender as GenderId) || '',
          bio: d.bio || app.bio || '',
          activities: app.activities && app.activities.length ? app.activities : d.activities,
          rate: app.rate ? Math.round(app.rate / 100) : d.rate,
        }));
      })
      .catch(() => {});

    // Pre-fill from the account just created during registration
    dataClient
      .getUser()
      .then((user) => {
        if (cancelled || !user) return;
        setAccountName(user.firstName);
        setData((d) => ({
          ...d,
          name: d.name || user.firstName,
          city: d.city || user.city || '',
          gender: d.gender || (user.gender ?? ''),
          dateOfBirth: d.dateOfBirth || user.dateOfBirth || '',
        }));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const validate = (): boolean => {
    const errs: string[] = [];
    if (step === 0) {
      if (!data.name.trim()) errs.push('Name is required.');
      if (!data.city) errs.push('Please select your city.');
      if (!data.gender) errs.push('Please select your gender identity.');
      if (data.dateOfBirth) {
        const dob = new Date(data.dateOfBirth);
        const age = new Date().getFullYear() - dob.getFullYear();
        if (Number.isNaN(dob.getTime()) || age < 18) {
          errs.push('Companions must be 18 years of age or older.');
        }
      }
    } else if (step === 1) {
      if (!data.activities.length) errs.push('Select at least one activity.');
    } else if (step === 2) {
      if (!data.photoFile) errs.push('Profile photo required.');
      if (!data.idFile) errs.push('Government ID required.');
      if (!data.idDocType) errs.push('Please select an ID type (Aadhaar or PAN).');
      else if (!validateIdNumber(data.idDocType, data.idDocNumber))
        errs.push('Enter a valid ID number before continuing.');
      if (!data.backgroundConsent) errs.push('Background check consent required.');
      if (!data.platonicAck) errs.push('Please acknowledge the platonic standard.');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const goNext = () => {
    if (!validate()) return;
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setErrors([]);

    // Save draft asynchronously so progress is preserved if page reloads
    void dataClient.saveApplication({
      name: data.name,
      city: data.city,
      gender: data.gender || undefined,
      activities: data.activities,
      rate: data.rate * 100,
      bio: data.bio,
      idUploaded: !!data.idFile,
      backgroundConsent: data.backgroundConsent,
      status: 'draft',
    }).catch(() => {});
  };

  const goBack = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
    setErrors([]);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrors([]);

    try {
      // 1. Ensure user profile has dateOfBirth set if provided
      if (data.dateOfBirth) {
        const u = await dataClient.getUser();
        if (u) {
          await dataClient.setUser({ ...u, dateOfBirth: data.dateOfBirth }).catch(() => {});
        }
      }

      // 2. Activate ₹199 platform subscription unlock for companion if not already unlocked
      if (!isUnlocked) {
        const payRes = await payWithRazorpay({
          kind: 'unlock',
          passTier: 'pass1m',
        });

        if (payRes === 'dismissed') {
          setSubmitting(false);
          return;
        }

        if (payRes === 'auth_required') {
          setErrors(['Session expired. Please sign in again to submit your application.']);
          setSubmitting(false);
          return;
        }

        if (payRes !== 'success') {
          if (payRes === 'unconfigured') {
            await dataClient.setUnlocked(true).catch(() => {});
          } else {
            setErrors(['Payment was not completed. Please try again to activate your companion profile.']);
            setSubmitting(false);
            return;
          }
        }
        setIsUnlocked(true);
      }

      // 3. Save application to server/storage
      await dataClient.saveApplication({
        name: data.name,
        city: data.city,
        gender: data.gender || undefined,
        activities: data.activities,
        rate: data.rate * 100,
        bio: data.bio,
        idUploaded: !!data.idFile,
        backgroundConsent: data.backgroundConsent,
        photoUrl: data.photoUrl,
        idPhotoUrl: data.idPhotoUrl,
        status: 'submitted',
      });

      // 3. Upload ID documents if in http mode
      const isHttp = process.env.NEXT_PUBLIC_DATA_CLIENT === 'http';
      if (isHttp && data.photoFile && data.idFile && data.idDocType && data.idDocNumber) {
        try {
          const fd = new FormData();
          fd.append('photo', data.photoFile);
          fd.append('id', data.idFile);
          fd.append('idDocType', data.idDocType);
          fd.append('idDocNumber', data.idDocNumber);
          if (data.ocrMatched !== null) fd.append('ocrMatched', String(data.ocrMatched));
          await fetch('/api/application/upload', { method: 'POST', body: fd });
        } catch (uploadErr) {
          console.warn('Upload warning:', uploadErr);
        }
      }

      // 4. Add notification for user
      await dataClient.addNotification({
        title: 'Application submitted',
        body: 'Your companion application is under review. Usually 2-3 days.',
      }).catch(() => {});

      setSubmitted(true);
    } catch (err: unknown) {
      console.error('Submit application error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('403') || errMsg.includes('age_verification_required')) {
        setErrors(['Age verification required: Confirm you are 18 or older in Step 1.']);
      } else if (errMsg.includes('401')) {
        setErrors(['Session expired. Please sign in again to submit your application.']);
      } else {
        setErrors(['Submission failed. Please check your connection and try again.']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <WizardSuccess name={data.name || accountName} />;

  const variants = {
    enter: (d: number) => ({ x: reduced ? 0 : d * 32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: reduced ? 0 : d * -32, opacity: 0 }),
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8 flex justify-center">
        <SegmentedPill steps={STEPS} current={step} />
      </div>

      {accountName && step === 0 && (
        <p
          className="mb-6 text-center font-sans text-sm rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(31,174,107,0.08)',
            border: '1.5px solid rgba(31,174,107,0.22)',
            color: '#157A4A',
          }}
        >
          Signed in as <strong>{accountName}</strong>, just finish your companion
          profile and verification below. No need to re-enter your details.
        </p>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: reduced ? 0 : 0.22 }}
        >
          {step === 0 && <WizardStepAbout data={data} onChange={update} />}
          {step === 1 && <WizardStepServices data={data} onChange={update} />}
          {step === 2 && <WizardStepVerify data={data} onChange={update} />}
          {step === 3 && (
            <WizardStepPreview
              data={data}
              isUnlocked={isUnlocked}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {errors.length > 0 && (
        <ul role="alert" aria-live="polite" className="mt-4 space-y-1">
          {errors.map((e, i) => (
            <li key={`${e}-${i}`} className="font-sans text-sm font-semibold" style={{ color: '#C7161A' }}>
              {e}
            </li>
          ))}
        </ul>
      )}

      {step < STEPS.length - 1 && (
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={goBack} size="md">
              ← Back
            </Button>
          ) : (
            <span />
          )}
          <Button variant="cta" size="lg" onClick={goNext}>
            {step === STEPS.length - 2 ? 'Preview →' : 'Continue →'}
          </Button>
        </div>
      )}
    </div>
  );
}
