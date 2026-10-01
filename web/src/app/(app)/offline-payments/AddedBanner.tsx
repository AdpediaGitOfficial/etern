'use client';

import { useSearchParams } from 'next/navigation';
import { Notice } from '@/components/ui';

export default function AddedBanner() {
  return useSearchParams().get('added') ? <Notice tone="good">Offline payment added. The student’s subscription is now active.</Notice> : null;
}
