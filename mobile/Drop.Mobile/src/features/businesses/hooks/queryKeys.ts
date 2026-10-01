export const businessKeys = {
  mine: ['businesses', 'mine'] as const,
  branches: (businessId: string) => ['businesses', businessId, 'branches'] as const,
  members: (businessId: string) => ['businesses', businessId, 'members'] as const,
  stats: (businessId: string, days: number) => ['businesses', businessId, 'stats', days] as const,
  branch: (branchId: string) => ['branches', branchId] as const,
  branchDrops: (branchId: string) => ['branches', branchId, 'drops'] as const,
  branchQr: (branchId: string) => ['branches', branchId, 'qr'] as const,
  schedules: (branchId: string) => ['branches', branchId, 'schedules'] as const,
};
