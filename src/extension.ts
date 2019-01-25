import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => { Parse(context); });

	let provider = vscode.languages.registerCompletionItemProvider({pattern: "**/*"}, {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, compeletion_context: vscode.CompletionContext) {

			let items: vscode.CompletionItem[] = [];

			Parse(context)!.forEach(it => {
				let item = new vscode.CompletionItem(it.name);
				item.insertText = new vscode.SnippetString(it.body);
				// prefix word that make this compeletion fire.
				item.filterText = "laz";
				items.push(item);
			});

			return items;
		}
	});

	context.subscriptions.push(provider, disposable);
}

function Parse(context: vscode.ExtensionContext) {
	let editor = vscode.window.activeTextEditor;
	if (editor) {
		let snippets_txt = fs.readFileSync(path.join(context.extensionPath, 'snippets', 'test_msw.code-snippets'), 'utf-8');
		// remove comment
		var stripJsonComments = require('strip-json-comments');
		snippets_txt = stripJsonComments(snippets_txt);
		// remove last cammma(e.g./\,\s*(\]|\})/)
		// RESTRICTION!: In following function, we can't recognize last comma in the double quatation area "".
		snippets_txt = snippets_txt.replace(/\,(\s*[\]\}])/g, "$1");

		try {
			let snippet_json = JSON.parse(snippets_txt);

			let snippets: { name: string, body: string }[] = [];

			for (var it in snippet_json) {
				let snippet: { name: string, body: string } = { name: "", body: "" };
				snippet.name = it.toString();
				let snippet_txt = "";
				let body = snippet_json[it].body;

				if (body) {
					snippet_json[it].body.forEach((element: any) => {
						snippet_txt += element + "\n";
					});

					body = preParse(snippet_json, snippet_txt);
					snippet.body = body;

					snippets.push(snippet);
				}
			}

			return snippets;
		}
		catch (e) {
			console.log(e.message);
		}
	}
}

function preParse(json: any, text: string) {

	text = asignLocalVariables(json, text);
	text = asignConfigVariables(text);

	return text;
}

function asignLocalVariables(json: any, text: string) {

	if (Array.isArray(json["$VALIABLES$"]) === true) {
		json["$VALIABLES$"].forEach((element: any) => {
			text = text.replace(new RegExp(`\\$\{${element.name}\}`, 'g'), element.value);
		});
	}

	return text;
}

function asignConfigVariables(text: string) {

	return text.replace(/\$\{CONFIG\s*:\s*(\w+)\}/g, (match, args) => {
		return getConfigValue(args);
	});
}

function getConfigValue(name: string) {

	try {
		let variables: any[] | undefined
			= vscode.workspace.getConfiguration("snipp", null)!.get("variables");


		if (variables) {
			return variables.find((value: any) => { return value.name === name; })!.value;
		}
	}
	catch{
		console.error(`configuration variable \"${name}\" is not defined.`);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
