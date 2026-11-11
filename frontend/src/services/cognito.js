/**
 * AWS Cognito Identity Provider Service for AeroDispatch Production
 * User Pool: ap-northeast-2_ldtJGhzxe
 * Client ID: 1vtgfpimi7cllflbrm1uqb7eqt
 * Region: ap-northeast-2
 */

export const COGNITO_CONFIG = {
  region: 'ap-northeast-2',
  userPoolId: 'ap-northeast-2_ldtJGhzxe',
  clientId: '1vtgfpimi7cllflbrm1uqb7eqt',
  endpoint: 'https://cognito-idp.ap-northeast-2.amazonaws.com/',
};

async function callCognito(target, payload) {
  const res = await fetch(COGNITO_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify({
      ClientId: COGNITO_CONFIG.clientId,
      ...payload,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorType = data.__type || data.code || 'CognitoError';
    const message = data.message || data.detail || 'Authentication service error';

    if (errorType.includes('UsernameExistsException')) {
      throw new Error('An account with this email already exists. Please sign in or reset your password.');
    }
    if (errorType.includes('InvalidPasswordException')) {
      throw new Error('Password must be at least 8 characters and include uppercase, lowercase, numbers, and special symbols (!@#$%).');
    }
    if (errorType.includes('CodeMismatchException')) {
      throw new Error('Invalid verification code entered. Please check your email inbox and try again.');
    }
    if (errorType.includes('ExpiredCodeException')) {
      throw new Error('Verification code has expired. Please click "Resend code" to receive a fresh passcode.');
    }
    if (errorType.includes('UserNotFoundException')) {
      throw new Error('No account found with this email. Please check your credentials or register a new account.');
    }
    if (errorType.includes('NotAuthorizedException')) {
      throw new Error('Incorrect email or password. Please verify your credentials.');
    }
    if (errorType.includes('UserNotConfirmedException')) {
      const err = new Error('Your email has not been verified yet. Please enter the verification code sent to your email.');
      err.requiresVerification = true;
      throw err;
    }
    if (errorType.includes('InvalidParameterException')) {
      throw new Error(message.replace(/1 validation error detected: /i, ''));
    }

    throw new Error(message);
  }

  return data;
}

/**
 * Register a new user in AWS Cognito.
 * Cognito automatically dispatches a REAL 6-digit confirmation email to the user's inbox.
 */
export async function cognitoSignUp(name, email, password, phone = '', role = 'customer') {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email is required');
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters and include uppercase, lowercase, numbers, and special symbols.');
  }

  const userAttributes = [
    { Name: 'email', Value: normalizedEmail },
    { Name: 'name', Value: (name || '').trim() || normalizedEmail.split('@')[0] },
    { Name: 'profile', Value: role || 'customer' }
  ];

  let rawPhone = (phone || '').trim().replace(/[\s-]/g, '');
  if (rawPhone) {
    if (!rawPhone.startsWith('+')) {
      rawPhone = `+91${rawPhone}`;
    }
    // Only pass if it looks like a valid E.164 phone
    if (/^\+[1-9]\d{7,14}$/.test(rawPhone)) {
      userAttributes.push({ Name: 'phone_number', Value: rawPhone });
    }
  }

  const res = await callCognito('SignUp', {
    Username: normalizedEmail,
    Password: password,
    UserAttributes: userAttributes,
  });

  return {
    success: true,
    requiresOtp: true,
    userSub: res.UserSub,
    destination: res.CodeDeliveryDetails?.Destination || normalizedEmail,
  };
}

/**
 * Confirm user registration by verifying the real 6-digit OTP code sent to their email.
 */
export async function cognitoConfirmSignUp(email, code) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanCode = (code || '').trim();
  if (!cleanCode || cleanCode.length < 6) {
    throw new Error('Please enter all 6 digits of the verification code sent to your email.');
  }

  await callCognito('ConfirmSignUp', {
    Username: normalizedEmail,
    ConfirmationCode: cleanCode,
  });

  return true;
}

/**
 * Resend the real 6-digit verification code to the user's email via AWS Cognito.
 */
export async function cognitoResendConfirmationCode(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const res = await callCognito('ResendConfirmationCode', {
    Username: normalizedEmail,
  });
  return {
    success: true,
    destination: res.CodeDeliveryDetails?.Destination || normalizedEmail,
  };
}

/**
 * Authenticate existing user with AWS Cognito USER_PASSWORD_AUTH.
 */
export async function cognitoLogin(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const res = await callCognito('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: normalizedEmail,
      PASSWORD: password,
    },
  });

  return {
    idToken: res.AuthenticationResult?.IdToken,
    accessToken: res.AuthenticationResult?.AccessToken,
    refreshToken: res.AuthenticationResult?.RefreshToken,
    tokenType: res.AuthenticationResult?.TokenType,
    expiresIn: res.AuthenticationResult?.ExpiresIn,
  };
}

/**
 * Initiate real password recovery via AWS Cognito (sends reset code to email).
 */
export async function cognitoForgotPassword(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const res = await callCognito('ForgotPassword', {
    Username: normalizedEmail,
  });
  return {
    success: true,
    destination: res.CodeDeliveryDetails?.Destination || normalizedEmail,
  };
}

/**
 * Confirm password reset using the real code received via email and set a new password.
 */
export async function cognitoConfirmForgotPassword(email, code, newPassword) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  await callCognito('ConfirmForgotPassword', {
    Username: normalizedEmail,
    ConfirmationCode: (code || '').trim(),
    Password: newPassword,
  });
  return true;
}

