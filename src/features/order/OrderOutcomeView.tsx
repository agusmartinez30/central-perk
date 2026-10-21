import { TABLE } from "@/mocks/table";
import { Notice, PrimaryButton, SecondaryButton, StateCard, StatusBar } from "@/shared/ui";
import { OrderHero } from "./OrderHero";
import type { OrderOutcomeCopy } from "./order-outcomes";

type OrderOutcomeViewProps = {
  copy: OrderOutcomeCopy;
  onPrimary: () => void;
  primaryLoading?: boolean;
  /** Optional feedback shown under the actions (e.g. "Avisamos al personal"). */
  feedback?: string;
};

/** Screens 06A–C: hero, state card, notice and the two recovery actions. */
export function OrderOutcomeView({ copy, onPrimary, primaryLoading, feedback }: OrderOutcomeViewProps) {
  return (
    <>
      <StatusBar tone="brand" />
      <OrderHero
        cafeName={TABLE.cafeName}
        table={TABLE.number}
        badgeIcon={copy.icon}
        spinBadgeIcon={copy.spinIcon}
        badgeLabel={copy.badge}
        headline={copy.headline}
        headlineSize={copy.headlineSize}
        text={copy.heroText}
        artOpacity={copy.artOpacity}
      />
      <main className="flex flex-1 flex-col gap-3.5 px-4 pt-5 pb-6">
        <StateCard icon={copy.icon} spinIcon={copy.spinIcon} title={copy.cardTitle}>
          {copy.cardText}
        </StateCard>
        <Notice title={copy.noticeTitle}>{copy.noticeText}</Notice>
        <div className="flex flex-col gap-3">
          <PrimaryButton
            icon={copy.primaryIcon}
            iconPosition="end"
            onClick={onPrimary}
            loading={primaryLoading}
            className="text-[15px]!"
          >
            {copy.primaryLabel}
          </PrimaryButton>
          <SecondaryButton
            href={copy.secondaryHref}
            icon={copy.secondaryIcon}
            className="h-[52px]! rounded-[26px]! text-[14.5px]!"
          >
            {copy.secondaryLabel}
          </SecondaryButton>
        </div>
        {feedback ? <Notice tone="success">{feedback}</Notice> : null}
        <p className="mt-auto pt-2 text-center text-[9.5px] font-bold tracking-[0.8px] text-muted">
          {TABLE.cafeName.toUpperCase()} · Mesa {TABLE.number}
        </p>
      </main>
    </>
  );
}
