let inputCode = args.shortcutParameter || "";

function numberToWords(num)
{
	const units = [
		"Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
		"Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
		"Seventeen", "Eighteen", "Nineteen"
	];
	const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty"];

	if (num < 20) return units[num];
	let t = Math.floor(num / 10);
	let r = num % 10;
	return tens[t] + (r > 0 ? units[r] : "");
}

function charToCode(char)
{
	if (!char || char === ' ') return 0;
	let code = char.charCodeAt(0);
	if (code >= 65 && code <= 90) return code - 64; // A-Z -> 1-26
	if (char === '.') return 27;
	if (char === '!') return 28;
	if (char === ',') return 29;
	if (char === '?') return 30;
	if (code >= 97 && code <= 122) return code - 66; // a-z -> 31-56
	if (char === '"') return 57;
	if (char === '-') return 58;
	if (char === '+') return 59;
	if (code >= 48 && code <= 57) return code + 12; // 0-9 -> 60-69
	return 0;
}
// 36 postions for the display
function encodeDisplayString(str)
{
	let result = new Array(36).fill(0);
	let position = 0;
	let i = 0;

	while (i < str.length && position < 36)
	{

		// Recognize the literal /n newline marker
		if (str[i] === '/' && str[i + 1] === 'n')
		{
			position = (Math.floor(position / 12) + 1) * 12;
			i += 2;
			continue;
		}

		// Also recognize the escaped newline sequence \n.
		if (str[i] === '\\' && str[i + 1] === 'n')
		{
			position = (Math.floor(position / 12) + 1) * 12;
			i += 2;
			continue;
		}

		// Recognize actual newline characters if present.
		if (str[i] === '\n' || str[i] === '\r')
		{
			if (str[i] === '\r' && str[i + 1] === '\n')
			{
				i += 2;
			}
			else
			{
				i++;
			}

			position = (Math.floor(position / 12) + 1) * 12;
			continue;
		}

		// Encode the current character.
		result[position] = charToCode(str[i]);

		position++;
		i++;
	}

	return result;
}

function isEquation(rhs)
{
	let trimmed = rhs.trim();
	if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return false;
	if (/^["'“”‘’].*["'“”‘’]$/.test(trimmed)) return false;
	if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false;
	return true;
}

function pushAssignment(outputArray, line, deferredQueue)
{
	outputArray.push(line);
	let eqIndex = line.indexOf('=');
	if (eqIndex !== -1)
	{
		let varName = line.slice(0, eqIndex).trim();
		let rightSide = line.slice(eqIndex + 1).trim();

		if (varName && !varName.startsWith('#') && isEquation(rightSide))
		{
			deferredQueue.push(`${varName}=`);
		}
	}
}

function extractStringLiteral(line)
{
	if (!line) return null;
	let match = line.match(/^print\s*\(\s*(.*?)\s*\)/i);
	if (!match) return null;
	let arg = match[1].trim();
	if (
		(arg.startsWith('"') && arg.endsWith('"')) ||
		(arg.startsWith("'") && arg.endsWith("'")) ||
		(arg.startsWith('“') && arg.endsWith('”')) ||
		(arg.startsWith('‘') && arg.endsWith('’'))
	)
	{
		return arg.slice(1, -1);
	}
	return null;
}

function parseCondition(line, blockID, outputLines, deferredQueue)
{
	let condMatch = line.match(/if\s*\(\s*([a-zA-Z0-9_]+)\s*(>|<|==|>=|<=)\s*([a-zA-Z0-9_]+|\d+)\s*\)/i);
	if (!condMatch)
	{
		condMatch = line.match(/if\s+([a-zA-Z0-9_]+)\s*(>|<|==|>=|<=)\s*([a-zA-Z0-9_]+|\d+)/i);
	}

	if (!condMatch) return null;

	let varA = condMatch[1];
	let op = condMatch[2];
	let varB = condMatch[3];

	outputLines.push(`# IF Check ${blockID}`);

	if (op === '>')
	{
		pushAssignment(outputLines, `diff${blockID} = ${varA} - ${varB}`, deferredQueue);
		pushAssignment(outputLines, `flag${blockID} = round((diff${blockID} + abs(diff${blockID})) / (2 * diff${blockID} + 0.000001))`, deferredQueue);
	}
	else if (op === '<')
	{
		pushAssignment(outputLines, `diff${blockID} = ${varB} - ${varA}`, deferredQueue);
		pushAssignment(outputLines, `flag${blockID} = round((diff${blockID} + abs(diff${blockID})) / (2 * diff${blockID} + 0.000001))`, deferredQueue);
	}
	else if (op === '==')
	{
		pushAssignment(outputLines, `diff${blockID} = abs(${varA} - ${varB})`, deferredQueue);
		pushAssignment(outputLines, `gtFlag${blockID} = round((diff${blockID} + abs(diff${blockID})) / (2 * diff${blockID} + 0.000001))`, deferredQueue);
		pushAssignment(outputLines, `flag${blockID} = 1 - gtFlag${blockID}`, deferredQueue);
	}

	return `flag${blockID}`;
}

function compileRandomAssignment(line, outputLines, deferredQueue, randomCount)
{
	let assignmentMatch = line.match(
		/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*random\s*\(\s*(.*?)\s*,\s*(.*?)\s*\)\s*$/i
	);

	if (!assignmentMatch) return false;

	let targetVar = assignmentMatch[1];
	let minValue = assignmentMatch[2].trim();
	let maxValue = assignmentMatch[3].trim();

	if (!minValue || !maxValue)
	{
		outputLines.push(`# Error: random() requires a minimum and maximum: ${line.trim()}`);
		return true;
	}

	let seed = 12 + randomCount;

	outputLines.push(`# Random Number: ${targetVar} = random(${minValue}, ${maxValue})`);

	pushAssignment(outputLines, `seed = ${seed}`, deferredQueue);

	pushAssignment(
		outputLines,
		`targetRaw = (37 * seed + 17) mod (${maxValue} - ${minValue} + 1)`,
		deferredQueue
	);

	pushAssignment(
		outputLines,
		`${targetVar} = targetRaw + ${minValue}`,
		deferredQueue
	);

	return true;
}

function compileNotepad(code)
{
	if (!code || code.trim() === "")
	{
		return "Notepad Program\n# Error: No source code passed to compiler.";
	}

	code = code.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

	let lines = code.split('\n');
	let outputLines = ["Notepad Program"];
	let deferredQueue = [];
	let ifCount = 0;
	let arrayCount = 0;
	let randomCount = 0;

	let consoleBuffer = new Array(36).fill(0);
	let dynamicPrintVar = null;
	let conditionalDisplaySet = false;

	let i = 0;
	while (i < lines.length)
	{
		let line = lines[i].trim();
		if (!line)
		{
			i++;
			continue;
		}

		if (line.toLowerCase().startsWith('title'))
		{
			let customTitle = line.split('=')[1] || line.split(':')[1] || "Notepad Program";
			outputLines[0] = customTitle.trim().replace(/["'“”‘’]/g, '');
			i++;
			continue;
		}

		// Multi-Branch IF / ELSE IF / ELSE Parser
		if (line.toLowerCase().startsWith('if'))
		{
			let branches = [];
			let fallbackBranch = null;

			while (i < lines.length)
			{
				let currentLine = lines[i].trim();

				if (currentLine.toLowerCase().startsWith('if') || currentLine.toLowerCase().startsWith('else if'))
				{
					let blockID = numberToWords(ifCount++);
					let flagVar = parseCondition(currentLine, blockID, outputLines, deferredQueue);
					i++;

					let actionLine = (lines[i] || "").trim();
					let strVal = extractStringLiteral(actionLine);
					branches.push(
					{
						flagVar: flagVar,
						str: strVal || ""
					});
					i++;
				}
				else if (currentLine.toLowerCase().startsWith('else'))
				{
					i++;
					let actionLine = (lines[i] || "").trim();
					fallbackBranch = extractStringLiteral(actionLine) || "";
					i++;
					break;
				}
				else
				{
					break; // No more matching branches
				}
			}

			// Generate multiplexed console array elements for all collected branches
			if (branches.length > 0)
			{
				outputLines.push(`# Array Declaration: consoleDisplay (Conditional Multi-Branch)`);
				let consoleArrID = numberToWords(arrayCount);

				// Build active condition expressions for each branch.
				let activeFlags = [];
				let negatedPrevious = [];

				for (let b = 0; b < branches.length; b++)
				{
					let prefix = negatedPrevious.length > 0 ? negatedPrevious.join(' * ') + ' * ' : '';
					activeFlags.push(`${prefix}${branches[b].flagVar}`);
					negatedPrevious.push(`(1 - ${branches[b].flagVar})`);
				}

				let fallbackFlag = negatedPrevious.join(' * ');

				// combining its characters with the original condition flags.
				let encodedBranches = branches.map(branch =>
					encodeDisplayString(branch.str)
				);

				let encodedFallback = fallbackBranch !== null ?
					encodeDisplayString(fallbackBranch) :
					null;

				for (let slot = 0; slot < 36; slot++)
				{
					let terms = [];

					for (let b = 0; b < branches.length; b++)
					{
						let cCode = encodedBranches[b][slot];
						terms.push(`(${activeFlags[b]} * ${cCode})`);
					}

					if (fallbackBranch !== null)
					{
						let fallbackCode = encodedFallback[slot];
						terms.push(`(${fallbackFlag} * ${fallbackCode})`);
					}

					let elemID = numberToWords(slot);
					pushAssignment(
						outputLines,
						`arr${consoleArrID}Elem${elemID} = ${terms.join(' + ')}`,
						deferredQueue
					);
				}

				conditionalDisplaySet = true;
			}
			continue;
		}

		// Single print statements outside if-blocks.
		let printMatch = line.match(/^print\s*\(\s*(.*?)\s*\)/i);

		if (printMatch)
		{
			let str = extractStringLiteral(line);

			if (str !== null)
			{
				consoleBuffer = encodeDisplayString(str);
			}
			else
			{
				dynamicPrintVar = printMatch[1].trim();
			}

			i++;
			continue;
		}

		if (line.includes('=') && /\brandom\s*\(/i.test(line))
		{
			if (compileRandomAssignment(line, outputLines, deferredQueue, randomCount))
			{
				randomCount++;
				i++;
				continue;
			}
		}

		if (line.startsWith("#"))
		{
			outputLines.push(line);
			i++;
			continue;
		}

		if (line.includes('='))
		{
			pushAssignment(outputLines, line, deferredQueue);
		}
		else
		{
			outputLines.push(line);
		}

		i++;
	}

	if (!conditionalDisplaySet)
	{
		outputLines.push("# Array Declaration: consoleDisplay");
		let consoleArrID = numberToWords(arrayCount);

		if (dynamicPrintVar)
		{
			outputLines.push(`# Dynamic Print of variable: ${dynamicPrintVar}`);

			pushAssignment(
				outputLines,
				`printTensDigit = floor(${dynamicPrintVar} / 10)`,
				deferredQueue
			);

			pushAssignment(
				outputLines,
				`printOnesDigit = ${dynamicPrintVar} - (printTensDigit * 10)`,
				deferredQueue
			);

			pushAssignment(
				outputLines,
				`arr${consoleArrID}ElemZero = 60 + printTensDigit`,
				deferredQueue
			);

			pushAssignment(
				outputLines,
				`arr${consoleArrID}ElemOne = 60 + printOnesDigit`,
				deferredQueue
			);

			for (let idx = 2; idx < 36; idx++)
			{
				let elemID = numberToWords(idx);
				pushAssignment(
					outputLines,
					`arr${consoleArrID}Elem${elemID} = 0`,
					deferredQueue
				);
			}
		}
		else
		{
			consoleBuffer.forEach((val, idx) =>
			{
				let elemID = numberToWords(idx);

				pushAssignment(
					outputLines,
					`arr${consoleArrID}Elem${elemID} = ${val}`,
					deferredQueue
				);
			});
		}
	}

	if (deferredQueue.length > 0)
	{
		outputLines.push("# Deferred Variable Outputs");
		outputLines = outputLines.concat(deferredQueue);
	}

	return outputLines.join('\n');
}

let compiledResult = compileNotepad(inputCode);
Script.setShortcutOutput(compiledResult);
Script.complete();
