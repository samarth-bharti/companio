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

const STEPS = ['About', 'Services', 'Verify', 'Preview'];

interface WizardData {
  name: string;
  city: string;
  /**
   * Pre-filled from the account — they told us at registration, so we do not ask
   * twice — but editable, because this is the gender members will match against.
   */
  gender: GenderId | '';
  bio: string;
  activities: string[];
  rate: number;
  photoFile: File | null;
  idFile: File | null;
  backgroundConsent: boolean;
  platonicAck: boolean;
  // Document-validation fields (step 2)
  idDocType:   IdDocType | null;
  idDocNumber: string;
  ocrMatched:  boolean | null;
}

const INIT: WizardData = {
  name: '', city: '', gender: '', bio: '',
  activities: [], rate: 499,
  photoFile: null, idFile: null,
  backgroundConsent: false, platonicAck: false,
  idDocType: null, idDocNumber: '', ocrMatched: null,
};

export function ApplyWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(INIT);
  const [accountName, setAccountName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const reduced = useEffectiveReducedMotion();

  useEffect(() => {
    // Also from the server: an application submitted on another device (or in
    // this one, before localStorage was cleared) must still read as submitted.
    void dataClient
      .getApplication()
      .then((app) => {
        if (app?.status === 'submitted') setSubmitted(true);
      })
      .catch(() => {});

    // Pre-fill from the account just created during registration — this is one
    // continuous onboarding, so we never ask for name/city twice.
    //
    // Read from the SERVER, not localStorage: the real sign-in never writes that
    // key, so this prefill was silently empty for every account created by the
    // actual register wizard.
    let cancelled = false;
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
      // Without this a companion cannot be matched by members who ask to meet
      // someone of their own gender — which is the filter most likely to be on.
      if (!data.gender) errs.push('Please select your gender identity.');
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
  };

  const goBack = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
    setErrors([]);
  };

  const handleSubmit = async () => {
    // Through dataClient, so the application reaches the SERVER.
    //
    // This called `saveApplication` from lib/appState directly — localStorage,
    // and only localStorage. In http mode the application was never posted:
    // no CompanionApplication row was created, so no admin ever saw it, no
    // application could be approved, and therefore no companion could ever own a
    // profile or sign in to a dashboard. It also made the document upload below
    // fail, because that route updates a row that did not exist.
    //
    // Awaited before the upload for that reason: the row must exist first.
    await dataClient.saveApplication({
      name: data.name,
      city: data.city,
      gender: data.gender || undefined,
      activities: data.activities,
      // RUPEES → PAISE. The slider is in rupees (it renders "₹499"); the column
      // is paise, and approval copies it straight into Companion.hourlyRate,
      // which is paise. So a companion who asked for ₹499 was stored as ₹4.99,
      // shown to the admin as "₹5/mtg", and given an hourly rate so far below
      // the legal floor that the booking quote clamped it back up to ₹300.
      rate: data.rate * 100,
      bio: data.bio,
      idUploaded: !!data.idFile,
      backgroundConsent: data.backgroundConsent,
      status: 'submitted',
    });

    // In http mode, ship the files to the upload route.
    // In demo/local mode this block never runs — saveApplication above is enough.
    const isHttp = process.env.NEXT_PUBLIC_DATA_CLIENT === 'http';
    if (isHttp && data.photoFile && data.idFile && data.idDocType && data.idDocNumber) {
      try {
        const fd = new FormData();
        fd.append('photo', data.photoFile);
        fd.append('id', data.idFile);
        fd.append('idDocType', data.idDocType);
        fd.append('idDocNumber', data.idDocNumber);
        if (data.ocrMatched !== null) fd.append('ocrMatched', String(data.ocrMatched));
        // Non-fatal: if the upload fails the application is already saved;
        // admin can manually review or the user can retry later.
        await fetch('/api/application/upload', { method: 'POST', body: fd });
      } catch {
        // Upload errors are non-fatal in degraded / first-run mode.
      }
    }

    // Through dataClient, so the notification lands in the account and the
    // dashboard bell shows it. Written straight to localStorage, it existed
    // only in the tab that submitted the form.
    await dataClient.addNotification({
      title: 'Application submitted',
      body: 'Your companion application is under review. Usually 2-3 days.',
    }).catch(() => {});
    setSubmitted(true);
  };

  if (submitted) return <WizardSuccess name={data.name} />;

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
          {step === 3 && <WizardStepPreview data={data} onSubmit={handleSubmit} />}
        </motion.div>
      </AnimatePresence>

      {errors.length > 0 && (
        <ul role="alert" aria-live="polite" className="mt-4 space-y-1">
          {errors.map((e) => (
            <li key={e} className="font-sans text-sm" style={{ color: '#C7161A' }}>
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
