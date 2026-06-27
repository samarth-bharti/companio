// lib/company.ts
//
// SINGLE SOURCE OF TRUTH for company + compliance contact facts. These appear in
// the Privacy Policy, Terms of Service and the site footer.
//
// ⚠️  GO-LIVE: replace every [[ ... ]] placeholder with the real, verified value.
// DPDPA 2023 and the IT Act both REQUIRE a published, reachable Grievance Officer
// and a registered address. Publishing wrong/placeholder details is worse than
// none — fill these from the incorporation papers before launch.

export const COMPANY = {
  legalName: 'TRYCOMPANIOLABS LLP',
  brand: 'Companio',
  // From the LLP incorporation papers (LLPs have an LLPIN, not a CIN):
  llpin: 'ACY-1464',
  registeredAddress:
    'DPT 808B, F 79–80, 8th Floor, DLF Prime Tower, Okhla Industrial Area Phase-I, New Delhi – 110020, Delhi, India',
  // Contact — confirm these mailboxes exist and are monitored:
  supportEmail: 'support@trycompanio.in',
  privacyEmail: 'privacy@trycompanio.in',
  // DPDPA / IT Act Grievance Officer — MUST be a real, reachable person:
  grievanceOfficer: {
    name: '[[Grievance Officer full name]]',
    email: 'grievance@trycompanio.in',
    phone: '[[Grievance Officer phone]]',
  },
  // Legal venue for disputes:
  jurisdiction: 'New Delhi, India',
  governingLaw: 'the laws of India',
} as const;

/** True while a field is still an unfilled [[placeholder]]. */
function unfilled(v: string): boolean {
  return v.includes('[[');
}

/**
 * Display-safe company facts. Any field still holding a [[placeholder]] is
 * swapped for a graceful fallback so a raw "[[CIN]]" can NEVER render to a user.
 * Fill the real values in COMPANY above and these pass straight through.
 *
 * NOTE: a real, reachable Grievance Officer + registered address are LEGALLY
 * required (DPDPA 2023 / IT Act). The fallback is a stopgap to avoid leaking
 * placeholders — it is NOT a substitute for filling in the real details.
 */
export const COMPANY_DISPLAY = {
  legalName: COMPANY.legalName,
  llpin: unfilled(COMPANY.llpin) ? null : COMPANY.llpin,
  registeredAddress: unfilled(COMPANY.registeredAddress)
    ? 'Registered office details available on request'
    : COMPANY.registeredAddress,
  grievanceOfficer: {
    name: unfilled(COMPANY.grievanceOfficer.name)
      ? 'Grievance Officer'
      : COMPANY.grievanceOfficer.name,
    email: COMPANY.grievanceOfficer.email,
    phone: unfilled(COMPANY.grievanceOfficer.phone) ? null : COMPANY.grievanceOfficer.phone,
  },
} as const;
