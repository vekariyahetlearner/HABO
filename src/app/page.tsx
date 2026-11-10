import { Suspense } from 'react';
import DashboardClient from '@/components/DashboardClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-mono font-bold text-sm">
          <div className="neo-card p-6 bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
            ⚡ Loading HeatMaps Matrix...
          </div>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
