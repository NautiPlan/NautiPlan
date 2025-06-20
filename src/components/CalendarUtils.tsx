export type MonthInfo = {
  daysInMonth: number;
  startingDay: number;
  monthName: string;
  year: number;
};

export const getMonthInfo = (
  date: Date,
  weekStartsOnMonday: boolean = false
): MonthInfo => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startingDay = firstDay.getDay();
  if (weekStartsOnMonday) {
    startingDay = startingDay === 0 ? 6 : startingDay - 1;
  }

  return {
    daysInMonth: lastDay.getDate(),
    startingDay,
    monthName: date.toLocaleString("zh-CN", { month: "long" }),
    year,
  };
};

export const isSameDay = (date1: Date, date2: Date): boolean =>
  date1.toDateString() === date2.toDateString();

export const generateWeekdays = (weekStartsOnMonday: boolean): string[] =>
  weekStartsOnMonday
    ? ["一", "二", "三", "四", "五", "六", "日"]
    : ["日", "一", "二", "三", "四", "五", "六"];
