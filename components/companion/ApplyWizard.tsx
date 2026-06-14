'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SegmentedPill } from '@/components/journey/SegmentedPill';
import { Button } from '@/components/ui/Button';
import { getApplication, saveApplication, addNotification } from '@/lib/appState';
import { WizardStepAbout } from './WizardStepAbout';
import { WizardStepServices } from './WizardStepServices';
import { WizardStepVerify } from './WizardStepVerify';
import { WizardStepPreview } from './WizardStepPreview';
import { WizardSuccess } from './WizardSuccess';

const STEPS = ['About', 'Services', 'Verify', 'Preview'];

interface WizardData {
  name: string;
  city: string;
  bio: string;
  activities: string[];
  rate: number;
  photoFile: File | null;
  idFile: File | null;
  backgroundConsent: boolean;
  platonicAck: boolean;
}

const INIT: WizardData = {
  name: '', city: '', bio: '',
  activities: [], rate: 499,
  photoFile: null, idFile: null,
  backgroundConsent: false, platonicAck: false,
};

export function ApplyWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<WizardData>(INIT);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const app = getApplication();
    if (app?.status === 'submitted') setSubmitted(true);
  }, []);

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const validate = (): boolean => {
    const errs: string[] = [];
    if (step === 0) {
      if (!data.name.trim()) errs.push('Name is required.');
      if (!data.city) errs.push('Please select your city.');
    } else if (step === 1) {
      if (!data.activities.length) errs.push('Select at least one activity.');
    } else if (step === 2) {
      if (!data.photoFile) errs.push('Profile photo required.');
      if (!data.idFile) errs.push('Government ID required.');
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

  const handleSubmit = () => {
    saveApplication({
      name: data.name,
      city: data.city,
      activities: data.activities,
      rate: data.rate,
      bio: data.bio,
      idUploaded: !!data.idFile,
      backgroundConsent: data.backgroundConsent,
      status: 'submitted',
    });
    addNotification({
      title: 'Application submitted',
      body: 'Your companion application is under review. Usually 2-3 days.',
    });
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
