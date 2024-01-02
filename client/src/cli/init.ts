import fs from 'fs';
import path from 'path';
import prompt, { PromptObject } from 'prompts';
import { validateForge, validatePackageManager } from '../scaffold/dependency';
import { scaffoldNext } from '../scaffold/nextjs';
import { scaffoldProject } from '../scaffold/project';
import { scaffoldScript } from '../scaffold/script';
import { ScaffoldManager } from '../scaffold/scaffoldManager';

export const init = async (
  options: {
    path?: string,
    scaffold?: string,
    packageMgr?: string,
  }
) => {
  // Check that user has installed forge
  await validateForge();

  // List of questions
  let setupQuestions: PromptObject[] = [
    {
      name: "path",
      type: "text",
      message: "Path to initialize Axiom project (default: current directory)?"
    },
    {
      name: "scaffold",
      type: "select",
      choices: [
        { title: "Next.js", value: "nextjs", description: "Next.js dApp (default)" }, 
        { title: "Script", value: "script", description: "Simple test script" },
        { title: "None", value: "none", description: "No scaffold" },
      ],
      message: "Type of Axiom app interface scaffold to use?"
    },
    {
      name: "packageMgr",
      type: "select",
      choices: [
        { title: "npm", value: "npm", description: "Use npm as the package manager (default)" }, 
        { title: "yarn", value: "yarn", description: "Use yarn as the package manager" },
        { title: "pnpm", value: "pnpm", description: "Use pnpm as the package manager" },
      ],
      message: "Which package manager do you want to use for the project?"
    }
  ];

  // Remove prompt for path if it's already passed in
  if (options.path !== undefined) {
    setupQuestions = setupQuestions.filter((obj) => {
      return obj.name !== "path";
    });
  }

  // Remove prompt for scaffold if it's already passed in
  if (options.scaffold !== undefined) {
    const parsedScaffold = options.scaffold.trim().toLowerCase();
    switch (parsedScaffold) {
      case "nextjs":
      case "script":
      case "none":
        break;
      default:
        throw new Error("Invalid option for scaffold. Valid options: [nextjs, script, none]");
    }
    setupQuestions = setupQuestions.filter((obj) => {
      return obj.name !== "scaffold";
    });
  }

  // Validate package manager answers in options
  if (options.packageMgr !== undefined) {
    const parsedManager = options.packageMgr.trim().toLowerCase();
    switch (parsedManager) {
      case "npm":
      case "yarn":
      case "pnpm":
        break;
      default:
        throw new Error("Invalid option for package manager. Valid options: [npm, yarn, pnpm]");
    }
    setupQuestions = setupQuestions.filter((obj) => {
      return obj.name !== "packageMgr";
    });
  }

  let answers = await prompt(setupQuestions)
  
  if (answers.path === "") {
    answers.path = ".";
  }

  answers = {
    ...answers,
    ...options,
  }

  // Validate that the package manager the user has selected is installed
  validatePackageManager(answers.packageMgr);

  // Initialize scaffold manager
  const sm = new ScaffoldManager(answers.path, answers.packageMgr);

  // Initialize project
  await scaffoldProject(sm);

  // App scaffolds
  if (answers.scaffold === "nextjs") {
    await scaffoldNext({ path: answers.path, packageMgr: answers.packageMgr }, sm);
  } else if (answers.scaffold === "script") {
    await scaffoldScript({ path: answers.path, packageMgr: answers.packageMgr }, sm);
  }

  // Print report
  sm.report();
}