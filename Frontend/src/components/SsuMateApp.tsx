"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Bot,
  Copy,
  Download,
  FileText,
  Grid2X2,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { CLUBS, DIVISIONS, INITIAL_ASSETS, INITIAL_BRIEFS, MONTHS } from "@/data/ssu-mate";
import type { Asset, ChatMessage, ChatSession, Club, MailDraft, Plan, UserProfile } from "@/types/ssu-mate";

type View = "chat" | "clubs" | "mypage";
type MyTab = "plans" | "mails" | "assets" | "briefs" | "recent";
type Screen = {
  view: View;
  myTab: MyTab;
  clubPageId: string | null;
};
type Flow =
  | { kind: "plan"; step: number; data: Partial<Pick<Plan, "topic" | "target" | "period" | "budget">>; clubIds: string[] }
  | { kind: "mail"; clubId: string; purpose?: string; tone?: string };

const TODAY = "2026.08.28";
const PLAN_SLOTS = [
  { key: "topic", label: "주제", question: "어떤 사업을 기획하시나요? 주제를 한 문장으로 알려주세요.", chips: ["재학생 창업 부트캠프", "동아리 연계 아이디어톤", "시제품 제작 지원 프로그램"] },
  { key: "target", label: "대상", question: "대상은 누구인가요?", chips: ["재학생 40명", "창업 동아리 소속 20팀", "전 학년 제한 없음"] },
  { key: "period", label: "기간", question: "운영 기간은 어떻게 되나요?", chips: ["2026년 10월 ~ 11월 (4주)", "2026년 겨울방학 2주", "학기 중 매주 1회, 8주"] },
  { key: "budget", label: "예산", question: "예산 규모를 알려주세요.", chips: ["1,800만원", "2,500만원", "미정 (추후 확정)"] },
] as const;

const QUICK = [
  { icon: UsersRound, title: "동아리 찾기", desc: "협업할 곳 추천받기", query: "창업 관련 행사를 기획하려는데 지원해줄 만한 동아리가 있을까?" },
  { icon: FileText, title: "기획안 만들기", desc: "근거 붙은 초안 작성", query: "기획안 작성해줘" },
  { icon: Mail, title: "협업 메일 쓰기", desc: "회장에게 보낼 초안", query: "스타트온에 협업 메일 써줘" },
  { icon: Bell, title: "활동 살펴보기", desc: "최근 움직임 확인", query: "최근에 활동이 활발한 동아리 보여줘" },
];

const now = () => new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
const uid = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(16).slice(2, 7)}`;
const recentCount = (club: Club) => club.activity.slice(-3).reduce((sum, value) => sum + value, 0);
const totalCount = (club: Club) => club.activity.reduce((sum, value) => sum + value, 0);
const lastActive = (club: Club) => MONTHS[[...club.activity].map((value, index) => (value > 0 ? index : -1)).filter((index) => index >= 0).pop() ?? 0];
const findClub = (text: string) => CLUBS.find((club) => text.includes(club.name));

function matchClubs(text: string) {
  const lower = text.toLowerCase();
  const rules = [
    ["창업", "창업"],
    ["사업화", "창업"],
    ["ai", "AI"],
    ["인공지능", "AI"],
    ["개발", "개발"],
    ["디자인", "디자인"],
    ["영상", "영상"],
    ["홍보", "홍보"],
    ["공연", "공연"],
    ["행사", "행사"],
    ["환경", "환경"],
    ["투자", "투자"],
    ["제작", "제작"],
    ["시제품", "시제품"],
    ["교류", "교류"],
    ["멘토", "멘토"],
    ["활발", "__recent"],
    ["최근", "__recent"],
  ];
  const tags = rules.filter(([keyword]) => lower.includes(keyword)).map(([, tag]) => tag);
  if (tags.includes("__recent") && tags.length === 1) return CLUBS.filter((club) => recentCount(club) >= 8).sort((a, b) => recentCount(b) - recentCount(a));
  const semanticTags = tags.filter((tag) => tag !== "__recent");
  if (!semanticTags.length) return [];
  return CLUBS.filter((club) => semanticTags.some((tag) => club.tags.includes(tag))).sort((a, b) => b.docs.length - a.docs.length);
}

function createSession(): ChatSession {
  return { id: uid("s"), title: "새 대화", date: TODAY, messages: [] };
}

export function SsuMateApp() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [joinMode, setJoinMode] = useState(false);
  const [view, setView] = useState<View>("chat");
  const [myTab, setMyTab] = useState<MyTab>("plans");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mails, setMails] = useState<MailDraft[]>([]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [recent, setRecent] = useState<string[]>([]);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [lastMatch, setLastMatch] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("전체");
  const [sort, setSort] = useState("recent");
  const [clubPageId, setClubPageId] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const active = sessions.find((session) => session.id === activeId) ?? null;
  const clubsById = useMemo(() => new Map(CLUBS.map((club) => [club.id, club])), []);
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
  const mailsById = useMemo(() => new Map(mails.map((mail) => [mail.id, mail])), [mails]);
  const currentScreen: Screen = { view, myTab, clubPageId };

  useEffect(() => {
    if (!user) return;

    const initialScreen: Screen = { view: "chat", myTab: "plans", clubPageId: null };
    if (!window.history.state?.ssuMateScreen) {
      window.history.replaceState({ ssuMateScreen: initialScreen }, "", window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      const screen = event.state?.ssuMateScreen as Screen | undefined;
      if (!screen) return;
      applyScreen(screen);
      setSideOpen(false);
      setSettingsOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user]);

  function applyScreen(screen: Screen) {
    setView(screen.view);
    setMyTab(screen.myTab);
    setClubPageId(screen.clubPageId);
  }

  function isSameScreen(a: Screen, b: Screen) {
    return a.view === b.view && a.myTab === b.myTab && a.clubPageId === b.clubPageId;
  }

  function navigate(next: Partial<Screen>, replace = false) {
    const nextScreen = { ...currentScreen, ...next };
    if (isSameScreen(currentScreen, nextScreen)) return;
    if (replace) {
      window.history.replaceState({ ssuMateScreen: nextScreen }, "", window.location.href);
    } else {
      window.history.pushState({ ssuMateScreen: nextScreen }, "", window.location.href);
    }
    applyScreen(nextScreen);
  }

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function login(form: FormData) {
    const profile = {
      name: joinMode ? String(form.get("name") || "김성실") : "김성실",
      email: String(form.get("email") || "startup@ssu.ac.kr"),
      rank: joinMode ? String(form.get("rank") || "팀원") : "팀원",
      department: joinMode ? String(form.get("department") || "창업지원단") : "창업지원단",
    };
    const session = createSession();
    setUser(profile);
    setSessions([session]);
    setActiveId(session.id);
  }

  function logout() {
    setUser(null);
    setSessions([]);
    setActiveId(null);
    setPlans([]);
    setMails([]);
    setRecent([]);
    setFlow(null);
    setLastMatch([]);
    setView("chat");
    setSettingsOpen(false);
    flash("로그아웃했습니다");
  }

  function addMessage(message: Omit<ChatMessage, "id" | "time">) {
    setSessions((current) =>
      current.map((session) =>
        session.id !== activeId
          ? session
          : {
              ...session,
              title: session.title === "새 대화" && message.role === "user" ? message.text.slice(0, 22) : session.title,
              messages: [...session.messages, { ...message, id: uid("m"), time: now() }],
            },
      ),
    );
  }

  function newChat() {
    const session = createSession();
    setSessions((current) => [session, ...current]);
    setActiveId(session.id);
    setFlow(null);
    setLastMatch([]);
    applyScreen({ view: "chat", myTab, clubPageId: null });
    window.history.replaceState({ ssuMateScreen: { view: "chat", myTab, clubPageId: null } }, "", window.location.href);
  }

  function sendText(text: string) {
    const value = text.trim();
    if (!value || !activeId) return;
    addMessage({ role: "user", text: value });
    window.setTimeout(() => route(value), 180);
  }

  function route(text: string) {
    if (flow) {
      runFlow(text);
      return;
    }

    if (lastMatch.length && /(이 중|이중|그 중|중에서).*(최근|활발)|최근.*활동.*(만|보여)/.test(text)) {
      const filtered = lastMatch.map((id) => clubsById.get(id)).filter((club): club is Club => Boolean(club)).filter((club) => recentCount(club) >= 6);
      const next = filtered.length ? filtered : lastMatch.map((id) => clubsById.get(id)).filter((club): club is Club => Boolean(club));
      setLastMatch(next.map((club) => club.id));
      addMessage({ role: "assistant", text: `이전 검색 결과 ${lastMatch.length}곳 중 최근 3개월 활동이 6건 이상인 곳만 남겼습니다.`, kind: "match", clubIds: next.map((club) => club.id), chips: ["이 동아리들로 기획안 작성해줘", "첫 번째 동아리 프로필 보여줘"] });
      return;
    }

    if (/기획안|기획서|계획서|사업\s?기획/.test(text)) {
      startPlan(text);
      return;
    }

    if (/메일|이메일|연락.*드리|협조.*요청/.test(text)) {
      startMail(findClub(text)?.id);
      return;
    }

    const club = findClub(text);
    if (club) {
      openClub(club.id);
      addMessage({ role: "assistant", text: `${club.name} 동아리 프로필입니다. 활동보고서와 회의록을 근거로 구성했습니다.`, kind: "profile", clubIds: [club.id], chips: ["이 동아리에 협업 메일 써줘", "비슷한 동아리 더 찾아줘"] });
      return;
    }

    const matched = matchClubs(text).slice(0, 4);
    if (matched.length) {
      setLastMatch(matched.map((club) => club.id));
      addMessage({ role: "assistant", text: `활동보고서와 회의록을 검색해 ${matched.length}곳을 찾았습니다. 추천 근거가 된 활동 이력과 자료 시점을 함께 표시했습니다.`, kind: "match", clubIds: matched.map((club) => club.id), chips: ["이 중에서 최근에 활동한 동아리만 보여줘", "이 동아리들로 기획안 작성해줘"] });
      return;
    }

    addMessage({ role: "assistant", text: "요청을 이해하지 못했습니다. 아래 중 하나로 다시 물어봐 주세요.", chips: ["창업 관련 행사를 기획하려는데 지원해줄 만한 동아리가 있을까?", "AI 관련 활동을 주로 하는 동아리가 있을까?", "코드너츠 동아리 정보 알려줘", "기획안 작성해줘"] });
  }

  function startPlan(text: string) {
    const initialTopic = /^기획안|^기획서/.test(text) || text.length <= 10 ? undefined : text.replace(/기획안.*$/, "").trim();
    const matchedClubIds = lastMatch.length ? lastMatch : matchClubs("창업").slice(0, 3).map((club) => club.id);
    const step = initialTopic ? 1 : 0;
    setFlow({ kind: "plan", step, data: initialTopic ? { topic: initialTopic } : {}, clubIds: matchedClubIds });
    const slot = PLAN_SLOTS[step];
    addMessage({ role: "assistant", text: `${initialTopic ? `주제는 "${initialTopic}"로 이해했습니다. ` : ""}${slot.question}`, chips: [...slot.chips] });
  }

  function runFlow(text: string) {
    if (flow?.kind === "plan") {
      const slot = PLAN_SLOTS[flow.step];
      const data = { ...flow.data, [slot.key]: text };
      const nextStep = flow.step + 1;
      if (nextStep < PLAN_SLOTS.length) {
        const nextSlot = PLAN_SLOTS[nextStep];
        setFlow({ ...flow, step: nextStep, data });
        addMessage({ role: "assistant", text: nextSlot.question, chips: [...nextSlot.chips] });
        return;
      }
      const plan: Plan = {
        id: uid("p"),
        title: `2026 ${data.topic} 기획안`,
        topic: data.topic ?? "창업지원 프로그램",
        target: data.target ?? "재학생",
        period: data.period ?? "2026년 2학기",
        budget: data.budget ?? "미정",
        clubIds: flow.clubIds,
        assetIds: assets.map((asset) => asset.id),
        createdAt: TODAY,
      };
      setPlans((current) => [plan, ...current]);
      setFlow(null);
      addMessage({ role: "assistant", text: `필요한 정보를 모두 받았습니다. 동아리 ${flow.clubIds.length}곳의 활동 근거와 창업지원단 기존 자료 ${assets.length}건을 반영해 초안을 만들었습니다.`, kind: "plan", planId: plan.id, chips: ["참여 동아리에 협업 메일 써줘", "예산 항목을 더 자세히 써줘"] });
      return;
    }

    if (flow?.kind === "mail") {
      if (!flow.purpose) {
        setFlow({ ...flow, purpose: text });
        addMessage({ role: "assistant", text: "메일 톤을 골라주세요.", chips: ["공손하게", "친근하게"] });
        return;
      }
      const club = clubsById.get(flow.clubId) ?? CLUBS[1];
      const polite = text.includes("공손");
      const draft: MailDraft = {
        id: uid("mail"),
        clubId: club.id,
        purpose: flow.purpose,
        tone: text,
        subject: `[숭실대 창업지원단] ${club.name} 동아리 ${flow.purpose} 관련 안내`,
        body: polite
          ? `안녕하세요, ${club.name} 회장 ${club.head.name} 님.\n숭실대학교 창업지원단 ${user?.rank ?? "팀원"} ${user?.name ?? "김성실"}입니다.\n\n${club.name} 동아리의 최근 활동 자료를 살펴보다가 연락드리게 되었습니다. ${club.talking[0]} 관련 내용이 저희가 준비 중인 프로그램과 맞닿아 있어, ${flow.purpose} 드리고자 합니다.\n\n${club.running[0]}에 대해서도 지원할 수 있는 부분이 있을 것으로 보입니다. 편하신 시간에 짧게 논의할 수 있다면 좋겠습니다.\n\n회신 부탁드립니다. 감사합니다.\n\n${user?.department ?? "창업지원단"} ${user?.rank ?? "팀원"} ${user?.name ?? "김성실"}\n${user?.email ?? "startup@ssu.ac.kr"}`
          : `안녕하세요, ${club.name} ${club.head.name} 회장님!\n창업지원단 ${user?.name ?? "김성실"}입니다.\n\n${club.name} 활동 기록을 보다가 ${club.talking[0]} 이야기가 눈에 들어와서 연락드려요. 저희 쪽에서 ${flow.purpose} 드리려고 하는데, 관심 있으실까요?\n\n${club.running[0]} 쪽도 같이 이야기 나눠보면 좋을 것 같습니다. 편하신 때 알려주세요!\n\n${user?.name ?? "김성실"} 드림\n${user?.email ?? "startup@ssu.ac.kr"}`,
        createdAt: TODAY,
      };
      setMails((current) => [draft, ...current]);
      setFlow(null);
      addMessage({ role: "assistant", text: `${text.replace("하게", "한")} 톤으로 초안을 작성했습니다. 회장 연락처를 함께 넣었습니다.`, kind: "mail", mailId: draft.id, chips: ["다른 톤으로 다시 써줘", "다른 동아리에도 보내줘"] });
    }
  }

  function startMail(clubId?: string) {
    const targetId = clubId ?? lastMatch[0] ?? "k2";
    const club = clubsById.get(targetId) ?? CLUBS[1];
    setFlow({ kind: "mail", clubId: club.id });
    addMessage({ role: "assistant", text: `${club.name}(회장 ${club.head.name})에게 보낼 메일을 작성하겠습니다. 목적을 골라주세요.`, chips: ["협업 제안", "자료 요청", "행사 참여 요청"] });
  }

  function openClub(clubId: string) {
    setRecent((current) => [clubId, ...current.filter((id) => id !== clubId)].slice(0, 8));
  }

  function downloadPlan(plan: Plan) {
    const clubs = plan.clubIds.map((id) => clubsById.get(id)).filter((club): club is Club => Boolean(club));
    const usedAssets = plan.assetIds.map((id) => assets.find((asset) => asset.id === id)).filter((asset): asset is Asset => Boolean(asset));
    const html = `<html><head><meta charset="utf-8"></head><body><h1>${plan.title}</h1><p>창업지원단 · ${plan.createdAt}</p><h2>1. 사업 목적</h2><p>${plan.topic}을 통해 재학생의 창업 실행 경험을 확대한다.</p><h2>2. 대상 및 규모</h2><ul><li>대상: ${plan.target}</li><li>기간: ${plan.period}</li><li>예산: ${plan.budget}</li></ul><h2>3. 주요 내용</h2><ul><li>사전 수요조사 및 참가팀 모집</li><li>주차별 실습 중심 운영</li><li>멘토 1인당 2팀 배정</li><li>최종 발표회 및 만족도 조사</li></ul><h2>4. 기획 근거 - 동아리 활동</h2><ul>${clubs.map((club) => `<li>${club.name}: ${club.talking[0]} (근거 ${club.docs.length}건, 최근 ${club.docs[0].date})</li>`).join("")}</ul><h2>5. 기획 근거 - 창업지원단 자료</h2><ul>${usedAssets.map((asset) => `<li>${asset.event} ${asset.type}: ${asset.gist}</li>`).join("")}</ul></body></html>`;
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${plan.title}.doc`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    flash("기획안을 내려받았습니다");
  }

  function addAsset() {
    const asset: Asset = {
      id: uid("asset"),
      type: "기획안",
      year: 2026,
      event: "신규 등록 자료",
      file: "uploaded_program_plan.hwpx",
      gist: "업로드한 문서에서 행사명, 대상, 예산, 주요 내용을 구조화해 저장했습니다.",
    };
    setAssets((current) => [asset, ...current]);
    flash("창업지원단 자료를 등록했습니다");
  }

  if (!user) {
    return <AuthScreen joinMode={joinMode} setJoinMode={setJoinMode} onSubmit={login} />;
  }

  return (
    <>
      <div className="app">
        <Rail user={user} view={view} myTab={myTab} settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} onNavigate={(target) => {
          if (target === "chat") navigate({ view: "chat", clubPageId: null });
          else if (target === "clubs") navigate({ view: "clubs", clubPageId: null });
          else navigate({ view: "mypage", myTab: target, clubPageId: null });
        }} onLogout={logout} />
        <Sidebar
          open={sideOpen}
          sessions={sessions}
          activeId={activeId}
          user={user}
          view={view}
          planCount={plans.length}
          mailCount={mails.length}
          onView={(nextView) => {
            navigate({ view: nextView, clubPageId: nextView === "clubs" ? null : clubPageId });
            setSideOpen(false);
          }}
          onNew={newChat}
          onSelect={(id) => {
            setActiveId(id);
            navigate({ view: "chat", clubPageId: null });
            setSideOpen(false);
          }}
        />
        <main className="main">
          {view === "chat" && active ? (
            <ChatView
              active={active}
              clubsById={clubsById}
              plansById={plansById}
              mailsById={mailsById}
              assets={assets}
              onSend={sendText}
              onMenu={() => setSideOpen((current) => !current)}
              onClub={(id) => {
                openClub(id);
                navigate({ view: "clubs", clubPageId: id });
              }}
              onMail={startMail}
              onCopy={(mail) => navigator.clipboard?.writeText(mail.body).then(() => flash("본문을 복사했습니다"))}
              onDownload={downloadPlan}
              onGoMy={(tab) => {
                navigate({ view: "mypage", myTab: tab, clubPageId: null });
              }}
            />
          ) : null}
          {view === "clubs" ? (
            <ClubsView
              query={query}
              division={division}
              sort={sort}
              clubPageId={clubPageId}
              onQuery={setQuery}
              onDivision={setDivision}
              onSort={setSort}
              onBack={() => navigate({ view: "clubs", clubPageId: null }, true)}
              onMenu={() => setSideOpen((current) => !current)}
              onChat={() => navigate({ view: "chat", clubPageId: null })}
              onOpen={(id) => {
                openClub(id);
                navigate({ view: "clubs", clubPageId: id });
              }}
              onMail={(id) => {
                navigate({ view: "chat", clubPageId: null });
                startMail(id);
              }}
              onAsk={(id) => {
                navigate({ view: "chat", clubPageId: null });
                sendText(`${clubsById.get(id)?.name} 동아리 정보 알려줘`);
              }}
            />
          ) : null}
          {view === "mypage" ? (
            <MyPageView
              user={user}
              tab={myTab}
              setTab={setMyTab}
              plans={plans}
              mails={mails}
              assets={assets}
              recent={recent}
              clubsById={clubsById}
              mailsById={mailsById}
              onMenu={() => setSideOpen((current) => !current)}
              onChat={() => navigate({ view: "chat", clubPageId: null })}
              onAddAsset={addAsset}
              onDownload={downloadPlan}
              onCopy={(mail) => navigator.clipboard?.writeText(mail.body).then(() => flash("본문을 복사했습니다"))}
              onOpenClub={(id) => {
                openClub(id);
                navigate({ view: "clubs", clubPageId: id });
              }}
            />
          ) : null}
        </main>
      </div>
      <div className={toast ? "toast show" : "toast"}>{toast}</div>
    </>
  );
}

function AuthScreen({ joinMode, setJoinMode, onSubmit }: { joinMode: boolean; setJoinMode: (value: boolean) => void; onSubmit: (form: FormData) => void }) {
  return (
    <div className="auth">
      <form className="auth-card" action={onSubmit}>
        <div className="auth-logo">
          <div className="logo-mark">S</div>
          <b>슈메이트</b>
          <span>SSU-MATE</span>
        </div>
        <h1>{joinMode ? "회원가입" : "로그인"}</h1>
        <p className="sub">{joinMode ? "이름, 이메일, 직급, 부서를 입력하세요." : "창업지원단 계정으로 들어가세요."}</p>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!joinMode} onClick={() => setJoinMode(false)}>로그인</button>
          <button type="button" role="tab" aria-selected={joinMode} onClick={() => setJoinMode(true)}>회원가입</button>
        </div>
        {joinMode ? (
          <>
            <label className="field">이름<input name="name" placeholder="김성실" /></label>
            <div className="row2">
              <label className="field">직급<select name="rank"><option>팀원</option><option>과장</option><option>팀장</option><option>센터장</option><option>교수</option></select></label>
              <label className="field">부서<select name="department"><option>창업지원단</option><option>교수학습혁신센터</option><option>진로취업센터</option></select></label>
            </div>
          </>
        ) : null}
        <label className="field">이메일<input name="email" type="email" placeholder="name@ssu.ac.kr" defaultValue="startup@ssu.ac.kr" /></label>
        <button className="btn block" type="submit">{joinMode ? "가입하고 시작하기" : "로그인"}</button>
        <div className="auth-note">기능명세서를 화면으로 확인하는 프로토타입입니다. 실제 인증은 동작하지 않으며, 어떤 값을 넣어도 들어갈 수 있습니다.</div>
      </form>
    </div>
  );
}

function Rail({ user, view, myTab, settingsOpen, setSettingsOpen, onNavigate, onLogout }: { user: UserProfile; view: View; myTab: MyTab; settingsOpen: boolean; setSettingsOpen: (value: boolean) => void; onNavigate: (target: "chat" | "clubs" | MyTab) => void; onLogout: () => void }) {
  const items = [
    { key: "chat" as const, label: "AI 채팅", icon: MessageCircle },
    { key: "clubs" as const, label: "동아리", icon: Grid2X2 },
    { key: "plans" as const, label: "기획안", icon: FileText },
    { key: "mails" as const, label: "협업 메일", icon: Mail },
    { key: "briefs" as const, label: "브리핑", icon: Bell },
  ];
  return (
    <nav className="rail" aria-label="주요 메뉴">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = view === item.key || (view === "mypage" && myTab === item.key);
        return (
          <button key={item.key} className="rail-item" aria-current={selected} onClick={() => onNavigate(item.key)}>
            <span className="ico"><Icon size={19} /></span><span className="lb">{item.label}</span>
          </button>
        );
      })}
      <div className="rail-spacer" />
      <div className="settings-wrap">
        <button className="rail-item" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>
          <span className="ico"><Settings size={19} /></span><span className="lb">설정</span>
        </button>
        {settingsOpen ? (
          <div className="popmenu">
            <div className="em"><b>{user.name} {user.rank}</b>{user.email}</div>
            <button onClick={onLogout}><LogOut size={17} />로그아웃</button>
          </div>
        ) : null}
      </div>
      <div className="avatar">{user.name[0]}</div>
    </nav>
  );
}

function Sidebar({ open, sessions, activeId, user, view, planCount, mailCount, onView, onNew, onSelect }: { open: boolean; sessions: ChatSession[]; activeId: string | null; user: UserProfile; view: View; planCount: number; mailCount: number; onView: (view: View) => void; onNew: () => void; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const list = sessions.filter((session) => !search || session.title.includes(search));
  return (
    <aside className={open ? "side open" : "side"}>
      <div className="side-top"><label className="search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="대화 검색" /></label></div>
      <div className="side-sec">
        <h4>메뉴</h4>
        <button className="navi" aria-current={view === "chat"} onClick={() => onView("chat")}><MessageCircle size={15} />채팅<span>{sessions.length}</span></button>
        <button className="navi" aria-current={view === "clubs"} onClick={() => onView("clubs")}><Grid2X2 size={15} />동아리 탐색<span>{CLUBS.length}</span></button>
        <button className="navi" aria-current={view === "mypage"} onClick={() => onView("mypage")}><FileText size={15} />마이페이지<span>{planCount + mailCount}</span></button>
      </div>
      <div className="side-sec side-heading"><h4>대화</h4><button className="btn ghost sm" onClick={onNew}><Plus size={13} />새 대화</button></div>
      <div className="sessions">
        {list.length ? list.map((session) => {
          const last = session.messages.at(-1)?.text ?? "아직 대화가 없습니다";
          return <button key={session.id} className="sess" aria-current={session.id === activeId} onClick={() => onSelect(session.id)}><span className="t">{session.title}</span><span className="d">{last}</span></button>;
        }) : <div className="empty-small">검색 결과가 없습니다.</div>}
      </div>
      <div className="side-bot"><div className="avatar">{user.name[0]}</div><div><div className="n">{user.name}</div><div className="m">{user.department} · {user.rank}</div></div></div>
    </aside>
  );
}

function ChatView({ active, clubsById, plansById, mailsById, assets, onSend, onMenu, onClub, onMail, onCopy, onDownload, onGoMy }: { active: ChatSession; clubsById: Map<string, Club>; plansById: Map<string, Plan>; mailsById: Map<string, MailDraft>; assets: Asset[]; onSend: (text: string) => void; onMenu: () => void; onClub: (id: string) => void; onMail: (id?: string) => void; onCopy: (mail: MailDraft) => void; onDownload: (plan: Plan) => void; onGoMy: (tab: MyTab) => void }) {
  const empty = active.messages.length === 0;
  const chatWrapRef = useRef<HTMLDivElement>(null);
  const lastMessageId = active.messages.at(-1)?.id;

  useEffect(() => {
    const chatWrap = chatWrapRef.current;
    if (!chatWrap) return;

    requestAnimationFrame(() => {
      chatWrap.scrollTo({
        top: chatWrap.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [active.id, lastMessageId]);

  return (
    <>
      <Topbar onMenu={onMenu} title="슈메이트 에이전트" subtitle={`동아리 데이터 ${CLUBS.length}곳 · 창업지원단 자료 ${assets.length}건 연결됨`} icon={<Bot size={17} />} />
      {empty ? <HomeComposer onSend={onSend} assetCount={assets.length} /> : (
        <>
          <div className="chatwrap" ref={chatWrapRef}><div className="msgs">
            {active.messages.map((message) => (
              <MessageBubble key={message.id} message={message} clubsById={clubsById} plansById={plansById} mailsById={mailsById} onSend={onSend} onClub={onClub} onMail={onMail} onCopy={onCopy} onDownload={onDownload} onGoMy={onGoMy} />
            ))}
          </div></div>
          <Composer onSend={onSend} />
        </>
      )}
    </>
  );
}

function Topbar({ title, subtitle, icon, onMenu, actions }: { title: string; subtitle: string; icon?: React.ReactNode; onMenu: () => void; actions?: React.ReactNode }) {
  return (
    <div className="topbar">
      <button className="iconbtn mobonly" onClick={onMenu} aria-label="대화 목록 열기"><Menu size={18} /></button>
      {icon ? <div className="avatar pale">{icon}</div> : null}
      <div className="who"><div><div className="n">{title}</div><div className="s"><span className="dot" />{subtitle}</div></div></div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

function HomeComposer({ onSend, assetCount }: { onSend: (text: string) => void; assetCount: number }) {
  return (
    <div className="home"><div className="home-in">
      <h1 className="hero">무엇이든 편하게 시작해 보세요.</h1>
      <ComposerFrame onSend={onSend} placeholder="동아리를 찾거나, 기획안·협업 메일 작성을 요청해 보세요" footer={`동아리 10곳 · 창업지원단 자료 ${assetCount}건`} />
      <div className="quick">{QUICK.map((item) => {
        const Icon = item.icon;
        return <button className="qc" key={item.title} onClick={() => onSend(item.query)}><Icon size={19} /><b>{item.title}</b><span>{item.desc}</span></button>;
      })}</div>
      <div className="homefoot"><b>모든 답변에 근거가 붙습니다</b><span>활동보고서와 회의록의 시점·건수를 함께 보여줍니다</span></div>
    </div></div>
  );
}

function Composer({ onSend }: { onSend: (text: string) => void }) {
  return <div className="composer"><ComposerFrame onSend={onSend} placeholder="다음에 할 일을 알려주세요" footer="근거 기반 응답" compact /><div className="hint">답변의 수치는 활동보고서·회의록에서 추출한 값입니다.</div></div>;
}

function ComposerFrame({ onSend, placeholder, footer, compact = false }: { onSend: (text: string) => void; placeholder: string; footer: string; compact?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);
  const lastSubmitRef = useRef({ text: "", at: 0 });
  const [allowExternalSearch, setAllowExternalSearch] = useState(false);
  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
    const maxHeight = Number.isFinite(lineHeight) ? lineHeight * 10 : 240;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };
  const clearTextarea = () => {
    if (!ref.current) return;
    ref.current.value = "";
    ref.current.style.height = compact ? "24px" : "52px";
    ref.current.style.overflowY = "hidden";
  };
  const submit = () => {
    const text = ref.current?.value.trim() ?? "";
    if (!text) return;

    const nowTime = Date.now();
    if (lastSubmitRef.current.text === text && nowTime - lastSubmitRef.current.at < 500) return;
    lastSubmitRef.current = { text, at: nowTime };

    onSend(text);
    clearTextarea();
  };

  return (
    <div className={compact ? `box composer-box${allowExternalSearch ? " external-on" : ""}` : "glow"}><div className={compact ? "" : "homebox"}>
      <textarea ref={ref} rows={compact ? 1 : 2} placeholder={placeholder} onCompositionStart={() => {
        isComposingRef.current = true;
      }} onCompositionEnd={() => {
        isComposingRef.current = false;
      }} onInput={(event) => resizeTextarea(event.currentTarget)} onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey && !event.repeat && !event.nativeEvent.isComposing && !isComposingRef.current) {
          event.preventDefault();
          submit();
        }
      }} />
      <div className="composer-actions">
        <button type="button" className="modechip">{footer}</button>
        <button
          type="button"
          className={allowExternalSearch ? "search-toggle on" : "search-toggle"}
          aria-pressed={allowExternalSearch}
          onClick={() => setAllowExternalSearch((current) => !current)}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span>{allowExternalSearch ? "AI 외부 검색 허용" : "AI 내부 문서 검색"}</span>
        </button>
        <button type="button" className="sendbtn" aria-label="보내기" onClick={() => {
          submit();
        }}><Send size={16} /></button>
      </div>
    </div></div>
  );
}

function MessageBubble(props: { message: ChatMessage; clubsById: Map<string, Club>; plansById: Map<string, Plan>; mailsById: Map<string, MailDraft>; onSend: (text: string) => void; onClub: (id: string) => void; onMail: (id?: string) => void; onCopy: (mail: MailDraft) => void; onDownload: (plan: Plan) => void; onGoMy: (tab: MyTab) => void }) {
  const { message } = props;
  const isUser = message.role === "user";
  return (
    <>
      <div className={isUser ? "msg me" : "msg ai"}>
        {!isUser ? <div className="avatar pale">S</div> : null}
        <div className="bub">
          <p>{message.text}</p>
          <MessageAttachment {...props} />
          <span className="time">{message.time}</span>
        </div>
      </div>
      {!isUser && message.chips?.length ? <div className="chips">{message.chips.map((chip) => <button className="chip" key={chip} onClick={() => props.onSend(chip)}>{chip}</button>)}</div> : null}
    </>
  );
}

function MessageAttachment({ message, clubsById, plansById, mailsById, onClub, onMail, onCopy, onDownload, onGoMy }: Parameters<typeof MessageBubble>[0]) {
  if (message.kind === "match") {
    return <div className="card reclist">{message.clubIds?.map((id) => clubsById.get(id)).filter((club): club is Club => Boolean(club)).map((club) => <Recommendation key={club.id} club={club} onClub={onClub} onMail={onMail} />)}</div>;
  }
  if (message.kind === "profile") {
    const club = message.clubIds?.[0] ? clubsById.get(message.clubIds[0]) : undefined;
    return club ? <ProfileCard club={club} onClub={onClub} onMail={onMail} /> : null;
  }
  if (message.kind === "plan" && message.planId) {
    const plan = plansById.get(message.planId);
    return plan ? <PlanCard plan={plan} onDownload={onDownload} onGoMy={() => onGoMy("plans")} /> : null;
  }
  if (message.kind === "mail" && message.mailId) {
    const mail = mailsById.get(message.mailId);
    const club = mail ? CLUBS.find((item) => item.id === mail.clubId) : undefined;
    return mail && club ? <MailCard mail={mail} club={club} onCopy={onCopy} onGoMy={() => onGoMy("mails")} /> : null;
  }
  return null;
}

function MiniChart({ club, big = false }: { club: Club; big?: boolean }) {
  const max = Math.max(...club.activity, 1);
  return (
    <>
      <div className={big ? "mini big" : "mini"}>{club.activity.map((value, index) => <i key={`${club.id}-${MONTHS[index]}`} className={value >= max ? "hot" : ""} style={{ height: `${Math.max(3, Math.round((value / max) * (big ? 76 : 44)))}px` }} />)}</div>
      <div className="mini-x">{MONTHS.map((month) => <span key={month}>{month.replace("월", "")}</span>)}</div>
    </>
  );
}

function Recommendation({ club, onClub, onMail }: { club: Club; onClub: (id: string) => void; onMail: (id?: string) => void }) {
  return (
    <div className="rec">
      <div className="rec-head"><b>{club.name}</b><span className="badge gray">{club.division}</span>{recentCount(club) >= 6 ? <span className="badge green">최근 활동 활발</span> : null}</div>
      <div className="why">{club.running[0]} · {club.talking[0]}</div>
      <div className="ev"><span>근거 자료 {club.docs.length}건</span><span>최근 자료 {club.docs[0].date}</span><span>마지막 활동 {lastActive(club)}</span><span>정회원 {club.members}명</span></div>
      <div className="cta"><button className="btn ghost sm" onClick={() => onClub(club.id)}>프로필 보기</button><button className="btn ghost sm" onClick={() => onMail(club.id)}>협업 메일</button></div>
    </div>
  );
}

function ProfileCard({ club, onClub, onMail }: { club: Club; onClub: (id: string) => void; onMail: (id?: string) => void }) {
  return (
    <div className="card">
      <h5>{club.name} <span className="badge gray">{club.division}</span></h5>
      <div className="meta">{club.intro}</div>
      <div className="chart-title">최근 12개월 월별 활동 현황 · 총 {totalCount(club)}건</div>
      <MiniChart club={club} />
      <dl className="kv"><dt>회장</dt><dd>{club.head.name} · {club.head.email} · {club.head.phone}</dd><dt>규모</dt><dd>정회원 {club.members}명</dd><dt>진행 중</dt><dd>{club.running.join(" / ")}</dd><dt>논의 중</dt><dd>{club.talking.join(" / ")}</dd></dl>
      <EvidenceList club={club} />
      <div className="cta"><button className="btn ghost sm" onClick={() => onClub(club.id)}>동아리 탐색으로 보기</button><button className="btn ghost sm" onClick={() => onMail(club.id)}>협업 메일 작성</button></div>
    </div>
  );
}

function EvidenceList({ club }: { club: Club }) {
  return <div className="evlist"><div className="meta">근거 자료 {club.docs.length}건</div>{club.docs.slice(0, 3).map((doc) => <div className="e" key={doc.title}><span className="tag">{doc.type}</span><span className="tx">{doc.title}</span><span className="dt">{doc.date}</span></div>)}</div>;
}

function PlanCard({ plan, onDownload, onGoMy }: { plan: Plan; onDownload: (plan: Plan) => void; onGoMy: () => void }) {
  const clubs = plan.clubIds.map((id) => CLUBS.find((club) => club.id === id)).filter((club): club is Club => Boolean(club));
  return (
    <div className="card"><div className="doc">
      <h6>{plan.title}</h6><div className="dmeta">창업지원단 · 작성 {plan.createdAt}</div>
      <strong>1. 사업 목적</strong><ul><li>{plan.topic}을 통해 재학생의 창업 실행 경험을 확대한다.</li><li>동아리 단위로 이미 형성된 활동을 사업화 단계로 연결한다.</li></ul>
      <strong>2. 대상 및 규모</strong><ul><li>대상: {plan.target}</li><li>기간: {plan.period}</li><li>예산: {plan.budget}</li></ul>
      <strong>3. 주요 내용</strong><ul><li>사전 수요조사 및 참가팀 모집</li><li>주차별 실습 중심 운영, 회차당 3시간</li><li>멘토 1인당 2팀 배정 후 개별 피드백</li><li>최종 발표회 및 만족도 조사</li></ul>
      <strong>4. 기획 근거 - 동아리 활동</strong><ul>{clubs.map((club) => <li key={club.id}>{club.name}: {club.talking[0]} (근거 {club.docs.length}건, 최근 {club.docs[0].date})</li>)}</ul>
    </div><div className="cta"><button className="btn ghost sm" onClick={() => onDownload(plan)}><Download size={13} />DOC 내려받기</button><button className="btn ghost sm" onClick={onGoMy}>내 기획안에서 보기</button></div></div>
  );
}

function MailCard({ mail, club, onCopy, onGoMy }: { mail: MailDraft; club: Club; onCopy: (mail: MailDraft) => void; onGoMy: () => void }) {
  return <div className="card"><div className="mailbox"><div className="mh"><div><span>받는이</span>{club.head.email} ({club.name} 회장)</div><div><span>연락처</span>{club.head.phone}</div><div><span>제목</span>{mail.subject}</div></div><div className="mb">{mail.body}</div></div><div className="cta"><button className="btn ghost sm" onClick={() => onCopy(mail)}><Copy size={13} />본문 복사</button><button className="btn ghost sm" onClick={onGoMy}>메일 이력에서 보기</button></div></div>;
}

function ClubsView({ query, division, sort, clubPageId, onQuery, onDivision, onSort, onBack, onMenu, onChat, onOpen, onMail, onAsk }: { query: string; division: string; sort: string; clubPageId: string | null; onQuery: (query: string) => void; onDivision: (division: string) => void; onSort: (sort: string) => void; onBack: () => void; onMenu: () => void; onChat: () => void; onOpen: (id: string) => void; onMail: (id: string) => void; onAsk: (id: string) => void }) {
  const clubPage = clubPageId ? CLUBS.find((club) => club.id === clubPageId) : null;
  if (clubPage) return <ClubDetail club={clubPage} onBack={onBack} onMail={onMail} onAsk={onAsk} onMenu={onMenu} />;
  const list = CLUBS.filter((club) => {
    const text = `${club.name} ${club.intro} ${club.tags.join(" ")} ${club.running.join(" ")} ${club.talking.join(" ")}`.toLowerCase();
    return (division === "전체" || club.division === division) && (!query || text.includes(query.toLowerCase()));
  }).sort((a, b) => sort === "docs" ? b.docs.length - a.docs.length : sort === "size" ? b.members - a.members : sort === "name" ? a.name.localeCompare(b.name, "ko") : recentCount(b) - recentCount(a));
  return (
    <>
      <Topbar onMenu={onMenu} title="동아리 탐색" subtitle={`중앙동아리 ${CLUBS.length}곳 · 활동보고서·회의록 ${CLUBS.reduce((sum, club) => sum + club.docs.length, 0)}건 기준`} actions={<button className="btn ghost sm" onClick={onChat}>채팅으로 물어보기</button>} />
      <div className="mp"><div className="mp-in">
        <div className="filterbar"><label className="search"><Search size={14} /><input placeholder="동아리명, 활동 내용, 논의 주제로 검색" value={query} onChange={(event) => onQuery(event.target.value)} /></label><select value={sort} onChange={(event) => onSort(event.target.value)}><option value="recent">최근 활동순</option><option value="docs">근거 자료 많은순</option><option value="size">규모순</option><option value="name">이름순</option></select></div>
        <div className="divchips">{["전체", ...DIVISIONS.filter((item) => CLUBS.some((club) => club.division === item))].map((item) => <button key={item} className="dchip" aria-pressed={division === item} onClick={() => onDivision(item)}>{item}</button>)}</div>
        {list.length ? <div className="clubgrid">{list.map((club) => <ClubCard key={club.id} club={club} onOpen={onOpen} onMail={onMail} />)}</div> : <div className="mp-empty"><b>조건에 맞는 동아리가 없습니다</b>검색어를 지우거나 분과를 전체로 되돌려 보세요.</div>}
      </div></div>
    </>
  );
}

function ClubCard({ club, onOpen, onMail }: { club: Club; onOpen: (id: string) => void; onMail: (id: string) => void }) {
  return (
    <article
      className="ccard"
      role="button"
      tabIndex={0}
      aria-label={`${club.name} 자세히 보기`}
      onClick={() => onOpen(club.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(club.id);
        }
      }}
    >
      <div className="ch"><div className="avatar pale">{club.name[0]}</div><div><b>{club.name}</b><span>{club.division} · 정회원 {club.members}명</span></div>{recentCount(club) >= 8 ? <span className="badge green">활발</span> : null}</div>
      <p>{club.intro}</p>
      <MiniChart club={club} />
      <div className="tags">{club.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="foot"><span>근거 {club.docs.length}건</span><span>최근 {club.docs[0].date}</span><span>마지막 활동 {lastActive(club)}</span></div>
      <div className="cta">
        <button className="btn ghost sm" onClick={(event) => {
          event.stopPropagation();
          onMail(club.id);
        }}>협업 메일</button>
      </div>
    </article>
  );
}

function ClubDetail({ club, onBack, onMail, onAsk, onMenu }: { club: Club; onBack: () => void; onMail: (id: string) => void; onAsk: (id: string) => void; onMenu: () => void }) {
  return (
    <>
      <div className="topbar"><button className="iconbtn mobonly" onClick={onMenu}><Menu size={18} /></button><button className="btn ghost sm" onClick={onBack}>목록</button><div className="who"><div><div className="n">{club.name}</div><div className="s">{club.division}</div></div></div></div>
      <div className="mp"><div className="mp-in"><div className="cd-head"><div className="avatar">{club.name[0]}</div><div><h1>{club.name}</h1><p>{club.intro}</p></div></div><div className="statline"><div><span>정회원</span><b>{club.members}명</b></div><div><span>12개월 활동</span><b>{totalCount(club)}건</b></div><div><span>활동보고서</span><b>{club.docs.filter((doc) => doc.type === "활동보고서").length}건</b></div><div><span>회의록</span><b>{club.docs.filter((doc) => doc.type === "회의록").length}건</b></div><div><span>마지막 활동</span><b>{lastActive(club)}</b></div></div><div className="cd-grid"><div><div className="box"><h3>최근 12개월 월별 활동 현황</h3><MiniChart club={club} big /></div><div className="box"><h3>근거 자료 {club.docs.length}건</h3>{club.docs.map((doc) => <div className="docrow" key={doc.title}><span className={`badge ${doc.type === "회의록" ? "amber" : "gray"}`}>{doc.type}</span><span>{doc.title}</span><small>{doc.date}</small></div>)}</div></div><div><div className="box"><h3>현재 진행 중인 활동</h3>{club.running.map((item) => <div className="li" key={item}>{item}</div>)}</div><div className="box"><h3>회의록에서 논의 중</h3>{club.talking.map((item) => <div className="li" key={item}>{item}</div>)}</div><div className="box"><h3>연락처</h3><div className="rrow"><span>회장</span>{club.head.name}</div><div className="rrow"><span>이메일</span>{club.head.email}</div><div className="rrow"><span>전화</span>{club.head.phone}</div><button className="btn block" onClick={() => onMail(club.id)}>협업 메일 작성</button></div><div className="box"><h3>활동 분야</h3><div className="tags">{club.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button className="btn ghost sm wide" onClick={() => onAsk(club.id)}>채팅에서 이 동아리로 물어보기</button></div></div></div></div></div>
    </>
  );
}

function MyPageView({ user, tab, setTab, plans, mails, assets, recent, clubsById, onMenu, onChat, onAddAsset, onDownload, onCopy, onOpenClub }: { user: UserProfile; tab: MyTab; setTab: (tab: MyTab) => void; plans: Plan[]; mails: MailDraft[]; assets: Asset[]; recent: string[]; clubsById: Map<string, Club>; mailsById: Map<string, MailDraft>; onMenu: () => void; onChat: () => void; onAddAsset: () => void; onDownload: (plan: Plan) => void; onCopy: (mail: MailDraft) => void; onOpenClub: (id: string) => void }) {
  const tabs: { key: MyTab; label: string; count: number }[] = [
    { key: "plans", label: "내 기획안", count: plans.length },
    { key: "mails", label: "협업 메일 이력", count: mails.length },
    { key: "assets", label: "창업지원단 자료", count: assets.length },
    { key: "briefs", label: "활동 브리핑", count: INITIAL_BRIEFS.length },
    { key: "recent", label: "최근 조회한 동아리", count: recent.length },
  ];
  return (
    <>
      <Topbar onMenu={onMenu} title="마이페이지" subtitle={`${user.department} · ${user.name} ${user.rank}`} actions={<button className="btn ghost sm" onClick={onChat}>채팅으로 돌아가기</button>} />
      <div className="mp"><div className="mp-in"><h1>{tabs.find((item) => item.key === tab)?.label}</h1><p className="sub">채팅에서 만들거나 조회한 내용을 여기서 다시 확인합니다.</p><div className="mtabs">{tabs.map((item) => <button key={item.key} aria-selected={tab === item.key} onClick={() => setTab(item.key)}>{item.label}<span>{item.count}</span></button>)}</div>
        {tab === "plans" ? <PlansTab plans={plans} clubsById={clubsById} onDownload={onDownload} onChat={onChat} /> : null}
        {tab === "mails" ? <MailsTab mails={mails} clubsById={clubsById} onCopy={onCopy} /> : null}
        {tab === "assets" ? <AssetsTab assets={assets} onAddAsset={onAddAsset} /> : null}
        {tab === "briefs" ? <BriefsTab /> : null}
        {tab === "recent" ? <RecentTab recent={recent} clubsById={clubsById} onOpenClub={onOpenClub} /> : null}
      </div></div>
    </>
  );
}

function PlansTab({ plans, clubsById, onDownload, onChat }: { plans: Plan[]; clubsById: Map<string, Club>; onDownload: (plan: Plan) => void; onChat: () => void }) {
  if (!plans.length) return <div className="mp-empty"><b>아직 만든 기획안이 없습니다</b>채팅에서 “기획안 작성해줘”라고 요청하면 여기에 쌓입니다.</div>;
  return plans.map((plan) => <div className="item" key={plan.id}><div className="ih"><b>{plan.title}</b><span>{plan.createdAt}</span></div><div className="facts"><div><span>대상</span>{plan.target}</div><div><span>기간</span>{plan.period}</div><div><span>예산</span>{plan.budget}</div><div><span>근거</span>동아리 {plan.clubIds.length}곳 · 내부자료 {plan.assetIds.length}건</div></div><p>기획 근거: {plan.clubIds.map((id) => clubsById.get(id)?.name).filter(Boolean).join(", ")}</p><div className="cta"><button className="btn ghost sm" onClick={() => onDownload(plan)}>DOC 다운로드</button><button className="btn ghost sm" onClick={onChat}>채팅에서 이어서 수정</button></div></div>);
}

function MailsTab({ mails, clubsById, onCopy }: { mails: MailDraft[]; clubsById: Map<string, Club>; onCopy: (mail: MailDraft) => void }) {
  if (!mails.length) return <div className="mp-empty"><b>작성한 협업 메일이 없습니다</b>동아리 추천 결과에서 “협업 메일 작성”을 누르면 초안이 여기에 저장됩니다.</div>;
  return mails.map((mail) => { const club = clubsById.get(mail.clubId); return <div className="item" key={mail.id}><div className="ih"><b>{club?.name}</b><span className="badge gray">{mail.purpose}</span><span className="badge">{mail.tone}</span><span>{mail.createdAt}</span></div><p>{mail.subject}</p><div className="facts"><div><span>받는이</span>{club?.head.email}</div><div><span>연락처</span>{club?.head.phone}</div></div><div className="cta"><button className="btn ghost sm" onClick={() => onCopy(mail)}>본문 복사</button></div></div>; });
}

function AssetsTab({ assets, onAddAsset }: { assets: Asset[]; onAddAsset: () => void }) {
  return <><div className="upzone"><p>기획안·운영안·결과보고서·만족도조사를 등록하세요</p><small>등록한 자료는 기획안 생성 시 과거 사례 근거로 사용됩니다. HWPX · DOCX · PDF</small><button className="btn" onClick={onAddAsset}>자료 등록</button></div>{assets.map((asset) => <div className="item" key={asset.id}><div className="ih"><b>{asset.event}</b><span className="badge gray">{asset.type}</span><span>{asset.year}</span></div><p>{asset.gist}</p><div className="facts"><div><span>파일</span>{asset.file}</div></div></div>)}</>;
}

function BriefsTab() {
  return <>{INITIAL_BRIEFS.map((brief) => <div className="brief" key={brief.club}><b>{brief.club}</b><span>{brief.when}</span><div>{brief.what}</div><small>매칭 근거 {brief.from}건 → {brief.to}건으로 증가</small></div>)}<p className="muted">2차 확장에서 월 1회 자동 수집이 붙으면 이 목록이 자동으로 갱신됩니다.</p></>;
}

function RecentTab({ recent, clubsById, onOpenClub }: { recent: string[]; clubsById: Map<string, Club>; onOpenClub: (id: string) => void }) {
  if (!recent.length) return <div className="mp-empty"><b>최근 조회한 동아리가 없습니다</b>채팅에서 동아리 프로필을 열면 여기에 기록됩니다.</div>;
  return <div className="grid3">{recent.map((id) => { const club = clubsById.get(id); return club ? <button className="tile" key={id} onClick={() => onOpenClub(id)}><b>{club.name}</b><span>{club.division} · 정회원 {club.members}명</span><span>근거 {club.docs.length}건 · 최근 {club.docs[0].date}</span></button> : null; })}</div>;
}
