'use client';

import { Bell, Mail, MessageSquare } from 'lucide-react';

interface NotificationPreferencesProps {
  preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  onChange: (preferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
  }) => void;
}

export function NotificationPreferences({
  preferences,
  onChange,
}: NotificationPreferencesProps) {
  const handleToggle = (key: 'push' | 'email' | 'sms') => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Choose how you want to receive health alerts and updates
      </p>

      {/* Push Notifications */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div className="flex items-start">
          <Bell className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              Receive instant alerts on your device for critical health updates
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.push}
          onClick={() => handleToggle('push')}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            preferences.push ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              preferences.push ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Email Notifications */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div className="flex items-start">
          <Mail className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">
              Receive daily digests and important updates via email
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.email}
          onClick={() => handleToggle('email')}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            preferences.email ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              preferences.email ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* SMS Notifications */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div className="flex items-start">
          <MessageSquare className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900">SMS Notifications</h3>
            <p className="text-sm text-gray-500">
              Receive text messages for emergency health alerts
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Coming soon - SMS notifications are not yet available
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.sms}
          onClick={() => handleToggle('sms')}
          disabled
          className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 opacity-50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
        </button>
      </div>

      <div className="rounded-md bg-blue-50 p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> You can change these preferences at any time.
          Critical emergency alerts may override your preferences to ensure your
          safety.
        </p>
      </div>
    </div>
  );
}
