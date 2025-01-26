export const fetchMfaStatus = async (userId: string) => {
    const url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/mfa-status/?user_id=${userId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!res.ok) {
      throw new Error('Failed to fetch MFA status');
    }
  
    const data = await res.json();
    return data.enabled ?? false;
  };
  
  export const toggleMfa = async (userId: string, enable: boolean) => {
    const url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/enable-mfa?user_id=${userId}&enable=${enable}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to toggle MFA');
    }
  };

export const sendOtp = async (emailOrPhone: string, purpose: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/send-otp?email_or_phone=${emailOrPhone}&purpose=${purpose}`,
      { method: 'POST' }
    );

    if (response.ok) {
      return true;
    } else {
      const errorData = await response.json();
      console.error('Failed to send OTP:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Error during OTP send:', error);
    return false;
  }
};

export const deactivateAccount = async (userId: string, otp: string) => {
  const url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/deactivate-account?user_id=${userId}&otp=${otp}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Failed to deactivate account');
  }
};

export const recoverAccount = async (email: string, otp: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/recover-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to recover account');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Error during account recovery:', error);
    throw error;
  }
};

export const deleteAccount = async (userId: string, otp: string) => {
  const url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/delete-account?user_id=${userId}&otp=${otp}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Failed to delete account');
  }
};


  