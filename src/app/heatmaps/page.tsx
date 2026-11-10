import DashboardClient from '@/components/DashboardClient';
import { Suspense } from 'react';

export default function HeatmapsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--canvas-bg)]" />}>
      <DashboardClient view="heatmaps" />
    </Suspense>
  );
}
