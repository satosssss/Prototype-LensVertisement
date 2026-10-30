// ============================================================================
// Gemini Structured-Output Schema
//
// The shape we ask Gemini to return. Passing this as `response_format.schema`
// makes the model emit JSON that matches it, so we never parse free-form prose.
//
// Two rules govern this file:
//
//  1. It describes OBSERVATIONS ABOUT THE ADVERTISEMENT, never a measurement of
//     a viewer. There is no field for "manipulation score", "emotional impact",
//     or "brain response" — because MindLens has no way to measure those.
//
//  2. It is deliberately a SUBSET of JSON Schema. Gemini enforces `minItems`
//     and `maxItems` but silently IGNORES `minLength`, `maxLength`,
//     `minProperties`, `maxProperties`, `uniqueItems`, `contains`,
//     `minContains` and `maxContains`. Length limits are therefore applied
//     server-side in utils/validateAIResponse.js. The model's output is never
//     trusted, only checked.
//
// Reference: https://ai.google.dev/gemini-api/docs/structured-output
// ============================================================================

/** Upper bound on technique cards, for both the model and the UI. */
export const MAX_TECHNIQUES = 6;

/**
 * The enum Gemini must choose from. `confidence` is the model's confidence
 * that the technique is genuinely present — NOT how powerful it is.
 */
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];

function techniqueSchema() {
  return {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'Short plain-language name of the persuasive technique, e.g. "Scarcity", ' +
          '"Social proof", "Appeal to authority". Not a psychological diagnosis.',
      },
      evidence: {
        type: 'string',
        description:
          'Verbatim quote, or a precise description of the visual element, taken ' +
          'from the advertisement, that justifies this technique. Must be ' +
          'checkable against the ad. Never paraphrase loosely invented detail.',
      },
      explanation: {
        type: 'string',
        description:
          'Why this kind of appeal can influence attention or judgement, in ' +
          'plain language. Describe the mechanism in general terms; do not ' +
          'claim it worked on any particular viewer.',
      },
      psychologyConcept: {
        type: 'string',
        description:
          'The established concept this relates to, e.g. "Scarcity heuristic", ' +
          '"Bandwagon effect". Phrase as related to the technique, not as a ' +
          'proven cause of behaviour.',
      },
      possibleEffect: {
        type: 'string',
        description:
          'What the advertisement appears designed to encourage (e.g. urgency, ' +
          'trust, belonging). Hedged language only: "may encourage", "aims to". ' +
          'Never "will make you feel".',
      },
      confidence: {
        type: 'string',
        enum: CONFIDENCE_LEVELS,
        description:
          'How confident you are that this technique is actually present in the ' +
          'ad materials. This is not a measure of the technique\'s power.',
      },
      reflectionQuestion: {
        type: 'string',
        description:
          'One question that helps the reader think critically about THIS ad, ' +
          'referring to its actual content rather than generic advice.',
      },
    },
    required: [
      'name',
      'evidence',
      'explanation',
      'psychologyConcept',
      'possibleEffect',
      'confidence',
      'reflectionQuestion',
    ],
  };
}

function audienceIndicatorSchema() {
  return {
    type: 'object',
    properties: {
      indicator: {
        type: 'string',
        description:
          'Something in the ad that suggests who it is addressed to, e.g. ' +
          '"Use of student slang". An observation, not a demographic profile.',
      },
      evidence: {
        type: 'string',
        description: 'The specific word, image, or design choice supporting it.',
      },
    },
    required: ['indicator', 'evidence'],
  };
}

/** The full response schema handed to Gemini. */
export const analysisResponseSchema = {
  type: 'object',
  properties: {
    adSummary: {
      type: 'string',
      description:
        'One or two neutral sentences describing what the advertisement is and ' +
        'what it promotes. Descriptive, not evaluative.',
    },
    language: {
      type: 'string',
      description:
        'Language of the advertisement text as a short code or name, e.g. "en", ' +
        '"Tagalog". Use "unknown" if there is no readable text.',
    },
    extractedText: {
      type: 'string',
      description:
        'All readable text in the advertisement, verbatim, in reading order. ' +
        'Empty string if the input is text-only or if no text is visible. Never ' +
        'invent or complete truncated words.',
    },
    visualObservations: {
      type: 'array',
      description:
        'Image input only. Objective, checkable observations about what is ' +
        'visible: subject, setting, colours, composition, typography. No ' +
        'interpretation of meaning or intent. Empty array for text input.',
      items: {
        type: 'object',
        properties: {
          element: {
            type: 'string',
            description: 'What is being described, e.g. "Main subject".',
          },
          description: {
            type: 'string',
            description: 'A factual description of that element.',
          },
        },
        required: ['element', 'description'],
      },
    },
    techniques: {
      type: 'array',
      maxItems: MAX_TECHNIQUES,
      description:
        'Persuasive techniques that are genuinely evidenced in the ad. Return an ' +
        'EMPTY array when the ad does not clearly use any. Never pad the list to ' +
        'look thorough.',
      items: techniqueSchema(),
    },
    targetAudienceIndicators: {
      type: 'array',
      description:
        'Signals about who the ad appears to address, inferred from its content ' +
        'only. Empty array if there is nothing specific to point at.',
      items: audienceIndicatorSchema(),
    },
    criticalThinkingQuestions: {
      type: 'array',
      description:
        'Three to five questions a reader should ask about this specific ad.',
      items: { type: 'string' },
    },
    limitations: {
      type: 'array',
      description:
        'What this analysis cannot conclude. Must be non-empty and must include ' +
        'that it describes the ad, not any person\'s reaction to it.',
      items: { type: 'string' },
    },
  },
  required: [
    'adSummary',
    'extractedText',
    'techniques',
    'criticalThinkingQuestions',
    'limitations',
  ],
};

export default analysisResponseSchema;
