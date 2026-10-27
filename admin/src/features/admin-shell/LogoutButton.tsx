"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutStaff } from "@/features/auth";

/** "Cerrar sesión" at the foot of the sidebar: `POST /auth/logout`, then `/login`. */
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    await signOutStaff();
    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="mt-auto flex h-[40px] w-full shrink-0 items-center gap-2.5 rounded-nav px-2.5 text-[13px] font-medium whitespace-nowrap text-white/72 transition-colors hover:bg-white/6 hover:text-white disabled:opacity-60"
    >
      <LogOut size={16} aria-hidden="true" className="shrink-0 text-white/60" />
      <span>Cerrar sesión</span>
    </button>
  );
}
