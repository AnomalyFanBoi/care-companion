"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, LoaderCircle, RefreshCw, ShieldCheck, TriangleAlert, UserRound, Users } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Profile = {
	id: string;
	full_name: string | null;
	role: string | null;
	created_at: string | null;
};

type BookingRequest = {
	id: string;
	task: string | null;
	booking_date: string | null;
	booking_time: string | null;
	start_location: string | null;
	destination: string | null;
	status: string | null;
};

type DashboardData = {
	profiles: Profile[];
	requests: BookingRequest[];
};

type Notice = { type: "success" | "error"; message: string };
type DashboardFetchResult = { error: true } | { error: false; data: DashboardData };
type UserRole = "customer" | "companion" | "admin";

const roleLabels: Record<string, string> = {
	admin: "Admin",
	companion: "Companion",
	customer: "Customer",
};

const taskLabels: Record<string, string> = {
	hospital: "ไปโรงพยาบาล",
	bank: "ไปธนาคาร",
	government: "ติดต่อหน่วยงานราชการ",
	"public-venue": "ไปสถานที่สาธารณะ",
	other: "ธุระอื่น ๆ",
};

async function fetchDashboardData(): Promise<DashboardFetchResult> {
	const [profilesResult, requestsResult] = await Promise.all([
		supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }),
		supabase.from("booking_request").select("id, task, booking_date, booking_time, start_location, destination, status").order("booking_date", { ascending: false }).order("booking_time", { ascending: false }),
	]);

	if (profilesResult.error || requestsResult.error) return { error: true };
	return { error: false, data: { profiles: (profilesResult.data ?? []) as Profile[], requests: (requestsResult.data ?? []) as BookingRequest[] } };
}

export default function AdminDashboardPage() {
	const [data, setData] = useState<DashboardData>({ profiles: [], requests: [] });
	const [isLoading, setIsLoading] = useState(true);
	const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
	const [notice, setNotice] = useState<Notice | null>(null);

	const loadDashboard = useCallback(async () => {
		const result = await fetchDashboardData();
		if (result.error) {
			setNotice({ type: "error", message: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาตรวจสอบสิทธิ์แล้วลองใหม่อีกครั้ง" });
		} else {
			setData(result.data);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		let isMounted = true;
		async function fetchInitialData() {
			const result = await fetchDashboardData();
			if (!isMounted) return;

			if (result.error) {
				setNotice({ type: "error", message: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาตรวจสอบสิทธิ์แล้วลองใหม่อีกครั้ง" });
			} else {
				setData(result.data);
			}
			setIsLoading(false);
		}

		void fetchInitialData();
		return () => {
			isMounted = false;
		};
	}, []);

	async function updateRole(profileId: string, role: UserRole) {
		setUpdatingUserId(profileId);
		setNotice(null);
		const { data: updatedProfile, error } = await supabase
			.from("profiles")
			.update({ role })
			.eq("id", profileId)
			.select("id, full_name, role, created_at")
			.maybeSingle();

		if (error) {
			setNotice({ type: "error", message: "เปลี่ยนสิทธิ์ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ UPDATE และ RLS policy ของ profiles" });
		} else if (!updatedProfile) {
			setNotice({ type: "error", message: "ฐานข้อมูลไม่ได้อัปเดตผู้ใช้นี้ โปรดตรวจสอบว่าโปรไฟล์ยังมีอยู่และ RLS policy อนุญาตให้ Admin แก้ไขได้" });
		} else {
			setData((current) => ({ ...current, profiles: current.profiles.map((profile) => profile.id === profileId ? updatedProfile as Profile : profile) }));
			setNotice({ type: "success", message: "อัปเดตสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว" });
		}
		setUpdatingUserId(null);
	}

	const customerCount = data.profiles.filter((profile) => profile.role?.toLowerCase() === "customer").length;
	const companionCount = data.profiles.filter((profile) => profile.role?.toLowerCase() === "companion").length;

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-7xl">
				<header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
					<div><Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#63746e] hover:text-[#18302b]"><ArrowLeft size={16} />กลับหน้าหลัก</Link><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Admin workspace</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">ภาพรวมระบบ</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#63746e]">ดูแลผู้ใช้งานและติดตามคำขอบริการทั้งหมดจากที่เดียว</p></div>
					<button type="button" onClick={() => { setIsLoading(true); setNotice(null); void loadDashboard(); }} disabled={isLoading} title="รีเฟรชข้อมูล" className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-sm font-semibold text-[#304640] shadow-sm transition hover:border-[#b9ccc2] hover:text-[#18302b] disabled:cursor-not-allowed disabled:opacity-60 md:self-end"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />รีเฟรชข้อมูล</button>
				</header>

				{notice ? <div role={notice.type === "error" ? "alert" : "status"} className={`mt-7 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6 ${notice.type === "success" ? "bg-[#edf6f1] text-[#356b5b]" : "bg-[#fff0ed] text-[#a64a3c]"}`}>{notice.type === "success" ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" /> : <TriangleAlert size={19} className="mt-0.5 shrink-0" />}{notice.message}</div> : null}

				<section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="สถิติภาพรวม">
					<StatCard icon={<Users size={21} />} label="ผู้ใช้งานทั้งหมด" value={data.profiles.length} accent="green" />
					<StatCard icon={<UserRound size={21} />} label="Customer" value={customerCount} accent="gold" />
					<StatCard icon={<ShieldCheck size={21} />} label="Companion" value={companionCount} accent="lavender" />
					<StatCard icon={<BriefcaseBusiness size={21} />} label="งานทั้งหมด" value={data.requests.length} accent="peach" />
				</section>

				<section className="mt-8 rounded-4xl border border-[#e4e8e1] bg-white shadow-[0_15px_45px_rgba(36,67,57,0.06)]">
					<SectionHeading icon={<Users size={19} />} title="ผู้ใช้งานทั้งหมด" detail={`${data.profiles.length} บัญชี`} />
					{isLoading ? <LoadingState /> : data.profiles.length === 0 ? <EmptyState text="ยังไม่มีข้อมูลผู้ใช้งาน" /> : <div className="overflow-x-auto"><table className="w-full min-w-162.5 text-left"><thead><tr className="border-y border-[#edf0eb] bg-[#fbfcfa] text-xs font-bold uppercase tracking-widest text-[#789087]"><th className="px-6 py-4">ผู้ใช้งาน</th><th className="px-6 py-4">สิทธิ์ปัจจุบัน</th><th className="px-6 py-4">วันที่สมัคร</th><th className="px-6 py-4 text-right">จัดการสิทธิ์</th></tr></thead><tbody>{data.profiles.map((profile) => <tr key={profile.id} className="border-b border-[#edf0eb] last:border-0"><td className="px-6 py-5"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#dceee7] font-semibold text-[#467267]">{getInitial(profile.full_name)}</span><div><p className="font-semibold text-[#304640]">{profile.full_name || "ยังไม่ระบุชื่อ"}</p><p className="mt-1 text-xs text-[#9aa9a3]">ID: {profile.id.slice(0, 8)}...</p></div></div></td><td className="px-6 py-5"><RoleBadge role={profile.role} /></td><td className="px-6 py-5 text-sm text-[#63746e]">{formatDate(profile.created_at)}</td><td className="px-6 py-5 text-right"><label className="sr-only" htmlFor={`role-${profile.id}`}>เปลี่ยนสิทธิ์ของ {profile.full_name || "ผู้ใช้งาน"}</label><select id={`role-${profile.id}`} value={profile.role ?? "customer"} onChange={(event) => void updateRole(profile.id, event.target.value as UserRole)} disabled={updatingUserId === profile.id} className="rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-3 py-2 text-sm font-medium text-[#304640] outline-none transition focus:border-[#5e9b83] focus:ring-4 focus:ring-[#dceee7] disabled:opacity-60"><option value="customer">Customer</option><option value="companion">Companion</option><option value="admin">Admin</option></select></td></tr>)}</tbody></table></div>}
				</section>

				<section className="mt-8 rounded-4xl border border-[#e4e8e1] bg-white shadow-[0_15px_45px_rgba(36,67,57,0.06)]">
					<SectionHeading icon={<BriefcaseBusiness size={19} />} title="คำขอบริการทั้งหมด" detail={`${data.requests.length} งาน`} />
					{isLoading ? <LoadingState /> : data.requests.length === 0 ? <EmptyState text="ยังไม่มีคำขอบริการ" /> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="border-y border-[#edf0eb] bg-[#fbfcfa] text-xs font-bold uppercase tracking-widest text-[#789087]"><th className="px-6 py-4">ธุระ</th><th className="px-6 py-4">วันและเวลา</th><th className="px-6 py-4">เส้นทาง</th><th className="px-6 py-4">สถานะ</th></tr></thead><tbody>{data.requests.map((request) => <tr key={request.id} className="border-b border-[#edf0eb] last:border-0"><td className="px-6 py-5"><p className="font-semibold text-[#304640]">{taskLabels[request.task ?? ""] ?? request.task ?? "ธุระทั่วไป"}</p><p className="mt-1 text-xs text-[#9aa9a3]">#{request.id.slice(0, 8)}</p></td><td className="px-6 py-5"><p className="text-sm font-medium text-[#304640]">{formatDate(request.booking_date)}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#789087]"><Clock3 size={13} />{formatTime(request.booking_time)}</p></td><td className="max-w-xs px-6 py-5 text-sm text-[#63746e]"><p className="truncate">{request.start_location || "ไม่ระบุจุดเริ่มต้น"}</p><p className="my-1 text-xs text-[#b0bbb5]">↓</p><p className="truncate">{request.destination || "ไม่ระบุจุดหมาย"}</p></td><td className="px-6 py-5"><StatusBadge status={request.status} /></td></tr>)}</tbody></table></div>}
				</section>
			</div>
		</main>
	);
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: "green" | "gold" | "lavender" | "peach" }) {
	const accents = { green: "bg-[#dceee7] text-[#467267]", gold: "bg-[#f8e6c8] text-[#a16a2a]", lavender: "bg-[#e8e0f2] text-[#756080]", peach: "bg-[#f6ded4] text-[#a45f4d]" };
	return <article className="rounded-3xl border border-[#e4e8e1] bg-white p-5 shadow-[0_12px_35px_rgba(36,67,57,0.05)]"><div className="flex items-start justify-between gap-3"><span className={`flex size-11 items-center justify-center rounded-2xl ${accents[accent]}`}>{icon}</span><span className="text-3xl font-semibold tracking-[-0.05em] text-[#18302b]">{value}</span></div><p className="mt-5 text-sm font-medium text-[#63746e]">{label}</p></article>;
}

function SectionHeading({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
	return <div className="flex items-center justify-between gap-4 p-6 sm:p-7"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#edf6f1] text-[#467267]">{icon}</span><h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2></div><span className="text-sm text-[#789087]">{detail}</span></div>;
}

function RoleBadge({ role }: { role: string | null }) {
	const normalizedRole = role?.toLowerCase() ?? "customer";
	const styles = normalizedRole === "admin" ? "bg-[#e8e0f2] text-[#756080]" : normalizedRole === "companion" ? "bg-[#dceee7] text-[#467267]" : "bg-[#f8e6c8] text-[#8f682b]";
	return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{roleLabels[normalizedRole] ?? role ?? "Customer"}</span>;
}

function StatusBadge({ status }: { status: string | null }) {
	const normalizedStatus = status?.toLowerCase() ?? "pending";
	const styles = normalizedStatus === "accepted" ? "bg-[#dceee7] text-[#467267]" : normalizedStatus === "completed" ? "bg-[#e8e0f2] text-[#756080]" : "bg-[#f8e6c8] text-[#8f682b]";
	const label = normalizedStatus === "accepted" ? "Accepted" : normalizedStatus === "completed" ? "Completed" : "Pending";
	return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{label}</span>;
}

function LoadingState() {
	return <div className="flex justify-center py-16 text-[#5e9b83]"><LoaderCircle size={30} className="animate-spin" /></div>;
}

function EmptyState({ text }: { text: string }) {
	return <div className="border-t border-[#edf0eb] px-6 py-16 text-center text-sm text-[#789087]">{text}</div>;
}

function getInitial(name: string | null) {
	return name?.trim().charAt(0).toUpperCase() || "?";
}

function formatDate(value: string | null) {
	if (!value) return "ไม่ระบุวันที่";
	const date = new Date(`${value.slice(0, 10)}T00:00:00`);
	return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(date);
}

function formatTime(value: string | null) {
	return value ? `${value.slice(0, 5)} น.` : "ไม่ระบุเวลา";
}