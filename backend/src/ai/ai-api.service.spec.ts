import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { AiApiService } from './ai-api.service';

jest.mock('openai');

describe('AiApiService', () => {
  let service: AiApiService;
  const mockedCreate = jest.fn();
  const originalEnv = process.env;

  beforeAll(() => {

    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create: mockedCreate } },
    }));
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockedCreate.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('throws if OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new AiApiService()).toThrow(InternalServerErrorException);
    });

    it('initializes client when OPENAI_API_KEY provided', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      service = new AiApiService();
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-key' });
    });
  });

  describe('complete()', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
      service = new AiApiService();
    });

    it('returns the content when API responds with valid message', async () => {
      mockedCreate.mockResolvedValue({
        choices: [{ message: { content: 'generated response' } }],
      });

      const result = await service.complete('hello');
      expect(mockedCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: 500,
      });
      expect(result).toBe('generated response');
    });

    it('throws if the API returns no content', async () => {
      mockedCreate.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });
      await expect(service.complete('ping')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException on client error', async () => {
      mockedCreate.mockRejectedValue(new Error('some error'));
      await expect(service.complete('error')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
