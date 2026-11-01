# An Esoteric Programming Language in Apple Notes

An esoteric programming language that uses Apple Notes as its computational environment.

Apple Notes can evaluate mathematical expressions. It cannot execute conventional programs, manage control flow, or run user-defined functions. I decided to see how far I could get anyway.

This project is an attempt to build a programming language on top of that mathematical functionality. Programs are written in a high-level syntax, compiled into a much larger collection of Apple Notes-compatible mathematical expressions, and executed through Apple Notes. JavaScript handles compilation and output processing, while Apple Shortcuts connects the different stages.

What began as an experiment in doing math inside a notes application turned into an attempt to recreate fundamental programming concepts using nothing but equations.

## The Concept

The central idea is to treat Apple Notes' mathematical evaluator as the computational foundation of a programming language.

Instead of manually writing every equation required to perform an operation, I created a higher-level syntax that describes what the program should do. A compiler translates those instructions into the mathematical expressions needed to reproduce that behavior.

For example, a programmer can write:

```python
Guess = 5
HiddenNumber = random(0, 10)

if (Guess == HiddenNumber):
    print("You did it!")
```

The compiler must translate the comparison into mathematical expressions that produce a numerical condition flag. It then uses that flag to determine what values should appear in the output display.

A few lines of high-level code can therefore expand into dozens or hundreds of lower-level assignments.

The goal is to make the language usable without requiring the programmer to understand or manually construct all of those equations.

---

## Architecture

The project has three main components: the compiler, Apple Notes, and the frontend.

### 1. High-Level Source Code
Programs are written using a custom syntax inspired by conventional programming languages.

The language includes variable assignments, mathematical expressions, conditional statements, random number generation, and print statements.

This is the interface the programmer interacts with. It hides the mathematical complexity of the underlying implementation.

### 2. Compilation
`NotepadCompiler.js` translates the high-level source into a lower-level program.

Rather than simply replacing keywords with equivalent expressions, the compiler generates the mathematical operations needed to reproduce programming behavior.

Some of its responsibilities include:
* Parsing variable assignments and expressions.
* Translating comparisons into numerical condition flags.
* Expanding conditional branches into arithmetic expressions.
* Generating equations for pseudorandom number generation.
* Encoding text into numerical character values.
* Constructing the 36-position output array.
* Appending deferred variable outputs.

The compiled program is designed to be placed directly into Apple Notes.

### 3. Execution and Output
Apple Notes evaluates the generated mathematical expressions.

The compiled program uses named variables and equations to perform its calculations. Once Notes has evaluated the expressions, the frontend can extract the resulting numerical values.

`NotepadFrontend.js` processes the evaluated note, reconstructs the output display, and converts the numerical character codes back into readable text.

Apple Shortcuts connects these components and provides the interface for compiling and running programs.

---

## How Programming Concepts Are Recreated

The most interesting part of the project is how conventional programming operations are represented mathematically.

Apple Notes does not understand an `if` statement or a `print()` function. Those concepts have to be reconstructed using operations that its mathematical evaluator already supports.

### Boolean Comparisons
The compiler represents conditions using numerical flags.

A true condition produces $1$, while a false condition produces $0$. These flags can then be incorporated into other mathematical expressions.

For equality, the compiler calculates the absolute difference between two values:

diff = abs(A - B)

It then uses the following expression:

gtFlag = round((diff + abs(diff) / (2 * diff + .000001)

flag = 1 - gtFlag

When the two values are equal, their difference is zero and the resulting equality flag is 1. When they differ, the flag becomes 0.

Greater-than and less-than comparisons use a similar approach, with the subtraction reversed depending on the comparison being performed.

This turns a comparison that would normally produce a Boolean value into a numerical value that can participate in subsequent equations.

### Conditional Statements
Conditional statements are more complicated because Apple Notes does not execute conventional branches.

The compiler instead calculates condition flags and uses them to construct expressions that select the appropriate result.

For example, consider:

```python
if (Guess == HiddenNumber):
    print("You did it!")
if (Guess > HiddenNumber):
    print("Nope!\nLower!")
if (Guess < HiddenNumber):
    print("Nope!\nHigher!")
```

The compiler first generates a numerical flag for each comparison.

It then encodes each possible message into character values. For every position in the output display, it creates an equation combining the corresponding characters with the condition flags.

The resulting expression selects the character associated with the active condition.

For multiple branches, the compiler also incorporates the negation of previous condition flags. This prevents later branches from contributing output when an earlier branch has already been selected.

Instead of executing one branch and ignoring the others, the mathematical evaluator calculates the output values using the condition flags.

This is how the language recreates conditional output without conventional control flow.

### Random Number Generation
The language supports a `random(min, max)` function.

Since the underlying environment does not provide a conventional random-number function, the compiler generates a mathematical expression using a seed and modular arithmetic.

The current implementation uses:

seed = 12 + randomCount

targetRaw = (37 * seed + 17) mod (max - min + 1)

result = targetRaw + min

The seed changes for each random-number expression generated during compilation.

This produces an integer within the requested range, although it is pseudorandom rather than truly random. The current implementation is deterministic for a given compilation order.

### Text Encoding
Apple Notes performs the mathematical calculations, but it still needs a way to represent text numerically.

I created a character encoding system that maps supported characters to numerical values.

The current encoding includes:

| Character | Numerical Representation |
| :--- | :--- |
| Space | 0 |
| A–Z | 1–26 |
| `.` | 27 |
| `!` | 28 |
| `,` | 29 |
| `?` | 30 |
| a–z | 31–56 |
| `"` | 57 |
| `-` | 58 |
| `+` | 59 |
| 0–9 | 60–69 |

The compiler converts strings into these numerical representations before generating the display equations.

Newline markers advance the output position to the beginning of the next row.

The frontend implements the reverse mapping, converting the numerical results back into characters.

### The Output Array
The language uses a 36-position array to represent its output display.

The array is arranged as three rows of twelve characters:

```
 0 0 0 0 0 0 0 0 0 0 0 0 
 0 0 0 0 0 0 0 0 0 0 0 0 
 0 0 0 0 0 0 0 0 0 0 0 0 
```

Each position is represented by a separate variable, such as:
* `arrZeroElemZero`
* `arrZeroElemOne`
* `arrZeroElemTwo`

The compiler generates assignments for all 36 positions.

For ordinary string output, these assignments contain the encoded characters directly. For conditional output, each position contains an equation that combines the possible characters with their respective condition flags.

The frontend reads the evaluated values, decodes them, and reconstructs the three rows of text.

This display is deliberately simple, but it provides a way for programs to communicate results back to the user.

---

## Example: Guess the Number

The following example demonstrates variable assignment, pseudorandom number generation, comparisons, conditional branches, and text output.

### High-Level Source

```python
Title = Guess the Number! (0-10)
Guess = 5
HiddenNumber = random(0, 10)

if (Guess == HiddenNumber):
    print("You did it!")
if (Guess > HiddenNumber):
    print("Nope!\nLower!")
if (Guess < HiddenNumber):
    print("Nope!\nHigher!")
```

The programmer only needs to describe the desired behavior. The compiler handles the underlying equations.

### Compiled Output
The equality comparison becomes:

diffZero = abs(Guess - HiddenNumber)

gtFlagZero = round((diffZero + abs(diffZero)) / (2 * diffZero + .000001))

flagZero = 1 - gtFlagZero

The compiler then generates equations for each display position.

A simplified example of one such equation is:

arrZeroElemZero =
    (flagZero * 25)
    + ((1 - flagZero) * flagOne * 14)
    + ((1 - flagZero) * (1 - flagOne) * flagTwo * 14)

Each term represents a possible character value multiplied by the conditions under which that character should be displayed.

The compiler repeats this process for all 36 positions.

The complete compiled program is substantially longer than the original source because every high-level operation must be expanded into the mathematical expressions required by Apple Notes.

---

## Project Structure

```
Apple-Notes-Language/
│
├── README.md
│
├── shortcuts/
│   ├── CompileNotepad.shortcut
│   ├── CompilerNotepad.txt
│   ├── Run.shortcut
│   └── Run.txt
│
└── src/
    ├── NotepadCompiler.js
    └── NotepadFrontend.js
```

### `src/NotepadCompiler.js`
The compiler responsible for translating high-level source code into Notes-compatible mathematical expressions.

It handles parsing, condition generation, random-number expressions, character encoding, and output-array construction.

### `src/NotepadFrontend.js`
The frontend responsible for extracting the evaluated output array from the compiled note.

It removes formatting characters introduced by Apple Notes, reads the display variables, converts their numerical values into characters, and reconstructs the three-row output.

### `shortcuts/CompileNotepad.shortcut`
The shortcut that receives source code, passes it to the compiler, and creates an Apple Note containing the compiled program.

### `shortcuts/Run.shortcut`
The shortcut that receives a compiled program, passes it to the frontend, and displays the resulting output.

The accompanying `.txt` files document the actions performed by each shortcut.

---

## Running a Program

Execution requires Apple Notes and Apple Shortcuts.

The general workflow is:
1. Write a program using the high-level language syntax.
2. Submit the source code to the compilation shortcut.
3. The compiler generates the lower-level mathematical program.
4. The shortcut creates a note containing the compiled output.
5. Allow Apple Notes to evaluate the mathematical expressions.
6. Submit the evaluated note to the run shortcut.
7. The frontend decodes the output array and displays the result.

The JavaScript files are executed through Apple Shortcuts rather than directly in a browser or through Node.js.

---

## Limitations

This is an experimental esoteric language, and its implementation has several restrictions.

* **Output capacity:** The display currently supports 36 character positions, arranged in three rows of twelve.
* **Character support:** Only characters included in the encoding table can be represented.
* **Numeric output:** The current dynamic numeric print implementation handles two decimal digits, rather than arbitrary-length numbers.
* **Randomness:** Random-number generation uses a deterministic mathematical formula rather than a true random source.
* **Control flow:** Conditional statements are translated into arithmetic expressions rather than executed as conventional branches.
* **Execution environment:** Programs depend on Apple Notes' mathematical evaluator and Apple Shortcuts.
* **Language syntax:** The compiler currently supports a limited set of statements and comparison operations.

These restrictions are part of the current implementation, not claims about what the language could eventually support.

---

## Motivation

I built this project as my attempt to join the esoteric programming language community.

Esoteric languages explore programming from unusual angles. Some impose arbitrary restrictions, some use unconventional syntax, and others challenge the assumption that programming needs to look anything like conventional software development.

I wanted to approach that idea from a different direction. Instead of designing an unusual syntax for an otherwise conventional runtime, I started with an application that was never intended to execute programs in the first place.

Apple Notes already had a mathematical evaluator. I wanted to see whether I could assemble its existing capabilities into something resembling a programming environment.

The high-level language is what makes the experiment practical. The underlying equations are cumbersome, but the compiler allows them to be generated automatically from relatively readable source code.

The result is a programming language built around a note-taking application, with a compiler that translates familiar programming concepts into mathematics.
