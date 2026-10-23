/** Left brand column shared by 11A–11D ("Auth Brand Panel"). */
export function AuthBrandPanel() {
  return (
    <aside className="hidden h-screen min-h-[640px] w-[560px] shrink-0 flex-col justify-between bg-brand px-12 py-[52px] lg:sticky lg:top-0 lg:flex">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <span className="flex size-[38px] items-center justify-center rounded-full bg-surface text-[18px] font-bold text-brand">
            C
          </span>
          <span className="text-[16px] font-bold text-white">CAFÉ CENTRAL</span>
        </div>
        <div className="flex flex-col gap-[18px]">
          <p className="text-[44px] font-bold text-white">
            Tu restaurante,
            <br />
            organizado.
          </p>
          <p className="w-[400px] text-[18px]/[26px] text-white/80">
            Gestioná pedidos, mesas y cobros desde un solo lugar.
          </p>
        </div>
      </div>
      <CoffeeAccent />
    </aside>
  );
}

/** Line-art cup and saucer ("Café Visual Accent"). */
function CoffeeAccent() {
  return (
    <div aria-hidden="true" className="relative h-[210px] w-full">
      <div className="absolute top-[78px] left-[118px] h-[78px] w-[210px] rounded-[50%] outline-2 -outline-offset-1 outline-white/33" />
      <div className="absolute top-6 left-[150px] h-[108px] w-[145px] rounded-[50%] outline-3 -outline-offset-[1.5px] outline-white/67" />
      <div className="absolute top-11 left-[168px] h-14 w-[110px] rounded-[50%] bg-white/12" />
      <Steam className="left-[190px]" />
      <Steam className="left-[238px]" />
    </div>
  );
}

function Steam({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 20 42"
      preserveAspectRatio="none"
      className={`absolute top-0 h-[42px] w-[18px] overflow-visible ${className}`}
    >
      <path
        d="M10 40 C0 28 20 18 10 0"
        fill="none"
        stroke="#FFFFFF88"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
