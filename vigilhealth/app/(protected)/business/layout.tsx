'use client';

import { useEffect, useState } from 'react';

import { BusinessNav } from '@/components/layout/BusinessNav';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const [orgName, setOrgName] = useState<string | undefined>();

  useEffect(() => {
    fetch('/api/business/dashboard')
      .then(r => r.json())
      .then((d: { org?: { name: string } }) => {
        if (d.org?.name) setOrgName(d.org.name);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <BusinessNav orgName={orgName} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </div>
    </div>
  );
}
