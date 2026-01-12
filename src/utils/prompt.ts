export function prePrompts() {
  return {
    areaList: [
      {
        label: "无",
        value: "",
      },
      {
        label: "帕累托法则",
        value: "将以下主题最具挑战性的20%的核心内容汇总，以涵盖80%的内容，并提供一个专注于掌握这些内容的学习计划",
      },
      {
        label: "SQ3R方法",
        value: "使用SQ3R方法（Survey, Question, Read, Recite, Review）来学习以下主题，提供一个详细的学习计划",
      },

      {
        label: "艾宾浩斯记忆曲线",
        value: "我最近正在学习以下内容，请结合艾宾浩斯记忆曲线，制定一个学习计划，让我能在更长的时间中一直掌握这个技能",
      },
      {
        label: "主题交叉法",
        value: "创建一个学习计划，将以下主题中不同的主题或技能混合起来，帮助我发展更全面的理解，并强化他们之间的联系",
      },
      {
        label: "GROW模型",
        value: "我最近正在学习以下主题，接下来，请结合GROW模型（Goal，Reality，Options，Will），指定一个符合我当前情况的学习计划",
      },
    ],
  };
}
