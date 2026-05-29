'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalReports: number;
  totalReferrals: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalAdmins: 0, totalReports: 0, totalReferrals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('community_reports').select('id', { count: 'exact', head: true }),
      supabase.from('telehealth_referrals').select('id', { count: 'exact', head: true }),
    ]).then(([profiles, reports, referrals]) => {
      setStats({
        totalUsers: profiles.count ?? 0,
        totalAdmins: 0, // fetched separately
        totalReports: reports.count ?? 0,
        totalReferrals: referrals.count ?? 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', href: '/superadmin/users', color: 'bg-blue-50 border-blue-200' },
    { label: 'Community Reports', value: stats.totalReports, icon: '📋', href: '/admin/moderation', color: 'bg-orange-50 border-orange-200' },
    { label: 'Telehealth Referrals', value: stats.totalReferrals, icon: '🏥', href: '/admin/commissions', color: 'bg-green-50 border-green-200' },
    { label: 'Manage Admins', value: '→', icon: '🛡️', href: '/superadmin/admins', color: 'bg-purple-50 border-purple-200' },
    { label: 'Businesses', value: '→', icon: '🏢', href: '/superadmin/businesses', color: 'bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
        <p className="mt-1 text-gray-400">Full platform control and oversight</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}
              className={`rounded-xl border p-5 ${card.color} hover:shadow-md transition-shadow`}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-600 mt-1">{card.label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: '/superadmin/telehealth', label: 'Manage telehealth referrals', icon: '🏥' },
            { href: '/superadmin/admins', label: 'Promote user to Admin', icon: '⬆️' },
            { href: '/superadmin/businesses', label: 'Manage business accounts', icon: '🏢' },
            { href: '/superadmin/users', label: 'Suspend a user account', icon: '🚫' },
            { href: '/admin/moderation', label: 'Review flagged content', icon: '🔍' },
            { href: '/admin/safe-badges', label: 'Approve Safe Badge applications', icon: '✅' },
            { href: '/admin/commissions', label: 'View commission reports', icon: '💰' },
            { href: '/superadmin/system', label: 'System health & crons', icon: '⚙️' },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className="flex items-center gap-3 rounded-lg bg-gray-800 px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors">
              <span>{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
