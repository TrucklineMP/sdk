export type IsoDateString = string;

export type PublicUserVtc = {
  id: number;
  name: string;
  handle: string | null;
  role: string;
  joinedAt: IsoDateString;
};

export type PublicUserSocial = {
  youtube: string | null;
  youtubeChannelName: string | null;
  twitch: string | null;
  twitter: string | null;
  worldOfTrucks: string | null;
  medal: string | null;
  tiktok: string | null;
};

export type PublicUserGameStatus = {
  server: string;
  gameId: number;
  near: string;
};

export type PublicUser = {
  id: string;
  webId: number;
  handle: string | null;
  name: string;
  image: string | null;
  steamId: string | null;
  createdAt: IsoDateString;
  vtc: PublicUserVtc | null;
  staffRoles: Array<{ name: string; color: string | null }>;
  social: PublicUserSocial | null;
  gameStatus: PublicUserGameStatus | null;
};

export type PublicUserProfileResponse = { user: PublicUser };

export type PublicUserSearchResult = {
  id: string;
  webId: number;
  handle: string | null;
  name: string;
  image: string | null;
  steamId: string | null;
  vtcName: string | null;
  vtcId: number | null;
  role: string | null;
};

export type PublicUserSearchResponse = {
  users: PublicUserSearchResult[];
  pagination: { totalPages: number; total: number };
};

export type PublicUserBatchResponse = { users: PublicUser[] };

export type PublicUserBans = {
  active: {
    id: number;
    scope: string;
    severity: string;
    reasonShort: string;
  } | null;
  pastCount: number;
  history: Array<{
    id: number;
    scope: string;
    severity: string;
    reasonShort: string;
    active: boolean;
    createdAt: IsoDateString;
    expiresAt: IsoDateString | null;
  }>;
};

export type VtcListItem = {
  id: number;
  name: string;
  handle: string | null;
  description: string;
  slogan: string | null;
  profilePicture: string | null;
  banner: string | null;
  verified: boolean;
  official: boolean;
  partnered: boolean;
  validated?: boolean;
  tier?: string;
  activityScore?: number;
  inGameTag?: string | null;
  games?: string[];
  country?: string | null;
  timezone?: string | null;
  recruitmentOpen: boolean;
  visibility: "public" | "unlisted" | "private" | string;
  language: string;
  memberCount: number;
  createdAt: IsoDateString;
  [key: string]: unknown;
};

export type VtcMemberRoleBadge = {
  id: number;
  name: string;
  color: string | null;
};

export type VtcMember = {
  userId: string;
  role: string;
  joinedAt: IsoDateString;
  name: string;
  image: string | null;
  webId: number;
  steamId: string | null;
  isOwner: boolean;
  roles: VtcMemberRoleBadge[];
};

export type PublicEvent = {
  id: number;
  vtcId: number | null;
  organizerType: string;
  organizerUserId: string | null;
  authorId: string;
  name: string;
  slug: string;
  description: string;
  startAt: IsoDateString;
  endAt: IsoDateString;
  server: string | null;
  departure: string | null;
  arrival: string | null;
  banner: string | null;
  maxAttendees: number | null;
  category: string;
  accessMode: string;
  requiresApproval: boolean;
  membersOnly: boolean;
  attendeeCount: number;
  moderationStatus: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  [key: string]: unknown;
};

export type PublicEventAttendee = {
  userId: string;
  webId: number;
  handle: string | null;
  name: string;
  image: string | null;
  steamId: string | null;
  status: string;
};

export type PublicEventSlot = {
  id: number;
  label: string;
  role: string;
  position: number;
  maxOccupants: number;
  assignedUser: {
    id: string;
    webId: number;
    handle: string | null;
    name: string;
    image: string | null;
    steamId: string | null;
  } | null;
};

export type PublicNewsItem = {
  id: number;
  authorId: string;
  title: string;
  content: string;
  image: string | null;
  pinned: boolean;
  published: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  author: { name: string; image: string | null };
};

export type PublicBanListItem = {
  id: number;
  userHandle: string | null;
  userName: string | null;
  userImage: string | null;
  scope: string;
  severity: string;
  reasonShort: string;
  issuedAt: IsoDateString;
  expiresAt: IsoDateString | null;
};

export type PublicBanDetail = {
  id: number;
  userId: string;
  scope: string;
  severity: string;
  reason: string;
  createdAt: IsoDateString;
  expiresAt: IsoDateString | null;
  active: boolean;
  appealEligibleAt: IsoDateString | null;
  target: {
    id: string;
    name: string;
    handle: string | null;
    image: string | null;
    steamId: string | null;
  } | null;
  evidence: Array<{
    id: number;
    kind: string;
    value: string;
    caption: string | null;
    createdAt: IsoDateString;
  }>;
};

export type PublicPartner = {
  id: number;
  name: string;
  logo: string;
  url: string | null;
  description: string | null;
  promoCode: string | null;
  logoScale: number | null;
};

export type PublicVersion = {
  api: string;
  app: string;
  build?: string;
};

export type PublicRules = { url: string };

export type PublicBadgeRecipient = {
  webId: number;
  name: string;
  handle: string | null;
  image: string | null;
  steamId: string | null;
  profileUrl: string;
  reason: string;
  grantedAt: IsoDateString;
  grantedBy: { name: string };
};

export type PublicBadgeProgram = {
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  recipients: PublicBadgeRecipient[];
};

export type PublicRecognitionPrograms = {
  programs: PublicBadgeProgram[];
};

export type PublicAchievement = {
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  points: number;
};

export type PublicAchievementsCatalog = {
  achievements: PublicAchievement[];
};

export type PublicUserAchievement = PublicAchievement & {
  grantedAt: IsoDateString;
};

export type PublicUserAchievements = {
  achievements: PublicUserAchievement[];
};

export type GameServer = {
  id?: string | number;
  name?: string;
  region?: string;
  status?: string;
  players?: number;
  maxPlayers?: number;
  [key: string]: unknown;
};

export type VtcNewsItem = {
  id: number;
  title: string;
  content: string;
  image: string | null;
  pinned: boolean;
  createdAt: IsoDateString;
  authorName: string;
  authorImage: string | null;
};

export type VtcRole = {
  id: number;
  name: string;
  color: string | null;
  position: number;
};

export type OAuthScope =
  | "profile"
  | "vtc:read"
  | "events:read"
  | "bans:read"
  | "presence:read"
  | (string & {});

export type OAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

export type OAuthUserinfo = {
  sub: string;
  web_id: number | string;
  name?: string;
  picture?: string | null;
  handle?: string | null;
  steam_id?: string | null;
  vtc_memberships?: Array<{
    vtcId: number;
    vtcName: string;
    role: string;
    isOwner: boolean;
    joinedAt: IsoDateString;
  }>;
  is_online?: boolean;
  presence_checked_at?: IsoDateString;
  presence_ttl_seconds?: number;
  presence_unavailable?: boolean;
  [key: string]: unknown;
};

export type WebhookEventType =
  | "user.updated"
  | "user.banned"
  | "user.unbanned"
  | "vtc.created"
  | "vtc.member_joined"
  | "vtc.member_left"
  | "vtc.updated"
  | "vtc.application.accepted"
  | "vtc.application.rejected"
  | "vtc.partnership.request_sent"
  | "vtc.partnership.accepted"
  | "vtc.partnership.declined"
  | "vtc.partnership.cancelled"
  | "vtc.partnership.removed"
  | "vtc.embed.token_created"
  | "vtc.embed.token_revoked"
  | "event.created"
  | "event.updated"
  | "event.cancelled"
  | "event.rsvp"
  | "event.check_in"
  | "event.depot_slot_requested"
  | "event.depot_slot_decided"
  | "event.series.created"
  | "ban.issued"
  | "ban.appealed"
  | "ban.appeal_resolved"
  | "api.rate_limit_hit"
  | "api.token_revoked"
  | (string & {});

export type WebhookDelivery = {
  type: WebhookEventType;
  id?: string;
  createdAt?: IsoDateString;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
};
