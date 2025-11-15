/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  validUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'SecureP@ssw0rd123!',
    firstName: 'Jan',
    lastName: 'Kowalski',
    bloodType: 'A+' as const,
  },

  existingUser: {
    email: 'existing@example.com',
    password: 'SecureP@ssw0rd123!',
  },
};

export const testRCKiK = {
  warsaw: {
    id: 1,
    name: 'RCKiK Warszawa',
    city: 'Warszawa',
    address: 'ul. Saska 63A',
  },

  krakow: {
    id: 2,
    name: 'RCKiK Kraków',
    city: 'Kraków',
    address: 'ul. Rzeźnicza 11',
  },
};

export const testDonation = {
  valid: {
    date: '2025-11-10',
    rckikId: 1,
    volumeMl: 450,
    donationType: 'WHOLE_BLOOD' as const,
    notes: 'Regular donation',
  },

  invalidDate: {
    date: '2026-12-31', // Future date
    rckikId: 1,
    volumeMl: 450,
    donationType: 'WHOLE_BLOOD' as const,
  },
};

export const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'] as const;

export type BloodType = typeof bloodTypes[number];

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate test user data
 */
export function generateTestUser(overrides?: Partial<typeof testUsers.validUser>) {
  return {
    email: generateTestEmail(),
    password: 'SecureP@ssw0rd123!',
    firstName: 'Jan',
    lastName: 'Kowalski',
    bloodType: 'A+' as const,
    ...overrides,
  };
}
