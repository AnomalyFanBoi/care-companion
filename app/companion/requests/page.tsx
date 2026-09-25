"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, LoaderCircle, MapPin, Navigation, TriangleAlert } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type BookingRequest = {
	id: string;
	task_type: string | null;
	request_date: string | null;
	request_time: string | null;
	origin: string | null;
	destination: string | null;
	duration: string | null;
	details: string | null;
};

type StatusMessage = { type: "success" | "error"; message: string };

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

export default function CompanionRequestsPage() {
	const [requests, setRequests] = useState<BookingRequest[]>([]);
	const [userId, setUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [acceptingId, setAcceptingId] = useState<string | null>(null);
	const [status, setStatus] = useState<StatusMessage | null>(null);

	useEffect(() => {
		async function loadRequests() {
			const { data: authData, error: authError } = await supabase.auth.getUser();
			if (authError || !authData.user) {
				setStatus({ type: "error", message: "กรุณาเข้าสู่ระบบก่อนดูรายการคำขอ" });
				setIsLoading(false);
				return;
			}

			setUserId(authData.user.id);
			const { data, error } = await supabase
				.from("booking_requests")
				.select("id, task_type, request_date, request_time, origin, destination, duration, details")
				.eq("status", "pending")
				.order("request_date", { ascending: true })
				.order("request_time", { ascending: true });

			if (error) {
				setStatus({ type: "error", message: "ไม่สามารถโหลดรายการคำขอได้ กรุณาลองใหม่อีกครั้ง" });
			} else {
				setRequests((data ?? []) as BookingRequest[]);
			}
			setIsLoading(false);
		}

		void loadRequests();
	}, []);

	async function acceptRequest(requestId: string) {
		if (!userId) {
			setStatus({ type: "error", message: "ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง" });
			return;
		}

		setAcceptingId(requestId);
		setStatus(null);
		const { data, error } = await supabase
			.from("booking_requests")
			.update({ status: "accepted", companion_id: userId })
			.eq("id", requestId)
			.eq("status", "pending")
			.select("id")
			.maybeSingle();

		if (error) {
			setStatus({ type: "error", message: "ไม่สามารถตอบรับงานได้ กรุณาลองใหม่อีกครั้ง" });
		} else if (!data) {
			setRequests((current) => current.filter((request) => request.id !== requestId));
			setStatus({ type: "error", message: "คำขอนี้ถูกรับไปแล้ว หรือไม่อยู่ในสถานะว่าง" });
		} else {
			setRequests((current) => current.filter((request) => request.id !== requestId));
			setStatus({ type: "success", message: "ตอบรับการเป็นผู้ช่วยเรียบร้อยแล้ว" });
		}
		setAcceptingId(null);
	}

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-7xl">
				<Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#63746e] hover:text-[#18302b]"><ArrowLeft size={16} />กลับหน้าหลัก</Link>
				<div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
					<div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Companion requests</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">คำขอที่รอ Companion</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#63746e]">เลือกงานที่เหมาะกับคุณ แล้วร่วมทำให้ธุระสำคัญของใครสักคนง่ายขึ้น</p></div>
					<div className="flex items-center gap-2 text-sm text-[#63746e]"><Navigation size={18} className="text-[#5e9b83]" />{requests.length} คำขอที่ยังว่าง</div>
				</div>

				{status ? <div role={status.type === "error" ? "alert" : "status"} className={`mt-7 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6 ${status.type === "success" ? "bg-[#edf6f1] text-[#356b5b]" : "bg-[#fff0ed] text-[#a64a3c]"}`}>{status.type === "success" ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" /> : <TriangleAlert size={19} className="mt-0.5 shrink-0" />}{status.message}</div> : null}

				{isLoading ? <div className="flex justify-center py-24 text-[#5e9b83]"><LoaderCircle size={32} className="animate-spin" /></div> : requests.length === 0 ? <div className="mt-10 rounded-4xl border border-dashed border-[#cddbd3] bg-white px-6 py-20 text-center"><CalendarDays size={32} className="mx-auto text-[#789087]" /><h2 className="mt-4 text-xl font-semibold">ตอนนี้ยังไม่มีคำขอที่ว่าง</h2><p className="mt-2 text-sm text-[#63746e]">กลับมาเช็กอีกครั้งเมื่อมีงานใหม่เข้ามา</p></div> : <div className="mt-10 grid gap-5 lg:grid-cols-2">{requests.map((request) => <RequestCard key={request.id} request={request} isAccepting={acceptingId === request.id} onAccept={acceptRequest} />)}</div>}
			</div>
		</main>
	);
}

function RequestCard({ request, isAccepting, onAccept }: { request: BookingRequest; isAccepting: boolean; onAccept: (requestId: string) => void }) {
	return <article className="rounded-4xl border border-[#e4e8e1] bg-white p-6 shadow-[0_15px_45px_rgba(36,67,57,0.06)] sm:p-7">
		<div className="flex flex-wrap items-start justify-between gap-4"><div><span className="inline-flex rounded-full bg-[#edf6f1] px-3 py-1 text-xs font-bold text-[#467267]">{taskLabels[request.task_type ?? ""] ?? request.task_type ?? "ธุระทั่วไป"}</span><h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">รายละเอียดงาน</h2></div><div className="rounded-2xl bg-[#f8e6c8] p-3 text-[#a16a2a]"><CalendarDays size={21} /></div></div>
		<div className="mt-6 grid gap-4 sm:grid-cols-2"><Detail icon={<CalendarDays size={17} />} label="วัน" value={formatDate(request.request_date)} /><Detail icon={<Clock3 size={17} />} label="เวลา" value={formatTime(request.request_time)} /><Detail icon={<MapPin size={17} />} label="จุดเริ่มต้น" value={request.origin ?? "ไม่ได้ระบุ"} /><Detail icon={<Navigation size={17} />} label="จุดหมาย" value={request.destination ?? "ไม่ได้ระบุ"} /></div>
		<div className="mt-5 grid gap-4 border-t border-[#edf0eb] pt-5 sm:grid-cols-2"><Detail label="วัตถุประสงค์ธุระ" value={request.details ?? "ไม่ได้ระบุรายละเอียดเพิ่มเติม"} /><Detail label="ระยะเวลา" value={durationLabels[request.duration ?? ""] ?? request.duration ?? "ไม่ได้ระบุ"} /></div>
		<button type="button" onClick={() => onAccept(request.id)} disabled={isAccepting} className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#18302b] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-60">{isAccepting ? <LoaderCircle size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}{isAccepting ? "กำลังตอบรับ..." : "ตอบรับการเป็นผู้ช่วย"}</button>
	</article>;
}

function Detail({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
	return <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#789087]">{icon}{label}</p><p className="mt-2 text-sm leading-6 text-[#304640]">{value}</p></div>;
}

function formatDate(value: string | null) {
	if (!value) return "ไม่ได้ระบุ";
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(date);
}

function formatTime(value: string | null) {
	return value ? `${value.slice(0, 5)} น.` : "ไม่ได้ระบุ";
}