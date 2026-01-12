import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "tdesign-icons-react";
import { TabBar, TabBarItem } from "tdesign-mobile-react";
import "../styles/components/TabBarBase.css";

function TabBarBase() {
  const list = [
    { value: "/", icon: "home", ariaLabel: "Todo" },
    { value: "/calendar", icon: "app", ariaLabel: "Calendar" },
    { value: "/chat", icon: "chat", ariaLabel: "Chat" },
    { value: "/myPlan", icon: "user", ariaLabel: "MyPlan" },
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
          <TabBarItem key={item.value || i} icon={<Icon name={item.icon} />} value={item.value} />
        ))}
      </TabBar>
    </div>
  );
}

export default TabBarBase;
