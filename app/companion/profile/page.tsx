"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, LoaderCircle, MapPin, Save, TriangleAlert } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type ProfileValues = {
	bio: string;
	skills: string;
	serviceAreas: string;
	availability: string;
};

const emptyProfile: ProfileValues = {
	bio: "",
	skills: "",
	serviceAreas: "",
	availability: "",
};

function toText(value: unknown) {
	return Array.isArray(value) ? value.map(String).join(", ") : typeof value === "string" ? value : "";
}

export default function CompanionProfilePage() {
	const [values, setValues] = useState<ProfileValues>(emptyProfile);
	const [userId, setUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

	useEffect(() => {
		async function loadProfile() {
			const { data: authData, error: authError } = await supabase.auth.getUser();
			if (authError || !authData.user) {
				setStatus({ type: "error", message: "กรุณาเข้าสู่ระบบก่อนแก้ไขโปรไฟล์ Companion" });
				setIsLoading(false);
				return;
			}

			setUserId(authData.user.id);
			const { data, error } = await supabase.from("companion_profiles").select("bio, skills, service_areas, availability").eq("profile_id", authData.user.id).maybeSingle();
			if (error) {
				setStatus({ type: "error", message: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง" });
			} else if (data) {
				setValues({ bio: toText(data.bio), skills: toText(data.skills), serviceAreas: toText(data.service_areas), availability: toText(data.availability) });
			}
			setIsLoading(false);
		}

		void loadProfile();
	}, []);

	function updateValue(field: keyof ProfileValues, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
		setStatus(null);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!userId) {
			setStatus({ type: "error", message: "ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง" });
			return;
		}

		if (!values.bio.trim() || !values.skills.trim() || !values.serviceAreas.trim() || !values.availability.trim()) {
			setStatus({ type: "error", message: "กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก" });
			return;
		}

		setIsSaving(true);
		setStatus(null);
		const { error } = await supabase.from("companion_profiles").upsert({
			profile_id: userId,
			bio: values.bio.trim(),
			skills: values.skills.split(",").map((item) => item.trim()).filter(Boolean),
			service_areas: values.serviceAreas.split(",").map((item) => item.trim()).filter(Boolean),
			availability: values.availability.split(",").map((item) => item.trim()).filter(Boolean),
		}, { onConflict: "profile_id" });

		if (error) {
			setStatus({ type: "error", message: "บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง" });
		} else {
			setStatus({ type: "success", message: "บันทึกโปรไฟล์ Companion เรียบร้อยแล้ว" });
		}
		setIsSaving(false);
	}

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-3xl">
				<Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#63746e] hover:text-[#18302b]"><ArrowLeft size={16} />กลับหน้าหลัก</Link>
				<div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Companion profile</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">โปรไฟล์ของคุณ</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#63746e]">บอกเล่าประสบการณ์และช่วงเวลาที่คุณพร้อมร่วมเดินทาง เพื่อให้ Customer เลือกคุณได้อย่างมั่นใจ</p></div>

				<form onSubmit={handleSubmit} className="rounded-4xl border border-[#e4e8e1] bg-white p-6 shadow-[0_20px_60px_rgba(36,67,57,0.08)] sm:p-10">
					{isLoading ? <div className="flex justify-center py-16 text-[#5e9b83]"><LoaderCircle size={32} className="animate-spin" /></div> : <>
						<Field label="ประวัติเบื้องต้น (Bio)" icon={<></>}><textarea value={values.bio} onChange={(event) => updateValue("bio", event.target.value)} rows={5} placeholder="แนะนำตัว ประสบการณ์ หรือสไตล์การช่วยเหลือของคุณ" className={inputClass + " resize-none"} /></Field>
						<div className="mt-6 grid gap-6 sm:grid-cols-2">
							<Field label="ประสบการณ์ / ความสามารถ" icon={<CalendarClock size={17} />}><input value={values.skills} onChange={(event) => updateValue("skills", event.target.value)} placeholder="เช่น ขับรถ, ภาษาอังกฤษ, พาไปโรงพยาบาล" className={inputClass} /></Field>
							<Field label="พื้นที่ให้บริการ" icon={<MapPin size={17} />}><input value={values.serviceAreas} onChange={(event) => updateValue("serviceAreas", event.target.value)} placeholder="เช่น กรุงเทพ, นนทบุรี" className={inputClass} /></Field>
						</div>
						<div className="mt-6"><Field label="ช่วงเวลาที่สะดวก" icon={<CalendarClock size={17} />}><input value={values.availability} onChange={(event) => updateValue("availability", event.target.value)} placeholder="เช่น ช่วงเช้า, วันเสาร์-อาทิตย์" className={inputClass} /></Field><p className="mt-2 text-xs text-[#789087]">คั่นข้อมูลหลายรายการด้วยเครื่องหมายจุลภาค (,)</p></div>

						{status ? <div role="status" className={`mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6 ${status.type === "success" ? "bg-[#edf6f1] text-[#356b5b]" : "bg-[#fff0ed] text-[#a64a3c]"}`}>{status.type === "success" ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" /> : <TriangleAlert size={19} className="mt-0.5 shrink-0" />}{status.message}</div> : null}
						<button type="submit" disabled={isSaving} className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#18302b] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{isSaving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}</button>
					</>}
				</form>
			</div>
		</main>
	);
}

const inputClass = "mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm text-[#18302b] outline-none transition placeholder:text-[#9aa9a3] focus:border-[#5e9b83] focus:ring-4 focus:ring-[#dceee7]";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
	return <label className="block text-sm font-semibold text-[#304640]"><span className="flex items-center gap-2">{icon}{label}</span>{children}</label>;
}
