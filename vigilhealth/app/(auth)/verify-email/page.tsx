import Link from 'next/link';

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string; type?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email, type } = await searchParams;
  const isBusiness = type === 'business';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      {/* Icon */}
      <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isBusiness ? 'bg-blue-50' : 'bg-green-50'}`}>
        {isBusiness ? (
          <span className="text-3xl">🏢</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        )}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {isBusiness ? 'Verify your business email' : 'Check your email'}
      </h2>

      <p className="text-sm text-gray-600 mb-1">We sent a verification link to</p>
      {email && (
        <p className="text-sm font-medium text-gray-900 mb-4 break-all">{email}</p>
      )}

      <p className="text-sm text-gray-500 mb-2">
        Click the link in the email to activate your account.
      </p>

      {isBusiness && (
        <p className="text-sm text-blue-600 font-medium mb-4">
          After verification you&apos;ll be taken directly to set up your business.
        </p>
      )}

      <p className="text-sm text-gray-400 mb-6">
        Don&apos;t see it? Check your spam folder.
      </p>

      <div className="flex flex-col gap-2 items-center">
        <Link
          href={isBusiness ? '/login-business' : '/login'}
          className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {isBusiness ? 'Go to Business Sign In' : 'Back to sign in'}
        </Link>
        {isBusiness && (
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            Use personal account instead
          </Link>
        )}
      </div>
    </div>
  );
}
