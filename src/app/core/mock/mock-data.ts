import { Role, UserResponse, TaskResponse, OrganizationResponse, MemberResponse, TaskStatus, BreakResponse, RecurrenceType, ScheduleResponse, SuperAdminInvitationResponse, CognitiveLoad, ScheduleEntry } from '../../api';

export const MOCK_USERS: Record<string, UserResponse> = {
  'user@goaldone.de': {
    id: 'u-1',
    email: 'user@goaldone.de',
    firstName: 'Normal',
    lastName: 'User',
    role: Role.User,
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
  },
  'admin@goaldone.de': {
    id: 'u-2',
    email: 'admin@goaldone.de',
    firstName: 'Org',
    lastName: 'Admin',
    role: Role.Admin,
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
  },
  'superadmin@goaldone.de': {
    id: 'u-3',
    email: 'superadmin@goaldone.de',
    firstName: 'Super',
    lastName: 'Admin',
    role: Role.SuperAdmin,
    createdAt: new Date().toISOString(),
  },
};

export const MOCK_TASKS: TaskResponse[] = [
  {
    id: 't-1',
    title: 'Welcome to Goaldone',
    description: 'Explore the workspace and create your first task.',
    status: TaskStatus.Open,
    cognitiveLoad: CognitiveLoad.Medium,
    estimatedDurationMinutes: 30,
    ownerId: 'u-1',
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-2',
    title: 'Plan your week',
    description: 'Set up your weekly goals.',
    status: TaskStatus.InProgress,
    cognitiveLoad: CognitiveLoad.High,
    estimatedDurationMinutes: 60,
    ownerId: 'u-1',
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-3',
    title: 'Review Sprint',
    description: 'Analyze the progress of the current sprint and plan for the next one.',
    status: TaskStatus.Done,
    cognitiveLoad: CognitiveLoad.Medium,
    estimatedDurationMinutes: 90,
    ownerId: 'u-1',
    organizationId: 'org-1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_ORGANIZATIONS: OrganizationResponse[] = [
  {
    id: 'org-1',
    name: 'Goaldone Dev Team',
    adminEmail: 'admin@goaldone.de',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'org-2',
    name: 'Marketing Squad',
    adminEmail: 'marketing@goaldone.de',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

export const MOCK_MEMBERS: MemberResponse[] = [
  {
    id: 'u-1',
    email: 'user@goaldone.de',
    firstName: 'Normal',
    lastName: 'User',
    role: Role.User,
    joinedAt: new Date().toISOString(),
  },
  {
    id: 'u-2',
    email: 'admin@goaldone.de',
    firstName: 'Org',
    lastName: 'Admin',
    role: Role.Admin,
    joinedAt: new Date().toISOString(),
  },
  {
    id: 'u-4',
    email: 'colleague@goaldone.de',
    firstName: 'Team',
    lastName: 'Member',
    role: Role.User,
    joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const MOCK_BREAKS: BreakResponse[] = [
  {
    id: 'b-1',
    label: 'Lunch Break',
    startTime: '12:00',
    endTime: '13:00',
    recurrence: {
      type: RecurrenceType.Daily,
      interval: 1,
    }
  },
  {
    id: 'b-2',
    label: 'Coffee Break',
    startTime: '15:00',
    endTime: '15:15',
    recurrence: {
      type: RecurrenceType.Daily,
      interval: 1,
    }
  }
];

export const MOCK_SCHEDULE: ScheduleResponse = {
  generatedAt: new Date().toISOString(),
  from: new Date().toISOString(),
  to: new Date(Date.now() + 86400000).toISOString(),
  totalWorkMinutes: 480,
  entries: [
    {
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '12:00',
      taskTitle: 'Welcome to Goaldone',
      type: ScheduleEntry.TypeEnum.Task,
      taskId: 't-1'
    },
    {
      date: new Date().toISOString().split('T')[0],
      startTime: '12:00',
      endTime: '13:00',
      breakLabel: 'Lunch Break',
      type: ScheduleEntry.TypeEnum.Break,
      breakId: 'b-1'
    },
    {
      date: new Date().toISOString().split('T')[0],
      startTime: '13:00',
      endTime: '17:00',
      taskTitle: 'Plan your week',
      type: ScheduleEntry.TypeEnum.Task,
      taskId: 't-2'
    }
  ]
};

export const MOCK_SUPERADMIN_INVITATIONS: SuperAdminInvitationResponse[] = [
  {
    id: 'inv-1',
    email: 'new-admin@example.com',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
  }
];
