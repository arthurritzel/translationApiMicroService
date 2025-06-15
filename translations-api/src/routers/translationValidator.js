import * as yup from "yup";

const translationYupValidator = yup.object().shape({
  text: yup
    .string()
    .required("Text is required")
    .trim()
    .min(1, "Text cannot be empty")
    .max(10000, "Text cannot exceed 10,000 characters"),
  
  sourceLang: yup
    .string()
    .required("Source language is required")
    .trim()
    .lowercase()
    .matches(/^[a-z]{2}(-[a-z]{2})?$/, "Source language must be a valid ISO language code (e.g., 'en', 'pt-br')")
    .test('supported-language', 'Source language is not supported', (value) => {
      const supportedLanguages = [
        'en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru',
        'pt-br', 'en-us', 'en-gb', 'es-es', 'es-mx', 'fr-fr', 'de-de'
      ];
      return supportedLanguages.includes(value);
    }),
  
  targetLang: yup
    .string()
    .required("Target language is required")
    .trim()
    .lowercase()
    .matches(/^[a-z]{2}(-[a-z]{2})?$/, "Target language must be a valid ISO language code (e.g., 'en', 'pt-br')")
    .test('supported-language', 'Target language is not supported', (value) => {
      const supportedLanguages = [
        'en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru',
        'pt-br', 'en-us', 'en-gb', 'es-es', 'es-mx', 'fr-fr', 'de-de'
      ];
      return supportedLanguages.includes(value);
    })
    .test('different-languages', 'Source and target languages must be different', function(value) {
      return value !== this.parent.sourceLang;
    })
});

// Validator específico para atualização de status (usado pelo worker)
const translationStatusUpdateValidator = yup.object().shape({
  requestId: yup
    .string()
    .required("Request ID is required")
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, "Request ID must be a valid UUID"),
  
  status: yup
    .string()
    .required("Status is required")
    .oneOf(["queued", "processing", "completed", "failed"], "Invalid status"),
  
  translatedText: yup
    .string()
    .when("status", {
      is: "completed",
      then: (schema) => schema.required("Translated text is required when status is completed"),
      otherwise: (schema) => schema.nullable(),
    }),
  
  error: yup
    .string()
    .when("status", {
      is: "failed",
      then: (schema) => schema.required("Error message is required when status is failed"),
      otherwise: (schema) => schema.nullable(),
    }),
  
  processingTime: yup
    .number()
    .min(0, "Processing time cannot be negative")
    .nullable(),
  
  qualityScore: yup
    .number()
    .min(0, "Quality score cannot be negative")
    .max(100, "Quality score cannot exceed 100")
    .nullable(),
});

// Validator para busca/filtros
const translationQueryValidator = yup.object().shape({
  status: yup
    .string()
    .oneOf(["queued", "processing", "completed", "failed"], "Invalid status filter")
    .nullable(),
  
  sourceLang: yup
    .string()
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/, "Source language must be a valid ISO code")
    .nullable(),
  
  targetLang: yup
    .string()
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/, "Target language must be a valid ISO code")
    .nullable(),

});

export {
  translationYupValidator as default,
  translationStatusUpdateValidator,
  translationQueryValidator
};