export const attentionCalculation = (issueData: any) => {
  const issueList = issueData?.issues ?? [];
  const statusList = issueData?.statusList ?? [];

  const blockedId = statusList?.find((status: any) => status?.isBlocked)?.id;

  const todoId = statusList?.find((status: any) => status?.isInitial)?.id;

  const inProgressId = statusList?.find(
    (status: any) => status?.isInprogress,
  )?.id;

  const arr: any[] = [];

  if (!issueList.length) {
    return arr;
  }

  const currentTime = Date.now();

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const calculateSignals = (issue: any, baseScore = 0) => {
    let score = baseScore;

    const attentionReason: Record<string, any> = {};

    if (issue?.priority === "URGENT") {
      score += 30;
      attentionReason.urgent = true;
    } else if (issue?.priority === "HIGH") {
      score += 15;
      attentionReason.high = true;
    }

    if (issue?.targetDate) {
      const targetDateMs = new Date(issue.targetDate).getTime();
      const overdueMs = currentTime - targetDateMs;

      if (overdueMs > SEVEN_DAYS) {
        score += 30;
        attentionReason.overdue = "7 days";
      } else if (overdueMs > THREE_DAYS) {
        score += 20;
        attentionReason.overdue = "3 days";
      } else if (overdueMs > ONE_DAY) {
        score += 10;
        attentionReason.overdue = "1 day";
      }
    }

    if (issue?.updatedAt) {
      const updatedAtMs = new Date(issue.updatedAt).getTime();
      const staleMs = currentTime - updatedAtMs;

      if (staleMs > THREE_DAYS) {
        score += 10;
        attentionReason.stale = "3 days";
      }
    }

    if (!issue?.assigneeId) {
      score += 10;
      attentionReason.unassigned = true;
    }

    return {
      score,
      attentionReason,
    };
  };

  for (const issue of issueList) {
    if (issue?.statusId === blockedId) {
      const { score, attentionReason } = calculateSignals(issue, 40);

      arr.push({
        issue,
        score,
        attentionReason: {
          blocked: true,
          ...attentionReason,
        },
      });

      continue;
    }

    if (issue?.statusId === todoId) {
      const { score, attentionReason } = calculateSignals(issue);

      if (score > 0) {
        arr.push({
          issue,
          score,
          attentionReason,
        });
      }

      continue;
    }

    if (issue?.statusId === inProgressId) {
      const { score, attentionReason } = calculateSignals(issue);

      if (score > 0) {
        arr.push({
          issue,
          score,
          attentionReason,
        });
      }
    }
  }

  return arr.sort((a, b) => b.score - a.score);
};
