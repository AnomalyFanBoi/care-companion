"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, LoaderCircle, MapPin, Save, ShieldCheck, Sparkles, Trash2, TriangleAlert, Upload, UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const avatarBucket = "care-companion_bk";
const maxAvatarSize = 5 * 1024 * 1024;
const avatarExtensions: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

type ProfileValues = {
	bio: string;
	service_areas: string;
	skills: string;
	availability: string;
};

type CompanionProfileDB = {
	user_id: string;
	bio: string | null;
	service_areas: string[] | null;
	skills: string[] | null;
	availability: string | null;
};

type Notice = { type: "success" | "error"; message: string };

const emptyProfile: ProfileValues = {
	bio: "",
	service_areas: "",
	skills: "",
	availability: "",
};

export default function CompanionProfilePage() {
	const [values, setValues] = useState<ProfileValues>(emptyProfile);
	const [userId, setUserId] = useState<string | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [hasProfile, setHasProfile] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [notice, setNotice] = useState<Notice | null>(null);

	useEffect(() => {
		return () => {
			if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
		};
	}, [avatarPreview]);

	useEffect(() => {
		let isMounted = true;

		async function loadProfile() {
			const { data: authData, error: authError } = await supabase.auth.getUser();
			if (!isMounted) return;

			if (authError || !authData.user) {
				setNotice({ type: "error", message: "กรุณาเข้าสู่ระบบก่อนจัดการโปรไฟล์ Companion" });
				setIsLoading(false);
				return;
			}

			setUserId(authData.user.id);
			const [companionResult, profileResult] = await Promise.all([
				supabase.from("companion_profiles").select("user_id, bio, service_areas, skills, availability").eq("user_id", authData.user.id).maybeSingle(),
				supabase.from("profiles").select("avatar_url").eq("id", authData.user.id).maybeSingle(),
			]);

			if (!isMounted) return;
			if (companionResult.error || profileResult.error) {
				setNotice(toNotice(companionResult.error ?? profileResult.error, "โหลดโปรไฟล์ไม่สำเร็จ"));
			} else {
				setAvatarUrl(profileResult.data?.avatar_url ?? null);
				setAvatarPreview(profileResult.data?.avatar_url ?? null);
				if (companionResult.data) {
				const profile = companionResult.data as CompanionProfileDB;
				
				// แปลง Array จาก DB กลับมาเป็น String คั่นด้วย comma เพื่อแสดงใน Input
				setValues({
					bio: profile.bio ?? "",
					service_areas: Array.isArray(profile.service_areas) ? profile.service_areas.join(", ") : "",
					skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
					availability: profile.availability ?? "",
				});
				setHasProfile(true);
				}
			}
			setIsLoading(false);
		}

		void loadProfile();
		return () => {
			isMounted = false;
		};
	}, []);

	function handleAvatarSelection(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!avatarExtensions[file.type]) {
			setNotice({ type: "error", message: "เลือกรูปภาพชนิด JPEG, PNG หรือ WebP" });
			event.target.value = "";
			return;
		}
		if (file.size > maxAvatarSize) {
			setNotice({ type: "error", message: "ขนาดรูปภาพต้องไม่เกิน 5 MB" });
			event.target.value = "";
			return;
		}

		setAvatarFile(file);
		setAvatarPreview(URL.createObjectURL(file));
		setNotice(null);
	}

	async function uploadAvatar() {
		if (!userId || !avatarFile) return;

		setIsUploadingAvatar(true);
		setNotice(null);
		const objectPath = `${userId}/avatar-${Date.now()}.${avatarExtensions[avatarFile.type]}`;
		const { error: uploadError } = await supabase.storage.from(avatarBucket).upload(objectPath, avatarFile, {
			cacheControl: "3600",
			contentType: avatarFile.type,
			upsert: false,
		});

		if (uploadError) {
			setNotice(toNotice(uploadError, "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ"));
			setIsUploadingAvatar(false);
			return;
		}

		const { data } = supabase.storage.from(avatarBucket).getPublicUrl(objectPath);
		const { error: profileError } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
		if (profileError) {
			await supabase.storage.from(avatarBucket).remove([objectPath]);
			setNotice(toNotice(profileError, "บันทึกรูปโปรไฟล์ไม่สำเร็จ"));
		} else {
			setAvatarUrl(data.publicUrl);
			setAvatarPreview(data.publicUrl);
			setAvatarFile(null);
			setNotice({ type: "success", message: "อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว" });
		}
		setIsUploadingAvatar(false);
	}

	function updateValue(field: keyof ProfileValues, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
		setNotice(null);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!userId) {
			setNotice({ type: "error", message: "ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง" });
			return;
		}

		setIsSaving(true);
		setNotice(null);

		// Helper ฟังก์ชันแปลง String เป็น Array of Text ป้องกันค่าว่าง
		const toArray = (text: string) =>
			text
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean);

		const payload = {
			user_id: userId,
			bio: values.bio.trim(),
			service_areas: toArray(values.service_areas), // แปลงเป็น string[] สำหรับ PostgreSQL text[]
			skills: toArray(values.skills),               // แปลงเป็น string[] สำหรับ PostgreSQL text[]
			availability: values.availability.trim(),
		};

		const { error } = await supabase
			.from("companion_profiles")
			.upsert(payload, { onConflict: "user_id" });

		if (error) {
			setNotice(toNotice(error, "บันทึกโปรไฟล์ไม่สำเร็จ"));
		} else {
			setHasProfile(true);
			setNotice({ type: "success", message: "บันทึกโปรไฟล์ Companion เรียบร้อยแล้ว" });
		}
		setIsSaving(false);
	}

	async function handleDelete() {
		if (!userId) {
			setNotice({ type: "error", message: "ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง" });
			return;
		}
		if (!window.confirm("ยืนยันลบโปรไฟล์ Companion? ข้อมูลโปรไฟล์นี้จะถูกลบถาวร")) return;

		setIsDeleting(true);
		setNotice(null);
		const { error } = await supabase.from("companion_profiles").delete().eq("user_id", userId);
		if (error) {
			setNotice(toNotice(error, "ลบโปรไฟล์ไม่สำเร็จ"));
		} else {
			setValues(emptyProfile);
			setHasProfile(false);
			setNotice({ type: "success", message: "ลบโปรไฟล์ Companion เรียบร้อยแล้ว" });
		}
		setIsDeleting(false);
	}

	const isBusy = isSaving || isDeleting || isUploadingAvatar;

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-4xl">
				<Link href="/companion" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#63746e] transition hover:text-[#18302b]"><ArrowLeft size={16} />กลับหน้า Companion</Link>
				<header className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Companion profile</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">จัดการโปรไฟล์ของคุณ</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#63746e]">แนะนำตัวและระบุข้อมูลบริการ เพื่อให้ Customer เข้าใจรูปแบบความช่วยเหลือของคุณ</p></header>

				{notice ? <div role={notice.type === "error" ? "alert" : "status"} className={`mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6 ${notice.type === "success" ? "bg-[#edf6f1] text-[#356b5b]" : "bg-[#fff0ed] text-[#a64a3c]"}`}>{notice.type === "success" ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" /> : <TriangleAlert size={19} className="mt-0.5 shrink-0" />}{notice.message}</div> : null}

				<section className="rounded-3xl border border-[#e4e8e1] bg-white shadow-[0_20px_60px_rgba(36,67,57,0.08)]">
					<div className="flex items-center gap-3 border-b border-[#edf0eb] px-6 py-5 sm:px-8"><span className="flex size-10 items-center justify-center rounded-xl bg-[#dceee7] text-[#467267]"><UserRound size={19} /></span><div><h2 className="font-semibold">{hasProfile ? "ข้อมูลโปรไฟล์ Companion" : "สร้างโปรไฟล์ Companion"}</h2><p className="mt-1 text-xs text-[#789087]">คั่นรายการในช่องพื้นที่บริการและทักษะด้วยเครื่องหมายจุลภาค (,)</p></div></div>
					{isLoading ? <div className="flex justify-center py-20 text-[#5e9b83]"><LoaderCircle size={32} className="animate-spin" aria-label="กำลังโหลดโปรไฟล์" /></div> : <form onSubmit={handleSubmit} className="p-6 sm:p-8">
						<div className="mb-8 flex flex-col gap-5 rounded-2xl border border-[#edf0eb] bg-[#fbfcfa] p-5 sm:flex-row sm:items-center">
							<div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dfe5df] bg-[#dceee7] text-[#467267]" role="img" aria-label="ตัวอย่างรูปโปรไฟล์">
								{avatarPreview ? <div className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(avatarPreview)})` }} /> : <UserRound size={36} />}
							</div>
							<div className="min-w-0 flex-1"><h3 className="font-semibold text-[#304640]">รูปโปรไฟล์</h3><p className="mt-1 text-sm leading-6 text-[#789087]">ใช้รูป JPEG, PNG หรือ WebP ขนาดไม่เกิน 5 MB</p><div className="mt-4 flex flex-wrap gap-3"><label htmlFor="companion-avatar" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dfe5df] bg-white px-4 py-2.5 text-sm font-semibold text-[#304640] transition hover:border-[#b9ccc2]"> <Upload size={16} />เลือกรูปภาพ<input id="companion-avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarSelection} disabled={isBusy || !userId} className="sr-only" /></label><button type="button" onClick={() => void uploadAvatar()} disabled={isBusy || !avatarFile || !userId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18302b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-50">{isUploadingAvatar ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{isUploadingAvatar ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}</button></div>{avatarFile ? <p className="mt-2 text-xs text-[#789087]">{avatarFile.name}</p> : null}</div>
						</div>
						<div className="space-y-6">
							<Field label="แนะนำตัว" icon={<Sparkles size={17} />} hint="เล่าประสบการณ์หรือรูปแบบการช่วยเหลือของคุณ"><textarea value={values.bio} onChange={(event) => updateValue("bio", event.target.value)} rows={5} placeholder="แนะนำตัวให้ Customer รู้จักคุณ" className={`${inputClass} resize-y`} /></Field>
							<Field label="พื้นที่บริการ" icon={<MapPin size={17} />} hint="ระบุพื้นที่หรือจังหวัดคั่นด้วยจุลภาค (,) เช่น กรุงเทพ, นนทบุรี"><input value={values.service_areas} onChange={(event) => updateValue("service_areas", event.target.value)} placeholder="เช่น กรุงเทพ, นนทบุรี" className={inputClass} /></Field>
							<Field label="ทักษะและความเชี่ยวชาญ" icon={<ShieldCheck size={17} />} hint="บอกความสามารถคั่นด้วยจุลภาค (,) เช่น ขับรถ, ภาษาอังกฤษ, พาไปโรงพยาบาล"><input value={values.skills} onChange={(event) => updateValue("skills", event.target.value)} placeholder="เช่น ขับรถ, ภาษาอังกฤษ, พาไปโรงพยาบาล" className={inputClass} /></Field>
							<Field label="ช่วงเวลาที่สะดวกรับงาน" icon={<CalendarClock size={17} />} hint="ระบุวันหรือช่วงเวลาที่คุณสะดวก"><input value={values.availability} onChange={(event) => updateValue("availability", event.target.value)} placeholder="เช่น วันธรรมดาช่วงเช้า, เสาร์-อาทิตย์" className={inputClass} /></Field>
						</div>
						<div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#edf0eb] pt-6 sm:flex-row sm:justify-between">
							{hasProfile ? <button type="button" onClick={() => void handleDelete()} disabled={isBusy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8c9c1] px-4 py-3 text-sm font-semibold text-[#a64a3c] transition hover:bg-[#fff0ed] disabled:cursor-not-allowed disabled:opacity-60"><Trash2 size={17} />{isDeleting ? "กำลังลบโปรไฟล์..." : "ลบโปรไฟล์ Companion"}</button> : <span />}
							<button type="submit" disabled={isBusy || !userId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18302b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}{isSaving ? "กำลังบันทึก..." : hasProfile ? "บันทึกการแก้ไข" : "สร้างโปรไฟล์ Companion"}</button>
						</div>
					</form>}
				</section>
			</div>
		</main>
	);
}

const inputClass = "mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm text-[#18302b] outline-none transition placeholder:text-[#9aa9a3] focus:border-[#5e9b83] focus:ring-4 focus:ring-[#dceee7] disabled:cursor-not-allowed disabled:opacity-60";

function Field({ label, icon, hint, children }: { label: string; icon: React.ReactNode; hint: string; children: React.ReactNode }) {
	return <label className="block text-sm font-semibold text-[#304640]"><span className="flex items-center gap-2">{icon}{label}</span>{children}<span className="mt-2 block text-xs font-normal leading-5 text-[#789087]">{hint}</span></label>;
}

function toNotice(error: { code?: string; message?: string }, fallback: string): Notice {
	const message = error.message?.toLowerCase() ?? "";
	const isPermissionError = error.code === "42501" || message.includes("row-level security") || message.includes("permission denied");
	return {
		type: "error",
		message: isPermissionError ? "Supabase ปฏิเสธการเข้าถึงข้อมูล โปรดตรวจสอบ RLS policy ของ companion_profiles" : `${fallback} กรุณาลองใหม่อีกครั้ง`,
	};
}