# YUDAO-AI-HIS 智慧医疗信息系统 - 架构决策记录 (ADR)

> **文档编号**: YUDAO-HIS-ADR-001
> **版本**: V1.0
> **创建日期**: 2026-06-16
> **状态**: 评审中
> **编制方法**: 基于PRD、业务规则、模块划分、状态机设计文档识别关键架构决策
> **参考标准**: HIMSS EMRAM Stage 5+ | HL7 FHIR R4 | 等保三级 | ICD-10 | DICOM

---

## 目录

- [核心架构决策 (ADR-001~010)](#核心架构决策)
- [技术选型决策 (ADR-011~020)](#技术选型决策)
- [安全合规决策 (ADR-021~030)](#安全合规决策)

---

## 核心架构决策

---

# ADR-001: 微服务架构选型

## 状态

已接受

## 背景

YUDAO-AI-HIS智慧医疗信息系统需要支撑日均5000+门诊量、1000+住院量的三级医院核心业务。系统包含13个子系统、56个子模块、约320个功能点，业务复杂度高，模块间存在复杂的依赖关系。

当前面临的主要问题：
1. 传统单体HIS系统架构老旧，难以扩展和集成
2. 各业务模块耦合度高，一个模块故障可能影响全系统
3. 业务模块开发进度不一致，需要独立部署和迭代
4. 部分模块（如影像、检验）对性能要求差异大
5. 需要支持多院区部署的扩展性

## 决策

采用**模块化单体架构，预留微服务演进能力**的架构策略：

1. **第一阶段（MVP）**：采用模块化单体架构
   - 所有模块部署在同一应用中
   - 通过Maven多模块项目结构组织代码
   - 模块间通过接口/API调用，禁止直接访问其他模块的数据表
   - 共享数据库，但各模块有独立的数据Schema边界

2. **第二阶段（按需拆分）**：逐步演进为微服务架构
   - 优先拆分高负载模块：M05影像管理、M04检验管理
   - 独立部署公共服务：M10集成平台、CDS引擎
   - 保留核心业务模块（M01门诊、M02住院）为单体，保证事务一致性

3. **服务拆分边界原则**：
   - 按业务领域划分：门诊、住院、药品、检验、影像、财务
   - 高内聚低耦合：同一业务领域功能聚合
   - 数据边界清晰：每个服务拥有独立的数据存储

```
┌─────────────────────────────────────────────────────────────────┐
│                    第一阶段：模块化单体                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ M01 │ │ M02 │ │ M03 │ │ M04 │ │ M05 │ │ M06 │ │ M08 │      │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘      │
│     └───────┴───────┴───────┴───────┴───────┴───────┘          │
│                         共享数据库                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ 演进
┌─────────────────────────────────────────────────────────────────┐
│                    第二阶段：微服务架构                           │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                       │
│  │ 核心服务 │   │ 影像服务 │   │ 检验服务 │                       │
│  │ (单体)  │   │ (独立)  │   │ (独立)  │                       │
│  │ M01/M02 │   │   M05   │   │   M04   │                       │
│  │ M06/M08 │   └────┬────┘   └────┬────┘                       │
│  └────┬────┘        │             │                            │
│       │        ┌────┴─────────────┴────┐                       │
│       │        │      消息总线/网关     │                       │
│       └────────│                       │                       │
│                └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## 理由

1. **渐进式演进**：避免一开始就承担微服务的复杂度，MVP阶段快速交付
2. **降低风险**：核心业务（门诊、住院）保持在单体中，确保事务一致性
3. **按需拆分**：影像、检验等模块数据量大、负载高，独立部署可提升性能
4. **成本可控**：初期部署成本低，团队学习曲线平缓
5. **标准合规**：符合模块划分文档中的高内聚低耦合原则

## 替代方案

### 方案A：纯单体架构
- **优点**：开发简单，部署方便，事务一致性容易保证
- **缺点**：扩展性差，一个模块故障影响全局，技术债务累积快
- **拒绝原因**：无法满足日均5000+门诊量的性能扩展需求

### 方案B：全面微服务架构
- **优点**：独立部署、独立扩展，故障隔离
- **缺点**：运维复杂度高，分布式事务处理困难，初期投入大
- **拒绝原因**：MVP阶段投入产出比不合理，团队经验不足风险高

### 方案C：混合架构（单体+微服务）
- **优点**：兼顾两者优势
- **缺点**：需要清晰的边界划分，管理复杂度中等
- **接受程度**：与决策方案一致，采用渐进式演进

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 开发效率 | MVP阶段开发效率高，后期演进需要重构 | 设计阶段预留接口边界 |
| 部署运维 | 初期简单，后期需要容器化支持 | 预先设计Docker/K8s部署方案 |
| 性能扩展 | 核心模块横向扩展受限 | 通过缓存、分库分表提升性能 |
| 事务一致性 | 分布式事务处理复杂 | 核心业务保持在单体中 |
| 团队技能 | 需要微服务技能储备 | 培训和招聘并行 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| HIMSS EMRAM Stage 5+ | 符合 | 架构支持闭环给药等核心功能 |
| HL7 FHIR R4 | 符合 | 通过集成平台实现标准接口 |
| 等保三级 | 符合 | 模块化设计便于权限隔离 |

---

# ADR-002: 数据库分表策略

## 状态

已接受

## 背景

YUDAO-AI-HIS系统涉及大量业务数据，根据PRD文档的数据需求分析：

| 数据实体 | 年增量估算 | 保留期限 |
|----------|------------|----------|
| 费用明细 (his_charge_detail) | 约3000万条 | ≥ 15年 |
| 给药记录 (his_medication_admin) | 约2000万条 | ≥ 15年 |
| 医嘱执行 (his_order_exec) | 约1500万条 | ≥ 30年 |
| 检验结果 (his_lab_result) | 约500万条 | ≥ 15年 |
| 审计日志 (sys_audit_log) | 约1000万条 | ≥ 3年 |

数据特点：
1. 数据量巨大，单表性能瓶颈明显
2. 历史数据访问频率低，但需要长期保存
3. 查询多为按时间范围查询
4. 费用、检验数据需要按年度归档

## 决策

采用**按时间分表**的策略，结合**冷热数据分离**：

### 分表策略

| 数据表 | 分表策略 | 分表字段 | 分表粒度 | 说明 |
|--------|----------|----------|----------|------|
| his_charge_detail | 按年分表 | year | 年 | 费用明细数据量大 |
| his_lab_result | 按年分表 | year | 年 | 检验结果数据量大 |
| his_nursing_record | 按年分表 | year | 年 | 护理记录数据量大 |
| sys_audit_log | 按月分表 | year_month | 月 | 审计日志数据量极大 |
| his_medication_admin | 按年分表 | year | 年 | 给药记录数据量大 |
| his_order_exec | 按年分表 | year | 年 | 医嘱执行数据量大 |

### 分表命名规则

```
his_charge_detail_2026  -- 2026年费用明细表
his_charge_detail_2027  -- 2027年费用明细表
sys_audit_log_202606    -- 2026年6月审计日志表
```

### 数据访问层设计

```java
/**
 * 分表路由策略
 */
public class TableShardingStrategy {
    
    /**
     * 根据时间确定目标表名
     */
    public String getTargetTable(String baseTable, Date date) {
        if ("sys_audit_log".equals(baseTable)) {
            // 按月分表
            return baseTable + "_" + DateUtil.format(date, "yyyyMM");
        } else {
            // 按年分表
            return baseTable + "_" + DateUtil.year(date);
        }
    }
    
    /**
     * 跨表查询（支持时间范围查询）
     */
    public List<String> getTableRange(String baseTable, Date start, Date end) {
        // 返回时间范围内的所有表名
    }
}
```

### 冷热数据分离

```
┌─────────────────────────────────────────────────────────────┐
│                      热数据（在线）                           │
│         当年数据 + 最近3年数据，高性能存储                     │
│         MySQL主库 + Redis缓存                                │
├─────────────────────────────────────────────────────────────┤
│                      温数据（近线）                           │
│         3-7年历史数据，标准存储                               │
│         MySQL从库 / 归档库                                   │
├─────────────────────────────────────────────────────────────┤
│                      冷数据（离线）                           │
│         7年以上历史数据，低成本存储                           │
│         数据仓库 / 对象存储                                   │
└─────────────────────────────────────────────────────────────┘
```

## 理由

1. **性能保障**：单表数据量控制在合理范围，查询性能稳定
2. **运维友好**：按时间分表便于数据归档和清理
3. **成本控制**：冷热分离降低存储成本
4. **合规要求**：满足数据保留期限要求
5. **透明访问**：通过中间件屏蔽分表细节，对业务层透明

## 替代方案

### 方案A：单表+索引优化
- **优点**：实现简单，无需分表逻辑
- **缺点**：数据量增长后性能下降明显，索引维护成本高
- **拒绝原因**：无法满足长期性能需求

### 方案B：分库分表（ShardingSphere）
- **优点**：自动分片，支持多种分片策略
- **缺点**：引入中间件复杂度，跨分片查询性能差
- **拒绝原因**：医疗业务查询多为时间范围查询，按时间分表更合适

### 方案C：NoSQL存储（MongoDB/Elasticsearch）
- **优点**：天然支持海量数据
- **缺点**：事务支持弱，与关系型数据库迁移成本高
- **拒绝原因**：核心业务需要强事务一致性

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 应用开发 | 需要处理分表路由逻辑 | 封装分表中间件 |
| 数据迁移 | 需要定期迁移历史数据 | 开发自动化归档工具 |
| 跨年查询 | 需要合并多表结果 | 提供跨表查询工具 |
| 备份恢复 | 分表后备份策略调整 | 制定分表备份方案 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| 数据保留期限 | 符合 | 分表策略支持15-30年保留 |
| 等保三级 | 符合 | 审计日志分表支持3年保留 |

---

# ADR-003: 闭环给药架构设计

## 状态

已接受

## 背景

闭环给药是HIMSS EMRAM Stage 5的核心要求，也是保障患者用药安全的关键功能。根据PRD和状态机设计文档：

**业务要求**：
1. 给药前必须扫描患者腕带和药品条码（BR-IP-010）
2. 双重核对匹配后方可给药
3. 不匹配则停止给药并记录事件
4. 给药核对率必须达到100%
5. 自动生成eMAR记录

**现状痛点**：
- 传统人工核对方式易出错
- 给药差错难以完全避免
- 缺乏有效的追溯手段

## 决策

采用**状态机驱动的闭环给药架构**，实现腕带+药品条码双重核对：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                        闭环给药架构                                   │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ 医嘱开立  │───→│ 药师审核  │───→│ 药品配药  │───→│ 床旁给药  │     │
│  │ (CDS校验) │    │ (合理性)  │    │ (贴条码)  │    │ (双核对)  │     │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│                                                       │            │
│                                                       ▼            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    eMAR给药状态机 (SM-005)                   │  │
│  │                                                             │  │
│  │  待执行 ─→ 腕带扫描 ─→ 药品扫描 ─→ 双重核对通过 ─→ 已执行   │  │
│  │     │           │            │                             │  │
│  │     └───────────┴────────────┴──→ 核对失败 ─→ 重新核对     │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### eMAR状态机设计

基于状态机设计文档SM-005：

| 状态编码 | 状态名称 | 状态描述 | 允许操作 |
|----------|----------|----------|----------|
| 1 | 待执行 | 医嘱已审核，等待执行 | 开始核对、未执行 |
| 2 | 腕带扫描验证 | 正在扫描患者腕带 | 确认匹配、不匹配 |
| 3 | 药品扫描验证 | 正在扫描药品条码 | 确认匹配、不匹配 |
| 4 | 双重核对通过 | 腕带和药品双重核对通过 | 确认给药 |
| 5 | 已执行 | 给药完成 | 无 |
| 6 | 未执行 | 未执行给药（记录原因） | 补执行 |
| 7 | 核对失败 | 核对不匹配，停止给药 | 重新核对 |

### 核对流程

```java
/**
 * 闭环给药核对服务
 */
@Service
public class ClosedLoopMedicationService {
    
    /**
     * 腕带扫描校验
     */
    public WristbandCheckResult checkWristband(Long adminId, String wristbandCode) {
        MedicationAdmin admin = adminRepository.findById(adminId);
        Patient patient = patientRepository.findById(admin.getPatientId());
        
        // 校验腕带码与患者匹配
        boolean matched = patient.getWristbandCode().equals(wristbandCode);
        
        if (matched) {
            // 状态流转：腕带扫描验证 → 药品扫描验证
            stateMachineService.transition(adminId, MedicationEvent.WRISTBAND_MATCHED, getCurrentUser());
            return WristbandCheckResult.success();
        } else {
            // 状态流转：腕带扫描验证 → 核对失败
            stateMachineService.transition(adminId, MedicationEvent.WRISTBAND_MISMATCHED, getCurrentUser());
            return WristbandCheckResult.fail("患者身份不匹配，请核实");
        }
    }
    
    /**
     * 药品条码扫描校验
     */
    public DrugCheckResult checkDrugBarcode(Long adminId, String drugBarcode) {
        MedicationAdmin admin = adminRepository.findById(adminId);
        
        // 获取药品信息
        DrugBatch batch = drugRepository.findByBarcode(drugBarcode);
        
        // 校验药品匹配
        boolean drugMatched = admin.getDrugId().equals(batch.getDrugId());
        // 校验药品是否过期
        boolean expired = batch.getExpireDate().isBefore(LocalDateTime.now());
        
        if (!drugMatched) {
            stateMachineService.transition(adminId, MedicationEvent.DRUG_MISMATCHED, getCurrentUser());
            return DrugCheckResult.fail("药品不匹配，请联系药师确认");
        }
        
        if (expired) {
            stateMachineService.transition(adminId, MedicationEvent.DRUG_EXPIRED, getCurrentUser());
            return DrugCheckResult.fail("药品已过期，禁止使用");
        }
        
        // 状态流转：药品扫描验证 → 双重核对通过
        stateMachineService.transition(adminId, MedicationEvent.DOUBLE_CHECK_PASSED, getCurrentUser());
        return DrugCheckResult.success(batch);
    }
    
    /**
     * 确认给药
     */
    @Transactional
    public AdministerResult confirmAdministration(Long adminId, AdministrationRequest request) {
        // 检查状态是否为"双重核对通过"
        MedicationAdmin admin = adminRepository.findById(adminId);
        if (admin.getAdminStatus() != MedicationAdminStatusEnum.DOUBLE_CHECK_PASSED.getCode()) {
            throw new BusinessException("未完成双重核对，不能执行给药");
        }
        
        // 状态流转：双重核对通过 → 已执行
        stateMachineService.transition(adminId, MedicationEvent.ADMINISTERED, getCurrentUser());
        
        // 生成eMAR记录
        emarRecordService.create(adminId, request);
        
        // 自动记账
        chargeService.charge(admin.getOrderId());
        
        return AdministerResult.success();
    }
}
```

### 硬件集成

| 硬件设备 | 集成方式 | 用途 |
|----------|----------|------|
| PDA扫码枪 | 移动应用+蓝牙 | 床旁扫码核对 |
| 移动护理车 | 移动应用+WiFi | 护理工作站 |
| 患者腕带 | 条码/RFID | 患者身份标识 |
| 药品标签 | 条码打印 | 药品信息标识 |

## 理由

1. **符合HIMSS标准**：状态机设计满足EMRAM Stage 5闭环给药要求
2. **强制双重核对**：必须先腕带后药品，顺序不可颠倒
3. **防呆设计**：任一核对不匹配即阻止给药
4. **完整追溯**：所有核对过程记录审计日志
5. **状态机驱动**：业务流程标准化，易于维护和扩展

## 替代方案

### 方案A：人工双重核对
- **优点**：无需硬件投入
- **缺点**：依赖人员责任心，核对率难以保证100%
- **拒绝原因**：无法满足HIMSS Stage 5要求

### 方案B：仅药品条码核对
- **优点**：实现简单
- **缺点**：无法确认患者身份，存在用药风险
- **拒绝原因**：不符合闭环给药要求

### 方案C：RFID自动识别
- **优点**：无需手动扫描
- **缺点**：成本高，标签易损坏
- **拒绝原因**：性价比低，条码方案更实用

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 硬件投入 | 需要PDA扫码枪、腕带打印机 | 纳入预算采购 |
| 护理流程 | 改变传统给药流程 | 培训和流程改造 |
| 系统性能 | 高频扫码操作 | 移动端离线缓存 |
| 数据量 | 给药记录数据量大 | 分表策略 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| HIMSS EMRAM Stage 5 | 完全符合 | 双重核对+eMAR记录 |
| 用药安全规范 | 符合 | 强制核对防止差错 |
| 等保三级 | 符合 | 核对记录审计追踪 |

---

# ADR-004: CDS临床决策支持实现

## 状态

已接受

## 背景

临床决策支持（Clinical Decision Support, CDS）是保障医疗安全的核心功能。根据PRD文档，CDS需要实现四维校验：

1. **药物相互作用检查**：药物-药物相互作用检查必须覆盖所有已知高风险组合
2. **过敏检查**：基于患者过敏史的药物过敏警告
3. **剂量合理性校验**：基于年龄/体重/肾功能的剂量合理性提示
4. **配伍禁忌检查**：静脉用药配伍禁忌检查

业务规则要求：
- 处方开立时必须进行CDS校验（BR-OP-006）
- 住院医嘱开立必须进行CDS校验（BR-IP-005）
- CDS规则库需要持续更新维护

## 决策

采用**规则引擎+知识库**的CDS架构设计：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CDS架构设计                                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        CDS服务层                              │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│  │
│  │  │ 药物相互   │ │  过敏检查   │ │  剂量校验   │ │ 配伍禁忌   ││  │
│  │  │ 作用引擎   │ │   引擎     │ │   引擎     │ │   引擎     ││  │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘│  │
│  │        └──────────────┴──────────────┴──────────────┘       │  │
│  │                              │                              │  │
│  └──────────────────────────────┼──────────────────────────────┘  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        知识库层                               │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│  │
│  │  │ 药物相互   │ │  过敏原库   │ │  剂量规则   │ │ 配伍禁忌   ││  │
│  │  │ 作用知识库 │ │            │ │   知识库   │ │   知识库   ││  │
│  │  │ ~5000条    │ │  动态数据   │ │  ~2000条   │ │  ~300条    ││  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        数据支撑层                             │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐               │  │
│  │  │ 患者信息   │ │  过敏史    │ │  检验结果   │               │  │
│  │  │ (年龄体重) │ │            │ │ (肾功能)   │               │  │
│  │  └────────────┘ └────────────┘ └────────────┘               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### CDS服务接口设计

```java
/**
 * CDS临床决策支持服务
 */
@Service
public class ClinicalDecisionSupportService {
    
    /**
     * 综合CDS校验
     */
    public CDSResult check(CDSRequest request) {
        CDSResult result = new CDSResult();
        
        // 1. 获取患者信息（年龄、体重、过敏史、肾功能等）
        PatientClinicalInfo patientInfo = getPatientClinicalInfo(request.getPatientId());
        
        // 2. 获取当前用药列表
        List<MedicationInfo> currentMedications = getCurrentMedications(request.getPatientId());
        
        // 3. 四维校验
        for (PrescriptionItem item : request.getPrescriptionItems()) {
            // 3.1 药物相互作用检查
            List<DrugInteraction> interactions = checkDrugInteractions(item, currentMedications);
            result.addWarnings(interactions);
            
            // 3.2 过敏检查
            List<AllergyAlert> allergies = checkAllergies(item, patientInfo.getAllergies());
            result.addWarnings(allergies);
            
            // 3.3 剂量合理性校验
            List<DosageAlert> dosages = checkDosage(item, patientInfo);
            result.addWarnings(dosages);
            
            // 3.4 配伍禁忌检查（针对静脉用药）
            if (item.isIntravenous()) {
                List<IncompatibilityAlert> incompatibilities = checkIncompatibility(item, request.getPrescriptionItems());
                result.addWarnings(incompatibilities);
            }
        }
        
        // 4. 按严重程度排序
        result.sortBySeverity();
        
        return result;
    }
    
    /**
     * 药物相互作用检查
     */
    private List<DrugInteraction> checkDrugInteractions(PrescriptionItem newItem, List<MedicationInfo> currentMedications) {
        List<DrugInteraction> interactions = new ArrayList<>();
        
        for (MedicationInfo current : currentMedications) {
            // 查询知识库
            DrugInteraction interaction = drugInteractionRepository
                .findByDrugIds(newItem.getDrugId(), current.getDrugId());
            
            if (interaction != null) {
                interactions.add(interaction);
            }
        }
        
        return interactions;
    }
    
    /**
     * 过敏检查
     */
    private List<AllergyAlert> checkAllergies(PrescriptionItem item, List<AllergyInfo> allergies) {
        List<AllergyAlert> alerts = new ArrayList<>();
        
        for (AllergyInfo allergy : allergies) {
            // 检查药物是否含有过敏成分
            if (drugAllergyChecker.containsAllergen(item.getDrugId(), allergy.getAllergenId())) {
                alerts.add(new AllergyAlert(item, allergy));
            }
        }
        
        return alerts;
    }
    
    /**
     * 剂量合理性校验
     */
    private List<DosageAlert> checkDosage(PrescriptionItem item, PatientClinicalInfo patientInfo) {
        List<DosageAlert> alerts = new ArrayList<>();
        
        // 获取药物剂量规则
        DosageRule rule = dosageRuleRepository.findByDrugId(item.getDrugId());
        
        if (rule != null) {
            // 计算标准剂量范围
            DosageRange range = rule.calculateRange(patientInfo);
            
            // 校验单次剂量
            if (item.getSingleDose() < range.getMinDose()) {
                alerts.add(new DosageAlert("剂量偏低", Severity.WARNING));
            } else if (item.getSingleDose() > range.getMaxDose()) {
                alerts.add(new DosageAlert("剂量偏高", Severity.SEVERE));
            }
            
            // 日剂量校验
            BigDecimal dailyDose = item.getSingleDose().multiply(new BigDecimal(item.getFrequencyPerDay()));
            if (dailyDose.compareTo(range.getMaxDailyDose()) > 0) {
                alerts.add(new DosageAlert("日剂量超标", Severity.SEVERE));
            }
        }
        
        return alerts;
    }
}
```

### 知识库管理

| 知识库类型 | 数据来源 | 更新频率 | 记录数量 |
|------------|----------|----------|----------|
| 药物相互作用 | 临床药学知识库 | 季度更新 | ~5000条 |
| 过敏原库 | 药品成分库 | 月度更新 | 动态 |
| 剂量规则 | 药品说明书 | 月度更新 | ~2000条 |
| 配伍禁忌 | 药学指南 | 季度更新 | ~300条 |

### 告警分级

| 严重程度 | 颜色标识 | 处理方式 |
|----------|----------|----------|
| SEVERE | 红色 | 强制确认，需要审批 |
| WARNING | 黄色 | 弹窗提示，需要确认 |
| INFO | 蓝色 | 底部提示，可选择忽略 |

## 理由

1. **标准化流程**：规则引擎确保校验逻辑一致
2. **可维护性**：知识库独立管理，便于更新
3. **高性能**：知识库预加载到内存，校验响应快
4. **可扩展**：支持新增校验规则类型
5. **合规性**：满足药物相互作用全覆盖检查要求

## 替代方案

### 方案A：第三方CDS服务
- **优点**：知识库专业、更新及时
- **缺点**：依赖外部服务，响应延迟，成本高
- **拒绝原因**：核心功能需要自主可控

### 方案B：简单规则校验
- **优点**：实现简单
- **缺点**：覆盖面有限，难以扩展
- **拒绝原因**：无法满足复杂药物相互作用检查

### 方案C：AI辅助CDS
- **优点**：智能化程度高
- **缺点**：准确率无法保证，医疗责任界定难
- **拒绝原因**：作为辅助功能（M13），不作为核心CDS

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 知识库维护 | 需要药学专业人员维护 | 药剂科负责知识库更新 |
| 系统性能 | 大量规则校验 | 内存缓存+索引优化 |
| 用户体验 | 告警过多影响效率 | 分级显示+智能过滤 |
| 医疗责任 | CDS告警与责任界定 | 告警确认留痕 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| 药物相互作用检查 | 符合 | 覆盖所有已知高风险组合 |
| 过敏检查 | 符合 | 基于患者过敏史 |
| 剂量校验 | 符合 | 基于年龄/体重/肾功能 |

---

# ADR-005: HL7 FHIR R4集成策略

## 状态

已接受

## 背景

YUDAO-AI-HIS需要与多个外部系统对接，根据PRD文档：

| 接口编号 | 接口名称 | 对接系统 | 协议/标准 |
|----------|----------|----------|-----------|
| IF-001 | 医保接口 | 国家医保信息平台 | 国家医保局接口规范 |
| IF-002 | LIS接口 | 检验信息系统 | HL7 FHIR / ASTM |
| IF-003 | PACS接口 | 影像系统 | DICOM / HL7 |
| IF-004 | 集成平台 | 院内集成平台 | HL7 FHIR R4 |
| IF-005 | 区域平台 | 区域卫生信息平台 | HL7 CDA / FHIR |

要求：
- 对外接口遵循HL7 FHIR R4标准
- 支持12种FHIR资源映射
- 实现院内/院间互联互通

## 决策

采用**FHIR R4作为标准接口协议**，实现内部数据模型与FHIR资源的双向转换：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FHIR集成架构                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    外部系统层                                 │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │ 区域平台 │ │ 医保平台 │ │  LIS    │ │  PACS   │            │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │  │
│  └───────┼───────────┼───────────┼───────────┼──────────────────┘  │
│          │           │           │           │                     │
│          ▼           ▼           ▼           ▼                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    FHIR网关层                                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ FHIR Server │ │ 认证授权    │ │ 限流熔断    │            │  │
│  │  │ (HAPI FHIR) │ │ (OAuth2.0)  │ │             │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    资源转换层                                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ Patient转换 │ │ Encounter转 │ │ Medication  │            │  │
│  │  │             │ │   换        │ │ Request转换 │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    内部业务层                                 │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │his_patient│ │his_visit │ │his_order │ │his_presc│            │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### FHIR资源映射

| FHIR资源 | 用途 | 内部数据表 | 转换规则 |
|----------|------|------------|----------|
| Patient | 患者主索引 | his_patient | 患者基本信息映射 |
| Encounter | 就诊记录 | his_visit/his_admission | 门诊/住院就诊映射 |
| Practitioner | 医护人员 | sys_user | 用户信息映射 |
| Organization | 机构信息 | sys_org/sys_dept | 科室信息映射 |
| Condition | 诊断信息 | his_diagnosis | ICD-10诊断映射 |
| Observation | 观察记录 | his_lab_result | 检验结果映射 |
| MedicationRequest | 处方/医嘱 | his_prescription/his_order | 药品医嘱映射 |
| DiagnosticReport | 诊断报告 | his_lab_report/his_imaging_report | 报告映射 |
| Procedure | 操作/手术 | his_surgery | 手术记录映射 |
| AllergyIntolerance | 过敏信息 | his_allergy | 过敏史映射 |
| Immunization | 免疫接种 | his_vaccination | 疫苗记录映射 |
| DocumentReference | 文档引用 | his_emr_document | 病历文书映射 |

### 资源转换器设计

```java
/**
 * FHIR资源转换器接口
 * @param <T> FHIR资源类型
 * @param <E> 内部实体类型
 */
public interface FHIRResourceConverter<T extends IBaseResource, E> {
    
    /**
     * 内部实体转FHIR资源
     */
    T toFHIR(E entity);
    
    /**
     * FHIR资源转内部实体
     */
    E fromFHIR(T resource);
}

/**
 * Patient资源转换器
 */
@Component
public class PatientResourceConverter implements FHIRResourceConverter<Patient, HisPatient> {
    
    @Override
    public Patient toFHIR(HisPatient entity) {
        Patient patient = new Patient();
        
        // 设置患者ID
        patient.setId(new IdType("Patient", entity.getId()));
        
        // 设置姓名
        HumanName name = new HumanName();
        name.setText(entity.getPatientName());
        patient.setName(Arrays.asList(name));
        
        // 设置性别
        patient.setGender(Enumerations.AdministrativeGender.fromCode(entity.getGender()));
        
        // 设置出生日期
        patient.setBirthDate(entity.getBirthday());
        
        // 设置身份证号
        Identifier idCard = new Identifier();
        idCard.setSystem("urn:oid:2.16.840.1.113883.2.4.3.11");
        idCard.setValue(entity.getIdCard());
        patient.setIdentifier(Arrays.asList(idCard));
        
        // 设置联系电话
        ContactPoint phone = new ContactPoint();
        phone.setSystem(ContactPoint.ContactPointSystem.PHONE);
        phone.setValue(entity.getPhone());
        patient.setTelecom(Arrays.asList(phone));
        
        return patient;
    }
    
    @Override
    public HisPatient fromFHIR(Patient resource) {
        HisPatient entity = new HisPatient();
        
        // 反向映射
        entity.setId(resource.getIdElement().getIdPart());
        entity.setPatientName(resource.getNameFirstRep().getText());
        entity.setGender(resource.getGender().toCode());
        entity.setBirthday(resource.getBirthDate());
        
        // ... 其他字段映射
        
        return entity;
    }
}
```

### FHIR Server配置

```yaml
# application-fhir.yml
fhir:
  server:
    base-url: https://his.hospital.com/fhir
    implementation-description: YUDAO-AI-HIS FHIR Server
    fhir-version: R4
  
  security:
    enabled: true
    oauth2:
      authorization-url: https://his.hospital.com/oauth/authorize
      token-url: https://his.hospital.com/oauth/token
  
  validation:
    enabled: true
    request-validation: true
    response-validation: true
```

### 接口示例

```
GET /fhir/Patient/12345
Authorization: Bearer <token>

Response:
{
  "resourceType": "Patient",
  "id": "12345",
  "name": [{
    "text": "张三"
  }],
  "gender": "male",
  "birthDate": "1980-01-15",
  "identifier": [{
    "system": "urn:oid:2.16.840.1.113883.2.4.3.11",
    "value": "110101198001150011"
  }]
}

GET /fhir/MedicationRequest?patient=12345&status=active
Authorization: Bearer <token>

Response:
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 2,
  "entry": [
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "RX123",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [{
            "system": "http://drug.hospital.com",
            "code": "DRUG001",
            "display": "阿莫西林胶囊"
          }]
        },
        "subject": {
          "reference": "Patient/12345"
        }
      }
    }
  ]
}
```

## 理由

1. **国际标准**：HL7 FHIR R4是国际医疗数据交换标准
2. **互操作性**：支持与外部系统的标准化对接
3. **灵活性**：RESTful API设计，易于扩展
4. **成熟工具**：HAPI FHIR等开源框架支持
5. **合规要求**：满足互联互通标准化成熟度测评

## 替代方案

### 方案A：HL7 V2.x
- **优点**：医疗行业广泛使用
- **缺点**：消息结构复杂，扩展性差
- **拒绝原因**：技术老旧，不符合现代架构趋势

### 方案B：Web Service (SOAP)
- **优点**：标准化程度高
- **缺点**：协议重，开发复杂
- **拒绝原因**：已被RESTful API取代

### 方案C：自定义REST API
- **优点**：灵活自由
- **缺点**：无标准约束，互操作性差
- **拒绝原因**：不符合互联互通要求

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 学习成本 | 团队需要学习FHIR规范 | 培训和文档 |
| 开发工作量 | 需要实现资源转换器 | 使用HAPI FHIR框架 |
| 性能开销 | 数据转换消耗资源 | 缓存和批量处理 |
| 版本兼容 | FHIR版本更新 | 保持R4版本稳定 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| HL7 FHIR R4 | 完全符合 | 12种资源映射 |
| 互联互通标准化 | 符合 | 支持数据交换 |
| 区域卫生平台 | 符合 | 支持CDA/FHIR |

---

# ADR-006: 危急值15分钟通报机制

## 状态

已接受

## 背景

危急值管理是医疗安全的重要环节。根据PRD和业务规则文档：

**业务要求**：
- 危急值必须15分钟内通知临床科室并确认接收（BR-LIS-002）
- 超时未确认自动升级通知科室主任
- 记录检出、通知、确认、处理全流程时间

**现状痛点**：
- 传统电话通知方式效率低
- 通知时间难以追踪
- 超时处理依赖人工判断

## 决策

采用**实时通知+超时升级**的危急值管理机制：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                    危急值管理架构                                    │
│                                                                     │
│  ┌──────────┐                                                       │
│  │ 检验结果  │                                                       │
│  │ 检出危急值│                                                       │
│  └────┬─────┘                                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 危急值处理状态机 (SM-007)                     │  │
│  │                                                              │  │
│  │  检出 ─→ 已通知 ─→ 已确认 ─→ 已处理                         │  │
│  │            │                                                 │  │
│  │            ▼ (15分钟超时)                                    │  │
│  │        超时升级 ─→ 已处理                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    通知服务层                                 │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │ 系统消息 │ │ 短信通知 │ │ 语音通知 │ │ 微信推送 │            │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    定时任务层                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │ 危急值超时检查任务（每1分钟执行）                         ││  │
│  │  │ - 查询已通知状态超过15分钟的记录                         ││  │
│  │  │ - 自动升级通知科室主任                                   ││  │
│  │  │ - 记录超时事件                                           ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心实现

```java
/**
 * 危急值管理服务
 */
@Service
public class CriticalValueService {
    
    @Autowired
    private CriticalValueRepository criticalValueRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private StateMachineService stateMachineService;
    
    /**
     * 检出危急值
     */
    @Transactional
    public CriticalValue detect(CriticalValueDetection detection) {
        // 创建危急值记录
        CriticalValue cv = new CriticalValue();
        cv.setPatientId(detection.getPatientId());
        cv.setLabResultId(detection.getLabResultId());
        cv.setItemName(detection.getItemName());
        cv.setItemValue(detection.getItemValue());
        cv.setCriticalLow(detection.getCriticalLow());
        cv.setCriticalHigh(detection.getCriticalHigh());
        cv.setDeptId(detection.getDeptId());
        cv.setWardId(detection.getWardId());
        cv.setDetectTime(LocalDateTime.now());
        cv.setCriticalStatus(CriticalValueStatusEnum.DETECTED.getCode());
        
        criticalValueRepository.save(cv);
        
        // 记录状态变更
        stateMachineService.transition(cv.getId(), CriticalValueEvent.DETECTED, getCurrentUser());
        
        return cv;
    }
    
    /**
     * 确认并通知临床
     */
    @Transactional
    public void confirmAndNotify(Long cvId, String operator) {
        CriticalValue cv = criticalValueRepository.findById(cvId);
        
        // 状态流转：检出 → 已通知
        stateMachineService.transition(cvId, CriticalValueEvent.CONFIRMED, operator);
        
        // 记录通知时间（15分钟计时开始）
        cv.setNotifyTime(LocalDateTime.now());
        cv.setCriticalStatus(CriticalValueStatusEnum.NOTIFIED.getCode());
        criticalValueRepository.save(cv);
        
        // 发送多渠道通知
        notificationService.sendCriticalValueNotification(cv);
    }
    
    /**
     * 临床确认接收
     */
    @Transactional
    public void acknowledge(Long cvId, String operator) {
        // 状态流转：已通知 → 已确认
        stateMachineService.transition(cvId, CriticalValueEvent.ACKNOWLEDGED, operator);
        
        CriticalValue cv = criticalValueRepository.findById(cvId);
        cv.setAcknowledgeTime(LocalDateTime.now());
        cv.setAcknowledgeBy(operator);
        cv.setCriticalStatus(CriticalValueStatusEnum.CONFIRMED.getCode());
        criticalValueRepository.save(cv);
    }
    
    /**
     * 处理完成
     */
    @Transactional
    public void process(Long cvId, String processResult, String operator) {
        // 状态流转：已确认 → 已处理
        stateMachineService.transition(cvId, CriticalValueEvent.PROCESSED, operator);
        
        CriticalValue cv = criticalValueRepository.findById(cvId);
        cv.setProcessTime(LocalDateTime.now());
        cv.setProcessResult(processResult);
        cv.setProcessBy(operator);
        cv.setCriticalStatus(CriticalValueStatusEnum.PROCESSED.getCode());
        criticalValueRepository.save(cv);
    }
}

/**
 * 危急值超时检查任务
 */
@Component
public class CriticalValueTimeoutTask {
    
    @Autowired
    private CriticalValueRepository criticalValueRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private StateMachineService stateMachineService;
    
    /**
     * 每分钟检查一次危急值超时
     */
    @Scheduled(cron = "0 * * * * ?")
    public void checkTimeout() {
        // 查询已通知状态超过15分钟的记录
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(15);
        List<CriticalValue> timeoutList = criticalValueRepository
            .findByCriticalStatusAndNotifyTimeBefore(
                CriticalValueStatusEnum.NOTIFIED.getCode(),
                timeoutThreshold
            );
        
        for (CriticalValue cv : timeoutList) {
            // 状态流转：已通知 → 超时升级
            stateMachineService.transition(cv.getId(), CriticalValueEvent.TIMEOUT, "SYSTEM");
            
            cv.setCriticalStatus(CriticalValueStatusEnum.TIMEOUT_ESCALATED.getCode());
            cv.setTimeoutTime(LocalDateTime.now());
            criticalValueRepository.save(cv);
            
            // 升级通知科室主任
            notificationService.escalateToDirector(cv);
            
            // 记录超时事件
            auditLogService.logCriticalValueTimeout(cv);
        }
    }
}

/**
 * 通知服务
 */
@Service
public class NotificationService {
    
    /**
     * 发送危急值通知（多渠道）
     */
    public void sendCriticalValueNotification(CriticalValue cv) {
        // 构建通知内容
        String content = buildNotificationContent(cv);
        
        // 1. 系统消息（必发）
        sendSystemMessage(cv.getWardId(), content);
        
        // 2. 短信通知
        sendSMS(cv.getDoctorPhone(), content);
        
        // 3. 微信推送
        sendWeChatPush(cv.getDoctorOpenId(), content);
        
        // 4. 语音通知（重要）
        sendVoiceCall(cv.getDoctorPhone(), content);
    }
    
    /**
     * 升级通知科室主任
     */
    public void escalateToDirector(CriticalValue cv) {
        String content = "【危急值超时提醒】患者" + cv.getPatientName() + 
                         "危急值" + cv.getItemName() + "已超时15分钟未确认，请立即处理。";
        
        // 获取科室主任联系方式
        User director = userService.getDepartmentDirector(cv.getDeptId());
        
        // 发送升级通知
        sendSystemMessage(director.getUserId(), content);
        sendSMS(director.getPhone(), content);
        sendVoiceCall(director.getPhone(), content);
    }
}
```

### 数据表设计

```sql
-- 危急值记录表
CREATE TABLE his_critical_value (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    patient_id        BIGINT        NOT NULL COMMENT '患者ID',
    lab_result_id     BIGINT        COMMENT '检验结果ID',
    item_name         VARCHAR(100)  NOT NULL COMMENT '检验项目名称',
    item_value        VARCHAR(50)   NOT NULL COMMENT '检验值',
    critical_low      VARCHAR(50)   COMMENT '危急值低限',
    critical_high     VARCHAR(50)   COMMENT '危急值高限',
    dept_id           BIGINT        NOT NULL COMMENT '临床科室ID',
    ward_id           BIGINT        COMMENT '病区ID',
    critical_status   TINYINT       NOT NULL DEFAULT 1 COMMENT '状态：1检出 2已通知 3已确认 4已处理 5超时升级',
    detect_time       DATETIME      NOT NULL COMMENT '检出时间',
    detect_by         VARCHAR(50)   NOT NULL COMMENT '检出人',
    notify_time       DATETIME      COMMENT '通知时间',
    acknowledge_time  DATETIME      COMMENT '确认接收时间',
    acknowledge_by    VARCHAR(50)   COMMENT '确认人',
    process_time      DATETIME      COMMENT '处理时间',
    process_result    VARCHAR(500)  COMMENT '处理结果',
    process_by        VARCHAR(50)   COMMENT '处理人',
    timeout_time      DATETIME      COMMENT '超时时间',
    PRIMARY KEY (id),
    INDEX idx_status (critical_status),
    INDEX idx_notify_time (notify_time),
    INDEX idx_patient (patient_id)
) COMMENT '危急值记录表';
```

## 理由

1. **多渠道通知**：确保信息及时送达
2. **自动超时升级**：避免人工监督遗漏
3. **状态机驱动**：流程标准化，易于追踪
4. **完整记录**：满足审计和质控要求
5. **实时监控**：定时任务确保及时处理

## 替代方案

### 方案A：电话通知
- **优点**：传统方式，医护习惯
- **缺点**：效率低，无法追踪
- **拒绝原因**：无法满足15分钟通报要求

### 方案B：仅系统消息
- **优点**：实现简单
- **缺点**：医护人员可能未及时查看
- **拒绝原因**：通知可靠性不足

### 方案C：短信+系统消息
- **优点**：覆盖较全
- **缺点**：缺少语音提醒
- **接受程度**：作为辅助渠道，需增加语音通知

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 运营商费用 | 短信/语音通知费用 | 预算采购 |
| 噪音干扰 | 语音通知可能打扰 | 设置免打扰时段 |
| 系统压力 | 定时任务负载 | 优化查询索引 |
| 隐私保护 | 短信内容脱敏 | 发送前脱敏处理 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| BR-LIS-002 | 完全符合 | 15分钟通报机制 |
| 危急值管理规范 | 符合 | 完整流程记录 |

---

# ADR-007: 医保实时结算集成

## 状态

已接受

## 背景

医保实时结算是医院财务管理的核心功能。根据PRD和业务规则文档：

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
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    外部接口层                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │              国家医保信息平台                             ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 适配器设计

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
    
    @Override
    @Retryable(value = {InsuranceException.class}, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public InsuranceSubmitResult submit(InsuranceSettlementRequest request) {
        // 构建医保结算请求
        InsuranceSubmitRequest submitRequest = buildSubmitRequest(request);
        
        // 调用医保结算接口
        String url = endpoint + "/api/settlement/submit";
        InsuranceSubmitResponse response = restTemplate.postForObject(url, submitRequest, InsuranceSubmitResponse.class);
        
        // 解析响应
        if (response == null || !"0000".equals(response.getCode())) {
            // 记录失败日志
            logInsuranceError(request, response);
            throw new InsuranceException("医保结算失败: " + (response != null ? response.getMessage() : "无响应"));
        }
        
        return convertToSubmitResult(response);
    }
}

/**
 * 医保服务
 */
@Service
public class MedicalInsuranceService {
    
    @Autowired
    private List<MedicalInsuranceAdapter> adapters;
    
    @Autowired
    private InsuranceSettlementRepository settlementRepository;
    
    /**
     * 获取适配器
     */
    private MedicalInsuranceAdapter getAdapter(String insuranceType) {
        // 根据医保类型选择适配器
        return adapters.stream()
            .filter(a -> a.supports(insuranceType))
            .findFirst()
            .orElseThrow(() -> new BusinessException("不支持的医保类型: " + insuranceType));
    }
    
    /**
     * 医保结算
     */
    @Transactional
    public SettlementResult settle(SettlementRequest request) {
        // 1. 验证医保身份
        MedicalInsuranceAdapter adapter = getAdapter(request.getInsuranceType());
        InsuranceIdentityResult identity = adapter.verifyIdentity(request.getIdCard(), request.getInsuranceType());
        
        if (!identity.isValid()) {
            throw new BusinessException("医保身份验证失败: " + identity.getMessage());
        }
        
        // 2. 计算医保结算金额
        InsuranceSettlementRequest settlementRequest = buildSettlementRequest(request, identity);
        InsuranceSettlementResult calculation = adapter.calculate(settlementRequest);
        
        // 3. 提交医保结算
        InsuranceSubmitResult submitResult = adapter.submit(settlementRequest);
        
        // 4. 保存结算记录
        InsuranceSettlement settlement = saveSettlement(request, identity, calculation, submitResult);
        
        // 5. 更新费用状态
        updateChargeStatus(request.getChargeIds(), submitResult);
        
        return convertToResult(settlement);
    }
    
    /**
     * 结算失败处理
     */
    public void handleSettlementFailure(Long settlementId, String reason) {
        InsuranceSettlement settlement = settlementRepository.findById(settlementId);
        settlement.setStatus("FAILED");
        settlement.setFailReason(reason);
        settlementRepository.save(settlement);
        
        // 通知收费员重新处理
        notificationService.notifySettlementFailure(settlement);
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

## 理由

1. **适配器模式**：支持多种医保类型对接
2. **重试机制**：网络异常自动重试，提高成功率
3. **熔断降级**：医保系统故障时降级处理，不影响用户
4. **完整日志**：结算过程全程记录，便于问题排查
5. **失败处理**：明确的失败处理流程

## 替代方案

### 方案A：直接对接医保接口
- **优点**：实现简单
- **缺点**：耦合度高，无法适配多省份
- **拒绝原因**：扩展性差

### 方案B：第三方医保中间件
- **优点**：封装完善
- **缺点**：额外成本，依赖第三方
- **拒绝原因**：核心功能需要自主可控

### 方案C：人工医保结算
- **优点**：无需系统对接
- **缺点**：效率低，易出错
- **拒绝原因**：不符合实时结算要求

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 对接成本 | 需要与医保平台联调 | 预留联调时间 |
| 系统依赖 | 依赖医保平台稳定性 | 熔断降级机制 |
| 数据对照 | 医保目录需对照维护 | 专职人员维护 |
| 费用结算 | 结算失败影响用户 | 明确处理流程 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| BR-FIN-001 | 完全符合 | 实时对接医保平台 |
| 国家医保接口规范 | 符合 | 标准接口对接 |

---

# ADR-008: 电子病历签名与归档

## 状态

已接受

## 背景

电子病历签名与归档是医疗法律效力和病历管理的关键功能。根据PRD和业务规则文档：

**业务要求**：
- 电子签名必须符合《电子签名法》，支持CA数字签名（BR-EMR-002）
- 病历归档后不可修改（BR-EMR-001）
- 医疗纠纷时病历封存需双方确认（BR-EMR-003）
- 病历保存期限：门诊≥15年，住院≥30年

**现状痛点**：
- 传统纸质签名效率低
- 电子签名法律效力存疑
- 归档后篡改风险

## 决策

采用**CA数字签名+归档锁定**的电子病历管理架构：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                  电子病历签名与归档架构                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    病历状态机 (SM-008)                        │  │
│  │                                                              │  │
│  │  草稿 ─→ 已签名 ─→ 已审核 ─→ 已归档 ─→ 已封存              │  │
│  │                     │                                        │  │
│  │                     ▼                                        │  │
│  │              [CA数字签名]                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    CA签名服务层                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ 签名申请    │ │ 签名验证    │ │ 时间戳服务  │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    CA认证机构                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │              第三方CA中心                                 ││  │
│  │  │  - 数字证书签发                                          ││  │
│  │  │  - 签名验证                                              ││  │
│  │  │  - 时间戳服务                                            ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    归档存储层                                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ 在线存储    │ │ 归档库      │ │ 备份存储    │            │  │
│  │  │ (MySQL)     │ │ (归档库)    │ │ (对象存储)  │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### CA签名服务

```java
/**
 * CA数字签名服务
 */
@Service
public class CASignatureService {
    
    @Value("${ca.server.url}")
    private String caServerUrl;
    
    @Autowired
    private RestTemplate restTemplate;
    
    /**
     * 申请数字签名
     */
    public CASignatureResult sign(SignatureRequest request) {
        // 1. 获取用户证书
        UserCertificate cert = getUserCertificate(request.getUserId());
        
        // 2. 计算文档摘要
        String documentDigest = calculateDigest(request.getDocumentContent());
        
        // 3. 调用CA签名接口
        CASignRequest signRequest = new CASignRequest();
        signRequest.setCertificateId(cert.getCertificateId());
        signRequest.setDocumentDigest(documentDigest);
        signRequest.setUserId(request.getUserId());
        signRequest.setDocumentId(request.getDocumentId());
        
        CASignResponse response = restTemplate.postForObject(
            caServerUrl + "/api/sign", signRequest, CASignResponse.class);
        
        if (response == null || !"0000".equals(response.getCode())) {
            throw new CASignatureException("签名失败: " + (response != null ? response.getMessage() : "无响应"));
        }
        
        // 4. 获取时间戳
        TimestampResult timestamp = getTimestamp(documentDigest);
        
        // 5. 保存签名记录
        saveSignatureRecord(request, response, timestamp);
        
        return convertToResult(response, timestamp);
    }
    
    /**
     * 验证签名
     */
    public VerifyResult verify(String documentId, String signature) {
        // 1. 获取签名记录
        SignatureRecord record = signatureRecordRepository.findByDocumentId(documentId);
        
        // 2. 调用CA验证接口
        CAVerifyRequest verifyRequest = new CAVerifyRequest();
        verifyRequest.setSignature(signature);
        verifyRequest.setCertificateId(record.getCertificateId());
        verifyRequest.setDocumentDigest(record.getDocumentDigest());
        
        CAVerifyResponse response = restTemplate.postForObject(
            caServerUrl + "/api/verify", verifyRequest, CAVerifyResponse.class);
        
        // 3. 返回验证结果
        return VerifyResult.builder()
            .valid(response != null && response.isValid())
            .signerName(record.getSignerName())
            .signTime(record.getSignTime())
            .certificateStatus(response != null ? response.getCertificateStatus() : "UNKNOWN")
            .build();
    }
    
    /**
     * 获取时间戳
     */
    private TimestampResult getTimestamp(String documentDigest) {
        TimestampRequest request = new TimestampRequest();
        request.setDocumentDigest(documentDigest);
        
        TimestampResponse response = restTemplate.postForObject(
            caServerUrl + "/api/timestamp", request, TimestampResponse.class);
        
        return convertToTimestampResult(response);
    }
    
    /**
     * 计算文档摘要
     */
    private String calculateDigest(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("计算摘要失败", e);
        }
    }
}

/**
 * 病历归档服务
 */
@Service
public class MedicalRecordArchiveService {
    
    @Autowired
    private MedicalRecordRepository recordRepository;
    
    @Autowired
    private ArchiveRepository archiveRepository;
    
    /**
     * 归档病历
     */
    @Transactional
    public ArchiveResult archive(Long documentId, String operator) {
        // 1. 检查病历状态（必须已审核）
        MedicalRecord record = recordRepository.findById(documentId);
        if (record.getRecordStatus() != MedicalRecordStatusEnum.AUDITED.getCode()) {
            throw new BusinessException("病历未完成审核，不能归档");
        }
        
        // 2. 生成归档版本（PDF格式）
        String archiveContent = generateArchiveContent(record);
        
        // 3. 计算归档摘要
        String archiveDigest = calculateDigest(archiveContent);
        
        // 4. 保存到归档库
        ArchiveRecord archive = new ArchiveRecord();
        archive.setDocumentId(documentId);
        archive.setArchiveContent(archiveContent);
        archive.setArchiveDigest(archiveDigest);
        archive.setArchiveTime(LocalDateTime.now());
        archive.setArchiveBy(operator);
        archiveRepository.save(archive);
        
        // 5. 更新病历状态
        record.setRecordStatus(MedicalRecordStatusEnum.ARCHIVED.getCode());
        record.setArchiveId(archive.getId());
        recordRepository.save(record);
        
        // 6. 锁定病历（禁止修改）
        lockMedicalRecord(documentId);
        
        return ArchiveResult.success(archive.getId());
    }
    
    /**
     * 锁定病历
     */
    private void lockMedicalRecord(Long documentId) {
        // 设置归档标记，禁止任何修改操作
        recordRepository.updateArchiveLock(documentId, true);
    }
    
    /**
     * 病历封存（医疗纠纷场景）
     */
    @Transactional
    public SealResult seal(Long documentId, SealRequest request) {
        // 1. 检查病历状态
        MedicalRecord record = recordRepository.findById(documentId);
        if (record.getRecordStatus() != MedicalRecordStatusEnum.ARCHIVED.getCode()) {
            throw new BusinessException("病历未归档，不能封存");
        }
        
        // 2. 生成封存副本
        SealRecord seal = new SealRecord();
        seal.setDocumentId(documentId);
        seal.setSealReason(request.getSealReason());
        seal.setSealTime(LocalDateTime.now());
        seal.setHospitalRepresentative(request.getHospitalRepresentative());
        seal.setPatientRepresentative(request.getPatientRepresentative());
        sealRepository.save(seal);
        
        // 3. 双方电子签名
        CASignatureResult hospitalSign = casignatureService.sign(
            new SignatureRequest(documentId, request.getHospitalRepresentative()));
        CASignatureResult patientSign = casignatureService.sign(
            new SignatureRequest(documentId, request.getPatientRepresentative()));
        
        // 4. 更新病历状态
        record.setRecordStatus(MedicalRecordStatusEnum.SEALED.getCode());
        recordRepository.save(record);
        
        // 5. 记录封存日志
        auditLogService.logMedicalRecordSeal(documentId, request);
        
        return SealResult.success(seal.getId());
    }
}
```

### 数据表设计

```sql
-- 签名记录表
CREATE TABLE his_emr_sign (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    document_id       BIGINT        NOT NULL COMMENT '病历文档ID',
    user_id           BIGINT        NOT NULL COMMENT '签名用户ID',
    user_name         VARCHAR(50)   NOT NULL COMMENT '签名用户姓名',
    certificate_id    VARCHAR(100)  NOT NULL COMMENT '证书ID',
    signature_value   TEXT          NOT NULL COMMENT '签名值',
    document_digest   VARCHAR(200)  NOT NULL COMMENT '文档摘要',
    timestamp_value   VARCHAR(200)  COMMENT '时间戳',
    sign_time         DATETIME      NOT NULL COMMENT '签名时间',
    ip_address        VARCHAR(50)   COMMENT '签名IP',
    PRIMARY KEY (id),
    INDEX idx_document (document_id),
    INDEX idx_user (user_id)
) COMMENT '病历签名记录表';

-- 归档记录表
CREATE TABLE his_emr_archive (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    document_id       BIGINT        NOT NULL COMMENT '病历文档ID',
    archive_content   LONGTEXT      NOT NULL COMMENT '归档内容(PDF)',
    archive_digest    VARCHAR(200)  NOT NULL COMMENT '归档摘要',
    archive_time      DATETIME      NOT NULL COMMENT '归档时间',
    archive_by        VARCHAR(50)   NOT NULL COMMENT '归档人',
    PRIMARY KEY (id),
    UNIQUE INDEX idx_document (document_id)
) COMMENT '病历归档记录表';

-- 封存记录表
CREATE TABLE his_emr_seal (
    id                     BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    document_id            BIGINT        NOT NULL COMMENT '病历文档ID',
    seal_reason            VARCHAR(500)  NOT NULL COMMENT '封存原因',
    seal_time              DATETIME      NOT NULL COMMENT '封存时间',
    hospital_representative VARCHAR(50)  NOT NULL COMMENT '医院代表',
    patient_representative  VARCHAR(50)  NOT NULL COMMENT '患者代表',
    hospital_sign_id       BIGINT        COMMENT '医院签名记录ID',
    patient_sign_id        BIGINT        COMMENT '患者签名记录ID',
    PRIMARY KEY (id),
    INDEX idx_document (document_id)
) COMMENT '病历封存记录表';
```

## 理由

1. **法律效力**：CA数字签名符合《电子签名法》要求
2. **不可篡改**：归档锁定防止篡改
3. **时间戳服务**：第三方时间戳提供时间证明
4. **完整追溯**：签名记录全程留痕
5. **封存机制**：医疗纠纷场景下双方确认封存

## 替代方案

### 方案A：简单密码签名
- **优点**：实现简单
- **缺点**：法律效力不足
- **拒绝原因**：不符合《电子签名法》要求

### 方案B：自建CA签名
- **优点**：自主可控
- **缺点**：法律认可度低
- **拒绝原因**：需要第三方CA认证

### 方案C：纸质签名+扫描
- **优点**：传统方式认可
- **缺点**：效率低，存储成本高
- **拒绝原因**：不符合无纸化要求

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| CA费用 | 第三方CA服务费用 | 预算采购 |
| 签名效率 | CA签名响应时间 | 本地缓存证书 |
| 归档存储 | 归档PDF存储空间 | 对象存储 |
| 签名验证 | 需要验证签名有效性 | 签名验证接口 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| 《电子签名法》 | 完全符合 | CA数字签名 |
| BR-EMR-001~003 | 完全符合 | 归档锁定+封存 |
| 病历保存期限 | 符合 | 门诊≥15年，住院≥30年 |

---

# ADR-009: 数据权限控制方案

## 状态

已接受

## 背景

数据权限控制是医疗信息安全的核心。根据PRD和业务规则文档：

**业务要求**：
- 权限分为菜单权限、按钮权限、数据权限三级（BR-SYS-004）
- 病历查阅按角色分级控制（BR-EMR-004）
- 敏感数据操作必须记录操作前后值（BR-SYS-009）
- 满足等保三级安全要求

**权限场景**：
1. 医生只能查看本科室患者病历
2. 护士只能查看本病区患者信息
3. 管理者只能查看脱敏统计数据
4. 会诊医生需要临时授权

## 决策

采用**RBAC三级权限+数据范围控制**的权限管理方案：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                    数据权限控制架构                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    权限模型                                   │  │
│  │                                                              │  │
│  │    用户 ─→ 角色 ─→ 权限                                      │  │
│  │                      │                                       │  │
│  │                      ▼                                       │  │
│  │         ┌────────────────────────┐                          │  │
│  │         │    权限三级结构         │                          │  │
│  │         │  ┌──────────────────┐  │                          │  │
│  │         │  │ 1. 菜单权限       │  │ 页面可见性               │  │
│  │         │  │ 2. 按钮权限       │  │ 操作可用性               │  │
│  │         │  │ 3. 数据权限       │  │ 数据范围                 │  │
│  │         │  └──────────────────┘  │                          │  │
│  │         └────────────────────────┘                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    数据权限范围                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ 全部数据    │ │ 本科室数据  │ │ 本病区数据  │            │  │
│  │  │ ALL         │ │ DEPT        │ │ WARD        │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ 本人数据    │ │ 自定义数据  │ │ 仅授权数据  │            │  │
│  │  │ SELF        │ │ CUSTOM      │ │ AUTHORIZED  │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    权限拦截层                                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │ 菜单拦截    │ │ 按钮拦截    │ │ 数据拦截    │            │  │
│  │  │ (前端)      │ │ (前端+后端) │ │ (MyBatis)   │            │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 权限模型设计

```java
/**
 * 数据权限范围枚举
 */
public enum DataScopeEnum {
    
    ALL(1, "全部数据", "查看所有数据"),
    DEPT(2, "本科室数据", "仅查看本科室数据"),
    DEPT_AND_SUB(3, "本科室及下级", "查看本科室及下级科室数据"),
    WARD(4, "本病区数据", "仅查看本病区数据"),
    SELF(5, "本人数据", "仅查看本人创建/负责的数据"),
    CUSTOM(6, "自定义", "自定义数据范围"),
    AUTHORIZED(7, "仅授权数据", "仅查看被授权的数据");
    
    private final Integer code;
    private final String name;
    private final String description;
}

/**
 * 角色数据权限配置
 */
@Entity
@Table(name = "sys_role_data_scope")
public class RoleDataScope {
    
    @Id
    private Long id;
    
    /** 角色ID */
    private Long roleId;
    
    /** 数据权限范围 */
    private Integer dataScope;
    
    /** 自定义部门ID列表（逗号分隔） */
    private String customDeptIds;
    
    /** 病区ID列表（逗号分隔） */
    private String wardIds;
}

/**
 * 临时授权记录
 */
@Entity
@Table(name = "sys_temp_authorization")
public class TempAuthorization {
    
    @Id
    private Long id;
    
    /** 授权用户ID */
    private Long authorizedUserId;
    
    /** 被授权用户ID */
    private Long targetUserId;
    
    /** 授权类型：VIEW-查看，EDIT-编辑 */
    private String authType;
    
    /** 授权范围：PATIENT-患者，DOCUMENT-文档 */
    private String authScope;
    
    /** 授权对象ID（患者ID/文档ID） */
    private Long objectId;
    
    /** 授权开始时间 */
    private LocalDateTime startTime;
    
    /** 授权结束时间 */
    private LocalDateTime endTime;
    
    /** 授权原因 */
    private String reason;
}
```

### MyBatis数据权限拦截器

```java
/**
 * 数据权限拦截器
 */
@Intercepts({
    @Signature(type = StatementHandler.class, method = "prepare", args = {Connection.class, Integer.class})
})
@Component
public class DataScopeInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
        MetaObject metaObject = SystemMetaObject.forObject(statementHandler);
        
        // 获取原始SQL
        String originalSql = (String) metaObject.getValue("delegate.boundSql.sql");
        
        // 获取当前用户
        UserContext userContext = SecurityUtil.getCurrentUser();
        if (userContext == null) {
            return invocation.proceed();
        }
        
        // 获取数据权限范围
        DataScopeEnum dataScope = userContext.getDataScope();
        
        // 判断是否需要数据权限过滤
        if (needDataScopeFilter(originalSql, userContext)) {
            // 构建权限过滤SQL
            String filteredSql = buildDataScopeSql(originalSql, userContext);
            metaObject.setValue("delegate.boundSql.sql", filteredSql);
        }
        
        return invocation.proceed();
    }
    
    /**
     * 构建数据权限过滤SQL
     */
    private String buildDataScopeSql(String originalSql, UserContext userContext) {
        DataScopeEnum dataScope = userContext.getDataScope();
        
        StringBuilder whereClause = new StringBuilder();
        
        switch (dataScope) {
            case ALL:
                // 全部数据，不过滤
                return originalSql;
                
            case DEPT:
                // 本科室数据
                whereClause.append(" AND dept_id = ").append(userContext.getDeptId());
                break;
                
            case DEPT_AND_SUB:
                // 本科室及下级
                whereClause.append(" AND dept_id IN (")
                    .append("SELECT dept_id FROM sys_dept WHERE dept_id = ")
                    .append(userContext.getDeptId())
                    .append(" OR parent_id = ")
                    .append(userContext.getDeptId())
                    .append(")");
                break;
                
            case WARD:
                // 本病区数据
                whereClause.append(" AND ward_id = ").append(userContext.getWardId());
                break;
                
            case SELF:
                // 本人数据
                whereClause.append(" AND create_by = '").append(userContext.getUserId()).append("'");
                break;
                
            case AUTHORIZED:
                // 仅授权数据
                whereClause.append(" AND id IN (")
                    .append("SELECT object_id FROM sys_temp_authorization ")
                    .append("WHERE target_user_id = ").append(userContext.getUserId())
                    .append(" AND NOW() BETWEEN start_time AND end_time")
                    .append(")");
                break;
                
            case CUSTOM:
                // 自定义部门范围
                whereClause.append(" AND dept_id IN (").append(userContext.getCustomDeptIds()).append(")");
                break;
        }
        
        // 注入WHERE条件
        return injectWhereClause(originalSql, whereClause.toString());
    }
    
    /**
     * 注入WHERE条件到SQL中
     */
    private String injectWhereClause(String sql, String whereClause) {
        // 处理SQL注入WHERE条件
        if (sql.toUpperCase().contains(" WHERE ")) {
            return sql.replaceFirst("(?i) WHERE ", " WHERE 1=1 " + whereClause + " AND ");
        } else {
            int orderByIndex = sql.toUpperCase().indexOf(" ORDER BY ");
            if (orderByIndex > 0) {
                return sql.substring(0, orderByIndex) + " WHERE 1=1" + whereClause + sql.substring(orderByIndex);
            } else {
                return sql + " WHERE 1=1" + whereClause;
            }
        }
    }
}
```

### 病历查阅权限控制

```java
/**
 * 病历查阅权限服务
 */
@Service
public class MedicalRecordPermissionService {
    
    /**
     * 检查病历查阅权限
     */
    public PermissionResult checkViewPermission(Long userId, Long documentId) {
        MedicalRecord document = medicalRecordRepository.findById(documentId);
        User user = userRepository.findById(userId);
        
        // 1. 检查是否为病历创建者
        if (document.getCreateBy().equals(userId)) {
            return PermissionResult.allow("创建者");
        }
        
        // 2. 检查是否为主治医师（本科室）
        if (user.getDeptId().equals(document.getDeptId()) && 
            user.getRoleCodes().contains("ATTENDING_DOCTOR")) {
            return PermissionResult.allow("主治医师");
        }
        
        // 3. 检查是否有临时授权
        TempAuthorization auth = tempAuthorizationRepository.findByTargetUserAndObject(
            userId, "DOCUMENT", documentId);
        if (auth != null && auth.isActive()) {
            return PermissionResult.allow("临时授权");
        }
        
        // 4. 检查是否为会诊医师
        if (isConsultationDoctor(userId, documentId)) {
            return PermissionResult.allow("会诊医师");
        }
        
        // 5. 管理者角色，查看脱敏数据
        if (user.getRoleCodes().contains("HOSPITAL_MGR")) {
            return PermissionResult.allowWithMask("管理者", true);
        }
        
        return PermissionResult.deny("无权限查看该病历");
    }
    
    /**
     * 申请临时查阅授权
     */
    @Transactional
    public void applyTempAuthorization(TempAuthRequest request) {
        // 创建临时授权记录
        TempAuthorization auth = new TempAuthorization();
        auth.setAuthorizedUserId(request.getApplicantId());
        auth.setTargetUserId(request.getTargetUserId());
        auth.setAuthType("VIEW");
        auth.setAuthScope("DOCUMENT");
        auth.setObjectId(request.getDocumentId());
        auth.setStartTime(LocalDateTime.now());
        auth.setEndTime(LocalDateTime.now().plusHours(request.getDurationHours()));
        auth.setReason(request.getReason());
        
        tempAuthorizationRepository.save(auth);
        
        // 记录审计日志
        auditLogService.logTempAuthorization(auth);
    }
}
```

### 数据脱敏服务

```java
/**
 * 数据脱敏服务
 */
@Service
public class DataMaskService {
    
    /**
     * 脱敏患者信息
     */
    public PatientInfo maskPatientInfo(PatientInfo patient, MaskLevel level) {
        switch (level) {
            case STATISTICAL:
                // 统计级脱敏：完全脱敏
                patient.setPatientName("**");
                patient.setIdCard("******************");
                patient.setPhone("*******");
                break;
                
            case LIMITED:
                // 限制级脱敏：部分脱敏
                patient.setPatientName(maskName(patient.getPatientName()));
                patient.setIdCard(maskIdCard(patient.getIdCard()));
                patient.setPhone(maskPhone(patient.getPhone()));
                break;
                
            case FULL:
                // 完整信息
                break;
        }
        
        return patient;
    }
    
    private String maskName(String name) {
        if (name == null || name.length() < 2) {
            return "*";
        }
        return name.charAt(0) + "*" + name.substring(name.length() - 1);
    }
    
    private String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 18) {
            return "******************";
        }
        return idCard.substring(0, 6) + "********" + idCard.substring(14);
    }
    
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 11) {
            return "*******";
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}
```

## 理由

1. **RBAC标准模型**：成熟稳定，易于理解和管理
2. **三级权限**：菜单、按钮、数据分离，灵活控制
3. **数据范围控制**：自动注入SQL，对业务透明
4. **临时授权**：支持会诊等临时访问场景
5. **数据脱敏**：管理者查看脱敏数据，保护隐私

## 替代方案

### 方案A：ACL访问控制列表
- **优点**：细粒度控制
- **缺点**：管理复杂，权限数据量大
- **拒绝原因**：医院角色相对固定，RBAC更合适

### 方案B：ABAC属性访问控制
- **优点**：灵活性强
- **缺点**：实现复杂，性能开销大
- **拒绝原因**：医疗场景权限相对明确，过度设计

### 方案C：硬编码权限
- **优点**：实现简单
- **缺点**：难以维护和扩展
- **拒绝原因**：不满足灵活配置需求

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| SQL性能 | 数据权限注入增加查询复杂度 | 优化索引 |
| 权限管理 | 角色配置工作量大 | 提供默认角色模板 |
| 临时授权 | 授权管理流程 | 制定授权管理制度 |
| 审计日志 | 权限检查日志量大 | 分表存储 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| BR-SYS-004 | 完全符合 | 三级权限控制 |
| BR-EMR-004 | 完全符合 | 病历分级查阅 |
| 等保三级 | 符合 | 数据权限隔离 |

---

# ADR-010: 影像存储三级架构

## 状态

已接受

## 背景

影像数据存储是PACS系统的核心。根据PRD和业务规则文档：

**业务要求**：
- 影像必须通过DICOM标准接口采集和存储（BR-RIS-001）
- 影像存储采用三级架构：在线→近线→离线（BR-RIS-002）
- 影像加载时间：常规≤3秒，大型≤10秒（BR-RIS-003）
- 影像数据保存≥15年

**数据特点**：
- 单次检查影像大小：CT/MRI约200-500MB，X光约20-50MB
- 年影像数据增量：约100TB
- 热点数据：近期3个月数据访问频繁
- 冷数据：1年以上数据访问稀少

## 决策

采用**在线-近线-离线三级存储架构**：

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                    影像存储三级架构                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    在线存储 (Hot)                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │  存储介质：SSD/NVMe                                      ││  │
│  │  │  存储内容：近期3个月影像                                  ││  │
│  │  │  访问延迟：< 100ms                                       ││  │
│  │  │  容量规划：30TB (100TB/年 * 3个月)                       ││  │
│  │  │  技术方案：MinIO对象存储                                  ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       │ 数据迁移（定期任务）                                         │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    近线存储 (Warm)                             │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │  存储介质：SATA HDD                                      ││  │
│  │  │  存储内容：3个月 - 3年影像                                ││  │
│  │  │  访问延迟：< 1s                                          ││  │
│  │  │  容量规划：300TB (100TB/年 * 3年)                        ││  │
│  │  │  技术方案：MinIO对象存储                                  ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       │ 数据归档（定期任务）                                         │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    离线存储 (Cold)                             │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │  存储介质：磁带库/蓝光/云存储                             ││  │
│  │  │  存储内容：3年以上历史影像                                ││  │
│  │  │  访问延迟：分钟级                                         ││  │
│  │  │  容量规划：1.5PB (100TB/年 * 15年)                       ││  │
│  │  │  技术方案：归档存储服务                                    ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### MinIO配置

```yaml
# application-minio.yml
minio:
  # 在线存储配置
  hot:
    endpoint: http://minio-hot.hospital.com:9000
    accessKey: ${MINIO_HOT_ACCESS_KEY}
    secretKey: ${MINIO_HOT_SECRET_KEY}
    bucket: his-imaging-hot
    
  # 近线存储配置
  warm:
    endpoint: http://minio-warm.hospital.com:9000
    accessKey: ${MINIO_WARM_ACCESS_KEY}
    secretKey: ${MINIO_WARM_SECRET_KEY}
    bucket: his-imaging-warm
```

### 影像存储服务

```java
/**
 * 影像存储服务
 */
@Service
public class ImagingStorageService {
    
    @Autowired
    private MinioClient hotStorageClient;
    
    @Autowired
    private MinioClient warmStorageClient;
    
    @Autowired
    private ImagingStudyRepository studyRepository;
    
    /**
     * 存储影像
     */
    public void storeDicom(String studyId, List<DicomFile> dicomFiles) {
        // 1. 存储到在线存储
        for (DicomFile file : dicomFiles) {
            String objectName = buildObjectName(studyId, file);
            hotStorageClient.putObject(
                PutObjectArgs.builder()
                    .bucket("his-imaging-hot")
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType("application/dicom")
                    .build()
            );
        }
        
        // 2. 更新影像记录
        ImagingStudy study = studyRepository.findById(studyId);
        study.setStorageTier("HOT");
        study.setStoragePath("his-imaging-hot/" + studyId);
        study.setStudyTime(LocalDateTime.now());
        studyRepository.save(study);
    }
    
    /**
     * 获取影像
     */
    public InputStream retrieveDicom(String studyId) {
        ImagingStudy study = studyRepository.findById(studyId);
        
        switch (study.getStorageTier()) {
            case "HOT":
                return retrieveFromHot(study);
            case "WARM":
                // 近线存储：异步加载到在线存储
                return retrieveFromWarm(study);
            case "COLD":
                // 离线存储：触发解冻任务
                return retrieveFromCold(study);
            default:
                throw new BusinessException("未知存储层级: " + study.getStorageTier());
        }
    }
    
    /**
     * 从在线存储获取
     */
    private InputStream retrieveFromHot(ImagingStudy study) {
        return hotStorageClient.getObject(
            GetObjectArgs.builder()
                .bucket("his-imaging-hot")
                .object(study.getStoragePath())
                .build()
        );
    }
    
    /**
     * 从近线存储获取
     */
    private InputStream retrieveFromWarm(ImagingStudy study) {
        // 异步迁移到在线存储
        migrateToHotAsync(study);
        
        // 直接从近线存储获取
        return warmStorageClient.getObject(
            GetObjectArgs.builder()
                .bucket("his-imaging-warm")
                .object(study.getStoragePath())
                .build()
        );
    }
    
    /**
     * 从离线存储获取（需要等待解冻）
     */
    private InputStream retrieveFromCold(ImagingStudy study) {
        // 触发解冻任务
        thawRequestService.submitThawRequest(study.getId());
        
        throw new BusinessException("影像正在从归档存储中恢复，请稍后重试");
    }
}
```

### 数据迁移任务

```java
/**
 * 影像数据迁移任务
 */
@Component
public class ImagingMigrationTask {
    
    @Autowired
    private ImagingStudyRepository studyRepository;
    
    @Autowired
    private MinioClient hotStorageClient;
    
    @Autowired
    private MinioClient warmStorageClient;
    
    /**
     * 每天凌晨执行：将3个月前的数据迁移到近线存储
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void migrateToWarm() {
        LocalDateTime threshold = LocalDateTime.now().minusMonths(3);
        
        // 查询需要迁移的影像
        List<ImagingStudy> studies = studyRepository
            .findByStorageTierAndStudyTimeBefore("HOT", threshold);
        
        for (ImagingStudy study : studies) {
            try {
                // 从在线存储复制到近线存储
                String sourcePath = study.getStoragePath();
                
                hotStorageClient.copyObject(
                    CopyObjectArgs.builder()
                        .bucket("his-imaging-warm")
                        .object(sourcePath)
                        .source(CopySource.builder()
                            .bucket("his-imaging-hot")
                            .object(sourcePath)
                            .build())
                        .build()
                );
                
                // 更新存储层级
                study.setStorageTier("WARM");
                studyRepository.save(study);
                
                // 删除在线存储中的数据
                hotStorageClient.removeObject(
                    RemoveObjectArgs.builder()
                        .bucket("his-imaging-hot")
                        .object(sourcePath)
                        .build()
                );
                
                log.info("影像迁移完成: {} -> WARM", study.getId());
                
            } catch (Exception e) {
                log.error("影像迁移失败: {}", study.getId(), e);
            }
        }
    }
    
    /**
     * 每周执行：将3年前的数据归档到离线存储
     */
    @Scheduled(cron = "0 0 3 ? * SUN")
    public void archiveToCold() {
        LocalDateTime threshold = LocalDateTime.now().minusYears(3);
        
        List<ImagingStudy> studies = studyRepository
            .findByStorageTierAndStudyTimeBefore("WARM", threshold);
        
        for (ImagingStudy study : studies) {
            try {
                // 调用归档存储API
                archiveStorageService.archive(study);
                
                // 更新存储层级
                study.setStorageTier("COLD");
                studyRepository.save(study);
                
                log.info("影像归档完成: {} -> COLD", study.getId());
                
            } catch (Exception e) {
                log.error("影像归档失败: {}", study.getId(), e);
            }
        }
    }
}
```

### DICOM标准实现

```java
/**
 * DICOM服务
 */
@Service
public class DicomService {
    
    @Autowired
    private ImagingStorageService storageService;
    
    /**
     * 接收DICOM影像
     */
    public void receiveDicom(DicomInputStream dis) {
        // 1. 解析DICOM文件
        Attributes attrs = dis.readDataset();
        
        // 2. 提取关键信息
        String studyInstanceUID = attrs.getString(Tag.StudyInstanceUID);
        String patientId = attrs.getString(Tag.PatientID);
        String patientName = attrs.getString(Tag.PatientName);
        String studyDate = attrs.getString(Tag.StudyDate);
        String modality = attrs.getString(Tag.Modality);
        
        // 3. 创建影像记录
        ImagingStudy study = new ImagingStudy();
        study.setStudyInstanceUID(studyInstanceUID);
        study.setPatientId(patientId);
        study.setPatientName(patientName);
        study.setStudyDate(parseStudyDate(studyDate));
        study.setModality(modality);
        
        // 4. 存储影像文件
        storageService.storeDicom(studyInstanceUID, Arrays.asList(new DicomFile(attrs)));
        
        // 5. 保存影像记录
        studyRepository.save(study);
    }
    
    /**
     * 查询DICOM影像
     */
    public List<ImagingStudy> queryDicom(DicomQueryRequest request) {
        // 支持DICOM C-FIND查询
        // 按患者ID、检查日期、检查类型等查询
        return studyRepository.findByQuery(request);
    }
    
    /**
     * 获取DICOM影像
     */
    public InputStream retrieveDicom(String studyInstanceUID) {
        // 支持DICOM C-GET/C-MOVE
        return storageService.retrieveDicom(studyInstanceUID);
    }
}
```

## 理由

1. **成本优化**：冷热分离降低存储成本
2. **性能保障**：热点数据存储在高速存储
3. **合规要求**：满足15年保存期限
4. **标准兼容**：DICOM标准接口
5. **弹性扩展**：对象存储易于扩展

## 替代方案

### 方案A：全量在线存储
- **优点**：访问速度快
- **缺点**：成本高，难以扩展
- **拒绝原因**：成本不可控

### 方案B：NAS存储
- **优点**：传统方案，稳定
- **缺点**：扩展性差，性能瓶颈
- **拒绝原因**：不适合大规模影像存储

### 方案C：云存储
- **优点**：弹性扩展
- **缺点**：数据安全风险，带宽成本
- **拒绝原因**：医疗数据敏感，优先本地存储

## 影响

| 影响维度 | 影响描述 | 应对措施 |
|----------|----------|----------|
| 存储成本 | 三级存储降低整体成本 | 规划存储采购 |
| 数据迁移 | 定期迁移任务 | 监控迁移状态 |
| 冷数据访问 | 解冻需要等待 | 提前预约机制 |
| 备份策略 | 分级备份策略 | 制定备份方案 |

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| BR-RIS-001~002 | 完全符合 | DICOM标准+三级存储 |
| 影像保存期限 | 符合 | ≥15年 |
| 影像加载时间 | 符合 | 热数据<100ms |

---

## 技术选型决策

---

# ADR-011: 后端技术栈选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要选择合适的后端技术栈，支撑日均5000+门诊量的业务需求。

## 决策

基于**Spring Boot 3.x**技术栈：

| 技术组件 | 选型 | 版本 | 说明 |
|----------|------|------|------|
| 核心框架 | Spring Boot | 3.2.x | 主流企业级框架 |
| 安全框架 | Spring Security | 6.x | 认证授权 |
| ORM框架 | MyBatis-Plus | 3.5.x | 增强MyBatis |
| 数据库 | MySQL | 8.x | 关系型数据库 |
| 缓存 | Redis | 7.x | 分布式缓存 |
| 消息队列 | RabbitMQ | 3.x | 消息中间件 |
| 对象存储 | MinIO | Latest | 影像存储 |
| API文档 | Knife4j | 4.x | Swagger增强 |
| 任务调度 | XXL-Job | 2.x | 分布式调度 |

## 理由

1. **技术成熟**：Spring Boot生态成熟，社区活跃
2. **团队熟悉**：基于YUDAO框架，团队有经验
3. **扩展性好**：支持微服务演进
4. **性能稳定**：满足1000+并发需求

## 合规性

符合企业级应用开发规范。

---

# ADR-012: 前端技术栈选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要选择前端技术栈，支持多角色用户的交互需求。

## 决策

基于**Vue 3 + Element Plus**技术栈：

| 技术组件 | 选型 | 版本 | 说明 |
|----------|------|------|------|
| 核心框架 | Vue | 3.4.x | 响应式框架 |
| UI组件库 | Element Plus | 2.x | 企业级组件 |
| 状态管理 | Pinia | 2.x | Vue 3推荐 |
| 路由 | Vue Router | 4.x | 官方路由 |
| 构建工具 | Vite | 5.x | 快速构建 |
| 移动端 | uni-app | 3.x | 患者端小程序 |

## 理由

1. **技术先进**：Vue 3 Composition API
2. **组件丰富**：Element Plus企业级组件
3. **开发效率**：Vite快速热更新
4. **跨平台**：uni-app支持微信小程序

## 合规性

符合现代前端开发规范。

---

# ADR-013: 数据库选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要选择合适的关系型数据库，支撑核心业务数据存储。

## 决策

选择**MySQL 8.x**作为主数据库：

| 特性 | 说明 |
|------|------|
| 版本 | MySQL 8.0+ |
| 存储引擎 | InnoDB |
| 字符集 | utf8mb4 |
| 事务隔离 | READ-COMMITTED |
| 主从复制 | 异步复制 |

## 理由

1. **开源免费**：降低成本
2. **生态成熟**：工具链完善
3. **性能优秀**：满足业务需求
4. **团队熟悉**：运维经验丰富

## 合规性

符合医疗行业数据库选型惯例。

---

# ADR-014: 缓存架构选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要缓存方案提升系统性能。

## 决策

选择**Redis 7.x**作为缓存中间件：

| 用途 | 说明 |
|------|------|
| 会话存储 | 用户登录Session |
| 数据缓存 | 热点数据缓存 |
| 分布式锁 | 并发控制 |
| 消息发布 | 实时通知 |

## 理由

1. **高性能**：单机QPS 10万+
2. **数据结构丰富**：String/Hash/List/Set/ZSet
3. **持久化**：RDB/AOF
4. **集群支持**：哨兵/Cluster

## 合规性

符合缓存最佳实践。

---

# ADR-015: 消息队列选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要消息队列实现异步处理和解耦。

## 决策

选择**RabbitMQ**作为消息中间件：

| 场景 | 说明 |
|------|------|
| 异步通知 | 危急值通知、预约提醒 |
| 业务解耦 | 模块间消息传递 |
| 流量削峰 | 高并发场景 |

## 理由

1. **可靠性高**：消息持久化、确认机制
2. **协议标准**：AMQP协议
3. **管理友好**：Web管理界面
4. **延迟队列**：支持延迟消息

## 合规性

符合消息中间件选型标准。

---

# ADR-016: 容器化与编排选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要容器化部署支持。

## 决策

选择**Docker + Kubernetes**：

| 组件 | 选型 | 说明 |
|------|------|------|
| 容器运行时 | Docker | 标准容器 |
| 容器编排 | Kubernetes | K8s集群 |
| 镜像仓库 | Harbor | 企业级仓库 |
| 网络插件 | Calico | 网络策略 |

## 理由

1. **标准化部署**：容器化一致性
2. **弹性伸缩**：K8s自动伸缩
3. **高可用**：多副本部署
4. **运维友好**：声明式配置

## 合规性

符合云原生部署规范。

---

# ADR-017: API网关选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要API网关统一入口。

## 决策

选择**Spring Cloud Gateway**：

| 功能 | 说明 |
|------|------|
| 路由转发 | 统一入口 |
| 认证鉴权 | JWT验证 |
| 限流熔断 | 保护后端 |
| 日志追踪 | 链路追踪 |

## 理由

1. **Spring生态**：与Spring Boot集成良好
2. **响应式**：基于WebFlux
3. **功能丰富**：内置多种过滤器
4. **可扩展**：自定义过滤器

## 合规性

符合API网关最佳实践。

---

# ADR-018: 日志与监控选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要完善的日志和监控体系。

## 决策

选择**ELK + Prometheus**：

| 组件 | 选型 | 用途 |
|------|------|------|
| 日志收集 | Filebeat | 日志采集 |
| 日志存储 | Elasticsearch | 日志存储 |
| 日志展示 | Kibana | 日志分析 |
| 指标监控 | Prometheus | 指标采集 |
| 指标展示 | Grafana | 监控大屏 |
| 链路追踪 | SkyWalking | 分布式追踪 |

## 理由

1. **开源免费**：成本低
2. **功能完善**：覆盖日志、指标、追踪
3. **生态成熟**：社区活跃
4. **可视化**：丰富的仪表盘

## 合规性

符合运维监控标准。

---

# ADR-019: 任务调度选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要分布式任务调度支持。

## 决策

选择**XXL-Job**：

| 场景 | 说明 |
|------|------|
| 定时任务 | 危急值超时检查 |
| 数据迁移 | 影像数据迁移 |
| 报表生成 | 统计报表 |
| 数据清理 | 过期数据清理 |

## 理由

1. **分布式**：支持集群部署
2. **可视化管理**：Web控制台
3. **任务丰富**：支持CRON、固定频率等
4. **失败重试**：自动重试机制

## 合规性

符合分布式调度规范。

---

# ADR-020: 文件存储选型

## 状态

已接受

## 背景

YUDAO-AI-HIS需要存储影像、病历等文件。

## 决策

选择**MinIO**作为对象存储：

| 用途 | 说明 |
|------|------|
| 影像存储 | DICOM文件 |
| 病历附件 | 文档文件 |
| 报告文件 | PDF报告 |

## 理由

1. **S3兼容**：标准接口
2. **高性能**：单节点高吞吐
3. **分布式**：支持集群
4. **开源免费**：成本低

## 合规性

符合对象存储标准。

---

## 安全合规决策

---

# ADR-021: 身份认证方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要安全的身份认证机制。

## 决策

采用**JWT + OAuth2.0**认证方案：

| 认证方式 | 适用场景 |
|----------|----------|
| 用户名密码 | 内部用户 |
| CA证书 | 电子签名 |
| LDAP | 统一身份 |
| 微信OAuth | 患者用户 |

## 理由

1. **无状态**：JWT自包含
2. **标准化**：OAuth2.0协议
3. **安全性高**：签名验证
4. **多端支持**：PC/移动端

## 合规性

符合等保三级认证要求。

---

# ADR-022: 数据加密方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要对敏感数据加密保护。

## 决策

采用**AES-256 + RSA**加密方案：

| 加密类型 | 适用场景 | 算法 |
|----------|----------|------|
| 传输加密 | HTTPS通信 | TLS 1.3 |
| 存储加密 | 敏感数据 | AES-256 |
| 密码加密 | 用户密码 | BCrypt |
| 签名加密 | 电子签名 | RSA-2048 |

## 理由

1. **安全性高**：符合国家标准
2. **性能适中**：加密开销可控
3. **标准算法**：业界认可

## 合规性

符合《个人信息保护法》和等保三级要求。

---

# ADR-023: 审计日志方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要完善的审计日志机制。

## 决策

采用**集中式审计日志**：

| 日志类型 | 保留期限 |
|----------|----------|
| 登录日志 | ≥ 6个月 |
| 操作日志 | ≥ 3年 |
| 敏感数据访问日志 | ≥ 3年 |
| 异常日志 | ≥ 1年 |

## 理由

1. **合规要求**：等保三级
2. **追溯能力**：操作可追溯
3. **安全分析**：异常行为检测

## 合规性

完全符合BR-SYS-005~010业务规则和等保三级要求。

---

# ADR-024: 数据备份方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要可靠的数据备份机制。

## 决策

采用**多级备份策略**：

| 备份类型 | 频率 | 保留期限 | RPO | RTO |
|----------|------|----------|-----|-----|
| 全量备份 | 每日 | 7天 | 24h | 4h |
| 增量备份 | 每小时 | 3天 | 1h | 2h |
| 实时备份 | 实时 | 1天 | 0 | 30min |

## 理由

1. **数据安全**：防止数据丢失
2. **快速恢复**：RTO可控
3. **成本适中**：分级备份

## 合规性

符合数据备份最佳实践。

---

# ADR-025: 安全加固方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要满足等保三级安全要求。

## 决策

实施**多层安全防护**：

| 安全层级 | 防护措施 |
|----------|----------|
| 网络安全 | 防火墙、WAF、VPN |
| 主机安全 | 主机加固、入侵检测 |
| 应用安全 | 代码审计、漏洞扫描 |
| 数据安全 | 加密、脱敏、备份 |

## 理由

1. **合规要求**：等保三级
2. **纵深防御**：多层防护
3. **主动防护**：入侵检测

## 合规性

完全符合等保三级安全要求。

---

# ADR-026: 隐私保护方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要保护患者隐私。

## 决策

实施**数据脱敏和权限控制**：

| 保护措施 | 说明 |
|----------|------|
| 数据脱敏 | 敏感字段脱敏展示 |
| 访问控制 | 最小权限原则 |
| 日志审计 | 访问行为记录 |
| 同意管理 | 患者授权管理 |

## 理由

1. **法律要求**：《个人信息保护法》
2. **伦理要求**：医疗伦理
3. **信任建立**：患者信任

## 合规性

完全符合《个人信息保护法》要求。

---

# ADR-027: 接口安全方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要保障接口安全。

## 决策

实施**API安全防护**：

| 安全措施 | 说明 |
|----------|------|
| 认证鉴权 | JWT验证 |
| 限流熔断 | 防止滥用 |
| 参数校验 | 防止注入 |
| 签名验证 | 防止篡改 |
| HTTPS | 传输加密 |

## 理由

1. **防止攻击**：常见攻击防护
2. **稳定性**：限流保护
3. **合规性**：安全规范

## 合规性

符合API安全最佳实践。

---

# ADR-028: 容灾方案

## 状态

已接受

## 背景

YUDAO-AI-HIS需要容灾能力保障业务连续性。

## 决策

实施**主备容灾**：

| 容灾层级 | 方案 | RTO |
|----------|------|-----|
| 应用层 | 多副本部署 | 30s |
| 数据库层 | 主从切换 | 5min |
| 存储层 | 多副本存储 | 实时 |

## 理由

1. **业务连续性**：故障快速恢复
2. **成本适中**：主备模式
3. **运维成熟**：方案成熟

## 合规性

符合业务连续性要求。

---

# ADR-029: 开发安全规范

## 状态

已接受

## 背景

YUDAO-AI-HIS需要在开发阶段保障安全。

## 决策

实施**安全开发生命周期(SDL)**：

| 阶段 | 安全措施 |
|------|----------|
| 需求 | 安全需求分析 |
| 设计 | 安全架构评审 |
| 开发 | 安全编码规范 |
| 测试 | 安全测试 |
| 部署 | 安全配置检查 |

## 理由

1. **源头控制**：早期发现安全问题
2. **成本降低**：修复成本低
3. **质量提升**：代码质量提升

## 合规性

符合安全开发规范。

---

# ADR-030: 安全运维规范

## 状态

已接受

## 背景

YUDAO-AI-HIS需要安全运维保障。

## 决策

实施**安全运维管理**：

| 运维措施 | 说明 |
|----------|------|
| 漏洞管理 | 定期漏洞扫描和修复 |
| 补丁管理 | 及时更新安全补丁 |
| 变更管理 | 变更审批流程 |
| 应急响应 | 安全事件响应流程 |

## 理由

1. **持续安全**：运维阶段保障
2. **及时响应**：快速处理安全事件
3. **规范管理**：标准化流程

## 合规性

符合等保三级运维要求。

---

## 附录

### 附录A: ADR索引

| ADR编号 | 决策标题 | 状态 | 优先级 |
|---------|----------|------|--------|
| ADR-001 | 微服务架构选型 | 已接受 | 核心 |
| ADR-002 | 数据库分表策略 | 已接受 | 核心 |
| ADR-003 | 闭环给药架构设计 | 已接受 | 核心 |
| ADR-004 | CDS临床决策支持实现 | 已接受 | 核心 |
| ADR-005 | HL7 FHIR R4集成策略 | 已接受 | 核心 |
| ADR-006 | 危急值15分钟通报机制 | 已接受 | 核心 |
| ADR-007 | 医保实时结算集成 | 已接受 | 核心 |
| ADR-008 | 电子病历签名与归档 | 已接受 | 核心 |
| ADR-009 | 数据权限控制方案 | 已接受 | 核心 |
| ADR-010 | 影像存储三级架构 | 已接受 | 核心 |
| ADR-011 | 后端技术栈选型 | 已接受 | 技术选型 |
| ADR-012 | 前端技术栈选型 | 已接受 | 技术选型 |
| ADR-013 | 数据库选型 | 已接受 | 技术选型 |
| ADR-014 | 缓存架构选型 | 已接受 | 技术选型 |
| ADR-015 | 消息队列选型 | 已接受 | 技术选型 |
| ADR-016 | 容器化与编排选型 | 已接受 | 技术选型 |
| ADR-017 | API网关选型 | 已接受 | 技术选型 |
| ADR-018 | 日志与监控选型 | 已接受 | 技术选型 |
| ADR-019 | 任务调度选型 | 已接受 | 技术选型 |
| ADR-020 | 文件存储选型 | 已接受 | 技术选型 |
| ADR-021 | 身份认证方案 | 已接受 | 安全合规 |
| ADR-022 | 数据加密方案 | 已接受 | 安全合规 |
| ADR-023 | 审计日志方案 | 已接受 | 安全合规 |
| ADR-024 | 数据备份方案 | 已接受 | 安全合规 |
| ADR-025 | 安全加固方案 | 已接受 | 安全合规 |
| ADR-026 | 隐私保护方案 | 已接受 | 安全合规 |
| ADR-027 | 接口安全方案 | 已接受 | 安全合规 |
| ADR-028 | 容灾方案 | 已接受 | 安全合规 |
| ADR-029 | 开发安全规范 | 已接受 | 安全合规 |
| ADR-030 | 安全运维规范 | 已接受 | 安全合规 |

### 附录B: 参考标准

| 标准编号 | 标准名称 |
|----------|----------|
| HIMSS EMRAM | 电子病历采纳模型 |
| HL7 FHIR R4 | 快速医疗互操作性资源 |
| ICD-10 | 国际疾病分类第10版 |
| DICOM | 医学数字影像和通信标准 |
| GB/T 22239 | 信息安全技术 网络安全等级保护基本要求 |
| 电子签名法 | 中华人民共和国电子签名法 |
| 个人信息保护法 | 中华人民共和国个人信息保护法 |

### 附录C: 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| V1.0 | 2026-06-16 | 初始版本，定义30个架构决策记录 | YUDAO-AI-HIS架构组 |

---

> **架构师**: ________________
> **技术负责人**: ________________
> **安全专家**: ________________
> **最后更新**: 2026-06-16
