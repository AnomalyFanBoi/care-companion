"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, Send, TriangleAlert } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";

type FormValues = {
	taskType: string;
	date: string;
	time: string;
	origin: string;
	destination: string;
	duration: string;
	details: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
	taskType: "",
	date: "",
	time: "",
	origin: "",
	destination: "",
	duration: "",
	details: "",
};

function validateForm(values: FormValues): FormErrors {
	const errors: FormErrors = {};

	if (!values.taskType) errors.taskType = "กรุณาเลือกประเภทของธุระ";
	if (!values.date) errors.date = "กรุณาเลือกวันที่";
	if (!values.time) errors.time = "กรุณาเลือกเวลา";
	if (!values.origin.trim()) errors.origin = "กรุณาระบุสถานที่ต้นทาง";
	if (!values.destination.trim()) errors.destination = "กรุณาระบุจุดหมาย";
	if (!values.duration) errors.duration = "กรุณาระบุระยะเวลาใช้บริการ";

	return errors;
}

export default function CreateRequestPage() {
	const router = useRouter();
	const [values, setValues] = useState<FormValues>(initialValues);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

	function updateValue(field: keyof FormValues, value: string) {
		setValues((current) => ({ ...current, [field]: value }));
		setErrors((current) => ({ ...current, [field]: undefined }));
		setStatus(null);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const validationErrors = validateForm(values);
		setErrors(validationErrors);
		setStatus(null);

		if (Object.keys(validationErrors).length > 0) return;

		setIsSubmitting(true);
		const { data: authData, error: authError } = await supabase.auth.getUser();
		if (authError || !authData.user) {
			setStatus({ type: "error", message: "กรุณาเข้าสู่ระบบก่อนส่งคำขอ" });
			setIsSubmitting(false);
			return;
		}

		const { error } = await supabase.from("booking_request").insert({
			customer_id: authData.user.id,
			task: values.taskType,
			booking_date: values.date,
			booking_time: values.time,
			start_location: values.origin.trim(),
			destination: values.destination.trim(),
			duration: values.duration,
			details: values.details.trim() || null,
		});

		if (error) {
			setStatus({ type: "error", message: "ไม่สามารถส่งคำขอได้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง" });
		} else {
			router.push("/customer");
			return;
		}

		setIsSubmitting(false);
	}

	return (
		<main className="min-h-screen bg-[#f8f8f4] px-5 py-8 text-[#18302b] sm:px-8 lg:py-12">
			<div className="mx-auto max-w-3xl">
                <Link href="/customer" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#63746e] hover:text-[#18302b]">
                <ArrowLeft size={16} /> กลับ
                </Link>
				<div className="mb-8">
					<p className="text-xs font-bold uppercase tracking-[0.15em] text-[#789087]">Customer request</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">สร้างคำขอผู้ช่วยร่วมเดินทาง</h1>
					<p className="mt-4 max-w-2xl text-lg leading-8 text-[#63746e]">บอกเราเกี่ยวกับธุระที่ต้องการความช่วยเหลือ แล้วเราจะช่วยเชื่อมต่อคุณกับ Companion ที่เหมาะสม</p>
				</div>

				<form onSubmit={handleSubmit} noValidate className="rounded-4xl border border-[#e4e8e1] bg-white p-6 shadow-[0_20px_60px_rgba(36,67,57,0.08)] sm:p-10">
					<div className="grid gap-6 sm:grid-cols-2">
						<Field label="ประเภทของธุระ" error={errors.taskType} required>
							<select value={values.taskType} onChange={(event) => updateValue("taskType", event.target.value)} className={inputClass(errors.taskType)}>
								<option value="">เลือกประเภทของธุระ</option>
								<option value="hospital">ไปโรงพยาบาล</option>
								<option value="bank">ไปธนาคาร</option>
								<option value="government">ติดต่อหน่วยงานราชการ</option>
								<option value="public-venue">ไปสถานที่สาธารณะ</option>
								<option value="other">อื่น ๆ</option>
							</select>
						</Field>
						<Field label="วันที่" error={errors.date} required>
							<div className="relative"><CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#789087]" size={18} /><input type="date" min={new Date().toISOString().split("T")[0]} value={values.date} onChange={(event) => updateValue("date", event.target.value)} className={`${inputClass(errors.date)} pl-11`} /></div>
						</Field>
						<Field label="เวลา" error={errors.time} required>
							<div className="relative"><Clock3 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#789087]" size={18} /><input type="time" value={values.time} onChange={(event) => updateValue("time", event.target.value)} className={`${inputClass(errors.time)} pl-11`} /></div>
						</Field>
						<Field label="ระยะเวลาที่ต้องการใช้บริการ" error={errors.duration} required>
							<select value={values.duration} onChange={(event) => updateValue("duration", event.target.value)} className={inputClass(errors.duration)}><option value="">เลือกระยะเวลา</option><option value="1-2">1–2 ชั่วโมง</option><option value="3-4">3–4 ชั่วโมง</option><option value="half-day">ครึ่งวัน</option><option value="full-day">เต็มวัน</option></select>
						</Field>
						<Field label="สถานที่ต้นทาง" error={errors.origin} required>
							<div className="relative"><MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#789087]" size={18} /><input value={values.origin} onChange={(event) => updateValue("origin", event.target.value)} placeholder="เช่น บ้านหรือสถานีรถไฟฟ้า" className={`${inputClass(errors.origin)} pl-11`} /></div>
						</Field>
						<Field label="จุดหมาย" error={errors.destination} required>
							<div className="relative"><MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#789087]" size={18} /><input value={values.destination} onChange={(event) => updateValue("destination", event.target.value)} placeholder="เช่น โรงพยาบาลหรือธนาคาร" className={`${inputClass(errors.destination)} pl-11`} /></div>
						</Field>
					</div>

					<Field label="รายละเอียดเพิ่มเติม"><textarea value={values.details} onChange={(event) => updateValue("details", event.target.value)} rows={4} placeholder="บอกข้อมูลที่ช่วยให้ Companion เตรียมตัวได้ดีขึ้น (ไม่บังคับ)" className={`${inputClass()} resize-none`} /></Field>

					{status ? <div role="status" className={`mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6 ${status.type === "success" ? "bg-[#edf6f1] text-[#356b5b]" : "bg-[#fff0ed] text-[#a64a3c]"}`}>{status.type === "success" ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" /> : <TriangleAlert size={19} className="mt-0.5 shrink-0" />}{status.message}</div> : null}

					<button type="submit" disabled={isSubmitting} className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#18302b] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-60">
						<Send size={17} />
						{isSubmitting ? "กำลังส่งคำขอ..." : "ส่งคำขอ"}
					</button>
				</form>
			</div>
		</main>
	);
}

function inputClass(error?: string) {
	return `mt-2 w-full rounded-xl border bg-[#fbfcfa] px-4 py-3 text-sm text-[#18302b] outline-none transition placeholder:text-[#9aa9a3] focus:border-[#5e9b83] focus:ring-4 focus:ring-[#dceee7] ${error ? "border-[#c96d5d]" : "border-[#dfe5df]"}`;
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
	return <label className="block text-sm font-semibold text-[#304640]">{label}{required ? <span className="ml-1 text-[#b45c4d]">*</span> : null}{children}{error ? <span className="mt-1 block text-xs font-normal text-[#b45c4d]">{error}</span> : null}</label>;
}
