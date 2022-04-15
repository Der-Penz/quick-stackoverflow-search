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
			const text = await vscode.env.clipboard.readText();
			vscode.window.showInformationMessage(text.toString());
		}
	);

	let searchByClipBoard = vscode.commands.registerCommand(
		'quick-stackoverflow-search.soso-clipboard',
		async function () {
			const text = await vscode.env.clipboard.readText();
			vscode.window.showInformationMessage(text.toString());
		}
	);

	let searchByInput = vscode.commands.registerCommand(
		'quick-stackoverflow-search.soso-input',
		async function () {
			//get the question from the user
			let input = await vscode.window.showInputBox({
				placeHolder: '🔎| Search for...',
				prompt: 'Enter keywords for the title of the question (use "/" at the end to add a tag).',
				value: '',
			});

			//return if no input
			if (input === undefined) return;

			//concatenate the url
			const intitle = input.split('/')[0];
			const tags = input.split('/')[1] || '';
			const fullURL = `${URL_STACKOVERFLOW_API}intitle=${intitle}&tagged=${tags}&site=stackoverflow`;
			const fullURL_GOOGLE = `${URL_GOOGLE}${intitle}`;
			const fullURL_STACKOVERFLOW = `${URL_STACKOVERFLOW}${intitle}`;

			const result = await axios.get(fullURL);

			const mappedQuestions = result.data.items.map((question) => {
				return {
					label: `🔺${question.score} | ${question.title} |> ${question.owner.display_name}`,
					detail: ` ${question.tags
						.reduce((acc, curr) => `${acc} / ${curr}`, '🏷️ Tags: ')
						.toString()} | Answered: ${
						question.is_answered ? '✔️' : '🤔'
					} 👓${question.answer_count}`,
					link: question.link,
				};
			});

			const mappedGoogle = {
				label: '🔎| Search Question on Google',
				link: fullURL_GOOGLE,
			};

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

			if (selectedQuestion === undefined) return;

			vscode.env.openExternal(selectedQuestion.link);

			vscode.window.showInformationMessage('Opened Question in new Tab');
		}
	);

	context.subscriptions.push(searchByInput);
	context.subscriptions.push(searchByClipBoard);
	context.subscriptions.push(searchBySelection);
}

// extension deactivation
function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
