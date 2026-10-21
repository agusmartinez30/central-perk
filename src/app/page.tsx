import { ReceiptText, Send } from "lucide-react";
import {
  Notice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  StatusBar,
  StatusPill,
  StickyFooter,
} from "@/shared/ui";

// Temporary showcase of the shared UI kit; replaced by the menu screen in T3.
export default function Home() {
  return (
    <>
      <StatusBar />
      <ScreenHeader title="Café Central" table="07" />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="success">Entregado</StatusPill>
          <StatusPill tone="info">En preparación</StatusPill>
          <StatusPill tone="warning">Pendiente</StatusPill>
          <StatusPill tone="danger">Cancelado</StatusPill>
        </div>
        <Notice>Podés seguir pidiendo. Todos los nuevos pedidos se sumarán a esta cuenta.</Notice>
        <Notice tone="warning" title="El total de la mesa cambió">
          Revisá el nuevo total antes de confirmar.
        </Notice>
        <Notice tone="error" title="No pudimos enviar la solicitud">
          Revisá tu conexión y volvé a intentar.
        </Notice>
        <PrimaryButton icon={Send} iconPosition="end">
          Enviar pedido
        </PrimaryButton>
        <PrimaryButton loading>Enviando</PrimaryButton>
        <PrimaryButton disabled>Confirmar solicitud</PrimaryButton>
      </main>
      <StickyFooter>
        <div className="flex gap-2">
          <PrimaryButton size="md" icon={ReceiptText}>
            Solicitar cuenta
          </PrimaryButton>
          <SecondaryButton size="md">Pedir algo más</SecondaryButton>
        </div>
      </StickyFooter>
    </>
  );
}
