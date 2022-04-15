const vscode = require('vscode');
const axios = require('axios');
const { isReturnStatement } = require('typescript');

const URL_STACKOVERFLOW_API =
	'https://api.stackexchange.com/2.2/search?order=desc&sort=votes&';
const URL_STACKOVERFLOW = 'https://stackoverflow.com/search?q=';
const URL_GOOGLE = 'https://www.google.de/search?q=';

// extension activation (first time command is executed)
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('"Stackoverlow Quick Search" is now active!');

	let searchBySelection = vscode.commands.registerCommand(
		'quick-stackoverflow-search.soso-selection',
		async function () {
			
			//select the editor
			const editor = vscode.window.activeTextEditor;
			if(!editor) return;

			//get the selection
			const document = editor.document;
			let selectedText = '';
			const selectedTextLines = editor.selections.map((selection) => {
				if (selection.start.line === selection.end.line && selection.start.character === selection.end.character) {
					const range = document.lineAt(selection.start).range;
					const text = editor.document.getText(range);
					return `${text}${document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n'}`;
				}
		
				return editor.document.getText(selection);
			});

			if (selectedTextLines.length > 0) {
				selectedText = selectedTextLines[0];
			}
		
			selectedText = selectedText.trim();

			//request the question
			requestQuestion(selectedText);
		}
	);

	let searchByClipBoard = vscode.commands.registerCommand(
		'quick-stackoverflow-search.soso-clipboard',
		async () => {
			//get the text from the clipboard
			const clipboard = await vscode.env.clipboard.readText();

			//request the question
			requestQuestion(clipboard);
		}
	);

	let searchByInput = vscode.commands.registerCommand(
		'quick-stackoverflow-search.soso-input',
		async () => {
			//get the question from the user
			let input = await vscode.window.showInputBox({
				placeHolder: '🔎| Search for...',
				prompt: 'Enter keywords for the title of the question (use "/" at the end to add a tag).',
				value: '',
			});

			//return if no input
			if (input === undefined) return;

			//filter input
			const intitle = input.split('/')[0];
			const tag = input.split('/')[1] || '';

			//request the question
			requestQuestion(intitle, tag);
		}
	);

	context.subscriptions.push(searchByInput);
	context.subscriptions.push(searchByClipBoard);
	context.subscriptions.push(searchBySelection);
}

async function requestQuestion(title, tag = '') {
	//URL's
	const fullURL = `${URL_STACKOVERFLOW_API}intitle=${title}&tagged=${tag}&site=stackoverflow`;
	const fullURL_GOOGLE = `${URL_GOOGLE}${title}`;
	const fullURL_STACKOVERFLOW = `${URL_STACKOVERFLOW}${title}`;

	//request
	const result = await axios.get(fullURL);

	//map the result to fit vscode's quick pick
	const mappedQuestions = result.data.items.map((question) => {
		return {
			label: `🔺${question.score} | ${question.title} | 👨‍💻 ${question.owner.display_name}`,
			detail: ` ${question.tags
				.reduce((acc, curr) => `${acc} / ${curr}`, '🏷️ Tags: ')
				.toString()} | Answered: ${
				question.is_answered ? '✔️' : '🤔'
			} 👓${question.answer_count}`,
			link: question.link,
		};
	});

	//map google search to fit vscode's quick pick
	const mappedGoogle = {
		label: '🔎| Search Question on Google',
		link: fullURL_GOOGLE,
	};

	//map stackoverflow search to fit vscode's quick pick
	const mappedStackOverflow = {
		label: '🔎| Search Question on Stack Overflow',
		link: fullURL_STACKOVERFLOW,
	};

	//show the results
	const selectedQuestion = await vscode.window.showQuickPick([
		mappedGoogle,
		mappedStackOverflow,
		...mappedQuestions,
	]);

	//return if no question was selected
	if (selectedQuestion === undefined) return;

	//open the selected question
	vscode.env.openExternal(selectedQuestion.link);
}

// extension deactivation
function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
