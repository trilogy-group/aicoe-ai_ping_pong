export const hydrate = (raw: string, ctx: Record<string, string>): string => {
  // Safety check for undefined/null raw string
  if (!raw || typeof raw !== "string") {
    return "";
  }

  return raw.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmedKey = key.trim();
    return ctx[trimmedKey] ?? `{{${trimmedKey}}}`;
  });
};

export const buildContext = (outputs: string[]): Record<string, string> => {
  const context: Record<string, string> = {};

  // Safety check for undefined/null outputs array
  if (!outputs || !Array.isArray(outputs)) {
    return context;
  }

  outputs.forEach((output, index) => {
    if (output && output.trim()) {
      // Existing format: step0Output, step1Output, etc.
      context[`step${index}Output`] = output;
      context[`step${index + 1}Output`] = output; // 1-indexed for templates

      // New format: step1, step2, step3, etc. (1-indexed for user convenience)
      context[`step${index + 1}`] = output;
    }
  });

  // Also add userInput if it exists in the context
  if (context.userInput) {
    context["userInput"] = context.userInput;
  }

  return context;
};

// Enhanced context builder that includes user input
export const buildContextWithUserInput = (
  outputs: string[],
  userInput: string
): Record<string, string> => {
  const context = buildContext(outputs);
  if (userInput && userInput.trim()) {
    context["userInput"] = userInput.trim();
  }
  return context;
};
