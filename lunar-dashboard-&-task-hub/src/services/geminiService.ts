import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getChineseLunarInfo(date: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `请查询并提供 ${date} 的中国黄历及生活建议。请按以下结构返回 Markdown 格式：
1. **宜 & 忌**：精简列出今日最适合和最不适合做的事。
2. **每日吉时**：列出今日的几个大吉时辰及建议活动。
3. **今日穿搭**：根据当日五行或气运推荐适合的穿搭风格或颜色。
4. **变美指南**：提供关于美容、美甲、剪头发的建议（是否适合，或推荐风格）。
5. **温馨提示**：一句简短的今日生活小贴士。
请确保内容简洁、优雅、易读。`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "无法获取黄历信息。";
  } catch (error) {
    console.error("Error fetching lunar info:", error);
    return "获取黄历信息时出错。";
  }
}

export async function generateProjectIdea(existingProjects: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `我有一个项目面板，目前已有项目：${existingProjects.join(", ")}。请为我推荐一个新的互动项目点子，要求：有趣、实用、适合网页展示。只需返回项目名称和简短描述。`,
    });

    return response.text || "新项目：待定";
  } catch (error) {
    console.error("Error generating project idea:", error);
    return "无法生成新项目建议。";
  }
}
