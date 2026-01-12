export type MonthInfo = {
  daysInMonth: number;
  startingDay: number;
  monthName: string;
  year: number;
};

export const getMonthInfo = (date: Date): MonthInfo => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 直接使用周日作为每周起始日
  const startingDay = firstDay.getDay();

  return {
    daysInMonth: lastDay.getDate(),
    startingDay,
    monthName: date.toLocaleString("zh-CN", { month: "long" }),
    year,
  };
};

export const isSameDay = (date1: Date, date2: Date): boolean =>
  date1.toDateString() === date2.toDateString();

export const generateWeekdays = (): string[] => ["日", "一", "二", "三", "四", "五", "六"];

