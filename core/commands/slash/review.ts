import { ChatMessage, SlashCommand } from "../../index.js";
import { stripImages } from "../../llm/images.js";

const prompt = `
  审查以下代码，重点关注可读性、可维护性、代码异味、速度和内存性能。根据以下指南提供反馈：

  语气：以友好随意的工程师语气，确保反馈清晰并专注于实际改进。
  有序分析：按顺序从上到下审查代码，以确保彻底审查，不遗漏任何部分。
  描述性反馈：避免直接引用行号，因为它们可能会有所不同。相反，描述需要关注的代码部分或特定构造，并清楚地解释原因。
  提供示例：对于每个识别出的问题，提供一个示例，说明如何改进或重写代码以提高清晰度、性能或可维护性。
  你的回答应首先识别问题，然后解释为什么这是一个问题，最后提供带有示例代码的解决方案。`;

function getLastUserHistory(history: ChatMessage[]): string {
  const lastUserHistory = history
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserHistory) {
    return "";
  }

  if (Array.isArray(lastUserHistory.content)) {
    return lastUserHistory.content.reduce(
      (acc: string, current: { type: string; text?: string }) => {
        return current.type === "text" && current.text
          ? acc + current.text
          : acc;
      },
      "",
    );
  }

  return typeof lastUserHistory.content === "string"
    ? lastUserHistory.content
    : "";
}

const ReviewMessageCommand: SlashCommand = {
  name: "review",
  description: "Review code and give feedback",
  run: async function* ({ llm, history }) {
    const reviewText = getLastUserHistory(history).replace("\\review", "");

    const content = `${prompt} \r\n ${reviewText}`;

    for await (const chunk of llm.streamChat([
      { role: "user", content: content },
    ])) {
      yield stripImages(chunk.content);
    }
  },
};

export default ReviewMessageCommand;
