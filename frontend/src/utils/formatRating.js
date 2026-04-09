export const formatRating = (value, fallback = "4.5") => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const roundedValue = Math.round(numericValue * 10) / 10;

  return roundedValue.toFixed(1);
};
