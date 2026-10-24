"use client";

import { ConfirmDialog } from "@/shared/ui";

type RegenerateDialogProps = { onCancel: () => void; onConfirm: () => void };

/**
 * 09F "Regenerate QR Confirmation" over the dimmed 09C ("Dialog Scrim"). Nothing changes until
 * "Regenerar código"; "Cancelar", Escape or the scrim keep the current code. Focus starts on
 * "Cancelar", stays inside the dialog and returns to the opener on close.
 */
export function RegenerateDialog({ onCancel, onConfirm }: RegenerateDialogProps) {
  return (
    <ConfirmDialog
      title="¿Regenerar código QR?"
      description="El código anterior dejará de funcionar. Tendrás que reemplazar el QR impreso de esta mesa."
      note="Se conservan la mesa, sesiones activas, pedidos y pagos."
      confirmLabel="Regenerar código"
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
