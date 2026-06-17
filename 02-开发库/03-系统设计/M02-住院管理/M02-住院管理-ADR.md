# M02-住院管理 - 架构决策记录 (ADR)

> **模块编号**: M02
> **模块名称**: 住院管理
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 评审中
> **来源**: HIS系统-架构决策记录(ADR).md

---

## 目录

- [ADR-M02-001: 闭环给药架构设计](#adr-m02-001-闭环给药架构设计)
- [ADR-M02-002: 危急值15分钟通报机制](#adr-m02-002-危急值15分钟通报机制)

---

# ADR-M02-001: 闭环给药架构设计

## 决策编号

ADR-M02-001

## 状态

已接受

## 上下文

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

### 核心实现

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

## 后果

### 正面影响
1. 符合HIMSS标准：状态机设计满足EMRAM Stage 5闭环给药要求
2. 强制双重核对：必须先腕带后药品，顺序不可颠倒
3. 防呆设计：任一核对不匹配即阻止给药
4. 完整追溯：所有核对过程记录审计日志

### 负面影响
1. 需要PDA扫码枪、腕带打印机等硬件投入
2. 改变传统给药流程，需要培训护士
3. 高频扫码操作对系统性能有要求

### 应对措施
- 纳入预算采购硬件设备
- 组织培训和流程改造
- 移动端离线缓存优化性能

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| HIMSS EMRAM Stage 5 | 完全符合 | 双重核对+eMAR记录 |
| 用药安全规范 | 符合 | 强制核对防止差错 |
| 等保三级 | 符合 | 核对记录审计追踪 |
| BR-IP-010 | 完全符合 | 给药前扫描患者腕带和药品条码 |

---

# ADR-M02-002: 危急值15分钟通报机制

## 决策编号

ADR-M02-002

## 状态

已接受

## 上下文

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
}

/**
 * 危急值超时检查任务
 */
@Component
public class CriticalValueTimeoutTask {
    
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

## 后果

### 正面影响
1. 多渠道通知确保信息及时送达
2. 自动超时升级避免人工监督遗漏
3. 状态机驱动使流程标准化，易于追踪
4. 完整记录满足审计和质控要求

### 负面影响
1. 短信/语音通知会产生运营商费用
2. 语音通知可能在夜间打扰医护人员
3. 定时任务对数据库有一定负载

### 应对措施
- 预算采购通知服务
- 设置免打扰时段
- 优化查询索引降低负载

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| BR-LIS-002 | 完全符合 | 15分钟通报机制 |
| 危急值管理规范 | 符合 | 完整流程记录 |

---

## 附录

### 附录A: 参考标准

| 标准编号 | 标准名称 |
|----------|----------|
| HIMSS EMRAM Stage 5 | 电子病历采纳模型 |
| BR-IP-010 | 住院给药核对业务规则 |
| BR-LIS-002 | 危急值通报业务规则 |
| SM-005 | eMAR给药状态机 |
| SM-007 | 危急值处理状态机 |

### 附录B: 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| V1.0 | 2026-06-17 | 初始版本，从全局ADR拆分 | YUDAO-AI-HIS架构组 |

---

> **最后更新**: 2026-06-17
