import React from "react";
import { isSameDay } from "./CalendarUtils";

interface CalendarCellsProps {
  daysInMonth: number;
  startingDay: number;
  year: number;
  month: number;
  today: Date;
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  dayTaskCountMap?: Record<string, number>;
  modelChange?: number;
  setModelChange?: React.Dispatch<React.SetStateAction<number>>;
}

export const generateCalendarCells = ({
  daysInMonth,
  startingDay,
  year,
  month,
  today,
  selectedDate,
  onDateClick,
  dayTaskCountMap,
}: CalendarCellsProps) => {
  const totalCells = Math.ceil((daysInMonth + startingDay) / 7) * 7;
  const cells: React.ReactNode[] = [];

  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startingDay + 1;
    if (i < startingDay || dayNum > daysInMonth) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    } else {
      const date = new Date(year, month, dayNum);
      const isToday = isSameDay(date, today);
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      // 任务数量标记
      const key = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;
      const taskCount = dayTaskCountMap?.[key] ?? 0;

      // 标记颜色和大小
      let dotColor = "";
      if (taskCount >= 5) dotColor = "#f44336";
      else if (taskCount >= 3) dotColor = "#ff9800";
      else if (taskCount >= 1) dotColor = "#2196f3";
      let dotSize = 8 + Math.min(taskCount, 5);

      cells.push(
        <div
          key={`day-${dayNum}`}
          className={`calendar-day${isToday ? " today" : ""}${
            isSelected ? " selected" : ""
          }`}
          onClick={() => onDateClick(date)}
        >
          {dayNum}
          {isToday && <div className="today-marker" />}
          {taskCount > 0 && (
            <div
              className="task-dot"
              style={{
                background: dotColor,
                width: dotSize,
                height: dotSize,
              }}
              title={`任务数：${taskCount}`}
            />
          )}
        </div>
      );
    }
  }
  return cells;
};
