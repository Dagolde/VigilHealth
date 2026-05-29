'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface OrgData {
  id: string;
  name: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
}

interface WellnessSummary {
  totalReports: number;
  recentReports: number;
  absentToday: number;
  topSymptoms: string[];
}

export default function BusinessDashboardPage() {
  const [org, setOrg] = useState<OrgData | null>(null);
  const [wellness, setWellness] = useState<WellnessSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [noOrg, setNoOrg] = useState(false);

  useEffect(() => {
    fetch('/api/business/dashboard')
      .then(res => res.json())
      .then((data: { noOrg?: boolean; org?: OrgData; wellness?: WellnessSummary; error?: string }) => {
        if (data.noOrg || data.error) {
          setNoOrg(true);
        } else {
          setOrg(data.org ?? null);
          setWellness(data.wellness ?? null);
        }
        setLoading(false);
      })
      .catch(() => { setNoOrg(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (noOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Business Account Found</h1>
          <p className="text-gray-600 mb-6">You haven&apos;t set up a business account yet.</p>
          <Link href="/business/onboarding"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
            Set Up Business Account →
          </Link>
        </div>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    basic: 'bg-blue-100 text-blue-700',
    premium: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{org?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tierColors[org?.subscription_tier ?? 'free']}`}>
                {org?.subscription_tier ?? 'free'} plan
              </span>
              {org?.subscription_expires_at && (
                <span className="text-xs text-gray-500">
                  Expires {new Date(org.subscription_expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/business/subscription"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Manage Plan
            </Link>
            <Link href="/for-business"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Upgrade
            </Link>
          </div>
        </div>

        {/* Wellness Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Reports (7 days)', value: wellness?.totalReports ?? 0, icon: '📋', color: 'border-blue-200' },
            { label: 'Reports Today', value: wellness?.recentReports ?? 0, icon: '📅', color: 'border-green-200' },
            { label: 'Absent Today', value: wellness?.absentToday ?? 0, icon: '🏠', color: 'border-orange-200' },
            { label: 'Symptoms Tracked', value: wellness?.topSymptoms.length ?? 0, icon: '🩺', color: 'border-purple-200' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl bg-white border ${stat.color} p-4 shadow-sm`}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Top Symptoms */}
        {(wellness?.topSymptoms.length ?? 0) > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Top Reported Symptoms (7 days)</h2>
            <div className="flex flex-wrap gap-2">
              {wellness?.topSymptoms.map((s) => (
                <span key={s} className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-sm text-red-700 capitalize">
                  {s.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: '/business/staff',
                icon: '👥',
                title: 'Staff Management',
                description: 'Invite team members, manage roles, and control access to your organization.',
                color: 'border-blue-200 hover:border-blue-400',
                iconBg: 'bg-blue-50',
              },
              {
                href: '/business/safe-badge',
                icon: '🛡️',
                title: 'Safe Badge',
                description: 'Apply for the VigilHealth Safe Badge to certify your health and safety protocols.',
                color: 'border-emerald-200 hover:border-emerald-400',
                iconBg: 'bg-emerald-50',
              },
              {
                href: '/business/wellness',
                icon: '🩺',
                title: 'Wellness Reports',
                description: 'Track anonymous employee wellness reports and monitor symptom trends.',
                color: 'border-purple-200 hover:border-purple-400',
                iconBg: 'bg-purple-50',
              },
              {
                href: '/business/locations',
                icon: '📍',
                title: 'Locations',
                description: 'Manage your business locations, addresses, and employee assignments.',
                color: 'border-orange-200 hover:border-orange-400',
                iconBg: 'bg-orange-50',
              },
              {
                href: '/business/subscription',
                icon: '💳',
                title: 'Subscription',
                description: 'Manage your plan, billing, and unlock premium wellness monitoring features.',
                color: 'border-gray-200 hover:border-gray-400',
                iconBg: 'bg-gray-50',
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`group rounded-xl bg-white border ${card.color} p-5 shadow-sm transition-all hover:shadow-md`}
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg} text-2xl mb-3`}>
                  {card.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{card.description}</p>
                <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                  Go to {card.title} →
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upgrade CTA for free tier */}
        {org?.subscription_tier === 'free' && (
          <div className="rounded-xl bg-blue-600 p-6 text-white text-center">
            <h2 className="text-xl font-bold mb-2">Unlock Full Wellness Monitoring</h2>
            <p className="text-blue-100 mb-4 text-sm">
              Upgrade to B2B Dashboard ($99/mo) to track employee wellness, detect outbreaks, and get HIPAA-compliant reporting.
            </p>
            <Link href="/business/subscription"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors text-sm">
              Upgrade Now →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

