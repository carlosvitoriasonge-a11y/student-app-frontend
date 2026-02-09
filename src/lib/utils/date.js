export function schoolYearFromDate(dateStr) {
    const [y, m] = dateStr.split("-").map(Number);
    return m >= 4 ? y : y - 1;
  }
  