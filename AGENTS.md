<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes, APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Writing Style Rules

## No Em Dashes

Never use em dashes (U+2014, the character `—`) anywhere in this project. This applies to all files: source code, comments, documentation, markdown, commit messages, and PR descriptions.

**Replace with:**
- **Comma** for parenthetical breaks: `This, that, and the other` not `This — that — and the other`
- **Colon** for emphasis or elaboration: `One thing: focus` not `One thing — focus`
- **Period** for separate sentences: `Do this. Then that.` not `Do this — then that`

Em dashes are visually noisy and inconsistent across fonts. Commas and colons are cleaner.
