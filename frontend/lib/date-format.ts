import dayjs from "dayjs";

export const getRecentYearRange = () => {
  const now = dayjs();
  const isFirstHalfOfYear = now.month() < 6; // 0-5月为上半年

  let startYear, endYear;

  if (isFirstHalfOfYear) {
    // 如果是上半年，最近一年是前一年的7月到当前年的6月
    startYear = now.year() - 1;
    endYear = now.year();
  } else {
    // 如果是下半年，最近一年是当前年的1月到12月
    startYear = now.year();
    endYear = now.year();
  }

  const start = dayjs(`${startYear}-01-01`).format("MMMM YYYY");
  const end = dayjs(`${endYear}-06-01`).format("MMMM YYYY");

  return `${start} - ${end}`;
};
