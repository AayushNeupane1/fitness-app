export interface CreateMemberDto {
  fullName: string;
  email?: string;
  phone?: string;
}

export interface AssignPlanDto {
  memberId: string;
  title: string;
  description?: string;
}
