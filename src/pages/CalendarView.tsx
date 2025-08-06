import { useCallback, useEffect, useMemo, useState } from "react";
import { generateCalendarCells } from "../components/CalendarCells";
import CalendarModal from "../components/CalendarModal";
import { generateWeekdays, getMonthInfo } from "../components/CalendarUtils";
import { RecommendedResource } from "../interface/resource";
import { usePlanStore } from "../store/taskStore";
import "../styles/pages/CalendarView.css";
import { recommendResources } from "../utils/recommendRes";

function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelChange, setModelChange] = useState(0);

  // 推荐资料相关状态
  const [recommendedResources, setRecommendedResources] = useState<RecommendedResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  const getTasksByDate = usePlanStore((state) => state.getTasksByDate);

  // 获取推荐资料的API调用函数
  const fetchRecommendedResources = useCallback(async (targetDate: Date) => {
    setIsLoadingResources(true);
    try {
      // 调用实际的推荐资源API
      const resources = await recommendResources(targetDate);
      // setRecommendedResources(resources);
    } catch (error) {
      console.error("Failed to fetch recommended resources:", error);
      setRecommendedResources([]);
    } finally {
      setIsLoadingResources(false);
    }
  }, []);

  // 当选中日期或当前日期变化时，获取推荐资料
  useEffect(() => {
    const targetDate = selectedDate || currentDate;
    fetchRecommendedResources(targetDate);
  }, [selectedDate, currentDate, fetchRecommendedResources]);

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

  const { daysInMonth, startingDay, monthName, year } = useMemo(() => getMonthInfo(currentDate), [currentDate]);

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
    setSelectedDate(now);
    setSidebarOpen(true);
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

      {/* 推荐资料模块 */}
      <div className="recommended-resources-section">
        <div className="section-header">
          <h3>推荐资料</h3>
          <span className="section-subtitle">基于{selectedDate ? "选中日期" : "今日"}任务推荐</span>
        </div>

        {isLoadingResources ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>正在加载推荐资料...</span>
          </div>
        ) : (
          <div className="resources-grid">
            {recommendedResources.length > 0 ? (
              recommendedResources.map((resource) => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-type-badge">
                    {resource.type === "article" && "📄"}
                    {resource.type === "video" && "🎥"}
                    {resource.type === "document" && "📋"}
                    {resource.type === "link" && "🔗"}
                    <span>{resource.type}</span>
                  </div>
                  <h4 className="resource-title">{resource.title}</h4>
                  <p className="resource-description">{resource.description}</p>
                  <div className="resource-tags">
                    {resource.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="resource-actions">
                    <span className="relevance-score">相关度: {Math.round(resource.relevanceScore * 100)}%</span>
                    {resource.url && (
                      <button
                        className="view-resource-btn"
                        onClick={() => {
                          // TODO: 处理资料查看逻辑
                          console.log("查看资料:", resource.title);
                        }}
                      >
                        查看
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-resources">
                <p>暂无推荐资料</p>
                <button
                  className="refresh-btn"
                  onClick={() => {
                    const targetDate = selectedDate || currentDate;
                    fetchRecommendedResources(targetDate);
                  }}
                >
                  刷新推荐
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <CalendarModal open={sidebarOpen} selectedDate={selectedDate} onClose={closeSidebar} modelChange={modelChange} setModelChange={setModelChange} />
    </div>
  );
}

export default CalendarView;
