export type Division =
  | "교양분과"
  | "연대사업분과"
  | "연행예술분과"
  | "종교분과"
  | "창작전시분과"
  | "체육분과"
  | "학술분과";

export type ClubDocument = {
  type: "활동보고서" | "회의록";
  date: string;
  title: string;
  aiFinding?: string;
  aiTags?: string[];
};

export type ClubActivityFlow = {
  month: string;
  text: string;
};

export type Club = {
  id: string;
  name: string;
  division: Division;
  intro: string;
  head: {
    name: string;
    email: string;
    phone: string;
  };
  members: number;
  activity: number[];
  running: string[];
  talking: string[];
  tags: string[];
  docs: ClubDocument[];
  fields?: string[];
  activityFlow?: ClubActivityFlow[];
  aiSummary?: string;
  connection?: "높음" | "보통" | "낮음";
  recommendedTypes?: string[];
};

export type Asset = {
  id: string;
  type: "기획안" | "운영안" | "결과보고서";
  year: number;
  event: string;
  file: string;
  gist: string;
};

export type UserProfile = {
  name: string;
  email: string;
  rank: string;
  department: string;
  duty?: string;
};

export type RichMatchItem = {
  clubId: string;
  fit: number;
  reasons: string[];
  docIndexes: number[];
};

export type SimilarProgram = {
  id: string;
  title: string;
  similarity: number;
  target?: string;
  purpose: string;
  method?: string;
  period?: string;
  size?: string;
  satisfaction?: string;
  improvements?: string[];
  components?: string[];
  sources?: string[];
};

export type BriefSection = {
  title: string;
  body: string;
};

export type IdeaBlock = {
  title: string;
  body: string;
  internal: string;
  external?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  chips?: string[];
  kind?: "match" | "profile" | "plan" | "mail" | "richMatch" | "similarPrograms" | "brief" | "ideas";
  clubIds?: string[];
  planId?: string;
  mailId?: string;
  externalSearch?: boolean;
  richMatchItems?: RichMatchItem[];
  similarPrograms?: SimilarProgram[];
  aiJudgment?: string;
  briefSections?: BriefSection[];
  briefProposal?: string;
  briefEvidenceCount?: number;
  ideaBlocks?: IdeaBlock[];
  ideaFooter?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
};

export type Plan = {
  id: string;
  title: string;
  topic: string;
  target: string;
  period: string;
  budget: string;
  clubIds: string[];
  assetIds: string[];
  createdAt: string;
  status?: string;
  purpose?: string;
  necessity?: string;
  necessityEvidenceIndexes?: number[];
  targetList?: string[];
  expectedSize?: string;
  expectedSizeIsSuggestion?: boolean;
  steps?: string[];
  internalSources?: string[];
  evidenceCount?: number;
  externalUsed?: boolean;
};

export type MailDraft = {
  id: string;
  clubId: string;
  purpose: string;
  tone: string;
  subject: string;
  body: string;
  createdAt: string;
  usedInfo?: string[];
};

export type Brief = {
  club: string;
  from: number;
  to: number;
  what: string;
  when: string;
};
