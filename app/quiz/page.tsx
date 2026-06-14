import type { Metadata } from 'next';
import { QuizClient } from '@/components/quiz/QuizClient';

export const metadata: Metadata = {
  title: 'Find your companions, Companio',
  description:
    'Answer 7 quick questions and we\'ll find the best companions for you in your city.',
};

/**
 * Quiz page — thin server wrapper; all interactive logic lives in QuizClient.
 * Linked from Nav, the hero secondary CTA, and /explore.
 */
export default function QuizPage() {
  return <QuizClient />;
}
