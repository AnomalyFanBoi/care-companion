"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, FilePlus2, LoaderCircle, MapPin, Navigation, Search, ShieldCheck, TriangleAlert, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabase";

type BookingRequest = {
	id: string;
	task_type: string | null;
	request_date: string | null;
	request_time: string | null;
	origin: string | null;
	destination: string | null;
	duration: string | null;
	status: string | null;
	companion_id: string | null;
};

type CustomerData = {
	name: string;
	requests: BookingRequest[];
	companionNames: Record<string, string>;
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

export default function CustomerHomePage() {
	const [data, setData] = useState<CustomerData>({ name: "Customer", requests: [], companionNames: {} });
	const [isLoading, setIsLoading] = useState(true);
	const [notice, setNotice] = useState<Notice | null>(null);

	useEffect(() => {
		async function loadDashboard() {
			const { data: authData, error: authError } = await supabase.auth.getUser();
			if (authError || !authData.user) {
				setNotice({ type: "error", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน Customer Dashboard" });
				setIsLoading(false);
				return;
			}

			const userId = authData.user.id;
			const [profileResult, requestsResult] = await Promise.all([
				supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
				supabase.from("booking_requests").select("id, task_type, request_date, request_time, origin, destination, duration, status, companion_id").eq("customer_id", userId).order("request_date", { ascending: true }).order("request_time", { ascending: true }),
			]);

			if (profileResult.error || requestsResult.error) {
				setNotice({ type: "error", message: "ไม่สามารถโหลดข้อมูล Dashboard ได้ กรุณาลองใหม่อีกครั้ง" });
			} else {
				const requests = (requestsResult.data ?? []) as BookingRequest[];
				const companionIds = [...new Set(requests.map((request) => request.companion_id).filter((id): id is string => Boolean(id)))];
				const { data: companions, error: companionsError } = companionIds.length ? await supabase.from("profiles").select("id, full_name").in("id", companionIds) : { data: [], error: null };
				if (companionsError) {
					setNotice({ type: "error", message: "ไม่สามารถโหลดข้อมูล Companion ได้ กรุณาลองใหม่อีกครั้ง" });
				} else {
					setData({ name: profileResult.data?.full_name || "Customer", requests, companionNames: Object.fromEntries((companions ?? []).map((companion) => [companion.id, companion.full_name || "Companion"])) });
				}
			}
			setIsLoading(false);
		}

		void loadDashboard();
	}, []);

	const pendingRequests = data.requests.filter((request) => request.status === "pending");
	const upcomingRequests = data.requests.filter((request) => request.status === "accepted" && isUpcoming(request.request_date));
	const completedRequests = data.requests.filter((request) => request.status === "completed");
	const activeRequest = upcomingRequests[0] ?? pendingRequests[0] ?? null;

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-7xl">
				<Link href="/" aria-label="ย้อนกลับสู่หน้าหลัก" title="ย้อนกลับสู่หน้าหลัก" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#63746e] transition hover:text-[#18302b]"><ArrowLeft size={17} />หน้าหลัก</Link>
				<header className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Customer workspace</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">สวัสดี, {data.name}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#63746e]">วันนี้มีธุระอะไรที่อยากให้เราช่วยดูแลไหม</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link href="/customer/create-request" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18302b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26453d]"><FilePlus2 size={17} />สร้างคำขอใหม่</Link><Link href="/customer/search-companion" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-sm font-semibold text-[#304640] shadow-sm transition hover:border-[#b9ccc2] hover:text-[#18302b]"><Search size={17} />ค้นหา Companion</Link></div></header>

				{notice ? <div role="alert" className="mt-7 flex items-start gap-3 rounded-2xl bg-[#fff0ed] p-4 text-sm leading-6 text-[#a64a3c]"><TriangleAlert size={19} className="mt-0.5 shrink-0" />{notice.message}</div> : null}

				<section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="ภาพรวมการใช้บริการ"><OverviewCard icon={<Clock3 size={21} />} label="คำขอที่รอการตอบรับ" value={pendingRequests.length} tone="gold" /><OverviewCard icon={<CalendarDays size={21} />} label="บริการที่กำลังจะมาถึง" value={upcomingRequests.length} tone="green" /><OverviewCard icon={<Check size={21} />} label="ประวัติที่เสร็จสิ้นแล้ว" value={completedRequests.length} tone="lavender" /></section>

				<div className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
					<section className="rounded-4xl border border-[#e4e8e1] bg-white shadow-[0_15px_45px_rgba(36,67,57,0.06)]"><div className="flex items-start justify-between gap-4 p-6 sm:p-7"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Your next step</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">คำขอที่กำลังดำเนินการ</h2><p className="mt-2 text-sm text-[#63746e]">รายการล่าสุดที่กำลังจะเกิดขึ้นหรือรอ Companion ตอบรับ</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#467267]"><CalendarDays size={21} /></span></div>{isLoading ? <LoadingState /> : activeRequest ? <ActiveRequestCard request={activeRequest} companionName={activeRequest.companion_id ? data.companionNames[activeRequest.companion_id] : null} /> : <EmptyState />}</section>

					<section className="rounded-4xl bg-[#f1bd5d] p-6 text-[#18302b] shadow-[0_15px_45px_rgba(164,113,37,0.12)] sm:p-7"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#18302b] text-[#f1bd5d]"><ShieldCheck size={23} /></div><h2 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">เริ่มคำขอใหม่ได้ง่าย ๆ</h2><p className="mt-3 text-sm leading-7 text-[#594728]">บอกวัน เวลา และสถานที่ที่ต้องการความช่วยเหลือ แล้วเราจะช่วยเชื่อมต่อคุณกับ Companion ที่เหมาะสม</p><Link href="/customer/create-request" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#18302b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26453d]">สร้างคำขอบริการ<ArrowRight size={16} /></Link><div className="mt-8 border-t border-[#dba94e] pt-5"><p className="flex items-start gap-2 text-xs leading-5 text-[#594728]"><ShieldCheck size={15} className="mt-0.5 shrink-0" />Companion เป็นผู้ช่วยร่วมเดินทางและทำธุระ ไม่ใช่บริการทางการแพทย์</p></div></section>
				</div>

				<section className="mt-8 rounded-4xl border border-[#e4e8e1] bg-white shadow-[0_15px_45px_rgba(36,67,57,0.06)]"><div className="flex items-center justify-between gap-4 p-6 sm:p-7"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Recent activity</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">รายการคำขอของคุณ</h2></div><span className="text-sm text-[#789087]">{data.requests.length} รายการ</span></div>{isLoading ? <LoadingState /> : data.requests.length === 0 ? <div className="border-t border-[#edf0eb] px-6 py-12 text-center text-sm text-[#789087]">ยังไม่มีคำขอบริการ เริ่มต้นสร้างคำขอแรกของคุณได้เลย</div> : <div className="overflow-x-auto border-t border-[#edf0eb]"><table className="w-full min-w-[700px] text-left"><thead><tr className="bg-[#fbfcfa] text-xs font-bold uppercase tracking-widest text-[#789087]"><th className="px-6 py-4">ธุระ</th><th className="px-6 py-4">วันและเวลา</th><th className="px-6 py-4">สถานที่</th><th className="px-6 py-4">สถานะ</th></tr></thead><tbody>{data.requests.slice(0, 6).map((request) => <tr key={request.id} className="border-t border-[#edf0eb]"><td className="px-6 py-5"><p className="font-semibold text-[#304640]">{taskLabels[request.task_type ?? ""] ?? request.task_type ?? "ธุระทั่วไป"}</p><p className="mt-1 text-xs text-[#9aa9a3]">{durationLabels[request.duration ?? ""] ?? request.duration ?? "ไม่ระบุระยะเวลา"}</p></td><td className="px-6 py-5 text-sm text-[#63746e]">{formatDate(request.request_date)}<span className="mt-1 block text-xs text-[#789087]">{formatTime(request.request_time)}</span></td><td className="max-w-xs px-6 py-5 text-sm text-[#63746e]"><p className="truncate">{request.origin || "ไม่ระบุจุดเริ่มต้น"}</p><p className="my-1 text-xs text-[#b0bbb5]">↓</p><p className="truncate">{request.destination || "ไม่ระบุจุดหมาย"}</p></td><td className="px-6 py-5"><StatusBadge status={request.status} /></td></tr>)}</tbody></table></div>}</section>
			</div>
		</main>
	);
}

function OverviewCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "green" | "gold" | "lavender" }) {
	const tones = { green: "bg-[#dceee7] text-[#467267]", gold: "bg-[#f8e6c8] text-[#a16a2a]", lavender: "bg-[#e8e0f2] text-[#756080]" };
	return <article className="rounded-3xl border border-[#e4e8e1] bg-white p-5 shadow-[0_12px_35px_rgba(36,67,57,0.05)]"><span className={`flex size-11 items-center justify-center rounded-2xl ${tones[tone]}`}>{icon}</span><div className="mt-5 flex items-end justify-between gap-4"><p className="text-sm font-medium text-[#63746e]">{label}</p><strong className="text-3xl font-semibold tracking-[-0.05em] text-[#18302b]">{value}</strong></div></article>;
}

function ActiveRequestCard({ request, companionName }: { request: BookingRequest; companionName: string | null }) {
	return <div className="border-t border-[#edf0eb] p-6 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="inline-flex rounded-full bg-[#edf6f1] px-3 py-1 text-xs font-bold text-[#467267]">{taskLabels[request.task_type ?? ""] ?? request.task_type ?? "ธุระทั่วไป"}</span><h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{formatDate(request.request_date)}</h3><p className="mt-1 flex items-center gap-2 text-sm text-[#63746e]"><Clock3 size={16} className="text-[#5e9b83]" />{formatTime(request.request_time)} · {durationLabels[request.duration ?? ""] ?? request.duration ?? "ไม่ระบุระยะเวลา"}</p></div><StatusBadge status={request.status} /></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Detail icon={<MapPin size={17} />} label="จุดเริ่มต้น" value={request.origin || "ไม่ระบุ"} /><Detail icon={<Navigation size={17} />} label="จุดหมาย" value={request.destination || "ไม่ระบุ"} /></div><div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#fbfcfa] p-4"><span className="flex size-10 items-center justify-center rounded-full bg-[#dceee7] text-[#467267]"><UserRound size={19} /></span><div><p className="text-xs text-[#789087]">Companion ของคุณ</p><p className="mt-1 text-sm font-semibold text-[#304640]">{companionName || "กำลังรอ Companion ตอบรับ"}</p></div></div><Link href={`/customer/search-companion?request_id=${request.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#467267] hover:text-[#18302b]">ดูรายละเอียดคำขอ<ArrowRight size={16} /></Link></div>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#789087]">{icon}{label}</p><p className="mt-2 text-sm leading-6 text-[#304640]">{value}</p></div>;
}

function StatusBadge({ status }: { status: string | null }) {
	const normalized = status?.toLowerCase() ?? "pending";
	const styles = normalized === "accepted" ? "bg-[#dceee7] text-[#467267]" : normalized === "completed" ? "bg-[#e8e0f2] text-[#756080]" : "bg-[#f8e6c8] text-[#8f682b]";
	const label = normalized === "accepted" ? "Accepted" : normalized === "completed" ? "Completed" : "Pending";
	return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{label}</span>;
}

function LoadingState() {
	return <div className="flex justify-center border-t border-[#edf0eb] py-20 text-[#5e9b83]"><LoaderCircle size={30} className="animate-spin" /></div>;
}

function EmptyState() {
	return <div className="border-t border-[#edf0eb] px-6 py-16 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#5e9b83]"><CalendarDays size={27} /></span><h3 className="mt-4 font-semibold text-[#304640]">ยังไม่มีคำขอที่กำลังดำเนินการ</h3><p className="mt-2 text-sm text-[#789087]">สร้างคำขอใหม่เพื่อเริ่มต้นค้นหา Companion</p><Link href="/customer/create-request" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#467267]">สร้างคำขอใหม่<ArrowRight size={15} /></Link></div>;
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