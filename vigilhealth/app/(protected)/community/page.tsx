'use client';

import Link from 'next/link';

const sections = [
  {
    href: '/community/help-requests',
    icon: '🤝',
    title: 'Help Requests',
    description: 'Request help from verified neighbors for groceries, pharmacy runs, and other essential tasks.',
    color: 'bg-orange-50 border-orange-200',
    btnColor: 'bg-orange-600 hover:bg-orange-700',
  },
  {
    href: '/community/volunteers',
    icon: '⭐',
    title: 'Volunteer',
    description: 'Register as a verified volunteer and help neighbors in need during health crises.',
    color: 'bg-green-50 border-green-200',
    btnColor: 'bg-green-600 hover:bg-green-700',
  },
  {
    href: '/qa',
    icon: '💬',
    title: 'Community Q&A',
    description: 'Ask and answer health questions backed by verified sources from WHO, CDC, and other authorities.',
    color: 'bg-teal-50 border-teal-200',
    btnColor: 'bg-teal-600 hover:bg-teal-700',
  },
  {
    href: '/services',
    icon: '🏥',
    title: 'Safe Services Directory',
    description: 'Find verified pharmacies, testing sites, and telehealth providers with Safe Badge certification.',
    color: 'bg-blue-50 border-blue-200',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community Network</h1>
          <p className="mt-1 text-gray-600">
            Neighbor-to-neighbor mutual aid, verified health information, and community resources.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <div
              key={section.href}
              className={`rounded-xl border p-5 ${section.color}`}
            >
              <div className="text-3xl mb-3">{section.icon}</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h2>
              <p className="text-sm text-gray-600 mb-4">{section.description}</p>
              <Link
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${section.btnColor}`}
                href={section.href}
              >
                Go to {section.title} →
              </Link>
            </div>
          ))}
        </div>

        {/* Community Guidelines */}
        <div className="mt-8 rounded-lg bg-white p-5 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-2">Community Guidelines</h2>
          <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
            <li>Be respectful and supportive of all community members</li>
            <li>Only share verified health information with proper citations</li>
            <li>Report misinformation using the flag button on answers</li>
            <li>Volunteers must complete identity verification before accepting requests</li>
            <li>All content is moderated for spam and inappropriate material</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
