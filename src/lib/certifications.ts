export type CertificationStatus = "active" | "expired" | "pending";

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string | null;
  credentialId?: string | null;
  verificationUrl?: string | null;
  status: CertificationStatus;
};

/**
 * Add verified certification records here. This stays empty until real,
 * user-supplied certification details are available.
 */
export const certifications: Certification[] = [];
