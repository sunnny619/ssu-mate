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
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  chips?: string[];
  kind?: "match" | "profile" | "plan" | "mail";
  clubIds?: string[];
  planId?: string;
  mailId?: string;
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
};

export type MailDraft = {
  id: string;
  clubId: string;
  purpose: string;
  tone: string;
  subject: string;
  body: string;
  createdAt: string;
};

export type Brief = {
  club: string;
  from: number;
  to: number;
  what: string;
  when: string;
};
