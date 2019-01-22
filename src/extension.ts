// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-snippet-plus" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {

		let editor = vscode.window.activeTextEditor;
		if (editor) {
			let c_snippets = fs.readFileSync(vscode.Uri.parse("C:\\Users\\BG17059\\AppData\\Roaming\\Code\\User\\snippets\\c_test.json").fsPath, "utf-8");

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

				let snippet_src = "";

				c_snippet_obj["else if 規約"].body.forEach((element: any) => {

					snippet_src += element + "\n";
				});

				snippet_src = preParse(c_snippet_obj, snippet_src);

				editor.insertSnippet(new vscode.SnippetString(snippet_src));
			}
			catch (e) {
				console.log(e.message);
			}
		}
	});

	function preParse(json: any, text: string) {

		text = asignLocalVariables(json, text);
		text = asignConfigVariables(text);

		return text;
	}

	function asignLocalVariables(json: any, text: string) {
		
		json["$VALUABLES$"].forEach((element: any) => {
			text = text.replace(new RegExp(`\\$\{${element.name}\}`, 'g'), element.value);
		});

		return text;
	}

	function asignConfigVariables(text: string) {
		
		return text.replace(/\$\{CONFIG\s*:\s*(\w+)\}/g, (match, args) => {
			 return getConfigValue(args); });
	}

	function getConfigValue(name :string) {

		try {
		 let variables :any[] | undefined 
		 	= vscode.workspace.getConfiguration("snipp")!.get("variables");
		

		 if(variables){
			return variables.find((value :any) => {return value.name === name;})!.value;
		 }
		}
		catch{
			console.error(`configuration variable \"${name}\" is not defined.`);
		}
	}

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
