import { fetch } from "@tauri-apps/plugin-http";
import { v4 as uuidv4 } from "uuid";
import { Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import { genSignHeaders } from "./auth";
import { rerankWebSearchResults, webSearch } from "./webSearch";
import { WebSearchRes, RerankedWebSearchRes } from "../interface/resource";

const APP_ID = "2025795358";
const APP_KEY = "ZFiNLwhFLHHIcAVh";
const URI = "/vivogpt/completions";
const DOMAIN = "api-ai.vivo.com.cn";
const METHOD = "POST";

function buildTaskQuery(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "如何提高工作效率和时间管理";
  }

  const taskNames = tasks.map((task) => task.name).join("、");
  return `我今天有以下任务：${taskNames}。请推荐相关的学习资料和提升方法。`;
}

// 使用蓝心70B模型进行查询改写
async function queryRewrite(query: string): Promise<string[]> {
  const params = {
    requestId: uuidv4(),
  };

  const requestData = {
    prompt: query,
    systemPrompt:
      '你是一个查询改写专家。请将用户的查询改写成1-3个不同角度的相关查询，这些查询应该能够帮助用户找到更全面的学习资料和提升方法。请以JSON数组格式返回，例如：["查询1", "查询2", "查询3"]',
    model: "vivo-BlueLM-TB-Pro",
    sessionId: uuidv4(),
    extra: {
      temperature: 0.3,
    },
  };

  try {
    const signHeaders = genSignHeaders(APP_ID, APP_KEY, METHOD, URI, params);
    const headers = {
      ...signHeaders,
      "Content-Type": "application/json",
    };

    const url = `https://${DOMAIN}${URI}`;
    const queryParams = new URLSearchParams({
      requestId: params.requestId,
    });

    const response = await fetch(`${url}?${queryParams}`, {
      method: METHOD,
      headers,
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      const resObj = await response.json();

      if (resObj.code === 0 && resObj.data) {
        const contentStr: string = resObj.data.content;
        const queries: string[] = JSON.parse(contentStr);
        return queries;
      } else {
        console.error("查询改写API错误:", resObj.message || "未知错误");
        return [query]; // 返回原查询作为fallback
      }
    } else {
      const errorText = await response.text();
      console.error(`查询改写HTTP错误 ${response.status}:`, errorText);
      return [query];
    }
  } catch (error) {
    console.error("查询改写请求失败:", error);
    return [query]; // 返回原查询作为fallback
  }
}

export async function recommendResources(date: Date) {
  try {
    const getTasksByDate = usePlanStore.getState().getTasksByDate;
    const tasks = getTasksByDate(date);

    const originalQuery = buildTaskQuery(tasks);

    // 调用查询改写API
    const rewrittenQueries = await queryRewrite(originalQuery);
    const combinedQuery = rewrittenQueries.map((q) => `(${q})`).join(" OR ");
    // console.log("合并后的查询:", combinedQuery);
    // 调用搜索API
    const webSearchRes: WebSearchRes[] = await webSearch(combinedQuery);
    // console.log("WebSearch结果:", JSON.stringify(webSearchRes));

    // 排序
    const rerankedResults: RerankedWebSearchRes[] =
      await rerankWebSearchResults(combinedQuery, webSearchRes);

    // 转换
    const recommendedResources = rerankedResults.map((result) => {
      const doc = result.document;
      return {
        id: doc.id,
        title: doc.name,
        url: doc.url,
        relevanceScore: result.relevance_score,
        siteIcon: doc.siteIcon || "",
      };
    });

    return recommendedResources;
  } catch (error) {
    console.error("推荐资源生成失败:", error);
  }
}

// [
//   {
//     "index": 2,
//     "document": {
//       "id": "https://api.bochaai.com/v1/#WebPages.2",
//       "name": "GitHub - geeklp/408: 408学习资料和课程笔记(非考研)数据结构、操作系统、计算机网络、计算机组成原理",
//       "url": "https://github.com/geeklp/408",
//       "snippet": "Solutions Resources Search or jump to... Cancel Submit feedback Saved searches Use saved searches to",
//       "summary": "Solutions Resources Search or jump to... Cancel Submit feedback Saved searches Use saved searches to filter your results more quickly Cancel Create saved search You signed in with another tab or window. Reload to refresh your session. You signed out in another tab or window. Reload to refresh your session. You switched accounts on another tab or window. Reload to refresh your session. Dismiss alert geeklp/408   main Go to file Code Folders and files Name Name Last commit message Last commit date Latest commit   History 20 Commits 21计算机思维导图 21计算机思维导图     ppt ppt     操作系统 操作系统     README.md README.md     View all files Repository files navigation 408学习资料和课程笔记(非考研) 资料构成 王道考研ppt 王道考研思维导图 个人笔记 学习感悟(希望大家了解) 记笔记并不是一件 浪费时间的事情,还有利于多次学习 希望大家学有所成(点点Star,谢谢大家了hhh) 21视频材料等等等等链接: https://pan.baidu.com/s/"
//     },
//     "relevance_score": 0.5017665368896064
//   },
//   {
//     "index": 15,
//     "document": {
//       "id": "https://api.bochaai.com/v1/#WebPages.15",
//       "name": "无标题",
//       "url": "https://github.com/rhinuxx/book/blob/master/%E5%9B%BE%E4%B9%A6%E6%8E%A8%E8%8D%90.md",
//       "snippet": "我比较喜欢的一些图书,推荐给大家 。 \\n Linux 管理: \\n 《Linux 系统管理技术手册》 案头必备的工具书。 \\n 《鸟哥的 Linux 私房菜》不错的入门书。 \\n 《Linux 101",
//       "summary": "我比较喜欢的一些图书,推荐给大家。 \\n Linux 管理: \\n 《Linux 系统管理技术手册》 案头必备的工具书。 \\n 《鸟哥的 Linux 私房菜》不错的入门书。 \\n 《Linux 101 Hacks》常用命令手册 \\n 《UNIX Shell Scripting》写脚本的参考书 \\n 《The Linux Command Line》更详细的命令手册 \\n Linux 编程: \\n 《Linux 系统编程》对常用 API 讲述最详细的一本书 \\n 《UNIX 环境高级编程》经典 \\n 《The Linux Programming Interface》与上本书配套 \\n 《程序员的自我修养》别被名字误导,极好的一本深度基础书。 \\n 《深入理解 Linux 内核》可以翻翻,对提升细节理解有好处。 \\n 《UNIX 网络编程》经典 \\n 《TCP/IP 高级编程》好书 \\n C/C++: \\n 《C 程序设计语言》入门 书 \\n 《Lnux C 编程一站式学习》Linux 下开发的入门书 \\n 《C 语言核心技术》参考手册 \\n 《彻底搞定 C 指针》最好的指针入门书 \\n 《C++ 编程思想》经典 \\n 《高质量程序设计指南——C/C++语言》经典 \\n 《C 专家编程》 \\n 《C 和指针》 \\n 《C 陷阱与缺陷》 \\n Golang: \\n 《Learing Go》简单 \\n 《The Go Programming Language》比较详细 \\n 《The way to Go》提升 \\n Javascript: \\n 《Javascript, A Beginner's Guide》 \\n 《Object-Oriented Javascript》 \\n Python: \\n 《Python Pocket Reference》适合经常翻翻 \\n 《Expert"
//     },
//     "relevance_score": 0.49313652150133597
//   },
//   {
//     "index": 0,
//     "document": {
//       "id": "https://api.bochaai.com/v1/#WebPages.0",
//       "name": "Linux-Tutorial",
//       "url": "https://github.com/houpfchn/Linux-Tutorial/blob/master/other.md",
//       "snippet": "http://man.linuxde.net https://www.centos.bz/linux-basic-knowledge/ http://itlab.idcquan.com/linux/s",
//       "summary": "http://man.linuxde.net https://www.centos.bz/linux-basic-knowledge/ http://itlab.idcquan.com/linux/special/linuxcom/Index.html http://ganquan.info/linux/ http://wiki.open.qq.com/wiki/faq/linux......BB%A4 http://i...."
//     },
//     "relevance_score": 0.47972620424267853
//   }
// ]
