# M01-门诊管理 - 架构决策记录 (ADR)

> **模块编号**: M01
> **模块名称**: 门诊管理
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 评审中
> **来源**: HIS系统-架构决策记录(ADR).md

---

## 目录

- [ADR-M01-001: 门诊医保实时结算](#adr-m01-001-门诊医保实时结算)
- [ADR-M01-002: 门诊处方CDS校验](#adr-m01-002-门诊处方cds校验)

---

# ADR-M01-001: 门诊医保实时结算

## 决策编号

ADR-M01-001

## 状态

已接受

## 上下文

医保实时结算是门诊收费管理的核心功能。根据PRD和业务规则文档：

**业务要求**：
- 医保患者必须实时对接国家医保平台结算（BR-FIN-001）
- 医保挂号需实时验证医保身份
- 医保结算失败需要有效的处理策略

**对接复杂性**：
- 国家医保平台接口规范复杂
- 各省份医保政策差异
- 网络稳定性要求高
- 结算失败需要重试机制

## 决策

采用**适配器模式+重试机制**的医保集成架构：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                    医保集成架构                                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    业务应用层                                 │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │ 挂号管理 │ │ 门诊收费 │ │ 出院结算 │ │ 费用查询 │            │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │  │
│  └───────┼───────────┼───────────┼───────────┼──────────────────┘  │
│          │           │           │           │                     │
│          ▼           ▼           ▼           ▼                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    医保服务层                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │              MedicalInsuranceService                     ││  │
│  │  │  - verifyIdentity() 验证医保身份                         ││  │
│  │  │  - calculateSettlement() 计算医保结算                    ││  │
│  │  │  - submitSettlement() 提交医保结算                       ││  │
│  │  │  - querySettlement() 查询结算结果                        ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    适配器层                                   │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│  │
│  │  │ 国家医保适配器   │ │ 省医保适配器     │ │ 市医保适配器    ││  │
│  │  │ NationalAdapter │ │ ProvinceAdapter │ │ CityAdapter    ││  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘│  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    基础设施层                                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ 重试机制    │ │ 熔断降级    │ │ 日志监控    │            │  │
│  │  │ Retryable  │ │ CircuitBreak│ │ Logging    │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心实现

```java
/**
 * 医保适配器接口
 */
public interface MedicalInsuranceAdapter {
    
    /**
     * 验证医保身份
     */
    InsuranceIdentityResult verifyIdentity(String idCard, String insuranceType);
    
    /**
     * 计算医保结算
     */
    InsuranceSettlementResult calculate(InsuranceSettlementRequest request);
    
    /**
     * 提交医保结算
     */
    InsuranceSubmitResult submit(InsuranceSettlementRequest request);
    
    /**
     * 查询结算结果
     */
    InsuranceQueryResult query(String settlementId);
    
    /**
     * 撤销结算
     */
    InsuranceCancelResult cancel(String settlementId);
}

/**
 * 国家医保适配器
 */
@Service
@Primary
public class NationalMedicalInsuranceAdapter implements MedicalInsuranceAdapter {
    
    @Value("${insurance.national.endpoint}")
    private String endpoint;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Override
    @Retryable(value = {InsuranceException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    @CircuitBreaker(name = "insurance", fallbackMethod = "verifyIdentityFallback")
    public InsuranceIdentityResult verifyIdentity(String idCard, String insuranceType) {
        // 构建请求
        VerifyIdentityRequest request = new VerifyIdentityRequest();
        request.setIdCard(idCard);
        request.setInsuranceType(insuranceType);
        request.setTimestamp(System.currentTimeMillis());
        request.setSign(sign(request));
        
        // 调用医保接口
        String url = endpoint + "/api/identity/verify";
        VerifyIdentityResponse response = restTemplate.postForObject(url, request, VerifyIdentityResponse.class);
        
        // 解析响应
        if (response == null || !"0000".equals(response.getCode())) {
            throw new InsuranceException("医保身份验证失败: " + (response != null ? response.getMessage() : "无响应"));
        }
        
        return convertToResult(response);
    }
    
    /**
     * 验证失败降级处理
     */
    public InsuranceIdentityResult verifyIdentityFallback(String idCard, String insuranceType, Throwable t) {
        log.error("医保身份验证降级: {}", t.getMessage());
        // 返回降级结果，提示用户稍后重试
        return InsuranceIdentityResult.fallback("医保系统繁忙，请稍后重试");
    }
}
```

### 结算失败处理策略

| 失败类型 | 处理策略 | 说明 |
|----------|----------|------|
| 网络超时 | 自动重试3次 | 间隔2秒 |
| 医保系统异常 | 降级为自费 | 提示用户后续补结算 |
| 医保身份异常 | 提示用户核实 | 引导到医保窗口 |
| 结算金额异常 | 人工处理 | 财务介入 |
| 目录对照缺失 | 人工对照 | 医保办处理 |

### 重试与熔断配置

```yaml
# application-insurance.yml
resilience4j:
  circuitbreaker:
    instances:
      insurance:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
        
  retry:
    instances:
      insurance:
        maxAttempts: 3
        waitDuration: 1s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
```

## 后果

### 正面影响
1. 支持多种医保类型对接
2. 网络异常自动重试，提高成功率
3. 医保系统故障时降级处理，不影响用户

### 负面影响
1. 需要与医保平台联调，对接成本较高
2. 依赖医保平台稳定性
3. 医保目录需对照维护，需要专职人员

### 应对措施
- 预留联调时间
- 熔断降级机制保障系统稳定
- 明确结算失败处理流程

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| BR-FIN-001 | 完全符合 | 实时对接医保平台 |
| 国家医保接口规范 | 符合 | 标准接口对接 |

---

# ADR-M01-002: 门诊处方CDS校验

## 决策编号

ADR-M01-002

## 状态

已接受

## 上下文

门诊处方开立时必须进行CDS临床决策支持校验。根据PRD文档：

**业务要求**：
- 处方开立时必须进行CDS校验（BR-OP-006）
- 校验包括药物相互作用、过敏检查、剂量合理性、配伍禁忌
- CDS告警需要医生确认

**校验内容**：
1. 药物相互作用检查：药物-药物相互作用检查必须覆盖所有已知高风险组合
2. 过敏检查：基于患者过敏史的药物过敏警告
3. 剂量合理性校验：基于年龄/体重/肾功能的剂量合理性提示
4. 配伍禁忌检查：静脉用药配伍禁忌检查

## 决策

采用**规则引擎+知识库**的CDS校验架构：

### 校验流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                    门诊处方CDS校验流程                                │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ 医生开立  │───→│ CDS校验   │───→│ 告警提示  │───→│ 确认/修改 │     │
│  │ 处方     │    │ (四维)    │    │ (分级)    │    │ 处方     │     │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│                       │                                             │
│                       ▼                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    CDS校验引擎                               │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│   │
│  │  │ 药物相互   │ │  过敏检查   │ │  剂量校验   │ │ 配伍禁忌   ││   │
│  │  │ 作用引擎   │ │   引擎     │ │   引擎     │ │   引擎     ││   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘│   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 告警分级

| 严重程度 | 颜色标识 | 处理方式 |
|----------|----------|----------|
| SEVERE | 红色 | 强制确认，需要审批 |
| WARNING | 黄色 | 弹窗提示，需要确认 |
| INFO | 蓝色 | 底部提示，可选择忽略 |

### 知识库管理

| 知识库类型 | 数据来源 | 更新频率 | 记录数量 |
|------------|----------|----------|----------|
| 药物相互作用 | 临床药学知识库 | 季度更新 | ~5000条 |
| 过敏原库 | 药品成分库 | 月度更新 | 动态 |
| 剂量规则 | 药品说明书 | 月度更新 | ~2000条 |
| 配伍禁忌 | 药学指南 | 季度更新 | ~300条 |

## 后果

### 正面影响
1. 规则引擎确保校验逻辑一致
2. 知识库独立管理，便于更新
3. 满足药物相互作用全覆盖检查要求

### 负面影响
1. 需要药学专业人员维护知识库
2. 告警过多可能影响医生工作效率

### 应对措施
- 药剂科负责知识库更新
- 分级显示+智能过滤优化用户体验

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| BR-OP-006 | 完全符合 | 处方开立CDS校验 |
| 药物相互作用检查 | 符合 | 覆盖所有已知高风险组合 |

---

## 附录

### 附录A: 参考标准

| 标准编号 | 标准名称 |
|----------|----------|
| BR-FIN-001 | 医保实时结算业务规则 |
| BR-OP-006 | 门诊处方CDS校验业务规则 |
| 国家医保接口规范 | 国家医保信息平台接口规范 |

### 附录B: 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| V1.0 | 2026-06-17 | 初始版本，从全局ADR拆分 | YUDAO-AI-HIS架构组 |

---

> **最后更新**: 2026-06-17
