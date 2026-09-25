"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Check, LoaderCircle, MapPin, Search, ShieldCheck, Users, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";

type Companion = {
	id: string;
	name: string;
	avatarUrl: string | null;
	bio: string;
	areas: string[];
	skills: string[];
	availability: string[];
};

type RawCompanionProfile = Record<string, unknown>;
type RawProfile = RawCompanionProfile & { companion_profiles?: RawCompanionProfile | RawCompanionProfile[] | null };

const availabilityOptions = [
	{ value: "morning", label: "ช่วงเช้า (08:00–12:00)" },
	{ value: "afternoon", label: "ช่วงบ่าย (13:00–17:00)" },
	{ value: "evening", label: "ช่วงเย็น (18:00 เป็นต้นไป)" },
];

export default function SearchCompanionPage() {
	const searchParams = useSearchParams();
	const requestId = searchParams.get("request_id");
	const [companions, setCompanions] = useState<Companion[]>([]);
	const [area, setArea] = useState("");
	const [skill, setSkill] = useState("");
	const [availability, setAvailability] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	useEffect(() => {
		async function loadCompanions() {
			setIsLoading(true);
			const { data, error } = await supabase
				.from("profiles")
				.select("id, full_name, avatar_url, bio, companion_profiles!inner(*)");

			if (error) {
				setMessage({ type: "error", text: "ไม่สามารถโหลดข้อมูล Companion ได้ กรุณาลองใหม่อีกครั้ง" });
				setCompanions([]);
			} else {
				setCompanions((data as RawProfile[]).map(normalizeCompanion));
			}
			setIsLoading(false);
		}

		void loadCompanions();
	}, []);

	const filteredCompanions = useMemo(() => companions.filter((companion) => {
		const matchesArea = !area || companion.areas.some((item) => item.toLowerCase().includes(area.toLowerCase()));
		const matchesSkill = !skill || companion.skills.some((item) => item.toLowerCase().includes(skill.toLowerCase()));
		const matchesAvailability = !availability || companion.availability.some((item) => item.toLowerCase().includes(availability.toLowerCase()));
		return matchesArea && matchesSkill && matchesAvailability;
	}), [area, availability, companions, skill]);

	async function chooseCompanion(companion: Companion) {
		setSelectedId(companion.id);
		setMessage(null);

		if (!requestId) {
			setMessage({ type: "success", text: `เลือก ${companion.name} แล้ว กรุณาส่ง request_id เพื่อยืนยันการจับคู่กับคำขอ` });
			return;
		}

		const { error } = await supabase.from("booking_requests").update({ companion_id: companion.id }).eq("id", requestId);
		if (error) {
			setMessage({ type: "error", text: "ไม่สามารถเลือก Companion ให้คำขอนี้ได้ กรุณาลองใหม่อีกครั้ง" });
			setSelectedId(null);
		} else {
			setMessage({ type: "success", text: `จับคู่กับ ${companion.name} สำหรับคำขอเรียบร้อยแล้ว` });
		}
	}

	function clearFilters() {
		setArea("");
		setSkill("");
		setAvailability("");
	}

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-7xl">
				<Link href="/customer" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#63746e] hover:text-[#18302b]"><ArrowLeft size={16} />กลับ</Link>
				<div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
					<div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Find your companion</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">ค้นหา Companion ที่เหมาะกับคุณ</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#63746e]">เลือกผู้ช่วยร่วมเดินทางจากพื้นที่ ทักษะ และเวลาที่สะดวกของคุณ</p></div>
					<div className="flex items-center gap-2 text-sm text-[#63746e]"><Users size={18} className="text-[#5e9b83]" />{companions.length} Companion ในระบบ</div>
				</div>

				<section className="mt-10 rounded-4xl border border-[#e4e8e1] bg-white p-5 shadow-[0_15px_45px_rgba(36,67,57,0.06)] sm:p-6">
					<div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><Search size={18} className="text-[#5e9b83]" /><h2 className="font-semibold">ตัวกรองการค้นหา</h2></div><button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-[#63746e] hover:text-[#18302b]"><X size={14} />ล้างตัวกรอง</button></div>
					<div className="mt-5 grid gap-4 md:grid-cols-3">
						<FilterField label="พื้นที่ให้บริการ" value={area} onChange={setArea} placeholder="เช่น กรุงเทพ เชียงใหม่" />
						<FilterField label="ความสามารถ / ทักษะ" value={skill} onChange={setSkill} placeholder="เช่น ขับรถ ภาษาอังกฤษ" />
						<label className="block text-sm font-semibold text-[#304640]">ช่วงเวลาที่สะดวก<select value={availability} onChange={(event) => setAvailability(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm font-normal outline-none focus:border-[#5e9b83] focus:ring-4 focus:ring-[#dceee7]"><option value="">ทุกช่วงเวลา</option>{availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
					</div>
				</section>

				{message ? <div role="status" className={`mt-5 flex items-center gap-3 rounded-2xl p-4 text-sm ${message.type === "success" ? "bg-[#edf6f1] text-[#356b5b]" : "bg-[#fff0ed] text-[#a64a3c]"}`}>{message.type === "success" ? <Check size={18} /> : <ShieldCheck size={18} />}{message.text}</div> : null}

				{isLoading ? <div className="flex justify-center py-24 text-[#5e9b83]"><LoaderCircle size={32} className="animate-spin" /></div> : filteredCompanions.length === 0 ? <div className="mt-8 rounded-4xl border border-dashed border-[#cddbd3] bg-white px-6 py-16 text-center"><Search size={30} className="mx-auto text-[#789087]" /><h2 className="mt-4 text-xl font-semibold">ยังไม่พบ Companion ที่ตรงกับการค้นหา</h2><p className="mt-2 text-sm text-[#63746e]">ลองเปลี่ยนพื้นที่ ทักษะ หรือช่วงเวลาที่สะดวก</p></div> : <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredCompanions.map((companion) => <CompanionCard key={companion.id} companion={companion} isSelected={selectedId === companion.id} isRequestPending={Boolean(requestId) && selectedId === companion.id} onChoose={chooseCompanion} />)}</div>}
			</div>
		</main>
	);
}

function normalizeCompanion(profile: RawProfile): Companion {
	const nested = Array.isArray(profile.companion_profiles) ? profile.companion_profiles[0] : profile.companion_profiles;
	const readList = (value: unknown) => Array.isArray(value) ? value.map(String) : typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
	return {
		id: String(profile.id),
		name: String(profile.full_name ?? profile.name ?? "Companion"),
		avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
		bio: String(profile.bio ?? nested?.bio ?? "พร้อมช่วยให้การเดินทางและการทำธุระของคุณง่ายขึ้น"),
		areas: readList(nested?.service_areas ?? nested?.service_area ?? profile.service_areas ?? profile.service_area),
		skills: readList(nested?.skills ?? nested?.abilities ?? profile.skills),
		availability: readList(nested?.availability ?? nested?.available_times ?? profile.availability),
	};
}

function FilterField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
	return <label className="block text-sm font-semibold text-[#304640]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm font-normal outline-none placeholder:text-[#9aa9a3] focus:border-[#5e9b83] focus:ring-4 focus:ring-[#dceee7]" /></label>;
}

function CompanionCard({ companion, isSelected, isRequestPending, onChoose }: { companion: Companion; isSelected: boolean; isRequestPending: boolean; onChoose: (companion: Companion) => void }) {
	return <article className="flex flex-col rounded-4xl border border-[#e4e8e1] bg-white p-6 shadow-[0_15px_45px_rgba(36,67,57,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(36,67,57,0.1)]">
		<div className="flex items-start gap-4"><div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#dceee7] text-xl font-semibold text-[#467267]">{companion.avatarUrl ? <Image src={companion.avatarUrl} alt={companion.name} className="size-full object-cover" /> : companion.name.charAt(0)}</div><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{companion.name}</h2><div className="mt-1 flex items-center gap-1 text-xs text-[#5e9b83]"><ShieldCheck size={14} />โปรไฟล์ Companion</div></div></div>
		<p className="mt-5 min-h-14 text-sm leading-6 text-[#63746e]">{companion.bio}</p>
		<div className="mt-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#789087]"><MapPin size={14} />พื้นที่ให้บริการ</div><div className="mt-2 flex flex-wrap gap-2">{companion.areas.length ? companion.areas.map((item) => <span key={item} className="rounded-full bg-[#edf6f1] px-3 py-1 text-xs text-[#467267]">{item}</span>) : <span className="text-sm text-[#9aa9a3]">ยังไม่ได้ระบุ</span>}</div></div>
		<div className="mt-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#789087]"><CalendarClock size={14} />ทักษะและเวลาที่สะดวก</div><div className="mt-2 flex flex-wrap gap-2">{[...companion.skills, ...companion.availability].slice(0, 5).map((item) => <span key={item} className="rounded-full bg-[#f8e6c8] px-3 py-1 text-xs text-[#725523]">{item}</span>)}{!companion.skills.length && !companion.availability.length ? <span className="text-sm text-[#9aa9a3]">ยังไม่ได้ระบุ</span> : null}</div></div>
		<button type="button" onClick={() => onChoose(companion)} disabled={isRequestPending} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18302b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-70">{isRequestPending ? <LoaderCircle size={17} className="animate-spin" /> : isSelected ? <Check size={17} /> : null}{isRequestPending ? "กำลังจับคู่..." : isSelected ? "เลือกแล้ว" : "เลือก Companion"}</button>
	</article>;
}
