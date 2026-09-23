export const businessKeys = {
  mine: ['businesses', 'mine'] as const,
  branches: (businessId: string) => ['businesses', businessId, 'branches'] as const,
  members: (businessId: string) => ['businesses', businessId, 'members'] as const,
  branch: (branchId: string) => ['branches', branchId] as const,
  branchDrops: (branchId: string) => ['branches', branchId, 'drops'] as const,
};
