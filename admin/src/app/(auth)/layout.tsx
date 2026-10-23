import { AuthBrandPanel } from "@/features/auth";

/** Split layout of 11A–11D: brand panel on the left, centered form card on the right. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-cream">
      <AuthBrandPanel />
      <main className="flex flex-1 items-center justify-center px-6 py-10">{children}</main>
    </div>
  );
}
