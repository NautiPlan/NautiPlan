import { useRef, useState } from "react";
import type { TextareaProps } from "tdesign-mobile-react";
import { Button, Calendar, Cell, Input, Slider, Textarea, Toast } from "tdesign-mobile-react";
import { v4 as uuidv4 } from "uuid";
import { TaskDescription } from "../interface/task";
import "../styles/components/AIPlanner.css";
import { callVivoGpt } from "../utils/chat";

function AIPlanner() {
  // 任务名称
  const [taskName, setTaskName] = useState("");
  const onTaskNameChange = (value: any) => {
    const stringValue = String(value);
    setTaskName(stringValue);
  };
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

  // 优先级
  const [priorityValue, setpriorityValue] = useState(10);
  const onPriorityChange = (value: number | number[]) => {
    const pValue = Array.isArray(value) ? value[0] : value;
    setpriorityValue(pValue);
  };
  // 文件上传相关状态
  const [fileBuffers, setFileBuffers] = useState<ArrayBuffer[]>([]); // 存储所有上传文件
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newBuffers = await Promise.all(
        Array.from(files).map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          return arrayBuffer;
        })
      );

      setFileBuffers([...fileBuffers, ...newBuffers]);
      Toast.success(`成功添加${files.length}个文件到缓冲区`);

      // 重置input值，允许重复选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("文件读取错误:", error);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 上传
  const commit = async () => {
    const taskDescription: TaskDescription = {
      id: uuidv4(),
      name: taskName,
      startDate: new Date(),
      dueDate: new Date(dataNote),
      taskDescription: textValue?.toString(),
      importance: priorityValue,
    };

    try {
      const result = await callVivoGpt({ prompt: JSON.stringify(taskDescription) });

      if (!result) {
        try {
          const parsePlan = JSON.parse(result as string);
          console.log("解析后的计划:", parsePlan);
        } catch (error) {
          console.error("JSON解析失败:", error);
        }
      }
    } catch (error) {
      console.error("AI请求错误:", error);
    }
  };

  return (
    <div className="ai-planner-container">
      <div className="title">AI计划助手</div>
      <div className="item">
        任务
        <Input placeholder="请输入任务名称" value={taskName} onChange={onTaskNameChange} />
      </div>
      <div className="item">
        <div>
          <Calendar visible={visible} onConfirm={handleConfirm} onSelect={handleSelect} onClose={onClose}></Calendar>
          <Cell title="截止日期" arrow note={dataNote} onClick={() => setVisible(true)}></Cell>
        </div>
      </div>
      <div className="item">
        任务说明
        <Textarea
          placeholder="可包括任务目标、步骤、注意事项等"
          maxlength={100}
          autosize={true}
          allowInputOverMax
          indicator
          value={textValue}
          onChange={(value) => {
            console.log(value);
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
      <div className="item">
        上传图片或音频（可选）
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} multiple accept="image/*,audio/*" />
        <Button size="large" theme="default" onClick={handleUploadClick} style={{ marginTop: "10px" }}>
          选择文件
        </Button>
        {fileBuffers.length > 0 && <div style={{ marginTop: "10px", color: "#666" }}>已添加 {fileBuffers.length} 个文件</div>}
      </div>
      <div className="item">
        <Button size="large" theme="primary" onClick={commit}>
          生成计划
        </Button>
      </div>
    </div>
  );
}

export default AIPlanner;
