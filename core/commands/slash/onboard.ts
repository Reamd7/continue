import { IDE, SlashCommand } from "../..";
import * as fs from "fs/promises";
import * as path from "path";
import { stripImages } from "../../llm/images";
import ignore from "ignore";
import {
  defaultIgnoreDir,
  defaultIgnoreFile,
  gitIgArrayFromFile,
} from "../../indexing/ignore";

const LANGUAGE_DEP_MGMT_FILENAMES = [
  "package.json", // JavaScript (Node.js)
  "requirements.txt", // Python
  "Gemfile", // Ruby
  "pom.xml", // Java (Maven)
  "build.gradle", // Java (Gradle)
  "composer.json", // PHP
  "Cargo.toml", // Rust
  "go.mod", // Go
  "packages.config", // C# (.NET)
  "*.csproj", // C# (.NET Core)
  "pubspec.yaml", // Dart
  "Project.toml", // Julia
  "mix.exs", // Elixir
  "rebar.config", // Erlang
  "shard.yml", // Crystal
  "Package.swift", // Swift
  "dependencies.gradle", // Kotlin (when using Gradle)
  "Podfile", // Objective-C/Swift (CocoaPods)
  "*.cabal", // Haskell
  "dub.json", // D
];

const MAX_EXPLORE_DEPTH = 2;

const OnboardSlashCommand: SlashCommand = {
  name: "onboard",
  description: "Familiarize yourself with the codebase",
  run: async function* ({ llm, ide }) {
    const [workspaceDir] = await ide.getWorkspaceDirs();

    const context = await gatherProjectContext(workspaceDir, ide);
    const prompt = createOnboardingPrompt(context);

    for await (const chunk of llm.streamChat([
      { role: "user", content: prompt },
    ])) {
      yield stripImages(chunk.content);
    }
  },
};

async function getEntriesFilteredByIgnore(dir: string, ide: IDE) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  let ig = ignore().add(defaultIgnoreDir).add(defaultIgnoreFile);

  const gitIgnorePath = path.join(dir, ".gitignore");

  const hasIgnoreFile = await fs
    .access(gitIgnorePath)
    .then(() => true)
    .catch(() => false);

  if (hasIgnoreFile) {
    const gitIgnore = await ide.readFile(gitIgnorePath);
    const igPatterns = gitIgArrayFromFile(gitIgnore);

    ig = ig.add(igPatterns);
  }

  const filteredEntries = entries.filter((entry) => !ig.ignores(entry.name));

  return filteredEntries;
}

async function gatherProjectContext(
  workspaceDir: string,
  ide: IDE,
): Promise<string> {
  let context = "";

  async function exploreDirectory(dir: string, currentDepth: number = 0) {
    if (currentDepth > MAX_EXPLORE_DEPTH) {
      return;
    }

    const entries = await getEntriesFilteredByIgnore(dir, ide);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(workspaceDir, fullPath);

      if (entry.isDirectory()) {
        context += `\nFolder: ${relativePath}\n`;
        await exploreDirectory(fullPath, currentDepth + 1);
      } else {
        if (entry.name.toLowerCase() === "readme.md") {
          const content = await fs.readFile(fullPath, "utf-8");
          context += `README for ${relativePath}:\n${content}\n\n`;
        } else if (LANGUAGE_DEP_MGMT_FILENAMES.includes(entry.name)) {
          const content = await fs.readFile(fullPath, "utf-8");
          context += `${entry.name} for ${relativePath}:\n${content}\n\n`;
        }
      }
    }
  }

  await exploreDirectory(workspaceDir);

  return context;
}

function createOnboardingPrompt(context: string): string {
  return `
    作为一个有帮助的AI助手，你的任务是让一位新开发者加入这个项目。使用以下关于项目结构、README文件和依赖文件的上下文，创建一个全面的概述：

  ${context}

  请根据以下指南提供项目的概述：

  确定项目中最重要的一些文件夹，最多10个

  逐步介绍每个重要文件夹：

  如果可用，通过总结README或package.json文件，解释每个文件夹的独立功能

  提及在该文件夹中使用最多的或最常见的包及其角色

  在介绍完各个文件夹后，放大视角，解释项目架构的最多5个高层次见解：

  代码库的不同部分如何组合在一起

  从文件夹结构和依赖关系中显而易见的整体项目架构或设计模式

  提供最多5个关于项目架构的额外见解，这些见解在逐个文件夹的分解中未被涵盖

  你的回答应该是结构化的、清晰的，并且专注于给新开发者提供对各个组件的详细理解以及对项目整体的宏观概述。

  以下是一个有效响应的示例：
    
    ## 重要文件夹

    ### /folder1
    - 描述：包含主要应用程序逻辑
    - 关键包：Express.js用于路由，Mongoose用于数据库操作

    #### /folder1/folder2

    ## 项目架构
    - 前端使用React和Redux进行状态管理
    - 后端是一个使用Express.js进行路由和Mongoose进行数据库操作的Node.js应用程序
    - 应用程序遵循模型-视图-控制器（MVC）架构

    ## 额外见解
    - 项目使用monorepo结构
    - 项目使用TypeScript进行类型检查
  `;
}

export default OnboardSlashCommand;
