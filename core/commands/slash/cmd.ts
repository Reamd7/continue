import { streamLines } from "../../diff/util.js";
import { SlashCommand } from "../../index.js";
import { removeQuotesAndEscapes } from "../../util/index.js";

function commandIsPotentiallyDangerous(command: string) {
  return (
    command.includes("rm -rf") ||
    command.includes("sudo") ||
    command.includes("cd / ")
  );
}

const GenerateTerminalCommand: SlashCommand = {
  name: "cmd",
  description: "生成一个shell命令",
  run: async function* ({ ide, llm, input }) {
    if (input.trim() === "") {
      yield "请提供你想要生成的shell命令的描述。例如，'/cmd 列出当前目录中的所有文件'。";
      return;
    }

    const gen =
      llm.streamComplete(`用户请求运行一个shell命令。他们的描述是：

"${input}"

请编写一个shell命令，以实现用户请求的功能。你的输出应仅包含命令本身，不带任何解释或示例输出。不要使用任何换行符。只输出插入终端后能精确执行请求的命令。以下是命令：`);

    const lines = streamLines(gen);
    let cmd = "";
    for await (const line of lines) {
      console.log(line);
      if (line.startsWith("```") && line.endsWith("```")) {
        cmd = line.split(" ").slice(1).join(" ").slice(0, -3);
        break;
      }

      if (
        line.startsWith(">") ||
        line.startsWith("``") ||
        line.startsWith("\\begin{") ||
        line.trim() === ""
      ) {
        continue;
      }

      cmd = removeQuotesAndEscapes(line.trim());
      break;
    }

    yield `生成但shell命令: ${cmd}`;
    if (commandIsPotentiallyDangerous(cmd)) {
      yield "\n\n警告：此命令可能具有潜在危险性。请在粘贴到终端前仔细检查。";
    } else {
      await ide.runCommand(cmd);
    }
  },
};

export default GenerateTerminalCommand;
