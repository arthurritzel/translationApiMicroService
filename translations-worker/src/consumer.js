import amqp from 'amqplib';
import dotenv from 'dotenv';
import colors from 'colors';
import connection from './services/connection.js';
import { translateTextRobust } from './services/translationService.js';

dotenv.config();

const queue = 'translationQueue';
const exchange = 'translationExchange';
const routingKey = 'translationQueue';

// URL da API para atualizar status
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4040/api';
const API_TOKEN = process.env.API_TOKEN; // Token para autenticação se necessário

// Função para atualizar status via API
async function updateTranslationStatusAPI(requestId, status, data = {}) {
    const updateData = {
        status,
        ...data
    };

    const headers = {
        'x-api-key': requestId,
        'Content-Type': 'application/json'
    };


    const url = `${API_BASE_URL}/translation/${requestId}/status`;
    console.log(colors.cyan(`🔗 Calling API: ${url}`));
    console.log(colors.cyan(`📤 Payload:`, JSON.stringify(updateData)));

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData)
        });

        console.log(colors.cyan(`📥 Response status: ${response.status}`));

        if (!response.ok) {
            const responseText = await response.text();
            console.log(colors.red(`❌ Response body: ${responseText}`));
            
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }
            
            throw new Error(`API Error: ${response.status} - ${errorData.message || responseText}`);
        }

        const result = await response.json();
        console.log(colors.green(`✅ API Response:`, JSON.stringify(result)));
        return result;
        
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(`Network error: Cannot connect to ${url}. Is the API server running?`);
        }
        throw error;
    }
}
// Função para processar tradução
async function processTranslation(translationMessage) {
    const { correlationId, data } = translationMessage;
    const { text, sourceLang, targetLang } = data;
    
    // O requestId agora vem no correlationId
    const requestId = correlationId;
    
    console.log(colors.blue(`🔄 Processing translation: ${requestId}`));
    console.log(colors.cyan(`📝 Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`));
    console.log(colors.cyan(`🌍 ${sourceLang} → ${targetLang}`));
    
    try {
        // Atualizar status para PROCESSING via API
        await updateTranslationStatusAPI(requestId, 'PROCESSING');
        console.log(colors.yellow(`⏳ Status updated to PROCESSING for: ${requestId}`));
        
        // Realizar a tradução usando Google Translate com fallback
        const translatedText = await translateTextRobust(text, sourceLang, targetLang);
        
        console.log(colors.green(`📝 Translated: "${translatedText.substring(0, 100)}${translatedText.length > 100 ? '...' : ''}"`));
        
        // Atualizar status para COMPLETED via API
        await updateTranslationStatusAPI(requestId, 'COMPLETED', {
            translatedText
        });
        console.log(colors.green(`✅ Translation completed for: ${requestId}`));
        
    } catch (error) {
        console.error(colors.red(`❌ Translation failed for: ${requestId} - ${error.message}`));
        
        try {
            // Atualizar status para FAILED via API
            await updateTranslationStatusAPI(requestId, 'FAILED', {
                errorMessage: error.message,
                errorCode: 'TRANSLATION_ERROR'
            });
        } catch (apiError) {
            console.error(colors.red(`❌ Failed to update status via API: ${apiError.message}`));
        }
        
        throw error; // Re-throw para que o consumer possa tentar novamente
    }
}

// Iniciar o consumer
console.log(colors.cyan('🚀 Starting Translation Worker...'));

connection(queue, exchange, routingKey, processTranslation)
    .then(() => {
        console.log(colors.green('✅ Translation consumer is running'));
    })
    .catch((error) => {
        console.error(colors.red('❌ Failed to start translation consumer:', error));
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log(colors.yellow('📴 Shutting down translation consumer...'));
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log(colors.yellow('📴 Shutting down translation consumer...'));
    process.exit(0);
});