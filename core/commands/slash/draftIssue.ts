import { ChatMessage, SlashCommand } from "../../index.js";
import { stripImages } from "../../llm/images.js";
import { removeQuotesAndEscapes } from "../../util/index.js";

const PROMPT = (
  input: string,
  title: string,
) => `你将被要求根据用户请求生成GitHub问题的正文。你应该遵循以下规则：
- 描述性要强，但不要编造细节
- 如果用户请求中包含任何相关的代码片段，请在代码块中引用它们
- 逐步描述如何重现问题
- 描述解决问题的理想方案
- 描述问题解决后的预期行为
- 这个问题将由团队成员阅读
- 使用Markdown格式，但不需要用三重反引号包围整个正文
{additional_instructions}

以下是用户请求：'${input}'

标题：${title}

正文：\n\n`;

const DraftIssueCommand: SlashCommand = {
  name: "issue",
  description: "Draft a GitHub issue",
  run: async function* ({ input, llm, history, params }) {
    if (params?.repositoryUrl === undefined) {
      yield "This command requires a repository URL to be set in the config file.";
      return;
    }
    let title = await llm.complete(
      `Generate a title for the GitHub issue requested in this user input: '${input}'. Use no more than 20 words and output nothing other than the title. Do not surround it with quotes. The title is: `,
      { maxTokens: 20 },
    );

    title = `${removeQuotesAndEscapes(title.trim())}\n\n`;
    yield title;

    let body = "";
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: PROMPT(input, title) },
    ];

    for await (const chunk of llm.streamChat(messages)) {
      body += chunk.content;
      yield stripImages(chunk.content);
    }

    const url = `${params.repositoryUrl}/issues/new?title=${encodeURIComponent(
      title,
    )}&body=${encodeURIComponent(body)}`;
    yield `\n\n[Link to draft of issue](${url})`;
  },
};

export default DraftIssueCommand;
