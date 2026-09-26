"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, Clock3, LoaderCircle, MapPin, Navigation, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabase";

type RequestItem = {
	id: string;
	task: string | null;
	booking_date: string | null;
	booking_time: string | null;
	start_location: string | null;
	destination: string | null;
	duration: string | null;
	status: string | null;
};

type CompanionData = {
	name: string;
	serviceAreas: string[];
	openRequests: RequestItem[];
	myRequests: RequestItem[];
};

type Notice = { type: "success" | "error"; message: string };

const taskLabels: Record<string, string> = {
	hospital: "ไปโรงพยาบาล",
	bank: "ไปธนาคาร",
	government: "ติดต่อหน่วยงานราชการ",
	"public-venue": "ไปสถานที่สาธารณะ",
	other: "ธุระอื่น ๆ",
};

const durationLabels: Record<string, string> = {
	"1-2": "1–2 ชั่วโมง",
	"3-4": "3–4 ชั่วโมง",
	"half-day": "ครึ่งวัน",
	"full-day": "เต็มวัน",
};

export default function CompanionHomePage() {
	const [data, setData] = useState<CompanionData>({ name: "Companion", serviceAreas: [], openRequests: [], myRequests: [] });
	const [isLoading, setIsLoading] = useState(true);
	const [acceptingId, setAcceptingId] = useState<string | null>(null);
	const [notice, setNotice] = useState<Notice | null>(null);

	useEffect(() => {
		async function loadDashboard() {
			const { data: authData, error: authError } = await supabase.auth.getUser();
			if (authError || !authData.user) {
				setNotice({ type: "error", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน Companion Dashboard" });
				setIsLoading(false);
				return;
			}

			const userId = authData.user.id;
			const [profileResult, companionProfileResult, openRequestsResult, myRequestsResult] = await Promise.all([
				supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
				supabase.from("companion_profiles").select("service_area").eq("user_id", userId).maybeSingle(),
				supabase.from("booking_request").select("id, task, booking_date, booking_time, start_location, destination, duration, status").eq("status", "pending").order("booking_date", { ascending: true }).order("booking_time", { ascending: true }).limit(4),
				supabase.from("booking_request").select("id, task, booking_date, booking_time, start_location, destination, duration, status").eq("companion_id", userId).in("status", ["accepted", "completed"]).order("booking_date", { ascending: true }).order("booking_time", { ascending: true }),
			]);

			if (profileResult.error || companionProfileResult.error || openRequestsResult.error || myRequestsResult.error) {
				setNotice({ type: "error", message: "ไม่สามารถโหลดข้อมูล Dashboard ได้ กรุณาลองใหม่อีกครั้ง" });
			} else {
				setData({
					name: profileResult.data?.full_name || "Companion",
					serviceAreas: toList(companionProfileResult.data?.service_area),
					openRequests: (openRequestsResult.data ?? []) as RequestItem[],
					myRequests: (myRequestsResult.data ?? []) as RequestItem[],
				});
			}
			setIsLoading(false);
		}

		void loadDashboard();
	}, []);

	async function acceptRequest(request: RequestItem) {
		const { data: authData } = await supabase.auth.getUser();
		if (!authData.user) {
			setNotice({ type: "error", message: "ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง" });
			return;
		}

		setAcceptingId(request.id);
		setNotice(null);
		const { data: updatedRequest, error } = await supabase
			.from("booking_request")
			.update({ status: "accepted", companion_id: authData.user.id })
			.eq("id", request.id)
			.eq("status", "pending")
			.select("id, task, booking_date, booking_time, start_location, destination, duration, status")
			.maybeSingle();

		if (error) {
			setNotice({ type: "error", message: "ไม่สามารถรับงานได้ กรุณาลองใหม่อีกครั้ง" });
		} else if (!updatedRequest) {
			setData((current) => ({ ...current, openRequests: current.openRequests.filter((item) => item.id !== request.id) }));
			setNotice({ type: "error", message: "งานนี้ถูกรับไปแล้ว หรือไม่อยู่ในสถานะว่าง" });
		} else {
			setData((current) => ({ ...current, openRequests: current.openRequests.filter((item) => item.id !== request.id), myRequests: [...current.myRequests, updatedRequest as RequestItem] }));
			setNotice({ type: "success", message: "รับงานเรียบร้อยแล้ว งานนี้ถูกเพิ่มในตารางของคุณ" });
		}
		setAcceptingId(null);
	}

	const acceptedCount = data.myRequests.filter((request) => request.status === "accepted").length;
	const completedCount = data.myRequests.filter((request) => request.status === "completed").length;
	const upcomingRequests = data.myRequests.filter((request) => request.status === "accepted" && isUpcoming(request.booking_date));
	const isBusy = upcomingRequests.length > 0;

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-7xl">
				<header className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
					<div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Companion workspace</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">สวัสดี, {data.name}</h1><div className="mt-4 flex flex-wrap items-center gap-3"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${isBusy ? "bg-[#f8e6c8] text-[#8f682b]" : "bg-[#dceee7] text-[#467267]"}`}><span className={`size-2 rounded-full ${isBusy ? "bg-[#c4882d]" : "bg-[#5e9b83]"}`} />{isBusy ? "Busy" : "Available"}</span><span className="text-sm text-[#63746e]">{isBusy ? "คุณมีงานที่กำลังจะมาถึง" : "พร้อมรับงานใหม่ที่เหมาะกับคุณ"}</span></div></div>
					<div className="flex flex-col gap-3 sm:flex-row"><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-sm font-semibold text-[#304640] shadow-sm transition hover:border-[#b9ccc2] hover:text-[#18302b]"><ArrowLeft size={16} />กลับหน้าหลัก</Link><Link href="/companion/profile" aria-label="ไปหน้าโปรไฟล์ Companion" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-sm font-semibold text-[#304640] shadow-sm transition hover:border-[#b9ccc2] hover:text-[#18302b]"><UserRound size={16} />ไปหน้าโปรไฟล์</Link><Link href="/companion/requests" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18302b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26453d]"><BriefcaseBusiness size={16} />ดูรายการงานทั้งหมด</Link></div>
				</header>

				{notice ? <div role={notice.type === "error" ? "alert" : "status"} className={`mt-7 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6 ${notice.type === "success" ? "bg-[#edf6f1] text-[#356b5b]" : "bg-[#fff0ed] text-[#a64a3c]"}`}>{notice.type === "success" ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" /> : <TriangleAlert size={19} className="mt-0.5 shrink-0" />}{notice.message}</div> : null}

				<section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="สรุปสถิติการให้บริการ"><SummaryCard icon={<CheckCircle2 size={21} />} label="งานที่ตอบรับแล้ว" value={acceptedCount} tone="green" /><SummaryCard icon={<Check size={21} />} label="งานที่ให้บริการเสร็จสิ้น" value={completedCount} tone="lavender" /><SummaryCard icon={<MapPin size={21} />} label="พื้นที่บริการปัจจุบัน" value={data.serviceAreas.length} detail={data.serviceAreas.length ? data.serviceAreas.slice(0, 2).join(", ") : "ยังไม่ได้ระบุพื้นที่"} tone="gold" /></section>

				<div className="mt-8 grid gap-8 xl:grid-cols-[1.35fr_0.85fr]">
					<section className="rounded-4xl border border-[#e4e8e1] bg-white shadow-[0_15px_45px_rgba(36,67,57,0.06)]"><div className="flex items-start justify-between gap-4 p-6 sm:p-7"><div><div className="flex items-center gap-2 text-[#467267]"><Sparkles size={18} /><p className="text-xs font-bold uppercase tracking-[0.15em]">New opportunities</p></div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">งานใหม่ที่น่าสนใจ</h2><p className="mt-2 text-sm text-[#63746e]">คำขอจาก Customer ที่ยังรอ Companion</p></div><Link href="/companion/requests" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#467267] hover:text-[#18302b]">ดูทั้งหมด<ArrowRight size={16} /></Link></div>{isLoading ? <LoadingState /> : data.openRequests.length === 0 ? <EmptyState icon={<Sparkles size={28} />} title="ยังไม่มีงานใหม่ในตอนนี้" detail="กลับมาเช็กอีกครั้งเมื่อมีคำขอใหม่เข้ามา" /> : <div className="grid gap-4 border-t border-[#edf0eb] p-5 sm:p-6">{data.openRequests.map((request) => <OpportunityCard key={request.id} request={request} isAccepting={acceptingId === request.id} onAccept={acceptRequest} />)}</div>}</section>

					<section className="rounded-4xl border border-[#e4e8e1] bg-[#18302b] p-6 text-white shadow-[0_15px_45px_rgba(36,67,57,0.12)] sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[#f1bd5d]"><CalendarDays size={18} /><p className="text-xs font-bold uppercase tracking-[0.15em]">Upcoming schedule</p></div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">ตารางงานใกล้ถึง</h2></div><span className="rounded-full bg-[#31534a] px-3 py-1 text-xs font-semibold text-[#dceee7]">{upcomingRequests.length} งาน</span></div>{isLoading ? <div className="flex justify-center py-14 text-[#f1bd5d]"><LoaderCircle size={30} className="animate-spin" /></div> : upcomingRequests.length === 0 ? <div className="mt-8 rounded-2xl border border-[#31534a] bg-[#23453c] p-5 text-sm leading-6 text-[#b6c9c0]">ยังไม่มีงานที่กำลังจะถึง กดรับงานใหม่เพื่อเติมตารางของคุณ</div> : <div className="mt-7 space-y-4">{upcomingRequests.map((request) => <ScheduleItem key={request.id} request={request} />)}</div>}<Link href="/companion/requests" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#f1bd5d]">ดูรายการทั้งหมด<ArrowRight size={16} /></Link></section>
				</div>
			</div>
		</main>
	);
}

function SummaryCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: number; detail?: string; tone: "green" | "gold" | "lavender" }) {
	const tones = { green: "bg-[#dceee7] text-[#467267]", gold: "bg-[#f8e6c8] text-[#a16a2a]", lavender: "bg-[#e8e0f2] text-[#756080]" };
	return <article className="rounded-3xl border border-[#e4e8e1] bg-white p-5 shadow-[0_12px_35px_rgba(36,67,57,0.05)]"><span className={`flex size-11 items-center justify-center rounded-2xl ${tones[tone]}`}>{icon}</span><div className="mt-5 flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#63746e]">{label}</p>{detail ? <p className="mt-2 max-w-[13rem] truncate text-xs text-[#9aa9a3]" title={detail}>{detail}</p> : null}</div><strong className="text-3xl font-semibold tracking-[-0.05em] text-[#18302b]">{value}</strong></div></article>;
}

function OpportunityCard({ request, isAccepting, onAccept }: { request: RequestItem; isAccepting: boolean; onAccept: (request: RequestItem) => void }) {
	return <article className="rounded-3xl border border-[#e4e8e1] bg-[#fbfcfa] p-5 transition hover:border-[#b9ccc2]"><div className="flex items-start justify-between gap-3"><div><span className="inline-flex rounded-full bg-[#edf6f1] px-3 py-1 text-xs font-bold text-[#467267]">{taskLabels[request.task ?? ""] ?? request.task ?? "ธุระทั่วไป"}</span><h3 className="mt-3 font-semibold text-[#304640]">{formatDate(request.booking_date)} · {formatTime(request.booking_time)}</h3></div><BriefcaseBusiness size={19} className="mt-1 shrink-0 text-[#789087]" /></div><div className="mt-4 grid gap-2 text-sm text-[#63746e] sm:grid-cols-2"><p className="flex min-w-0 items-center gap-2"><MapPin size={15} className="shrink-0 text-[#5e9b83]" /><span className="truncate">{request.start_location || "ไม่ระบุจุดเริ่มต้น"}</span></p><p className="flex min-w-0 items-center gap-2"><Navigation size={15} className="shrink-0 text-[#5e9b83]" /><span className="truncate">{request.destination || "ไม่ระบุจุดหมาย"}</span></p></div><p className="mt-3 flex items-center gap-2 text-xs text-[#789087]"><Clock3 size={14} />{durationLabels[request.duration ?? ""] ?? request.duration ?? "ไม่ระบุระยะเวลา"}</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Link href={`/companion/requests#${request.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#dfe5df] px-4 py-3 text-sm font-semibold text-[#467267] transition hover:border-[#9ebaae]"><ArrowRight size={15} />ดูรายละเอียด</Link><button type="button" onClick={() => onAccept(request)} disabled={isAccepting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#18302b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-60">{isAccepting ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{isAccepting ? "กำลังรับงาน..." : "กดรับงาน"}</button></div></article>;
}

function ScheduleItem({ request }: { request: RequestItem }) {
	return <article className="rounded-2xl border border-[#31534a] bg-[#23453c] p-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1bd5d] text-[#18302b]"><CalendarDays size={18} /></span><div className="min-w-0"><p className="text-sm font-semibold text-white">{taskLabels[request.task ?? ""] ?? request.task ?? "ธุระทั่วไป"}</p><p className="mt-1 text-xs text-[#b6c9c0]">{formatDate(request.booking_date)} · {formatTime(request.booking_time)}</p><p className="mt-3 truncate text-xs text-[#dceee7]">{request.start_location || "ไม่ระบุจุดเริ่มต้น"} → {request.destination || "ไม่ระบุจุดหมาย"}</p></div></div></article>;
}

function LoadingState() {
	return <div className="flex justify-center border-t border-[#edf0eb] py-20 text-[#5e9b83]"><LoaderCircle size={30} className="animate-spin" /></div>;
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
	return <div className="border-t border-[#edf0eb] px-6 py-16 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#5e9b83]">{icon}</span><h3 className="mt-4 font-semibold text-[#304640]">{title}</h3><p className="mt-2 text-sm text-[#789087]">{detail}</p></div>;
}

function toList(value: unknown) {
	return Array.isArray(value) ? value.map(String).filter(Boolean) : typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function isUpcoming(value: string | null) {
	if (!value) return false;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const date = new Date(`${value.slice(0, 10)}T00:00:00`);
	return !Number.isNaN(date.getTime()) && date >= today;
}

function formatDate(value: string | null) {
	if (!value) return "ไม่ระบุวันที่";
	const date = new Date(`${value.slice(0, 10)}T00:00:00`);
	return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(date);
}

function formatTime(value: string | null) {
	return value ? `${value.slice(0, 5)} น.` : "ไม่ระบุเวลา";
}
