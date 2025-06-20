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
}

export const generateCalendarCells = ({
  daysInMonth,
  startingDay,
  year,
  month,
  today,
  selectedDate,
  onDateClick,
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
        </div>
      );
    }
  }
  return cells;
};
