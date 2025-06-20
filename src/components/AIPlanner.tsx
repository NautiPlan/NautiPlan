import { useState } from "react";
import type { TextareaProps } from "tdesign-mobile-react";
import { Calendar, Cell, Slider, Textarea } from "tdesign-mobile-react";

import { Input } from "tdesign-mobile-react";
function AIPlanner() {
  // 日期选择
  const [dataNote, setDataNote] = useState("");
  const [visible, setVisible] = useState(false);

  const format = (val: Date) => {
    const date = new Date(val);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const handleConfirm = (val: Date) => {
    console.log(val);
    setDataNote(format(val));
    setVisible(false);
  };
  const handleSelect = (val: Date) => {
    console.log(val);
  };
  const onClose = (trigger: string) => {
    setVisible(false);
    console.log("closed by", trigger);
  };

  // 文本域
  const [textValue, onChange] = useState<TextareaProps["value"]>("");

  function onFocus(value: any, { e }: any) {
    console.log("onFocus: ", value, e);
  }
  function onBlur(value: any, { e }: any) {
    console.log("onBlur: ", value, e);
  }

  // 优先级
  const [priorityValue, setpriorityValue] = useState(10);
  const onPriorityChange = (value: number | number[]) => {
    const pValue = Array.isArray(value) ? value[0] : value;
    setpriorityValue(pValue);
  };

  return (
    <div>
      <div className="title">AI计划助手</div>
      <div className="item">
        任务
        <Input placeholder="请输入文字" />
      </div>
      <div className="item">
        截止日期
        <div>
          <Calendar visible={visible} onConfirm={handleConfirm} onSelect={handleSelect} onClose={onClose}></Calendar>
          <Cell title="选择日期" arrow note={dataNote} onClick={() => setVisible(true)}></Cell>
        </div>
      </div>
      <div className="item">
        当前进度说明
        <Textarea
          className="textarea-example"
          value={textValue}
          placeholder="请输入文字"
          onFocus={onFocus}
          onBlur={onBlur}
          autosize={true}
          onChange={(value) => {
            console.log("value", value);
            onChange(value);
          }}
        />
      </div>
      <div className="item">
        重要度
        <div className="wrapper-label">
          <Slider label value={priorityValue} onChange={onPriorityChange} />
        </div>
      </div>
      <div className="item">上传图片或音频（可选）</div>
    </div>
  );
}

export default AIPlanner;
