import { SlashCommand } from "../../";
import EditSlashCommand from "./edit";

const CommentSlashCommand: SlashCommand = {
  name: "comment",
  description: "Write comments for highlighted code",
  run: async function* (sdk) {
    for await (const update of EditSlashCommand.run({
      ...sdk,
      input:
        "为这段代码写注释。不要改变代码本身的内容。",
    })) {
      yield update;
    }
  },
};

export default CommentSlashCommand;
