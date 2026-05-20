# Auto-Documentation and Session Audit

## Purpose
Guarantee developmental traceability and session auditing through the automated interception and logging of every interaction within the environment.

## Mandatory Directives
- **Automatic interception and logging**: Capture every agent interaction in the environment without manual intervention.
- **Logbook storage**: Save the exact prompt used into the logbook file (`docs/PROMPTS_LOG.md`).
- **Metadata detail**: Mandatorily record the LLM model used, the assigned agent, and the total token consumption.
- **Guarantee traceability**: Rigorously comply with the project's defined traceability requirements.

## Anti-patterns
- Manually or selectively logging only certain interactions, omitting incremental or minor changes.
- Omitting mandatory fields such as token consumption or the exact version of the LLM model used.
- Failing to create or ignoring the centralized logbook file `docs/PROMPTS_LOG.md` and saving information in scattered or temporary files instead.
- Recording incorrectly formatted information that is not easily readable or processable by automated tools.
