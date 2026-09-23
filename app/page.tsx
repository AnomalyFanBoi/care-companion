import {
	ArrowRight,
	Building2,
	Check,
	ChevronDown,
	Clock3,
	HeartHandshake,
	Hospital,
	Landmark,
	ShieldCheck,
	Sparkles,
	Users,
} from "lucide-react";

const customerBenefits = [
	"มีเพื่อนร่วมทางที่ไว้ใจได้ในวันที่ต้องการความช่วยเหลือ",
	"ช่วยวางแผนการเดินทางและจัดการธุระนอกบ้าน",
	"เลือกความช่วยเหลือให้เหมาะกับเวลาและความต้องการของคุณ",
];

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
	return (
		<main className="overflow-hidden bg-[#f8f8f4] text-[#18302b]">
			<header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
				<a href="#top" className="flex items-center gap-3" aria-label="Care Companion หน้าหลัก">
					<span className="flex size-10 items-center justify-center rounded-2xl bg-[#18302b] text-[#f5c76b] shadow-sm">
						<HeartHandshake size={21} strokeWidth={2.2} />
					</span>
					<span className="text-lg font-semibold tracking-[-0.03em]">Care Companion</span>
				</a>

				<nav className="order-3 flex w-full items-center justify-center gap-5 overflow-x-auto text-sm font-medium text-[#63746e] md:order-none md:w-auto md:gap-8" aria-label="เมนูหลัก">
					<a className="whitespace-nowrap transition-colors hover:text-[#18302b]" href="#how-it-works">วิธีใช้งาน</a>
					<a className="whitespace-nowrap transition-colors hover:text-[#18302b]" href="#benefits">สำหรับลูกค้า</a>
					<a className="whitespace-nowrap transition-colors hover:text-[#18302b]" href="#benefits">สำหรับ Companion</a>
				</nav>

				<a href="#get-started" className="inline-flex items-center gap-2 rounded-full bg-[#f1bd5d] px-4 py-3 text-xs font-semibold text-[#18302b] shadow-[0_4px_0_#d99e43] transition-transform hover:-translate-y-0.5 sm:px-5 sm:text-sm">
					เข้าสู่ระบบด้วย Google Account
					<ArrowRight size={16} />
				</a>
			</header>

			<section id="top" className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20">
				<div className="max-w-2xl">
					<div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c7ddd4] bg-[#ecf5f0] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#447568]">
						<Sparkles size={14} />
						เพื่อนร่วมทางสำหรับชีวิตประจำวัน
					</div>
					<h1 className="max-w-2xl text-[clamp(3.1rem,7vw,6.4rem)] font-semibold leading-[0.96] tracking-[-0.07em] text-[#18302b]">
						ทุกธุระสำคัญ เดินทางไปด้วยกันได้
					</h1>
					<p className="mt-8 max-w-xl text-lg leading-8 text-[#586a64] sm:text-xl">
						Care Companion คือแพลตฟอร์มกลางที่เชื่อมโยงผู้ที่ต้องการผู้ช่วยร่วมเดินทางทำธุระ กับผู้ให้บริการร่วมเดินทางที่พร้อมช่วยให้แต่ละวันง่ายขึ้น
					</p>
					<div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#e5c987] bg-[#fff7df] p-4 text-sm leading-6 text-[#614f2b]">
						<ShieldCheck className="mt-0.5 shrink-0 text-[#b17c27]" size={19} />
						<span><strong className="font-semibold text-[#48391e]">โปรดทราบ:</strong> Companion ไม่ใช่ผู้ให้บริการทางการแพทย์ และไม่ใช่ผู้ดูแลรักษาผู้ป่วย</span>
					</div>
					<div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
						<a href="#get-started" className="inline-flex items-center gap-3 rounded-full bg-[#18302b] px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
							เริ่มต้นใช้งาน
							<ArrowRight size={17} />
						</a>
						<a href="#how-it-works" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-[#586a64] hover:text-[#18302b]">
							ทำความรู้จักแพลตฟอร์ม
							<ChevronDown size={16} />
						</a>
					</div>
					<div className="mt-12 flex items-center gap-4 border-t border-[#dfe4de] pt-5 text-sm text-[#63746e]">
						<div className="flex -space-x-2" aria-hidden="true">
							<span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f8f8f4] bg-[#d49d76] text-xs font-bold text-white">น</span>
							<span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f8f8f4] bg-[#729987] text-xs font-bold text-white">ม</span>
							<span className="flex size-8 items-center justify-center rounded-full border-2 border-[#f8f8f4] bg-[#89789b] text-xs font-bold text-white">อ</span>
						</div>
						<span><strong className="text-[#18302b]">ความช่วยเหลือที่จริงใจ</strong> เริ่มต้นจากการมีใครสักคนอยู่ข้าง ๆ</span>
					</div>
				</div>

				<div className="relative mx-auto w-full max-w-xl lg:mr-0" aria-label="ภาพจำลองการวางแผนวันเดินทางกับ Companion">
					<div className="absolute -right-4 -top-8 size-28 rounded-full bg-[#f1bd5d] opacity-70 sm:size-36" />
					<div className="relative rounded-[2.5rem] bg-[#dceee7] p-4 shadow-[0_24px_60px_rgba(36,67,57,0.12)] sm:p-7">
						<div className="rounded-[2rem] bg-[#f8f8f4] p-5 sm:p-7">
							<div className="flex items-start justify-between">
								<div>
									<p className="text-xs font-bold uppercase tracking-[0.12em] text-[#789087]">วันนี้, 10:30 น.</p>
									<h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">แผนของคุณวันนี้</h2>
								</div>
								<span className="flex size-10 items-center justify-center rounded-xl bg-[#f8e6c8] text-[#a16a2a]"><Clock3 size={19} /></span>
							</div>
							<div className="mt-7 space-y-3">
								<div className="flex items-center gap-4 rounded-2xl border border-[#e5e7df] bg-white p-4">
									<span className="flex size-11 items-center justify-center rounded-xl bg-[#dceee7] text-[#467267]"><Hospital size={20} /></span>
									<div className="flex-1"><p className="text-sm font-semibold">ไปโรงพยาบาล</p><p className="mt-1 text-xs text-[#789087]">เดินทางพร้อมกัน · 10:30 น.</p></div>
									<Check size={18} className="text-[#5e9b83]" />
								</div>
								<div className="flex items-center gap-4 rounded-2xl border border-[#e5e7df] bg-white p-4">
									<span className="flex size-11 items-center justify-center rounded-xl bg-[#e8e0f2] text-[#756080]"><Landmark size={20} /></span>
									<div className="flex-1"><p className="text-sm font-semibold">ติดต่อธนาคาร</p><p className="mt-1 text-xs text-[#789087]">เดินต่อไปด้วยกัน · 12:15 น.</p></div>
									<span className="rounded-full bg-[#edf6f1] px-2.5 py-1 text-[10px] font-bold text-[#467267]">ถัดไป</span>
								</div>
							</div>
							<div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#18302b] p-4 text-white">
								<span className="flex size-10 items-center justify-center rounded-full bg-[#f1bd5d] text-[#18302b]"><HeartHandshake size={18} /></span>
								<div><p className="text-sm font-semibold">คุณเมย์กำลังเดินทางมา</p><p className="mt-1 text-xs text-[#b6c9c0]">Companion ของคุณในวันนี้</p></div>
							</div>
						</div>
					</div>
					<div className="absolute -bottom-6 -left-5 flex items-center gap-3 rounded-2xl border border-[#e5e7df] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(36,67,57,0.1)] sm:-left-10">
						<span className="flex size-10 items-center justify-center rounded-full bg-[#f1bd5d] text-[#18302b]"><ShieldCheck size={19} /></span>
						<div><p className="text-xs font-bold text-[#18302b]">ความช่วยเหลือที่ไว้ใจได้</p><p className="mt-0.5 text-[11px] text-[#789087]">ข้อมูลชัดเจน ปลอดภัย และสบายใจ</p></div>
					</div>
				</div>
			</section>

			<section id="how-it-works" className="border-y border-[#e1e4dd] bg-white">
				<div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">ใช้งานง่ายใน 3 ขั้นตอน</p>
						<h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">เพราะการขอความช่วยเหลือไม่ควรเป็นเรื่องยุ่งยาก</h2>
					</div>
					<div className="grid gap-8 sm:grid-cols-3">
						<div><span className="text-4xl font-semibold text-[#e0aa4d]">01</span><h3 className="mt-4 text-lg font-semibold">บอกสิ่งที่คุณต้องการ</h3><p className="mt-2 text-sm leading-6 text-[#687873]">ระบุธุระ เวลา และสถานที่ เพื่อให้เราเข้าใจความต้องการของคุณ</p></div>
						<div><span className="text-4xl font-semibold text-[#e0aa4d]">02</span><h3 className="mt-4 text-lg font-semibold">พบ Companion ที่เหมาะสม</h3><p className="mt-2 text-sm leading-6 text-[#687873]">เลือกผู้ให้บริการร่วมเดินทางที่ตรงกับความต้องการและจังหวะของคุณ</p></div>
						<div><span className="text-4xl font-semibold text-[#e0aa4d]">03</span><h3 className="mt-4 text-lg font-semibold">เดินทางอย่างมั่นใจ</h3><p className="mt-2 text-sm leading-6 text-[#687873]">มีเพื่อนร่วมทางคอยช่วยเหลือ ตั้งแต่เริ่มต้นจนเสร็จสิ้นธุระ</p></div>
					</div>
				</div>
			</section>

			<section id="benefits" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
				<div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">พื้นที่ที่ทุกคนมีส่วนร่วมได้</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">ดูแลกันได้ทั้งสองทาง</h2><p className="mt-5 text-lg leading-8 text-[#687873]">ไม่ว่าคุณจะกำลังมองหาความช่วยเหลือ หรืออยากเป็นคนที่ส่งต่อความช่วยเหลือ Care Companion เชื่อมโยงคนที่ต้องการกันและกัน</p></div>
				<div className="mt-12 grid gap-5 lg:grid-cols-2">
					<article className="rounded-[2rem] bg-[#18302b] p-7 text-white sm:p-10"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#f1bd5d] text-[#18302b]"><Users size={22} /></div><h3 className="mt-7 text-3xl font-semibold tracking-[-0.04em]">สำหรับ Customer</h3><p className="mt-3 max-w-md leading-7 text-[#c1d0c8]">คุณไม่จำเป็นต้องจัดการทุกอย่างเพียงลำพัง ขอความช่วยเหลือในแบบที่ตรงกับชีวิตของคุณ</p><ul className="mt-8 space-y-4">{customerBenefits.map((benefit) => <li key={benefit} className="flex items-start gap-3 text-sm text-[#e5eee8]"><Check size={17} className="mt-0.5 shrink-0 text-[#f1bd5d]" />{benefit}</li>)}</ul><a href="#get-started" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#f1bd5d]">ค้นหา Companion <ArrowRight size={16} /></a></article>
					<article className="rounded-[2rem] bg-[#f1bd5d] p-7 sm:p-10"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#18302b] text-[#f1bd5d]"><HeartHandshake size={22} /></div><h3 className="mt-7 text-3xl font-semibold tracking-[-0.04em]">สำหรับ Companion</h3><p className="mt-3 max-w-md leading-7 text-[#594728]">เวลา ความใส่ใจ และความตั้งใจของคุณ อาจทำให้วันธรรมดาของใครบางคนง่ายขึ้นมาก</p><ul className="mt-8 space-y-4">{companionBenefits.map((benefit) => <li key={benefit} className="flex items-start gap-3 text-sm text-[#594728]"><Check size={17} className="mt-0.5 shrink-0 text-[#18302b]" />{benefit}</li>)}</ul><a href="#get-started" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#18302b]">มาเป็น Companion <ArrowRight size={16} /></a></article>
				</div>
			</section>

			<section className="bg-[#edf6f1]">
				<div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">เราอาจช่วยคุณได้ที่นี่</p><h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">สถานที่ในชีวิตประจำวัน อุ่นใจขึ้นเมื่อมีใครไปด้วย</h2></div><div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">{useCases.map(({ icon: Icon, label, detail }) => <div key={label} className="rounded-2xl bg-white p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-[#dceee7] text-[#467267]"><Icon size={19} /></span><p className="mt-5 text-sm font-semibold">{label}</p><p className="mt-2 text-xs leading-5 text-[#789087]">{detail}</p></div>)}</div></div>
			</section>

			<section id="get-started" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="relative overflow-hidden rounded-[2.5rem] bg-[#dceee7] px-7 py-12 sm:px-12 sm:py-16"><div className="relative z-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#467267]">เริ่มต้นสร้างวันที่ง่ายขึ้น</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">ก้าวต่อไปของคุณ มีเราอยู่ข้าง ๆ</h2><p className="mt-5 max-w-lg text-lg leading-8 text-[#53625e]">ทำความรู้จัก Care Companion แพลตฟอร์มที่ช่วยเชื่อมต่อผู้ต้องการความช่วยเหลือกับ Companion ที่พร้อมร่วมเดินทาง</p><a href="#top" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#18302b] px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">เข้าสู่ระบบด้วย Google Account <ArrowRight size={17} /></a></div><div className="absolute -bottom-24 -right-12 size-64 rounded-full border-[36px] border-[#f1bd5d] opacity-70 sm:size-80" /></div></section>

			<footer className="border-t border-[#dfe3dc] px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[#789087] sm:flex-row sm:items-center sm:justify-between"><span className="font-semibold text-[#18302b]">Care Companion</span><span>แพลตฟอร์มกลางสำหรับผู้ต้องการความช่วยเหลือและผู้ให้บริการร่วมเดินทาง</span><span>© 2026 Care Companion</span></div></footer>
		</main>
	);
}
