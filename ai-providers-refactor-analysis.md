# AI Providers Module - Code Quality Analysis & Refactor Plan

## 🔍 **Current Issues với ai-providers module**

### **Domain Layer Issues**

#### ❌ **File Structure Problems:**
- **185 lines trong 1 file** với 5 classes khác nhau
- **Poor Single Responsibility** - 1 file chứa tất cả domain entities
- **Inconsistent Naming** - mix of `AiProvider`, `AiProviderConfig`, `AiUsageLog`, etc.
- **God Object Pattern** - `AiProviderConfig` quá nhiều responsibilities

### **Data Structure Issues:**
```typescript
// ❌ PROBLEM: AiProviderConfig class too big (20+ properties)
export class AiProviderConfig {
  id: string;
  providerId: string;
  provider?: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  useStream: boolean;
  // extra: Record<string, any>; (commented out but still clutter)
  ownerType: 'system' | 'user' | 'workspace';
  ownerId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Missing Proper Domain Separation:**
- **Configuration vs Ownership** concepts mixed
- **Provider Settings vs API Keys** không tách biệt
- **Usage Tracking** mixed with configuration

---

## 🏗️ **Refactored Architecture - Clean & Professional**

### **1. Domain Layer Structure (Clean Architecture)**

#### **A. Core Domain Entities - Separated Files**

```
apps/backend/src/ai-providers/domain/
├── providers/
│   ├── ai-provider.entity.ts          # AiProvider (clean)
│   ├── provider-config.entity.ts      # ProviderConfig (focused)
│   └── enums.ts                       # OwnerType, ProviderStatus
├── configurations/
│   ├── api-keys/
│   │   ├── secure-api-key.entity.ts   # Encrypted key storage
│   │   └── api-key.service.ts         # Encryption/decryption
│   ├── connection/
│   │   ├── connection-config.entity.ts # BaseUrl, timeout, etc.
│   │   └── models/
│   │       ├── model-config.entity.ts  # Model list per provider
│   │       └── model.enum.ts           # PREDEFINED_MODELS
│   └── ownership/
│       ├── ownership-type.enum.ts      # USER | WORKSPACE | SYSTEM
│       ├── user-config.entity.ts       # UserAiProviderConfig (minimal)
│       └── workspace-config.entity.ts  # WorkspaceAiProviderConfig
└── usage/
    ├── ai-usage-log.entity.ts          # Usage tracking
    ├── usage-stats.value-object.ts     # Cost calculations
    └── provider-limits.value-object.ts  # Rate limiting
```

#### **B. Clean Domain Entities - Better Separation**

```typescript
// ✅ CLEAN: AiProvider - chỉ metadata về provider
export class AiProvider {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'openai' })
  key: ProviderKey; // strong typing

  @ApiProperty({ example: 'OpenAI GPT' })
  label: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  // Dependencies instead of direct props
  getRequiredConfigFields(): ConfigField[] { /* */ }
}

// ✅ CLEAN: ProviderConfig - minimal and focused
export class ProviderConfig {
  id: string;
  providerId: string;
  provider: AiProvider;

  // Strong typing instead of any
  connection: ConnectionConfig;
  modelSettings: ModelSettings;
  ownership: OwnershipInfo;

  createdAt: Date;
  updatedAt: Date;
}

// ✅ CLEAN: Separate entities với single responsibility
export class SecureApiKey {
  id: string;
  providerConfigId: string;
  encryptedKey: string; // Only storage, no business logic
  ownerId: string;
  createdAt: Date;
}

export class ConnectionConfig {
  baseUrl?: string;
  timeout?: number;
  apiVersion?: string;
  streamEnabled: boolean;
}

export class OwnershipInfo {
  type: OwnershipType; // USER | WORKSPACE | SYSTEM
  ownerId: string;
  isDefault: boolean;
  displayName: string;
}
```

### **2. Application Services - Single Responsibility**

#### **A. Service Layer Separation**
```typescript
// ❌ BEFORE: One monolithic service
@Injectable()
export class AiProvidersService {
  // 40+ methods mixing everything
  createUserConfig(), createWorkspaceConfig(), encryptConfig(),
  chatWithOpenAI(), generateEmbedding(), getApiKey()...
}

// ✅ AFTER: Focused services
@Injectable()
export class ProviderManagementService {
  // Only provider CRUD operations
}

@Injectable()
export class AiConversationalService {
  // Only AI chat/completion operations
}

@Injectable()
export class ConfigurationService {
  // Only configuration management
  // Delegates encryption to SecureApiKeyService
}
```

#### **B. Clean Service APIs**

```typescript
// ✅ CLEAN: ProviderManagementService
@Injectable()
export class ProviderManagementService {
  constructor(
    private readonly repository: ProviderRepository,
    private readonly validator: ProviderValidator,
  ) {}

  async createProvider(config: CreateProviderRequest): Promise<AiProvider> {
    await this.validator.validateProviderConfig(config);
    const provider = this.buildProviderEntity(config);
    return this.repository.save(provider);
  }

  async getActiveProviders(): Promise<AiProvider[]> {
    return this.repository.findActive();
  }

  private buildProviderEntity(config: CreateProviderRequest): AiProvider {
    return {
      ...config,
      key: ProviderKey.create(config.key),
      isActive: config.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// ✅ CLEAN: AiConversationalService - Chat/Embedding only
@Injectable()
export class AiConversationalService {
  constructor(
    private readonly clientFactory: AiClientFactory,
    private readonly cache: CacheManager,
  ) {}

  async generateChat(
    request: ChatRequest,
    provider: AiProvider
  ): Promise<ChatResponse> {
    const client = this.clientFactory.createClient(provider);
    const cached = await this.cache.get(this.buildCacheKey(request));

    if (cached) return cached;

    const result = await client.chat(request);
    await this.cache.set(this.buildCacheKey(request), result, 300);

    return result;
  }
}
```

### **3. Infrastructure Layer - Clean Separation**

#### **A. Repository Pattern - Well Structured**

```typescript
// ✅ CLEAN: Separate repositories for different concerns
@Injectable()
export class AiProviderRepository {
  constructor(
    @InjectRepository(AiProviderEntity)
    private readonly providerRepo: Repository<AiProviderEntity>,
    @InjectRepository(ProviderConfigEntity)
    private readonly configRepo: Repository<ProviderConfigEntity>,
  ) {}

  async findById(id: string): Promise<AiProvider> {
    const entity = await this.providerRepo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async saveProvider(provider: AiProvider): Promise<void> {
    const entity = this.mapToEntity(provider);
    await this.providerRepo.save(entity);
  }

  // Clean mapping methods
  private mapToDomain(entity: AiProviderEntity): AiProvider { /* */ }
  private mapToEntity(domain: AiProvider): AiProviderEntity { /* */ }
}

@Injectable()
export class ConfigurationRepository {
  // Only configuration-related operations
  async saveUserConfig(config: UserProviderConfig): Promise<void> { /* */ }
  async findWorkspaceConfigs(workspaceId: string): Promise<WorkspaceProviderConfig[]> { /* */ }
}
```

#### **B. AI Client Factory - Extensible Design**

```typescript
// ✅ CLEAN: Factory pattern for AI providers
@Injectable()
export class AiClientFactory {
  constructor(private readonly configService: ConfigService) {}

  createClient(provider: AiProvider): IAiClient {
    const config = this.getProviderConfig(provider);

    switch (provider.key) {
      case ProviderKey.OPENAI:
        return new OpenAiClient(config);
      case ProviderKey.ANTHROPIC:
        return new AnthropicClient(config);
      case ProviderKey.GOOGLE:
        return new GoogleAiClient(config);
      default:
        throw new UnsupportedProviderError(provider.key);
    }
  }
}

// Clean interfaces
interface IAiClient {
  chat(request: ChatRequest): Promise<ChatResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}

// Implementation per provider
@Injectable()
export class OpenAiClient implements IAiClient {
  constructor(private readonly config: ProviderConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const client = new OpenAI({ apiKey: this.config.apiKey });

      // Clean implementation with proper error handling
      const response = await client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
      });

      return this.mapOpenAiResponse(response);
    } catch (error) {
      // Proper error classification
      throw new AiProviderError('OPENAI_CHAT_FAILED', error.message, error);
    }
  }

  private mapOpenAiResponse(response: any): ChatResponse {
    return {
      content: response.choices[0]?.message?.content ?? '',
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      metadata: {
        model: response.model,
        finishReason: response.choices[0]?.finish_reason,
      },
    };
  }
}
```

### **4. Configuration Management - Secure & Clean**

```typescript
// ✅ CLEAN: SecureApiKeyService - Single responsibility
@Injectable()
export class SecureApiKeyService {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly keyRepository: SecureApiKeyRepository,
  ) {}

  async storeApiKey(
    providerConfigId: string,
    rawApiKey: string,
    ownerId: string
  ): Promise<string> {
    const encryptedKey = this.encryptionService.encrypt(rawApiKey);

    const secureKey = await this.keyRepository.save({
      providerConfigId,
      encryptedKey,
      ownerId,
      createdAt: new Date(),
    });

    return secureKey.id;
  }

  async getApiKey(keyId: string, requestingOwnerId: string): Promise<string> {
    const secureKey = await this.keyRepository.findById(keyId);

    // Authorization check
    if (secureKey.ownerId !== requestingOwnerId) {
      throw new ForbiddenException('Access denied to API key');
    }

    return this.encryptionService.decrypt(secureKey.encryptedKey);
  }
}
```

### **5. Error Handling - Professional Grade**

```typescript
// ✅ CLEAN: Typed errors with proper classification
export abstract class AiProviderError extends Error {
  readonly code: string;
  readonly provider: string;
  readonly retryable: boolean;

  constructor(code: string, message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AiProviderError';
    this.code = code;
  }
}

export class OpenAiRateLimitError extends AiProviderError {
  readonly retryable = true;

  constructor(message: string, cause?: Error) {
    super('OPENAI_RATE_LIMIT', message, cause);
  }
}

export class AnthropicInvalidRequestError extends AiProviderError {
  readonly retryable = false;

  constructor(message: string, cause?: Error) {
    super('ANTHROPIC_INVALID_REQUEST', message, cause);
  }
}

// Error handling service
@Injectable()
export class AiErrorHandler {
  handleError(error: unknown, context: ErrorContext): never {
    if (error instanceof AiProviderError) {
      this.logAiProviderError(error, context);
      throw this.buildUserFriendlyError(error);
    }

    // Fallback for unexpected errors
    this.logUnexpectedError(error, context);
    throw new InternalServerErrorException('AI service temporarily unavailable');
  }

  private logAiProviderError(error: AiProviderError, context: ErrorContext) {
    // Structured logging for monitoring
    console.error({
      type: 'AI_PROVIDER_ERROR',
      code: error.code,
      provider: error.provider,
      retryable: error.retryable,
      userId: context.userId,
      timestamp: new Date().toISOString(),
      error: error.message,
      cause: error.cause?.message,
    });
  }
}
```

---

## 📊 **Benefits of Refactored Structure**

### **Maintainability**
- ✅ **Single Responsibility**: Each class/file has one clear purpose
- ✅ **Dependency Injection**: Easy to test and mock
- ✅ **Clean Interfaces**: Well-defined contracts giữa layers
- ✅ **Small Files**: <100 lines per file

### **Security**
- 🔒 **Encrypted Keys**: Separate service only for key management
- 🔒 **Access Control**: Proper authorization checks
- 🔒 **Audit Trail**: All operations are logged

### **Performance**
- ⚡ **Caching**: Shared cache cho common operations
- ⚡ **Connection Pooling**: Efficient AI provider clients
- ⚡ **Async Operations**: Non-blocking AI calls

### **Scalability**
- 📈 **Factory Pattern**: Easy to add new AI providers
- 📈 **Repository Pattern**: Clean data access abstraction
- 📈 **Event-driven**: Extensible architecture

---

## 🚀 **Migration Strategy**

### **Phase 1: Create New Structure (Week 1)**
1. Create new directory structure
2. Define clean interfaces
3. Implement core domain entities
4. Create base service classes

### **Phase 2: Migrate Core Logic (Week 2)**
1. Implement new AI clients
2. Migrate configuration management
3. Add proper error handling
4. Create secure API key service

### **Phase 3: Integration & Testing (Week 3)**
1. Integrate with existing controllers
2. Update database schemas if needed
3. Comprehensive unit/integration tests
4. Performance benchmarking

### **Phase 4: Optimization (Week 4)**
1. Add caching layers
2. Implement monitoring
3. Performance optimization
4. Documentation updates

---

## 📁 **File Structure After Refactor**

```
apps/backend/src/ai-providers/
├── domain/
│   ├── enums.ts                               # ProviderKey, OwnershipType
│   ├── interfaces.ts                         # Common interfaces
│   ├── providers/
│   │   ├── ai-provider.entity.ts            # Clean AiProvider
│   │   └── provider.interface.ts            # IAiProvider
│   ├── configurations/
│   │   ├── provider-config.entity.ts        # Minimal config entity
│   │   ├── user-config.entity.ts            # UserAiProviderConfig
│   │   └── workspace-config.entity.ts       # WorkspaceAiProviderConfig
│   ├── security/
│   │   ├── secure-api-key.entity.ts         # Encrypted key storage
│   │   └── secure-api-key.service.ts        # Encryption/decryption
│   └── usage/
│       ├── ai-usage-log.entity.ts           # Usage tracking
│       └── usage-stats.value-object.ts      # Cost calculations
├── application/
│   ├── services/
│   │   ├── provider-management.service.ts   # Provider CRUD
│   │   ├── ai-conversational.service.ts     # Chat/embeddings
│   │   ├── configuration.service.ts        # Config management
│   │   └── usage-tracking.service.ts       # Analytics
│   ├── ports/
│   │   ├── ai-client.interface.ts          # AI provider contracts
│   │   └── repository.interface.ts         # Data access contracts
│   └── factories/
│       └── ai-client.factory.ts            # Provider instantiations
├── infrastructure/
│   ├── repositories/
│   │   ├── ai-provider.repository.ts       # Provider persistence
│   │   ├── configuration.repository.ts     # Config persistence
│   │   ├── secure-key.repository.ts        # Key persistence
│   │   └── usage.repository.ts             # Usage persistence
│   ├── ai-clients/
│   │   ├── openai-client.service.ts       # OpenAI implementation
│   │   ├── anthropic-client.service.ts    # Anthropic implementation
│   │   ├── google-client.service.ts       # Google implementation
│   │   └── ollama-client.service.ts       # Ollama implementation
│   └── config/
│       └── ai-providers.config.ts         # Module configuration
├── dto/
│   ├── requests/
│   │   ├── create-provider.dto.ts
│   │   ├── update-config.dto.ts
│   │   ├── chat-request.dto.ts
│   │   └── usage-query.dto.ts
│   └── responses/
│       ├── provider.dto.ts
│       ├── chat-response.dto.ts
│       └── usage-stats.dto.ts
├── ai-providers.module.ts                   # Clean module
└── ai-providers.controller.ts              # Thin controller
```

---

## 🎯 **Key Refactoring Principles Applied**

1. **SOLID Principles**: Each class has single responsibility
2. **Dependency Inversion**: Depend on interfaces, not concretes
3. **Factory Pattern**: Flexible provider instantiation
4. **Repository Pattern**: Clean data access abstraction
5. **Domain-Driven Design**: Business logic ở domain layer
6. **CQRS Pattern**: Separate read/write operations nếu cần

**This refactor transforms a sloppy, monolithic module into a clean, professional, and maintainable AI providers service!**

Bạn muốn tôi bắt đầu implement Phase 1 - tạo new directory structure và core interfaces không?
