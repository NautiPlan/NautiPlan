import { useCallback, useMemo, useState } from "react";
import { generateCalendarCells } from "../components/CalendarCells";
import CalendarSidebar from "../components/CalendarSidebar";
import { generateWeekdays, getMonthInfo } from "../components/CalendarUtils";
import CalendarModal from "../components/CalendarModal";
import "../styles/pages/CalendarView.css";

function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const weekdays = useMemo(() => generateWeekdays(), []);

  const { daysInMonth, startingDay, monthName, year } = useMemo(
    () => getMonthInfo(currentDate),
    [currentDate]
  );

  // 点击日期时，设置选中日期并打开侧边栏
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
    setSidebarOpen(true);
  }, []);


  const changeMonth = useCallback((offset: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
    setSelectedDate(null);
    setSidebarOpen(false);
  }, []);

  const calendarWeeks = useMemo(() => {
    const cells = generateCalendarCells({
      daysInMonth,
      startingDay,
      year,
      month: currentDate.getMonth(),
      today,
      selectedDate,
      onDateClick: handleDateClick,
    });
    const weeks: React.ReactNode[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(
        <div key={`week-${i / 7}`} className="calendar-week">
          {cells.slice(i, i + 7)}
        </div>
      );
    }
    return weeks;
  }, [daysInMonth, startingDay, year, currentDate, today, selectedDate, handleDateClick]);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button onClick={() => changeMonth(-1)}>&lt; 上月</button>
          <button onClick={goToToday}>今天</button>
          <button onClick={() => changeMonth(1)}>下月 &gt;</button>
        </div>
        <h2>
          {monthName} {year}
        </h2>
      </div>
      <div className="calendar-weekdays">
        {weekdays.map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-body">{calendarWeeks}</div>

      <CalendarModal
        open={sidebarOpen}
        selectedDate={selectedDate}
        onClose={closeSidebar}
      />
      {/* <CalendarSidebar open={sidebarOpen} selectedDate={selectedDate} onClose={closeSidebar} /> */}
    </div>
  );
}

export default CalendarView;
