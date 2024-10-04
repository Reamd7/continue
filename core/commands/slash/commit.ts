import { SlashCommand } from "../../index.js";
import { stripImages } from "../../llm/images.js";

const CommitMessageCommand: SlashCommand = {
  name: "commit",
  description: "生成当前更改的提交信息",
  run: async function* ({ ide, llm, input }) {
    const diff = await ide.getDiff();

    if (!diff || diff.trim() === "") {
      yield "未检测到更改。请确保您位于包含当前更改的 Git 仓库中。";
      return;
    }

    const prompt = `${diff}\n\n生成上述更改集的提交消息。首先，给出一个不超过80个字符的单句。然后，在2个换行符之后，给出一个不超过5个短点的列表，每个点不超过40个字符。除了提交消息外，不要输出任何内容，也不要用引号包围它。用中文回答消息。提交消息需要符合 angular commit 规范`;
    for await (const chunk of llm.streamChat([
      { role: "user", content: prompt },
    ])) {
      yield stripImages(chunk.content);
    }
  },
};

export default CommitMessageCommand;
