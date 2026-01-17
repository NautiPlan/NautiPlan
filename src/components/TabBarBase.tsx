import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckSquareOutlined,
  CalendarOutlined,
  RobotOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { TabBar, TabBarItem } from "tdesign-mobile-react";
import "../styles/components/TabBarBase.css";

function TabBarBase() {
  const list = [
    { value: "/", icon: <CheckSquareOutlined />, ariaLabel: "Todo" },
    { value: "/calendar", icon: <CalendarOutlined />, ariaLabel: "Calendar" },
    { value: "/chat", icon: <RobotOutlined />, ariaLabel: "Chat" },
    { value: "/myPlan", icon: <ProjectOutlined />, ariaLabel: "MyPlan" },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);

  useEffect(() => {
    setValue(location.pathname);
  }, [location.pathname]);

  const change = (changeValue: string | number) => {
    setValue(changeValue as string);
    navigate(`${changeValue}`);
  };

  return (
    <div className="demo-tab-bar">
      <TabBar value={value} onChange={change} theme="tag" split={false}>
        {list.map((item, i) => (
          <TabBarItem
            key={item.value || i}
            icon={item.icon}
            value={item.value}
          />
        ))}
      </TabBar>
    </div>
  );
}

export default TabBarBase;
