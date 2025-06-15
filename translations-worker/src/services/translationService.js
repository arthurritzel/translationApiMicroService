import { translate } from '@vitalets/google-translate-api';

export async function translateText(text, sourceLang, targetLang) {
  try {

    // Verificar se a função de tradução está disponível
    if (typeof translate !== 'function') {
      throw new Error('Google Translate function not available');
    }

    // Normalizar códigos de idioma
    const normalizedSource = normalizeLanguageCode(sourceLang);
    const normalizedTarget = normalizeLanguageCode(targetLang);

    console.log(`Translating from ${normalizedSource} to ${normalizedTarget}: "${text.substring(0, 50)}..."`);

    const result = await translate(text, {
      from: normalizedSource,
      to: normalizedTarget
    });

    if (!result || !result.text) {
      throw new Error('Invalid translation response');
    }

    console.log(`Translation completed: "${result.text.substring(0, 50)}..."`);
    
    return result.text;

  } catch (error) {
    console.error('Translation error details:', error);
    
    // Tratamento de diferentes tipos de erro
    if (error.message.includes('not available') || error.message.includes('not a function')) {
      throw new Error('Translation service initialization failed - check library installation');
    } else if (error.code === 'BAD_REQUEST') {
      throw new Error('Invalid translation request - check language codes');
    } else if (error.code === 'TOO_MANY_REQUESTS' || error.message.includes('TooManyRequestsError')) {
      throw new Error('Translation rate limit exceeded - please try again later');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      throw new Error('Network error - translation service temporarily unavailable');
    }
    
    throw new Error(`Translation failed: ${error.message}`);
  }
}

function normalizeLanguageCode(langCode) {
  const mapping = {
    // Português
    'pt-br': 'pt',
    'pt-pt': 'pt',
    
    // Inglês
    'en-us': 'en',
    'en-gb': 'en',
    'en-ca': 'en',
    'en-au': 'en',
    
    // Espanhol
    'es-es': 'es',
    'es-mx': 'es',
    'es-ar': 'es',
    
    // Francês
    'fr-fr': 'fr',
    'fr-ca': 'fr',
    
    // Alemão
    'de-de': 'de',
    'de-at': 'de',
    'de-ch': 'de',
    
    // Chinês
    'zh-cn': 'zh',
    'zh-tw': 'zh-tw',
    'zh-hk': 'zh-tw'
  };

  const normalized = langCode.toLowerCase();
  return mapping[normalized] || normalized.split('-')[0];
}

export async function translateTextWithRetry(text, sourceLang, targetLang, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Adicionar delay progressivo entre tentativas
      if (attempt > 1) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 2s, 4s, 8s...
        console.log(`Retrying translation in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await translateText(text, sourceLang, targetLang);
      
    } catch (error) {
      lastError = error;
      
      // Não fazer retry para erros que não vão resolver com tentativas
      if (error.message.includes('Invalid translation request') || 
          error.message.includes('check language codes') ||
          error.message.includes('initialization failed')) {
        throw error;
      }
      
      console.warn(`Translation attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        break;
      }
    }
  }
  
  throw new Error(`Translation failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}


export async function translateTextRobust(text, sourceLang, targetLang) {
  try {
    // Primeira tentativa: Google Translate
    return await translateTextWithRetry(text, sourceLang, targetLang, 2);
  } catch (error) {
    console.warn(`Google Translate failed: ${error.message}`);
    console.log('Falling back to alternative translation method...');
    
    throw new Error(`Translation failed. Last error: ${error.message}`);
  }
}

export default {
  translateText,
  translateTextWithRetry,
  translateTextRobust,
};