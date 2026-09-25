"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Building2, Check, Clock3, HeartHandshake, Hospital, Landmark, LoaderCircle, LogOut, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

type UserProfile = {
	id: string;
	name: string;
	avatarUrl: string | null;
	role: string;
};

const roleLabels: Record<string, string> = {
	customer: "Customer",
	companion: "Companion",
	admin: "Admin",
};

const dashboardPaths: Record<string, string> = {
	customer: "/customer",
	companion: "/companion",
	admin: "/admin/dashboard",
};

const companionBenefits = [
	"เลือกรับงานที่เหมาะกับเวลาและความถนัดของคุณ",
	"สร้างรายได้จากการช่วยเหลือและใช้เวลาร่วมกับผู้อื่น",
	"รับข้อมูลการเดินทางและรายละเอียดงานอย่างชัดเจน",
];

const useCases = [
	{ icon: Hospital, label: "ไปโรงพยาบาล", detail: "มีเพื่อนช่วยเดินทางและประสานงาน" },
	{ icon: Landmark, label: "ไปธนาคาร", detail: "ช่วยจัดการธุระในสถานที่คุ้นเคยน้อยลง" },
	{ icon: Building2, label: "ติดต่อหน่วยงาน", detail: "มีคนช่วยไปติดต่อสถานที่ราชการ" },
];

export default function Home() {
	const router = useRouter();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const [isSigningOut, setIsSigningOut] = useState(false);

	useEffect(() => {
		let isMounted = true;

		// ฟังก์ชันโหลดโปรไฟล์จาก user.id ล่าสุด
		async function fetchProfileForUser(user: User | null) {
			if (!user) {
				if (isMounted) {
					setProfile(null);
					setIsCheckingAuth(false);
				}
				return;
			}

			const { data: profileData } = await supabase
				.from("profiles")
				.select("id, full_name, avatar_url, role")
				.eq("id", user.id)
				.maybeSingle();

			if (!isMounted) return;

			setProfile({
				id: user.id,
				name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "ผู้ใช้งาน",
				avatarUrl: profileData?.avatar_url || user.user_metadata?.avatar_url || null,
				role: normalizeRole(profileData?.role),
			});
			setIsCheckingAuth(false);
		}

		// 1. ตรวจสอบ User สดๆ จาก Supabase Server
		async function loadInitialUser() {
			const { data: { user } } = await supabase.auth.getUser();
			if (!isMounted) return;
			await fetchProfileForUser(user);
		}

		void loadInitialUser();

		// 2. ดักฟัง Event เมื่อ Auth State เปลี่ยนแปลง (สลับบัญชี / เข้าสู่ระบบ / ออกจากระบบ)
		const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
			if (!isMounted) return;

			if (event === "SIGNED_OUT" || !session?.user) {
				setProfile(null);
				setIsCheckingAuth(false);
			} else if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
				setIsCheckingAuth(true);
				await fetchProfileForUser(session.user);
			}
		});

		return () => {
			isMounted = false;
			authListener.subscription.unsubscribe();
		};
	}, []);

	async function handleSignOut() {
		setIsSigningOut(true);
		await supabase.auth.signOut();
		setProfile(null);
		setIsSigningOut(false);
		router.refresh(); // ล้าง App Router cache ของ Next.js
	}

	if (isCheckingAuth) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-[#f8f8f4] text-[#5e9b83]">
				<LoaderCircle size={32} className="animate-spin" aria-label="กำลังตรวจสอบสถานะการเข้าสู่ระบบ" />
			</main>
		);
	}

	return (
		<main className="overflow-hidden bg-[#f8f8f4] text-[#18302b]">
			<header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
				<Link href="/" className="flex items-center gap-3" aria-label="Care Companion หน้าหลัก">
					<span className="flex size-10 items-center justify-center rounded-2xl bg-[#18302b] text-[#f5c76b] shadow-sm">
						<HeartHandshake size={21} strokeWidth={2.2} />
					</span>
					<span className="text-lg font-semibold tracking-[-0.03em]">Care Companion</span>
				</Link>
				{profile ? (
					<div className="order-3 flex w-full items-center justify-between gap-3 border-t border-[#e1e4dd] pt-4 md:order-0 md:w-auto md:border-0 md:pt-0">
						<Link href={dashboardPaths[profile.role] ?? "/"} className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white">
							<Avatar profile={profile} />
							<span className="hidden text-left sm:block">
								<strong className="block text-sm font-semibold">{profile.name}</strong>
								<span className="mt-0.5 block text-xs text-[#789087]">{roleLabels[profile.role]}</span>
							</span>
						</Link>
						<button
							type="button"
							onClick={handleSignOut}
							disabled={isSigningOut}
							title="ออกจากระบบ"
							className="inline-flex items-center gap-2 rounded-xl border border-[#dfe5df] bg-white px-3 py-2.5 text-xs font-semibold text-[#63746e] transition hover:text-[#18302b] disabled:opacity-60"
						>
							{isSigningOut ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}
							<span className="hidden sm:inline">ออกจากระบบ</span>
						</button>
					</div>
				) : (
					<Link
						href="/login"
						className="inline-flex items-center gap-2 rounded-full bg-[#f1bd5d] px-4 py-3 text-xs font-semibold text-[#18302b] shadow-[0_4px_0_#d99e43] transition-transform hover:-translate-y-0.5 sm:px-5 sm:text-sm"
					>
						เข้าสู่ระบบด้วย Google Account
						<ArrowRight size={16} />
					</Link>
				)}
			</header>

			<section id="top" className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20">
				<div className="max-w-2xl">
					<div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c7ddd4] bg-[#ecf5f0] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#447568]">
						<Sparkles size={14} />เพื่อนร่วมทางสำหรับชีวิตประจำวัน
					</div>
					<h1 className="max-w-2xl text-[clamp(3.1rem,7vw,6.4rem)] font-semibold leading-[0.96] tracking-[-0.07em] text-[#18302b]">
						{profile ? `ยินดีต้อนรับกลับมา, ${profile.name}` : "ทุกธุระสำคัญ เดินทางไปด้วยกันได้"}
					</h1>
					<p className="mt-8 max-w-xl text-lg leading-8 text-[#586a64] sm:text-xl">
						Care Companion คือแพลตฟอร์มกลางที่เชื่อมโยงผู้ที่ต้องการผู้ช่วยร่วมเดินทางทำธุระ กับผู้ให้บริการร่วมเดินทางที่พร้อมช่วยให้แต่ละวันง่ายขึ้น
					</p>
					<div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#e5c987] bg-[#fff7df] p-4 text-sm leading-6 text-[#614f2b]">
						<ShieldCheck className="mt-0.5 shrink-0 text-[#b17c27]" size={19} />
						<span>
							<strong className="font-semibold text-[#48391e]">โปรดทราบ:</strong> Companion ไม่ใช่ผู้ให้บริการทางการแพทย์ และไม่ใช่ผู้ดูแลรักษาผู้ป่วย
						</span>
					</div>
					<div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
						{profile ? (
							<Link href={dashboardPaths[profile.role] ?? "/"} className="inline-flex items-center gap-3 rounded-full bg-[#18302b] px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
								ไปยัง Dashboard ของฉัน
								<ArrowRight size={17} />
							</Link>
						) : (
							<Link href="/login" className="inline-flex items-center gap-3 rounded-full bg-[#18302b] px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
								เริ่มต้นใช้งาน
								<ArrowRight size={17} />
							</Link>
						)}
						<a href="#how-it-works" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-[#586a64] hover:text-[#18302b]">
							ทำความรู้จักแพลตฟอร์ม
							<ArrowRight size={16} />
						</a>
					</div>
				</div>

				<div className="relative mx-auto w-full max-w-xl lg:mr-0">
					<div className="absolute -right-4 -top-8 size-28 rounded-full bg-[#f1bd5d] opacity-70 sm:size-36" />
					<div className="relative rounded-[2.5rem] bg-[#dceee7] p-4 shadow-[0_24px_60px_rgba(36,67,57,0.12)] sm:p-7">
						<div className="rounded-4xl bg-[#f8f8f4] p-5 sm:p-7">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-xs font-bold uppercase tracking-[0.12em] text-[#789087]">วันนี้, 10:30 น.</p>
									<h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">แผนของคุณวันนี้</h2>
								</div>
								<span className="flex size-10 items-center justify-center rounded-xl bg-[#f8e6c8] text-[#a16a2a]">
									<Clock3 size={19} />
								</span>
							</div>
							<div className="mt-7 space-y-3">
								<div className="flex items-center gap-4 rounded-2xl border border-[#e5e7df] bg-white p-4">
									<span className="flex size-11 items-center justify-center rounded-xl bg-[#dceee7] text-[#467267]">
										<Hospital size={20} />
									</span>
									<div className="flex-1">
										<p className="text-sm font-semibold">ไปโรงพยาบาล</p>
										<p className="mt-1 text-xs text-[#789087]">เดินทางพร้อมกัน · 10:30 น.</p>
									</div>
									<Check size={18} className="text-[#5e9b83]" />
								</div>
								<div className="flex items-center gap-4 rounded-2xl border border-[#e5e7df] bg-white p-4">
									<span className="flex size-11 items-center justify-center rounded-xl bg-[#e8e0f2] text-[#756080]">
										<Landmark size={20} />
									</span>
									<div className="flex-1">
										<p className="text-sm font-semibold">ติดต่อธนาคาร</p>
										<p className="mt-1 text-xs text-[#789087]">เดินต่อไปด้วยกัน · 12:15 น.</p>
									</div>
									<span className="rounded-full bg-[#edf6f1] px-2.5 py-1 text-[10px] font-bold text-[#467267]">ถัดไป</span>
								</div>
							</div>
							<div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#18302b] p-4 text-white">
								<span className="flex size-10 items-center justify-center rounded-full bg-[#f1bd5d] text-[#18302b]">
									<HeartHandshake size={18} />
								</span>
								<div>
									<p className="text-sm font-semibold">คุณเมย์กำลังเดินทางมา</p>
									<p className="mt-1 text-xs text-[#b6c9c0]">Companion ของคุณในวันนี้</p>
								</div>
							</div>
						</div>
					</div>
					<div className="absolute -bottom-6 -left-5 flex items-center gap-3 rounded-2xl border border-[#e5e7df] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(36,67,57,0.1)] sm:-left-10">
						<span className="flex size-10 items-center justify-center rounded-full bg-[#f1bd5d] text-[#18302b]">
							<ShieldCheck size={19} />
						</span>
						<div>
							<p className="text-xs font-bold text-[#18302b]">ความช่วยเหลือที่ไว้ใจได้</p>
							<p className="mt-0.5 text-[11px] text-[#789087]">ข้อมูลชัดเจน ปลอดภัย และสบายใจ</p>
						</div>
					</div>
				</div>
			</section>

			<section id="how-it-works" className="border-y border-[#e1e4dd] bg-white">
				<div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">ใช้งานง่ายใน 3 ขั้นตอน</p>
						<h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-tighter sm:text-5xl">เพราะการขอความช่วยเหลือไม่ควรเป็นเรื่องยุ่งยาก</h2>
					</div>
					<div className="grid gap-8 sm:grid-cols-3">
						<Step number="01" title="บอกสิ่งที่คุณต้องการ" detail="ระบุธุระ เวลา และสถานที่ เพื่อให้เราเข้าใจความต้องการของคุณ" />
						<Step number="02" title="พบ Companion ที่เหมาะสม" detail="เลือกผู้ให้บริการร่วมเดินทางที่ตรงกับความต้องการของคุณ" />
						<Step number="03" title="เดินทางอย่างมั่นใจ" detail="มีเพื่อนร่วมทางคอยช่วยเหลือ ตั้งแต่เริ่มต้นจนเสร็จสิ้นธุระ" />
					</div>
				</div>
			</section>

			<section id="benefits" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
				<div className="max-w-2xl">
					<p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">พื้นที่ที่ทุกคนมีส่วนร่วมได้</p>
					<h2 className="mt-4 text-4xl font-semibold tracking-tighter sm:text-5xl">ดูแลกันได้ทั้งสองทาง</h2>
					<p className="mt-5 text-lg leading-8 text-[#687873]">
						ไม่ว่าคุณกำลังมองหาความช่วยเหลือ หรืออยากเป็นคนที่ส่งต่อความช่วยเหลือ Care Companion เชื่อมโยงคนที่ต้องการกันและกัน
					</p>
				</div>
				<div className="mt-12 grid gap-5 lg:grid-cols-2">
					<article className="rounded-4xl bg-[#18302b] p-7 text-white sm:p-10">
						<div className="flex size-12 items-center justify-center rounded-2xl bg-[#f1bd5d] text-[#18302b]">
							<Users size={22} />
						</div>
						<h3 className="mt-7 text-3xl font-semibold tracking-[-0.04em]">สำหรับ Customer</h3>
						<p className="mt-3 max-w-md leading-7 text-[#c1d0c8]">คุณไม่จำเป็นต้องจัดการทุกอย่างเพียงลำพัง ขอความช่วยเหลือในแบบที่ตรงกับชีวิตของคุณ</p>
						<Link href="/customer" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#f1bd5d]">
							ไปหน้า Customer
							<ArrowRight size={16} />
						</Link>
					</article>
					<article className="rounded-4xl bg-[#f1bd5d] p-7 sm:p-10">
						<div className="flex size-12 items-center justify-center rounded-2xl bg-[#18302b] text-[#f1bd5d]">
							<HeartHandshake size={22} />
						</div>
						<h3 className="mt-7 text-3xl font-semibold tracking-[-0.04em]">สำหรับ Companion</h3>
						<p className="mt-3 max-w-md text-[#594728]">เวลา ความใส่ใจ และความตั้งใจของคุณ อาจทำให้วันธรรมดาของใครบางคนง่ายขึ้นมาก</p>
						<ul className="mt-8 space-y-4">
							{companionBenefits.map((benefit) => (
								<li key={benefit} className="flex items-start gap-3 text-sm text-[#594728]">
									<Check size={17} className="mt-0.5 shrink-0 text-[#18302b]" />
									{benefit}
								</li>
							))}
						</ul>
						<Link href="/companion" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#18302b]">
							ไปหน้า Companion
							<ArrowRight size={16} />
						</Link>
					</article>
				</div>
			</section>

			<section className="bg-[#edf6f1]">
				<div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-20">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">เราอาจช่วยคุณได้ที่นี่</p>
						<h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">สถานที่ในชีวิตประจำวัน อุ่นใจขึ้นเมื่อมีใครไปด้วย</h2>
					</div>
					<div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
						{useCases.map(({ icon: Icon, label, detail }) => (
							<div key={label} className="rounded-2xl bg-white p-4">
								<span className="flex size-10 items-center justify-center rounded-xl bg-[#dceee7] text-[#467267]">
									<Icon size={19} />
								</span>
								<p className="mt-5 text-sm font-semibold">{label}</p>
								<p className="mt-2 text-xs leading-5 text-[#789087]">{detail}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<footer className="border-t border-[#dfe3dc] px-5 py-8 sm:px-8 lg:px-10">
				<div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[#789087] sm:flex-row sm:items-center sm:justify-between">
					<span className="font-semibold text-[#18302b]">Care Companion</span>
					<span>แพลตฟอร์มกลางสำหรับผู้ต้องการความช่วยเหลือและผู้ให้บริการร่วมเดินทาง</span>
					<span>© 2026 Care Companion</span>
				</div>
			</footer>
		</main>
	);
}

function Avatar({ profile }: { profile: UserProfile }) {
	return profile.avatarUrl ? (
		<Image src={profile.avatarUrl} alt={`รูปโปรไฟล์ของ ${profile.name}`} width={40} height={40} className="size-10 rounded-full object-cover" />
	) : (
		<span className="flex size-10 items-center justify-center rounded-full bg-[#dceee7] text-sm font-semibold text-[#467267]">
			<UserRound size={18} />
		</span>
	);
}

function normalizeRole(role: unknown) {
	const normalized = typeof role === "string" ? role.toLowerCase() : "customer";
	return roleLabels[normalized] ? normalized : "customer";
}

function Step({ number, title, detail }: { number: string; title: string; detail: string }) {
	return (
		<div>
			<span className="text-4xl font-semibold text-[#e0aa4d]">{number}</span>
			<h3 className="mt-4 text-lg font-semibold">{title}</h3>
			<p className="mt-2 text-sm leading-6 text-[#687873]">{detail}</p>
		</div>
	);
}