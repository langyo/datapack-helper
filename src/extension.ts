'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as resources from './resources';
import * as fs from 'fs';
import * as path from 'path';
import getBaseNode from './command-node/node-factory';

export function activate(context: vscode.ExtensionContext) {
	let enabled = true;

	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
		vscode.window.showErrorMessage("There must be 1 and only 1 workspace folder for the datapack");
		enabled = false;
	} else {
		resources.loadFiles();
	}
	//file change watcher
	let watcher = vscode.workspace.createFileSystemWatcher("**/*.{mcfunction,json}");

	let baseNode = getBaseNode(fs.readFileSync(path.join(__dirname + "./../ref/command-format.json"), "utf-8"));

	vscode.languages.registerCompletionItemProvider('mcfunction', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			if (!enabled)
				return [];
			console.log(document.lineAt(position.line).text.substring(0, position.line));
			if (document.lineAt(position.line).text.length !== 0) {
				let char = document.lineAt(position.line).text.charCodeAt(0);
				if (char < 97 || char > 122)
					return [];
			}
			return baseNode.getCompletion(document.lineAt(position.line).text, 0, position.character, {})[0].map(v=>new vscode.CompletionItem(v));
		}
	}, ...[".", "[", "{", " ", "/", ":", "=", "!"]);

	vscode.commands.registerCommand("datapack.initialize", ()=> {
		if (!enabled)
			return;
		resources.initialize();
	})
	vscode.commands.registerCommand("datapack.read", ()=> {
		if (!enabled)
			return;
		resources.readFunctions().catch(err=>{
			if (err) vscode.window.showErrorMessage("Error reading functions: " + err);
		})
		resources.readAdvancements().catch(err=>{
			if (err) vscode.window.showErrorMessage("Error reading advancements: " + err);
		})
	})

	vscode.workspace.onDidChangeWorkspaceFolders(e=>{
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length !== 1) {
			vscode.window.showErrorMessage("There must be 1 and only 1 workspace folder for the datapack");
			enabled = false;
		} else {
			fs.access(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'pack.mcmeta'), err=> {
				if (!err) {
					enabled = true;
					resources.loadFiles();
				}
			})
		}
	})
}