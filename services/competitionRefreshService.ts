// Helper service to refresh competition dashboard after solving challenges
export const refreshCompetitionDashboard = (competitionId: string) => {
  const key = `competition_${competitionId}_refresh`;
  const timestamp = Date.now();
  localStorage.setItem(key, timestamp.toString());

  // Trigger the event manually for same-tab updates
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: key,
      newValue: timestamp.toString(),
    })
  );
};

// Alternative: Programmatically trigger a page reload
export const reloadCompetitionDashboard = (competitionId: string) => {
  // Navigate back to dashboard to refresh
  window.location.href = `/competition/${competitionId}`;
};
