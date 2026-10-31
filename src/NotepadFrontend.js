let compiledCode = args.shortcutParameter || "";

function codeToChar(num)
{
	if (num === 0) return " ";
	if (num >= 1 && num <= 26) return String.fromCharCode(64 + num);
	if (num === 27) return ".";
	if (num === 28) return "!";
	if (num === 29) return ",";
	if (num === 30) return "?";
	if (num >= 31 && num <= 56) return String.fromCharCode(66 + num);
	if (num === 57) return '"';
	if (num === 58) return "-";
	if (num === 59) return "+";
	if (num >= 60 && num <= 69) return String(num - 60);
	return " ";
}

function extractConsoleArray(code)
{
	// Strip hidden Unicode formatting characters injected by Apple Notes
	let cleanCode = code.replace(/[\u200B-\u200D\u200E\u200F\u202A-\u202E\u2009\u00A0\uFEFF]/g, '');

	let valuesMap = {};
	let lines = cleanCode.split(/\r?\n/);

	for (let line of lines)
	{
		let trimmed = line.trim();
		if (!trimmed.startsWith('arr')) continue;

		let parts = trimmed.split('=');
		if (parts.length >= 2)
		{
			let varName = parts[0].trim();
			let rightSide = parts[parts.length - 1].trim();

			// Extract the first number found on the right-hand side
			let match = rightSide.match(/-?\d+(?:\.\d+)?/);
			if (match)
			{
				// ALWAYS overwrites: guarantees the LAST line for this varName wins
				valuesMap[varName] = Math.floor(parseFloat(match[0]));
			}
		}
	}

	const numberWords = [
		"Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
		"Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
		"Seventeen", "Eighteen", "Nineteen", "Twenty", "TwentyOne", "TwentyTwo",
		"TwentyThree", "TwentyFour", "TwentyFive", "TwentySix", "TwentySeven",
		"TwentyEight", "TwentyNine", "Thirty", "ThirtyOne", "ThirtyTwo",
		"ThirtyThree", "ThirtyFour", "ThirtyFive"
	];

	let values = [];
	for (let i = 0; i < 36; i++)
	{
		let expectedVar = `arrZeroElem${numberWords[i]}`;
		// Pulls from valuesMap, which holds the last evaluated value
		values.push(valuesMap[expectedVar] !== undefined ? valuesMap[expectedVar] : 0);
	}

	return values;
}

let matrixData = extractConsoleArray(compiledCode);

let row1 = matrixData.slice(0, 12).map(codeToChar).join('');
let row2 = matrixData.slice(12, 24).map(codeToChar).join('');
let row3 = matrixData.slice(24, 36).map(codeToChar).join('');

let alertText = `${row1}\n${row2}\n${row3}`;

Script.setShortcutOutput(alertText);
Script.complete();
