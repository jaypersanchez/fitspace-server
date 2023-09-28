function isDateOlderThan16Years(dateString) {
  const now = new Date();
  const givenDate = new Date(dateString);
  const sixteenYearsAgo = now.getTime() - 16 * 365 * 24 * 60 * 60 * 1000;

  return givenDate.getTime() < sixteenYearsAgo;
}

export { isDateOlderThan16Years };
