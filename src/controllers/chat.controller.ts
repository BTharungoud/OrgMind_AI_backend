import type { Request, Response } from 'express'
import { DEFAULT_CATEGORY } from '../config/constants.js'
import { documentService } from '../services/document.service.js'
import { chatService } from '../services/chat.service.js'
import { ApiError } from '../utils/apiError.js'
import { successResponse } from '../utils/apiResponse.js'
import { positiveId, requireRequestAuth, stringField } from '../utils/request.js'

export const aiController = {
  async generate(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    const body = request.body as Record<string, unknown>
    const message = stringField(body.message, 'message', 10_000)
    const userId = body.userId ? positiveId(body.userId, 'userId') : auth.userId
    const agentSelected = typeof body.agentSelected === 'string' ? body.agentSelected : 'gemini-2.5-flash'
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : DEFAULT_CATEGORY
    const result = await chatService.generate(message, agentSelected, category, auth, userId)
    response.json({ ...successResponse('Response generated', result), response: result.answer, reply: result.answer, citations: result.citations })
  },
  async legacy(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    const message = request.query.message
    if (typeof message !== 'string' || !message.trim()) throw new ApiError(400, 'message is required.', 'VALIDATION_ERROR')
    const result = await chatService.generate(message, 'gemini-2.5-flash', DEFAULT_CATEGORY, auth, auth.userId)
    response.json({ response: result.answer, reply: result.answer, citations: result.citations })
  },
  async checkIngestion(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    const queryText = request.query.query
    if (typeof queryText !== 'string' || !queryText.trim()) throw new ApiError(400, 'query is required.', 'VALIDATION_ERROR')
    const result = await chatService.generate(queryText, 'gemini-2.5-flash', DEFAULT_CATEGORY, auth, auth.userId)
    response.json(successResponse('Ingestion search completed', { found: result.citations.length > 0, ...result }))
  },
  async ingestOne(request: Request, response: Response) {
    if (!request.file) throw new ApiError(400, 'file is required.', 'VALIDATION_ERROR')
    response.status(201).json(successResponse('File ingested', await documentService.ingest(request.file, requireRequestAuth(request))))
  },
  async ingestMany(request: Request, response: Response) {
    const files = request.files as Express.Multer.File[] | undefined
    if (!files?.length) throw new ApiError(400, 'At least one file is required.', 'VALIDATION_ERROR')
    const auth = requireRequestAuth(request)
    const results = []
    for (const file of files) results.push(await documentService.ingest(file, auth))
    response.status(201).json(successResponse('Files ingested', results))
  },
  async ingestUrl(request: Request, response: Response) {
    const value = (request.body as Record<string, unknown>).url ?? request.query.url
    if (typeof value !== 'string') throw new ApiError(400, 'url is required.', 'VALIDATION_ERROR')
    response.status(201).json(successResponse('URL ingested', await documentService.ingestFromUrl(value, requireRequestAuth(request))))
  },
}

export const historyController = {
  async byUser(request: Request, response: Response) {
    response.json(await chatService.listByUser(positiveId(request.params.userId, 'userId'), requireRequestAuth(request)))
  },
  async byCategory(request: Request, response: Response) {
    response.json(await chatService.listByUser(
      positiveId(request.params.userId, 'userId'), requireRequestAuth(request), request.params.category,
    ))
  },
  async get(request: Request, response: Response) {
    response.json(await chatService.get(positiveId(request.params.id), requireRequestAuth(request)))
  },
  async save(request: Request, response: Response) {
    const body = request.body as Record<string, unknown>
    const item = await chatService.save({
      userId: positiveId(body.userId, 'userId'),
      query: stringField(body.query, 'query', 10_000),
      response: stringField(body.response, 'response', 50_000),
      agentSelected: stringField(body.agentSelected, 'agentSelected'),
      uploadedFiles: typeof body.uploadedFiles === 'string' ? body.uploadedFiles : undefined,
      category: typeof body.category === 'string' ? body.category : DEFAULT_CATEGORY,
    }, requireRequestAuth(request))
    response.status(201).json(successResponse('Chat history saved', item))
  },
  async update(request: Request, response: Response) {
    const body = request.body as Record<string, unknown>
    response.json(successResponse('Chat history updated', await chatService.update(
      positiveId(request.params.id), typeof body.response === 'string' ? body.response : undefined,
      typeof body.category === 'string' ? body.category : undefined, requireRequestAuth(request),
    )))
  },
  async remove(request: Request, response: Response) {
    await chatService.remove(positiveId(request.params.id), requireRequestAuth(request))
    response.json(successResponse('Chat history deleted', null))
  },
  async removeByUser(request: Request, response: Response) {
    await chatService.removeByUser(positiveId(request.params.userId, 'userId'), requireRequestAuth(request))
    response.json(successResponse('User chat history deleted', null))
  },
}

