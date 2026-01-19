import { useCallback, useMemo, useState } from "react";
import { Button } from "antd-mobile";
import { LeftOutline, RightOutline } from "antd-mobile-icons";
import { generateCalendarCells } from "../components/CalendarCells";
import CalendarModal from "../components/CalendarModal";
import { generateWeekdays, getMonthInfo } from "../components/CalendarUtils";
import RecommendedResources from "../components/RecommendedResources";
import { usePlanStore } from "../store/taskStore";
import "../styles/pages/CalendarView.css";

function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelChange, setModelChange] = useState(0);

  const getTasksByDate = usePlanStore((state) => state.getTasksByDate);

  // 统计每一天的任务数量
  const dayTaskCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const tasks = getTasksByDate(date);
      const key = `${year}-${month + 1}-${day}`;
      map[key] = tasks.length;
    }
    return map;
  }, [getTasksByDate, currentDate, modelChange]); // 依赖 modelChange

  const today = useMemo(() => new Date(), []);
  const weekdays = useMemo(() => generateWeekdays(), []);

  const { daysInMonth, startingDay, monthName, year } = useMemo(
    () => getMonthInfo(currentDate),
    [currentDate]
  );

  // 点击日期时，设置选中日期并打开弹窗
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
    setSelectedDate(null);
    setSidebarOpen(false);
  }, []);

  const changeMonth = useCallback((offset: number) => {
    setSelectedDate(null);
    setSidebarOpen(false);
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
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
      dayTaskCountMap,
    });
    console.log("changed");
    const weeks: React.ReactNode[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(
        <div key={`week-${i / 7}`} className="calendar-week">
          {cells.slice(i, i + 7)}
        </div>
      );
    }
    return weeks;
  }, [
    daysInMonth,
    startingDay,
    year,
    currentDate,
    today,
    selectedDate,
    handleDateClick,
    dayTaskCountMap,
    modelChange, // 这里依赖modelChange即可
  ]);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-controls">
          <Button
            onClick={() => changeMonth(-1)}
            size="middle"
            fill="outline"
            color="primary"
          >
            <LeftOutline /> 上月
          </Button>
          <Button
            onClick={goToToday}
            size="middle"
            fill="solid"
            color="primary"
          >
            今天
          </Button>
          <Button
            onClick={() => changeMonth(1)}
            size="middle"
            fill="outline"
            color="primary"
          >
            下月 <RightOutline />
          </Button>
        </div>
        <h2>
          <span className="calendar-month">{monthName}</span>
          <span className="calendar-year">{year}</span>
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

      <RecommendedResources
        selectedDate={selectedDate}
        currentDate={currentDate}
      />

      <CalendarModal
        open={sidebarOpen}
        selectedDate={selectedDate}
        onClose={closeSidebar}
        modelChange={modelChange}
        setModelChange={setModelChange}
      />
    </div>
  );
}

export default CalendarView;
