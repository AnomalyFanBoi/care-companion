"use client";

import { useState } from "react";
import { ArrowLeft, HeartHandshake, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	async function handleGoogleSignIn() {
		setIsLoading(true);
		setErrorMessage("");

		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo: `${window.location.origin}/auth/callback` },
			});

			if (error) throw error;
		} catch {
			setErrorMessage("ไม่สามารถเข้าสู่ระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
			setIsLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#f8f8f4] px-5 py-10 text-[#18302b] sm:px-8">
			<div className="w-full max-w-md">
				<Link href="/" className="mx-auto mb-7 flex w-fit items-center gap-2 text-sm font-medium text-[#63746e] hover:text-[#18302b]">
					<ArrowLeft size={16} /> กลับหน้าหลัก
				</Link>
				<section className="rounded-4xl border border-[#e4e8e1] bg-white p-7 shadow-[0_24px_70px_rgba(36,67,57,0.1)] sm:p-10">
					<div className="flex size-14 items-center justify-center rounded-2xl bg-[#18302b] text-[#f1bd5d]"><HeartHandshake size={27} /></div>
					<p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-[#789087]">Care Companion</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">ยินดีต้อนรับกลับมา</h1>
					<p className="mt-4 leading-7 text-[#63746e]">เข้าสู่ระบบเพื่อค้นหา Companion หรือเริ่มต้นเป็นส่วนหนึ่งของชุมชนผู้ช่วยร่วมทาง</p>
					<button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#18302b] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-70">
						{isLoading ? <LoaderCircle size={19} className="animate-spin" /> : <span className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">G</span>}
						{isLoading ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย Google Account"}
					</button>
					{errorMessage ? <p role="alert" className="mt-4 rounded-xl bg-[#fff0ed] px-4 py-3 text-center text-sm leading-6 text-[#a64a3c]">{errorMessage}</p> : null}
					<div className="mt-8 flex gap-3 rounded-2xl border border-[#e5c987] bg-[#fff8e5] p-4 text-sm leading-6 text-[#614f2b]">
						<ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#b17c27]" />
						<p>Care Companion เป็นเพียงแพลตฟอร์มสำหรับผู้ช่วยร่วมเดินทางและทำธุระเท่านั้น <strong className="font-semibold text-[#48391e]">ไม่ใช่บริการทางการแพทย์</strong> และไม่ใช่ผู้ดูแลรักษาผู้ป่วย</p>
					</div>
				</section>
				<p className="mt-6 text-center text-xs leading-5 text-[#789087]">การเข้าสู่ระบบแสดงว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</p>
			</div>
		</main>
	);
}
