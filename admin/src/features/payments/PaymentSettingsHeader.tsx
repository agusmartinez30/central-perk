import type { Ref } from "react";
import type { SettingsTab } from "./payments-state";

/** Subtitle per tab ("Descripción · A" / "Descripción página"). */
const SUBTITLES: Record<SettingsTab, string> = {
  methods: "Definí cómo cobra el equipo y qué opciones ve el cliente.",
  bank: "Gestioná los datos utilizados para pagos por transferencia.",
};

type PaymentSettingsHeaderProps = {
  tab: SettingsTab;
  /** "Guardado hace 4 min", shown uppercase as in the export. */
  savedAgo: string;
  /** "Versión 18 · actualizada hoy 14:38", the pill's tooltip. */
  meta: string;
  /** Focus target after a confirmed save, when the save bar goes away. */
  statusRef?: Ref<HTMLParagraphElement>;
};

/** "Encabezado · A": breadcrumb, title, subtitle of the active tab and the "Estado guardado" pill. */
export function PaymentSettingsHeader({ tab, savedAgo, meta, statusRef }: PaymentSettingsHeaderProps) {
  return (
    <header className="flex h-[68px] w-full shrink-0 items-center justify-between">
      <div className="flex flex-col gap-[3px]">
        <p className="text-[11px] font-extrabold whitespace-nowrap text-brand">CONFIGURACIÓN / PAGOS</p>
        <h2 className="text-[24px] font-extrabold whitespace-nowrap text-ink">Configuración de pagos</h2>
        <p className="text-[12px] font-medium whitespace-nowrap text-muted">{SUBTITLES[tab]}</p>
      </div>
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        title={meta}
        className="flex items-center rounded-[12px] bg-success-bg px-2 py-1 text-[11px] font-extrabold whitespace-nowrap text-success uppercase outline-none"
      >
        {savedAgo}
      </p>
    </header>
  );
}
