export const SUPPORTED_TARGET_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'AI Engineer',
] as const;

export type SupportedTargetRole = (typeof SUPPORTED_TARGET_ROLES)[number];

export function isSupportedTargetRole(value: string): value is SupportedTargetRole {
  return SUPPORTED_TARGET_ROLES.includes(value as SupportedTargetRole);
}

export function mapTargetRole(value: string | null | undefined): SupportedTargetRole | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const exact = SUPPORTED_TARGET_ROLES.find((role) => role.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }

  if (normalized.includes('react') || normalized.includes('ui') || normalized.includes('frontend')) {
    return 'Frontend Developer';
  }

  if (normalized.includes('api') || normalized.includes('backend') || normalized.includes('server')) {
    return 'Backend Developer';
  }

  if (normalized.includes('full stack') || normalized.includes('software engineer') || normalized.includes('software developer')) {
    return 'Full Stack Developer';
  }

  if (normalized.includes('data scientist') || normalized.includes('data analyst') || normalized.includes('analytics')) {
    return 'Data Scientist';
  }

  if (normalized.includes('machine learning') || normalized.includes('ml') || normalized.includes('ai')) {
    return 'AI Engineer';
  }

  return null;
}
