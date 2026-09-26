"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, HeartHandshake, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

// 1. Export Component หลักที่ครอบด้วย Suspense
export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<main className="flex min-h-screen items-center justify-center bg-[#f8f8f4] text-[#5e9b83]">
					<LoaderCircle size={32} className="animate-spin" aria-label="กำลังตรวจสอบเซสชัน" />
				</main>
			}
		>
			<LoginContent />
		</Suspense>
	);
}

// 2. ย้าย Logic และ UI ทั้งหมดมาไว้ใน Component ย่อย
function LoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectToParam = searchParams.get("redirectTo") || "/";

	const [isCheckingSession, setIsCheckingSession] = useState(true);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		let isMounted = true;

		async function checkCurrentUser() {
			const { data: { user } } = await supabase.auth.getUser();
			if (!isMounted) return;

			if (user) {
				router.replace(redirectToParam);
				router.refresh();
			} else {
				setIsCheckingSession(false);
			}
		}

		void checkCurrentUser();

		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN" && session?.user && isMounted) {
				router.replace(redirectToParam);
				router.refresh();
			}
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, [router, redirectToParam]);

	async function handleGoogleSignIn() {
		setIsSigningIn(true);
		setErrorMessage("");

		const callbackUrl = new URL("/auth/callback", window.location.origin);
		if (redirectToParam !== "/") {
			callbackUrl.searchParams.set("next", redirectToParam);
		}

		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: callbackUrl.toString(),
				queryParams: {
					prompt: "select_account",
				},
			},
		});

		if (error) {
			setErrorMessage("ไม่สามารถเข้าสู่ระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
			setIsSigningIn(false);
		}
	}

	if (isCheckingSession) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-[#f8f8f4] text-[#5e9b83]">
				<LoaderCircle size={32} className="animate-spin" aria-label="กำลังตรวจสอบเซสชัน" />
			</main>
		);
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#f8f8f4] px-5 py-10 text-[#18302b] sm:px-8">
			<div className="w-full max-w-md">
				<Link href="/" className="mx-auto mb-7 flex w-fit items-center gap-2 text-sm font-medium text-[#63746e] hover:text-[#18302b]">
					<ArrowLeft size={16} />กลับหน้าหลัก
				</Link>
				<section className="rounded-4xl border border-[#e4e8e1] bg-white p-7 shadow-[0_24px_70px_rgba(36,67,57,0.1)] sm:p-10">
					<div className="flex size-14 items-center justify-center rounded-2xl bg-[#18302b] text-[#f1bd5d]">
						<HeartHandshake size={27} />
					</div>
					<p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-[#789087]">Care Companion</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">ยินดีต้อนรับ</h1>
					<p className="mt-4 leading-7 text-[#63746e]">
						เข้าสู่ระบบเพื่อค้นหา Companion สร้างคำขอบริการ หรือเริ่มต้นเป็นผู้ช่วยร่วมเดินทาง
					</p>

					<button
						type="button"
						onClick={handleGoogleSignIn}
						disabled={isSigningIn}
						className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#18302b] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#26453d] disabled:cursor-not-allowed disabled:opacity-70"
					>
						<span className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">G</span>
						{isSigningIn ? (
							<>
								<LoaderCircle size={18} className="animate-spin" />
								กำลังเชื่อมต่อกับ Google...
							</>
						) : (
							"เข้าสู่ระบบด้วย Google Account"
						)}
					</button>

					{errorMessage ? (
						<p role="alert" className="mt-4 rounded-xl bg-[#fff0ed] px-4 py-3 text-center text-sm leading-6 text-[#a64a3c]">
							{errorMessage}
						</p>
					) : null}

					<div className="mt-8 flex gap-3 rounded-2xl border border-[#e5c987] bg-[#fff8e5] p-4 text-sm leading-6 text-[#614f2b]">
						<ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#b17c27]" />
						<p>
							Care Companion เป็นเพียงแพลตฟอร์มสำหรับผู้ช่วยร่วมเดินทางและทำธุระเท่านั้น{" "}
							<strong className="font-semibold text-[#48391e]">ไม่ใช่บริการทางการแพทย์</strong> และไม่ใช่ผู้ดูแลรักษาผู้ป่วย
						</p>
					</div>
				</section>
				<p className="mt-6 text-center text-xs leading-5 text-[#789087]">
					การเข้าสู่ระบบแสดงว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
				</p>
			</div>
		</main>
	);
}