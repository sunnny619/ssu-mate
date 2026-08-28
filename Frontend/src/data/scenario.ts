import type { ChatMessage, IdeaBlock, MailDraft, Plan, RichMatchItem, SimilarProgram } from "@/types/ssu-mate";

export const RICH_MATCH_INTRO = "최근 1년간 활동보고서와 회의록을 분석한 결과, 프로덕트 제작 경험이 확인된 동아리 6곳을 찾았습니다.\n그중 창업지원 프로그램과의 연계 가능성이 높은 조직을 우선적으로 정리했습니다.";

export const RICH_MATCH_ITEMS: RichMatchItem[] = [
  {
    clubId: "lion",
    fit: 94,
    reasons: [
      "직군 간 협업 구조가 명확함",
      "단순 교육이 아니라 실제 프로덕트 제작까지 진행",
      "최근 1년간 관련 활동이 지속적으로 확인됨",
      "창업지원단의 팀 프로젝트형 프로그램과 연계 가능성이 높음",
    ],
    docIndexes: [0, 1, 2, 3],
  },
  {
    clubId: "yourssu",
    fit: 88,
    reasons: ["실제 서비스 운영 경험 보유", "사용자 문제 발굴부터 개발·배포까지 경험", "창업 및 프로덕트 실무형 프로그램과 연계 가능"],
    docIndexes: [0, 1, 2],
  },
  {
    clubId: "sccc",
    fit: 73,
    reasons: ["개발 프로젝트 활동 빈도가 높음", "IT 기반 창업 프로그램의 개발 인력 Pool로 활용 가능", "다만 다직군 협업 여부는 추가 확인 필요"],
    docIndexes: [0, 1],
  },
];

export const RICH_MATCH_CHIPS = ["동아리들로 기획안 작성해줘", "멋쟁이사자처럼에 협업 메일 써줘"];

export const SIMILAR_PROGRAMS_INTRO = "창업지원단 내부자료에서 유사도가 높은 기존 사업 3건을 찾았습니다.";

export const SIMILAR_PROGRAMS: SimilarProgram[] = [
  {
    id: "unithon",
    title: "2026 UNITHON",
    similarity: 91,
    target: "숭실대학교 재학생",
    purpose: "기획·디자인·개발 직군의 협업을 통한 창업 아이디어 구체화 및 프로토타입 제작",
    method: "팀 빌딩 → 아이디어 구체화 → 개발 → 발표",
    period: "2026.05 ~ 2026.07",
    size: "8팀 / 42명",
    satisfaction: "4.63 / 5.0",
    improvements: ["팀 빌딩 이전 직군별 역할 이해 필요", "개발 기간 부족 의견 다수", "후속 MVP 개발 지원 수요 확인"],
    sources: ["2026 UNITHON 운영계획서", "2026 UNITHON 결과보고서", "참여자 만족도 조사"],
  },
  {
    id: "prestartup",
    title: "Pre-Startup",
    similarity: 76,
    purpose: "초기 창업 아이디어 발굴 및 사업화 역량 강화",
    components: ["창업 교육", "아이디어 검증", "전문가 멘토링", "발표"],
  },
];

export const SIMILAR_PROGRAMS_JUDGMENT = "UNITHON은 '팀 단위 프로덕트 제작' 측면에서 유사도가 높고, Pre-Startup은 '아이디어의 사업화' 측면에서 참고 가치가 높습니다.";

export const SIMILAR_PROGRAMS_CHIPS = ["내부 데이터만 사용해서 이 프로그램의 필요성을 정리해줘"];

export const BRIEF_TITLE = "AI 프로덕트 빌더 프로그램 — 사업 필요성 근거";

export const BRIEF_SECTIONS = [
  {
    title: "1. 관련 학생 활동이 지속적으로 확인되고 있습니다",
    body: "최근 1년간 중앙동아리 활동 데이터에서 웹·앱 또는 AI 기반 프로젝트 수행 기록이 확인된 동아리 12개를 확인했습니다.\n이 가운데 6개 조직에서는 관련 활동이 3개월 이상 반복적으로 확인되었습니다.",
  },
  {
    title: "2. 다직군 협업 기반의 프로덕트 제작 활동이 존재합니다",
    body: "멋쟁이사자처럼 등 일부 조직에서는 기획·디자인·개발 직군이 팀을 구성하여 실제 서비스를 제작하는 활동이 지속적으로 확인됩니다.",
  },
  {
    title: "3. 기존 사업에서도 후속 제작 지원 수요가 확인되었습니다",
    body: "2026 UNITHON 결과보고서와 만족도 조사에서는 프로젝트 종료 이후 개발 기간 확대 및 후속 MVP 제작 지원에 대한 요구가 반복적으로 나타났습니다.",
  },
];

export const BRIEF_PROPOSAL = "기존 해커톤이 단기간의 아이디어 구현에 집중했다면, 신규 프로그램은 AI를 활용한 MVP 제작과 후속 검증 단계까지 지원하는 방식으로 차별화할 수 있습니다.";

export const BRIEF_EVIDENCE_COUNT = 8;

export const BRIEF_CHIPS = ["외부 사례까지 참고해서 이 프로그램을 어떻게 차별화하면 좋을지 아이디어를 줘"];

export const EXTERNAL_ON_NOTICE = "외부 자료까지 함께 탐색합니다.\n아이디어 탐색과 벤치마킹에 적합하며, 공식 문서 작성 시에는 교내 데이터 사용을 권장합니다.";

export const IDEAS_INTRO = "외부 리서치를 포함해 탐색했습니다.\n교내 데이터에서 확인된 학생 활동과 기존 사업 운영 결과에 외부 대학 및 기업의 최근 프로그램 사례를 함께 참고하면 다음 3가지 방향을 검토할 수 있습니다.";

export const IDEA_BLOCKS: IdeaBlock[] = [
  {
    title: "아이디어 1. AI Native MVP Sprint",
    body: "기존 해커톤처럼 결과물을 단기간에 만드는 데서 끝나지 않고, 생성형 AI 도구를 실제 프로덕트 개발 과정에 활용하도록 구성합니다.",
    internal: "UNITHON 참여자의 후속 개발 기간 확대 요구",
    external: "최근 대학·기업의 AI 활용 해커톤 및 프로토타이핑 프로그램 사례",
  },
  {
    title: "아이디어 2. 동아리 연합형 팀빌딩",
    body: "기존 조직 내부 팀 단위 모집 대신 서로 다른 동아리의 기획·디자인·개발 인력을 연결합니다.",
    internal: "각 동아리별 직군 구성의 편차 확인",
  },
  {
    title: "아이디어 3. MVP 이후 검증 단계 추가",
    body: "데모데이 이후 실제 학생 사용자를 대상으로 한 2~4주 검증 기간을 추가합니다.",
    internal: "기존 사업에서 후속 제작 지원 필요 확인",
  },
];

export const IDEAS_FOOTER = "외부 리서치 결과는 아이디어 탐색을 위한 참고자료입니다.\n공식 사업계획서 작성 시에는 검증된 내부자료만 근거로 사용합니다.";

export const SCENARIO_PLAN = {
  title: "2027 AI Product Builder 프로그램 운영안",
  topic: "AI 프로덕트 빌더 프로그램",
  status: "초안",
  purpose: "AI를 활용한 프로덕트 개발 경험을 제공하여 학생들이 아이디어를 실제 MVP로 구현하고, 향후 창업 및 사업화 가능성을 검증할 수 있도록 지원한다.",
  necessity: "최근 중앙동아리 활동 기록에서 웹·앱 및 AI 기반 프로젝트가 지속적으로 확인되고 있으며, 특히 기획·디자인·개발 직군이 협업하여 실제 프로덕트를 제작하는 활동이 다수 나타나고 있다.\n\n또한 기존 UNITHON 결과보고서에서 프로젝트 종료 이후 개발 기간 확대와 후속 MVP 제작 지원에 대한 수요가 확인되었다.",
  targetList: ["교내 재학생", "프로덕트 아이디어를 보유한 학생", "기획·디자인·개발 직군으로 구성된 팀"],
  expectedSize: "10팀 / 약 40~50명",
  period: "2027년 상반기 (8주)",
  budget: "미정 (추후 확정)",
  steps: ["오리엔테이션 및 팀빌딩", "문제 정의 및 아이디어 구체화", "AI 활용 프로토타이핑", "MVP 집중 개발", "사용자 검증", "데모데이 및 후속 지원 연계"],
  internalSources: ["2026 UNITHON 운영계획서", "2026 UNITHON 결과보고서", "2026 UNITHON 만족도 조사", "멋쟁이사자처럼 2026년 활동보고서 4건", "기타 관련 동아리 활동보고서"],
  evidenceCount: 8,
};

export const SCENARIO_PLAN_CONFIRM = "기획안 작성은 내부 데이터 기반 모드로 전환됩니다.";

export const SCENARIO_MAIL = {
  subject: "[숭실대학교 창업지원단] 2027년 창업 프로그램 기획 관련 미팅 제안",
  body: "안녕하세요. 숭실대학교 창업지원단입니다.\n\n동아리연합회 활동자료를 통해 멋쟁이사자처럼에서 기획·디자인·개발 직군이 함께 웹·앱 프로덕트를 제작하는 프로젝트를 지속적으로 운영하고 있는 것으로 확인하여 연락드립니다.\n\n창업지원단에서도 학생들의 아이디어를 실제 프로덕트로 발전시키는 프로그램을 운영하고 있으며, 차년도 프로그램을 기획하는 과정에서 멋쟁이사자처럼의 활동 경험과 학생들의 수요를 직접 들어보고 싶어 미팅을 제안드립니다.\n\n미팅에서는 현재 진행 중인 프로젝트와 활동 과정에서 필요한 지원, 창업지원단과 함께 검토할 수 있는 협업 방향 등을 가볍게 논의하고자 합니다.\n\n가능하신 일정이 있으시면 회신 부탁드립니다.\n\n감사합니다.\n숭실대학교 창업지원단",
  usedInfo: ["최근 프로덕트 제작 활동", "기획·디자인·개발 협업 구조", "2026년 활동보고서 3건"],
};

export const SIDEBAR_HISTORY = [
  { label: "오늘", titles: ["AI 프로젝트 동아리 탐색", "2027 신규 프로그램 검토"] },
  { label: "8월 27일", titles: ["UNITHON 운영 결과 분석", "멋쟁이사자처럼 협업 검토"] },
  { label: "8월 25일", titles: ["최근 IT 동아리 활동 변화", "2025~2026 창업 프로그램 비교"] },
  { label: "8월 21일", titles: ["Pre-Startup 만족도 분석"] },
];

export const ARCHIVE_STATS = {
  totalDocs: 2146,
  totalClubs: 77,
  newThisMonth: 83,
  updatedAt: "2026.08.27",
};

export const ARCHIVE_ROWS = [
  { name: "2026 UNITHON 운영계획서", type: "운영계획", year: "2026", status: "분석 완료" },
  { name: "2026 UNITHON 결과보고서", type: "결과보고서", year: "2026", status: "분석 완료" },
  { name: "2026 Pre-Startup 운영안", type: "운영안", year: "2026", status: "분석 완료" },
  { name: "2025 창업지원 프로그램 만족도", type: "만족도조사", year: "2025", status: "분석 완료" },
  { name: "2025 대학혁신지원사업 사업계획서", type: "사업계획서", year: "2025", status: "분석 완료" },
  { name: "중앙동아리 2026년 8월 활동보고서", type: "학생 활동", year: "2026", status: "최신" },
  { name: "중앙동아리 2026년 8월 회의록", type: "학생 활동", year: "2026", status: "최신" },
];

export const SCENARIO_PLAN_RECORD: Plan = {
  id: "p-scenario",
  title: SCENARIO_PLAN.title,
  topic: SCENARIO_PLAN.topic,
  target: SCENARIO_PLAN.targetList.join(", "),
  period: SCENARIO_PLAN.period,
  budget: SCENARIO_PLAN.budget,
  clubIds: ["lion"],
  assetIds: [],
  createdAt: "2026.08.28",
  status: SCENARIO_PLAN.status,
  purpose: SCENARIO_PLAN.purpose,
  necessity: SCENARIO_PLAN.necessity,
  necessityEvidenceIndexes: [0, 1, 2],
  targetList: [...SCENARIO_PLAN.targetList],
  expectedSize: SCENARIO_PLAN.expectedSize,
  expectedSizeIsSuggestion: true,
  steps: [...SCENARIO_PLAN.steps],
  internalSources: [...SCENARIO_PLAN.internalSources],
  evidenceCount: SCENARIO_PLAN.evidenceCount,
  externalUsed: false,
};

export const SCENARIO_MAIL_RECORD: MailDraft = {
  id: "mail-scenario",
  clubId: "lion",
  purpose: "미팅 제안",
  tone: "공손하게",
  subject: SCENARIO_MAIL.subject,
  body: SCENARIO_MAIL.body,
  createdAt: "2026.08.28",
  usedInfo: [...SCENARIO_MAIL.usedInfo],
};

export const SCENARIO_TRANSCRIPT: ChatMessage[] = [
  {
    id: "sc-1",
    role: "user",
    time: "오후 08:54",
    text: "최근 1년 동안 기획자, 디자이너, 개발자가 함께 웹이나 앱 서비스를 만든 동아리를 찾아줘. 창업지원 프로그램과 협업할 만한 곳을 우선적으로 보여줘.",
    externalSearch: false,
  },
  {
    id: "sc-2",
    role: "assistant",
    time: "오후 08:54",
    text: RICH_MATCH_INTRO,
    kind: "richMatch",
    clubIds: RICH_MATCH_ITEMS.map((item) => item.clubId),
    richMatchItems: RICH_MATCH_ITEMS,
    chips: [...RICH_MATCH_CHIPS],
    externalSearch: false,
  },
  {
    id: "sc-3",
    role: "user",
    time: "오후 08:55",
    text: "이런 학생들을 대상으로 AI를 활용한 프로덕트 제작 프로그램을 새로 만들고 싶어. 우리 부서에서 비슷하게 운영했던 사업이 있는지도 찾아줘.",
    externalSearch: false,
  },
  {
    id: "sc-4",
    role: "assistant",
    time: "오후 08:55",
    text: SIMILAR_PROGRAMS_INTRO,
    kind: "similarPrograms",
    similarPrograms: SIMILAR_PROGRAMS,
    aiJudgment: SIMILAR_PROGRAMS_JUDGMENT,
    chips: [...SIMILAR_PROGRAMS_CHIPS],
    externalSearch: false,
  },
  {
    id: "sc-5",
    role: "user",
    time: "오후 08:56",
    text: "좋아. 그럼 내부 데이터만 사용해서 이 프로그램의 필요성을 정리해줘.",
    externalSearch: false,
  },
  {
    id: "sc-6",
    role: "assistant",
    time: "오후 08:56",
    text: BRIEF_TITLE,
    kind: "brief",
    briefSections: BRIEF_SECTIONS,
    briefProposal: BRIEF_PROPOSAL,
    briefEvidenceCount: BRIEF_EVIDENCE_COUNT,
    chips: [...BRIEF_CHIPS],
    externalSearch: false,
  },
  {
    id: "sc-7",
    role: "user",
    time: "오후 08:57",
    text: "외부 사례까지 참고해서 이 프로그램을 어떻게 차별화하면 좋을지 아이디어를 줘.",
    externalSearch: true,
  },
  {
    id: "sc-8",
    role: "assistant",
    time: "오후 08:57",
    text: IDEAS_INTRO,
    kind: "ideas",
    ideaBlocks: IDEA_BLOCKS,
    ideaFooter: IDEAS_FOOTER,
    externalSearch: true,
  },
  {
    id: "sc-9",
    role: "assistant",
    time: "오후 08:57",
    text: `내부 데이터 기반으로 전환하여 초안을 만들었습니다. 근거자료 ${SCENARIO_PLAN.evidenceCount}건을 반영했습니다.`,
    kind: "plan",
    planId: "p-scenario",
    chips: ["참여 동아리에 협업 메일 써줘"],
    externalSearch: false,
  },
  {
    id: "sc-10",
    role: "user",
    time: "오후 08:58",
    text: "멋쟁이사자처럼에 내년도 프로그램 기획 전에 한번 미팅해보고 싶어. 메일 작성해줘.",
    externalSearch: false,
  },
  {
    id: "sc-11",
    role: "assistant",
    time: "오후 08:58",
    text: "멋쟁이사자처럼의 최근 활동을 반영해 협업 문의 초안을 작성했습니다.",
    kind: "mail",
    mailId: "mail-scenario",
    chips: ["다른 톤으로 다시 써줘"],
    externalSearch: false,
  },
];
