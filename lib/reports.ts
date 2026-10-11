export const REPORT_BUCKET = 'inspection-reports'
export const REPORT_MAX_BYTES = 50 * 1024 * 1024

export const REPORT_KINDS = [
  'building',
  'timber_pest',
  'building_and_pest',
  'new_home_stage',
  'pci',
  'other',
] as const
