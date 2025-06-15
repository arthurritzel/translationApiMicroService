import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import  publishTranslation  from '../services/publish.js';

const prisma = new PrismaClient();


export const createTranslation = async (req, res) => {
    /*
      #swagger.tags = ['Translations']
      #swagger.summary = 'Criar nova tradução'
      #swagger.description = 'Endpoint para criar uma nova requisição de tradução'
      #swagger.parameters['body'] = {
            text: {
              type: 'string',
              description: 'Texto a ser traduzido',
              example: 'Hello, how are you?'
            },
            sourceLang: {
              type: 'string',
              description: 'Idioma de origem (ISO code)',
              example: 'en'
            },
            targetLang: {
              type: 'string',
              description: 'Idioma de destino (ISO code)',
              example: 'pt'
        }
      }
      #swagger.responses[202] = {
        description: 'Requisição aceita e enfileirada',
        schema: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'ID único da requisição',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
          }
        }
      }
      #swagger.responses[400] = {
        description: 'Dados inválidos - validação falhou'
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor'
      }
    */
    
    try {
      // Os dados já foram validados pelo middleware
      const { text, sourceLang, targetLang } = req.body;

      // Criar tradução no banco de dados
      const translation = await prisma.translation.create({
        data: {
          requestId: uuidv4(),
          text,
          sourceLang: sourceLang.toLowerCase(),
          targetLang: targetLang.toLowerCase(),
          status: 'QUEUED',
          queuedAt: new Date(),
        },
      });

      // Simular envio para fila de processamento
      console.log(`[QUEUE] New translation request added: ${translation.requestId}`);
      
      // Adicionar à fila simulada para processamento
      try{
        await publishTranslation({
            requestId: translation.requestId,
            text: translation.text,
            sourceLang: translation.sourceLang,
            targetLang: translation.targetLang,
            wordCount: translation.text.split(' ').length
        });

      } catch (error) {
        console.error('Error publishing translation to queue:', error);
        // Atualizar status para FAILED se falhar ao publicar
        await prisma.translation.update({
          where: { requestId: translation.requestId },
          data: {
            status: 'FAILED',
            errorMessage: 'Failed to publish translation to queue',
            errorCode: 'QUEUE_ERROR',
            updatedAt: new Date(),
          },
        });
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to create translation request due to queue error',
          timestamp: new Date().toISOString(),
        });
      }

      // Responder ao cliente
      return res.status(202).json({
        requestId: translation.requestId,
        status: translation.status,
        message: 'Translation request has been queued for processing',
        createdAt: translation.createdAt,
      });

    } catch (error) {
      console.error('Error creating translation:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create translation request',
        timestamp: new Date().toISOString(),
      });
    }
  }

export const getTranslationStatus = async (req, res) => {
    /*
      #swagger.tags = ['Translations']
      #swagger.summary = 'Buscar status da tradução'
      #swagger.description = 'Endpoint para verificar o status de uma tradução específica'
      #swagger.parameters['requestId'] = {
        in: 'path',
        description: 'ID único da requisição de tradução',
        required: true,
        type: 'string',
        example: '123e4567-e89b-12d3-a456-426614174000'
      }
      #swagger.responses[200] = {
        description: 'Status da tradução encontrado',
        schema: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] 
            },
            originalText: { type: 'string' },
            translatedText: { type: 'string' },
            sourceLang: { type: 'string' },
            targetLang: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            queuedAt: { type: 'string', format: 'date-time' },
            errorMessage: { type: 'string' },
            errorCode: { type: 'string' },
            retryCount: { type: 'number' }
          }
        }
      }
      #swagger.responses[404] = {
        description: 'Tradução não encontrada',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor'
      }
    */

    try {
      // Os parâmetros já foram validados pelo middleware
      const { requestId } = req.params;

      // Buscar tradução no banco
      const translation = await prisma.translation.findUnique({
        where: { requestId },
      });

      if (!translation) {
        return res.status(404).json({
          error: 'Translation not found',
          message: `No translation found with requestId: ${requestId}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Preparar resposta
      const response = {
        requestId: translation.requestId,
        status: translation.status,
        originalText: translation.text,
        sourceLang: translation.sourceLang,
        targetLang: translation.targetLang,
        createdAt: translation.createdAt,
        updatedAt: translation.updatedAt,
        queuedAt: translation.queuedAt,
        retryCount: translation.retryCount,
      };

      // Adicionar campos condicionais baseados no status
      if (translation.translatedText) {
        response.translatedText = translation.translatedText;
      }

      if (translation.errorMessage) {
        response.errorMessage = translation.errorMessage;
      }

      if (translation.errorCode) {
        response.errorCode = translation.errorCode;
      }

      return res.status(200).json(response);

    } catch (error) {
      console.error('Error getting translation status:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve translation status',
        timestamp: new Date().toISOString(),
      });
    }
  }

export const getAllTranslations = async (req, res) => {
    /*
      #swagger.tags = ['Translations']
      #swagger.summary = 'Listar todas as traduções'
      #swagger.description = 'Endpoint para listar todas as traduções com filtros opcionais'
      #swagger.parameters['status'] = {
        in: 'query',
        description: 'Filtrar por status',
        required: false,
        type: 'string',
        enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
      }
      #swagger.parameters['sourceLang'] = {
        in: 'query',
        description: 'Filtrar por idioma de origem',
        required: false,
        type: 'string'
      }
      #swagger.parameters['targetLang'] = {
        in: 'query',
        description: 'Filtrar por idioma de destino',
        required: false,
        type: 'string'
      }
      #swagger.parameters['page'] = {
        in: 'query',
        description: 'Número da página',
        required: false,
        type: 'number',
        default: 1
      }
      #swagger.parameters['limit'] = {
        in: 'query',
        description: 'Itens por página',
        required: false,
        type: 'number',
        default: 10
      }
      #swagger.responses[200] = {
        description: 'Lista de traduções',
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  status: { type: 'string' },
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    */

    try {
      // Query parameters com valores padrão
      const {
        status,
        sourceLang,
        targetLang,
        page = 1,
        limit = 10
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir filtros
      const where = {};
      if (status) where.status = status;
      if (sourceLang) where.sourceLang = sourceLang;
      if (targetLang) where.targetLang = targetLang;

      // Buscar traduções e contar total
      const [translations, total] = await Promise.all([
        prisma.translation.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            requestId: true,
            status: true,
            sourceLang: true,
            targetLang: true,
            createdAt: true,
            updatedAt: true,
            retryCount: true,
          },
        }),
        prisma.translation.count({ where }),
      ]);

      return res.ok(res.hateos_list('translations', translations, Math.ceil(total / parseInt(limit))));

    } catch (error) {
      console.error('Error getting all translations:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve translations',
        timestamp: new Date().toISOString(),
      });
    }
  }

export const updateTranslationStatus = async (req, res) => {
    /*
      #swagger.tags = ['Translations']
      #swagger.summary = 'Atualizar status da tradução'
      #swagger.description = 'Endpoint para atualizar o status de uma tradução (usado pelo worker)'
      #swagger.parameters['requestId'] = {
        in: 'path',
        description: 'ID único da requisição de tradução',
        required: true,
        type: 'string'
      }
      #swagger.parameters['body'] = {
        in: 'body',
        description: 'Dados de atualização',
        required: true,
        schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
              description: 'Novo status da tradução'
            },
            translatedText: {
              type: 'string',
              description: 'Texto traduzido (obrigatório quando status = COMPLETED)'
            },
            errorMessage: {
              type: 'string',
              description: 'Mensagem de erro (obrigatório quando status = FAILED)'
            },
            errorCode: {
              type: 'string',
              description: 'Código do erro'
            }
          },
          required: ['status']
        }
      }
    */

    try {
      const { requestId } = req.params;
      const { status, translatedText, errorMessage, errorCode } = req.body;

      const token = req.header("x-api-key");
      const existingTranslation = await prisma.translation.findUnique({
          where: { requestId: token },
      });
      if (!existingTranslation){
          return res.unauthorized();
      }

      // Preparar dados de atualização
      const updateData = {
        status,
        updatedAt: new Date(),
      };

      // Validações baseadas no status
      if (status === 'COMPLETED') {
        if (!translatedText) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'translatedText is required when status is COMPLETED',
          });
        }
        updateData.translatedText = translatedText;
      }

      if (status === 'FAILED') {
        if (!errorMessage) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'errorMessage is required when status is FAILED',
          });
        }
        updateData.errorMessage = errorMessage;
        updateData.errorCode = errorCode;
        updateData.retryCount = { increment: 1 };
      }

      // Atualizar no banco
      const updatedTranslation = await prisma.translation.update({
        where: { requestId },
        data: updateData,
      });

      console.log(`[STATUS UPDATE] ${requestId}: ${existingTranslation.status} -> ${status}`);

      return res.status(200).json({
        requestId: updatedTranslation.requestId,
        status: updatedTranslation.status,
        message: `Translation status updated to ${status}`,
        updatedAt: updatedTranslation.updatedAt,
      });

    } catch (error) {
      console.error('Error updating translation status:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update translation status',
        timestamp: new Date().toISOString(),
      });
    }
  }
