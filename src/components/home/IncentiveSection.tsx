// src/components/home/IncentiveSection.tsx (do not remove this comment)

import React, { useMemo } from "react";
import { IncentiveRow } from "./IncentiveRow";
import { useIncentivePins } from "../../hooks/useIncentivePins";
import type { ActiveIncentive } from "../../types/location";

interface IncentiveSectionProps {
  incentives: ActiveIncentive[] | undefined;
}

export function IncentiveSection({ incentives }: IncentiveSectionProps) {
  const { isPinned, getPinnedId, togglePin } = useIncentivePins();

  const { daily, weekly, custom } = useMemo(() => {
    if (!incentives || incentives.length === 0) {
      return { daily: [], weekly: [], custom: [] };
    }
    return {
      daily: incentives.filter((i) => i.period === "DAILY"),
      weekly: incentives.filter((i) => i.period === "WEEKLY"),
      custom: incentives.filter((i) => i.period === "CUSTOM_PERIOD"),
    };
  }, [incentives]);

  if (daily.length === 0 && weekly.length === 0 && custom.length === 0) {
    return null;
  }

  return (
    <>
      {daily.length > 0 && (
        <IncentiveRow
          incentives={daily}
          periodType="DAILY"
          rowTitle="Daily Incentives"
          isPinned={isPinned}
          pinnedId={getPinnedId("DAILY")}
          onTogglePin={(id) => togglePin(id, "DAILY")}
        />
      )}
      {weekly.length > 0 && (
        <IncentiveRow
          incentives={weekly}
          periodType="WEEKLY"
          rowTitle="Weekly Challenges"
          isPinned={isPinned}
          pinnedId={getPinnedId("WEEKLY")}
          onTogglePin={(id) => togglePin(id, "WEEKLY")}
        />
      )}
      {custom.length > 0 && (
        <IncentiveRow
          incentives={custom}
          periodType="CUSTOM_PERIOD"
          rowTitle="Special Events"
          isPinned={isPinned}
          pinnedId={getPinnedId("CUSTOM_PERIOD")}
          onTogglePin={(id) => togglePin(id, "CUSTOM_PERIOD")}
        />
      )}
    </>
  );
}