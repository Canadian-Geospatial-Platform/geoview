To create an agent to standardize JSDoc comments across your codebase, you can use the runSubagent tool. Here's how to approach it:

Best Practices
Start Small:
- Begin with one directory or file type
- Test the agent's output before running on entire codebase
- Review changes carefully

Clear Rules:
- Reference your CONTRIBUTING.md standards
- Provide examples of correct format
- Specify what NOT to change

Batching Strategy:
- Audit first - understand scope
- Prioritize - core files first, then plugins
- Fix incrementally - one directory at a time
- Verify - check that functions still work after changes

How it works:
- You ask me (in this chat): "Standardize JSDoc in the measurement.tsx file"
    - e.g. Run audit agent for JSDOC good description, structure, param, return, private, staatic and others for the src/api/event-processors and report back
- I invoke the runSubagent tool internally
- The agent runs and does the analysis/fixes
- I report back to you with the results

Approach 1: Single File/Directory Agent - For a targeted approach (recommended to start):

// Example invocation
runSubagent({
  description: "Standardize JSDoc comments",
  prompt: `Review and standardize all JSDoc function comments in the file 'packages/geoview-core/src/core/components/nav-bar/buttons/measurement.tsx' according to these rules:

JSDOC STANDARDS (from CONTRIBUTING.md):
- Format: /** description @function functionName @param {Type} name - description @return {Type} description */
- Use @function for non-class contexts
- Use @param {Type} name - description (with dash separator)
- Use @return (not @returns)
- For Promises, describe the resolved type
- Use @private for non-exposed functions
- Include clear descriptions

TASKS:
1. Find all functions in the file
2. Check if JSDoc exists and follows the standard
3. Fix any that don't match (add missing tags, fix format, etc.)
4. Return a summary of what was changed

DO NOT change function implementation, only JSDoc comments.`
});


Approach 2: Workspace-Wide Agent (Batched) - For larger scope:

runSubagent({
  description: "Audit JSDoc across workspace",
  prompt: `Audit JSDoc function comments across the GeoView codebase:

PHASE 1 - AUDIT:
1. Search for all .ts and .tsx files in packages/geoview-core/src/
2. For each file, identify functions with missing or non-standard JSDoc
3. Categorize issues:
   - Missing JSDoc entirely
   - Missing @function tag (for non-class methods)
   - Missing @param tags
   - Missing @return tag
   - Wrong format (@returns instead of @return)
   - Missing parameter descriptions (no dash separator)

PHASE 2 - REPORT:
Return a structured report:
- Total functions found
- Functions with correct JSDoc
- Functions with issues (grouped by issue type)
- Top 10 files needing most fixes
- Suggested priority order for fixes

DO NOT make changes yet - just audit and report.`
});


Approach 3: Iterative Fix Agent - After auditing, fix in batches:

runSubagent({
  description: "Fix JSDoc in core utils",
  prompt: `Standardize JSDoc in packages/geoview-core/src/core/utils/ directory:

STANDARDS TO APPLY:
1. All functions must have JSDoc
2. Format:
   /**
    * Description of what function does
    * @function functionName (for non-class contexts)
    * @param {Type} paramName - Description
    * @return {Type} Description
    */
3. Use @private for internal functions
4. For Promises, describe resolved type: @return {Promise<TypeThatResolves>}

PROCESS:
1. Read all .ts files in core/utils/
2. For each function, ensure JSDoc follows standard
3. Make edits to fix non-compliant JSDoc
4. Return summary of files changed and fixes applied

IMPORTANT: Only modify JSDoc comments, never function implementations.`
});


