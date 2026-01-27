import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { pages } from "../App";
import {
  CheckSquareOutlined,
  CalendarOutlined,
  RobotOutlined,
  ProjectOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { TabBar, TabBarItem } from "tdesign-mobile-react";
import "../styles/components/TabBarBase.css";

function TabBarBase({ setDirection }: { setDirection: (dir: string) => void }) {
  const list = [
    { value: "/", icon: <CheckSquareOutlined />, ariaLabel: "Todo" },
    { value: "/calendar", icon: <CalendarOutlined />, ariaLabel: "Calendar" },
    { value: "/chat", icon: <RobotOutlined />, ariaLabel: "Chat" },
    { value: "/myPlan", icon: <ProjectOutlined />, ariaLabel: "MyPlan" },
    { value: "/model", icon: <SettingOutlined />, ariaLabel: "Model" },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);

  useEffect(() => {
    setValue(location.pathname);
  }, [location.pathname]);

  const change = (changeValue: string | number) => {
    const target = changeValue as string;
    const currentIndex = pages.indexOf(value);
    const targetIndex = pages.indexOf(target);
    if (targetIndex > currentIndex) {
      setDirection("forward");
    } else if (targetIndex < currentIndex) {
      setDirection("backward");
    }
    setValue(target);
    navigate(`${target}`);
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
