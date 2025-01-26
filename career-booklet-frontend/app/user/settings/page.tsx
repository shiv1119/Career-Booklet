'use client';

import { MFA, DeactivateAccountDropdown, DeleteAccountDropdown } from '@/components/auth_components';
import { useSession} from 'next-auth/react';

export default function Settings() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen flex flex-col items-center">
        <div className="text-gray-700 bg-white dark:bg-gray-800 w-full max-w-full">
          <MFA userId={String(session?.user.id)} />
        </div>
        <div className="text-gray-700 bg-white dark:bg-gray-800 w-full max-w-full mt-2">
          <DeactivateAccountDropdown />
        </div>
        <div className="text-gray-700 bg-white dark:bg-gray-800 w-full max-w-full mt-2">
          <DeleteAccountDropdown />
        </div>
    </div>
  );
}
