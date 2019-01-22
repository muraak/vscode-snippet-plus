import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => { Parse(context) });

	let provider = vscode.languages.registerCompletionItemProvider('plaintext', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, compeletion_context: vscode.CompletionContext) {

			let items: vscode.CompletionItem[] = [];

			Parse(context)!.forEach(it => {
				let item = new vscode.CompletionItem(it.name);
				item.insertText = new vscode.SnippetString(it.body);
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
		// let c_snippets = fs.readFileSync(vscode.Uri.parse("C:\\Users\\BG17059\\AppData\\Roaming\\Code\\User\\snippets\\c_test.json").fsPath, "utf-8");
		let c_snippets = fs.readFileSync(path.join(context.extensionPath, 'snippets', 'test.code-snippets'), 'utf-8');
		// remove comment
		var stripJsonComments = require('strip-json-comments');
		c_snippets = stripJsonComments(c_snippets);
		// remove last cammma(e.g./\,\s*(\]|\})/)
		// RESTRICTION!: In following function, we can't recognize last comma in the double quatation area "".
		c_snippets = c_snippets.replace(/\,(\s*[\]\}])/g, "$1");

		try {
			let c_snippet_obj = JSON.parse(c_snippets);

			// for(var propertyName in c_snippet_obj) {
			// 	console.log(propertyName);
			//  }

			let snippets: { name: string, body: string }[] = [];

			for (var it in c_snippet_obj) {
				let snippet: { name: string, body: string } = { name: "", body: "" };
				snippet.name = it.toString();
				let snippet_txt = "";
				let body = c_snippet_obj[it].body;

				if (body) {
					c_snippet_obj[it].body.forEach((element: any) => {
						snippet_txt += element + "\n";
					});

					body = preParse(c_snippet_obj, snippet_txt);
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
