const editor = document.getElementById('eval-editor');

        // Handle tab for indentation (4 spaces)
        editor.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                // Get the current caret position
                const start = editor.selectionStart;
                const end = editor.selectionEnd;

                // Insert 4 spaces at caret position
                const value = editor.value;
                editor.value = value.substring(0, start) + "    " + value.substring(end);

                // Move the caret to after the inserted spaces
                editor.selectionStart = editor.selectionEnd = start + 4;
            }

            // Handle auto-closing brackets
            const openBrackets = ['(', '[', '{', '"', "'"];
            const closeBrackets = [')', ']', '}', '"', "'"];
            if (openBrackets.includes(e.key)) {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;

                editor.value = editor.value.substring(0, start) + e.key + closeBrackets[openBrackets.indexOf(e.key)] + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 1; // Move the cursor between brackets
                e.preventDefault();
            }
        });

        // Maintain indentation on new line
        editor.addEventListener('input', function(e) {
            const text = editor.value;
            const caretPosition = editor.selectionStart;

            if (e.inputType === 'insertLineBreak') {
                const lineStart = text.lastIndexOf('\n', caretPosition - 2) + 1;
                const currentLine = text.substring(lineStart, caretPosition - 1);

                // Find leading spaces/tabs in the current line
                const indentation = currentLine.match(/^\s*/)[0];

                // Insert the same indentation on the new line
                const valueBeforeCaret = text.substring(0, caretPosition);
                const valueAfterCaret = text.substring(caretPosition);
                editor.value = valueBeforeCaret + indentation + valueAfterCaret;

                // Move the caret to after the inserted indentation
                editor.selectionStart = editor.selectionEnd = caretPosition + indentation.length;
            }
        });
