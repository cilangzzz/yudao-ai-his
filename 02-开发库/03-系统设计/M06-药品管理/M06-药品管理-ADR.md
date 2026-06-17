# M06-药品管理 - 架构决策记录 (ADR)

> **模块编号**: M06
> **模块名称**: 药品管理
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 评审中
> **来源**: HIS系统-架构决策记录(ADR).md

---

## 目录

- [ADR-M06-001: CDS临床决策支持实现](#adr-m06-001-cds临床决策支持实现)
- [ADR-M06-002: 药品条码管理](#adr-m06-002-药品条码管理)

---

# ADR-M06-001: CDS临床决策支持实现

## 决策编号

ADR-M06-001

## 状态

已接受

## 上下文

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

## 后果

### 正面影响
1. 规则引擎确保校验逻辑一致
2. 知识库独立管理，便于更新
3. 知识库预加载到内存，校验响应快
4. 支持新增校验规则类型

### 负面影响
1. 需要药学专业人员维护知识库
2. 大量规则校验对系统性能有影响
3. 告警过多可能影响医生工作效率

### 应对措施
- 药剂科负责知识库更新
- 内存缓存+索引优化提升性能
- 分级显示+智能过滤优化用户体验

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| 药物相互作用检查 | 符合 | 覆盖所有已知高风险组合 |
| 过敏检查 | 符合 | 基于患者过敏史 |
| 剂量校验 | 符合 | 基于年龄/体重/肾功能 |
| BR-OP-006 | 符合 | 门诊处方CDS校验 |
| BR-IP-005 | 符合 | 住院医嘱CDS校验 |

---

# ADR-M06-002: 药品条码管理

## 决策编号

ADR-M06-002

## 状态

已接受

## 上下文

药品条码管理是闭环给药的关键支撑。根据业务需求：

**业务要求**：
- 药品配药后需要贴条码标识
- 条码信息支持床旁扫码核对
- 条码包含药品批号、有效期信息
- 支持药品追溯

**技术要求**：
- 条码格式标准化
- 扫码识别率高
- 支持批量打印

## 决策

采用**一维码+二维码双码管理**策略：

### 条码设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                    药品条码设计                                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  一维码 (Code128)                                             │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ ||||| || |||||| ||| ||||||||| |||||| || ||| |||        │  │  │
│  │  │ DRUG2026061700012345                                   │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  用途：快速扫码识别                                           │  │
│  │  内容：药品唯一编码 (DRUG + 日期 + 序列号)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  二维码 (QR Code)                                             │  │
│  │  ┌──────────────────┐                                        │  │
│  │  │ ████  ██  ██████ │  内容：                               │  │
│  │  │ █  █  █    █    █ │  - 药品ID                             │  │
│  │  │ █  ███████████   │  - 药品名称                            │  │
│  │  │ ██████    ██  ███ │  - 批号                               │  │
│  │  │ █    ████  ████  │  - 有效期                              │  │
│  │  │ ████████████████ │  - 规格                               │  │
│  │  └──────────────────┘                                        │  │
│  │  用途：信息展示、追溯查询                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 条码数据结构

```java
/**
 * 药品条码信息
 */
@Data
public class DrugBarcodeInfo {
    
    /** 药品唯一编码 */
    private String drugCode;
    
    /** 药品ID */
    private Long drugId;
    
    /** 药品名称 */
    private String drugName;
    
    /** 规格 */
    private String specification;
    
    /** 批号 */
    private String batchNo;
    
    /** 有效期 */
    private LocalDate expireDate;
    
    /** 生产厂家 */
    private String manufacturer;
    
    /** 发药单号 */
    private String dispenseNo;
    
    /** 患者ID */
    private Long patientId;
    
    /** 医嘱ID */
    private Long orderId;
}
```

### 条码打印服务

```java
/**
 * 药品条码打印服务
 */
@Service
public class DrugBarcodePrintService {
    
    /**
     * 生成药品条码
     */
    public DrugBarcode generateBarcode(DrugDispenseInfo dispenseInfo) {
        DrugBarcode barcode = new DrugBarcode();
        
        // 生成唯一编码
        String drugCode = generateDrugCode(dispenseInfo);
        barcode.setDrugCode(drugCode);
        
        // 设置条码信息
        barcode.setDrugId(dispenseInfo.getDrugId());
        barcode.setDrugName(dispenseInfo.getDrugName());
        barcode.setBatchNo(dispenseInfo.getBatchNo());
        barcode.setExpireDate(dispenseInfo.getExpireDate());
        barcode.setDispenseNo(dispenseInfo.getDispenseNo());
        barcode.setPatientId(dispenseInfo.getPatientId());
        barcode.setOrderId(dispenseInfo.getOrderId());
        
        // 生成一维码
        barcode.setBarcode128(generateCode128(drugCode));
        
        // 生成二维码
        barcode.setQrCode(generateQRCode(barcode));
        
        return barcode;
    }
    
    /**
     * 生成药品唯一编码
     */
    private String generateDrugCode(DrugDispenseInfo dispenseInfo) {
        // 格式：DRUG + 日期(8位) + 序列号(8位)
        String dateStr = DateUtil.format(new Date(), "yyyyMMdd");
        String sequence = String.format("%08d", sequenceGenerator.next("DRUG_BARCODE"));
        return "DRUG" + dateStr + sequence;
    }
    
    /**
     * 批量打印药品条码
     */
    public void batchPrint(List<DrugDispenseInfo> dispenseList) {
        List<DrugBarcode> barcodes = dispenseList.stream()
            .map(this::generateBarcode)
            .collect(Collectors.toList());
        
        // 调用打印机打印标签
        printService.printDrugLabels(barcodes);
    }
}
```

## 后果

### 正面影响
1. 标准化条码便于系统集成
2. 一维码快速识别，二维码信息丰富
3. 支持药品追溯全流程

### 负面影响
1. 需要条码打印设备投入
2. 条码标签成本
3. 条码管理需要规范流程

### 应对措施
- 纳入预算采购条码打印设备
- 制定条码管理规范

## 合规性

| 标准/规范 | 符合程度 | 说明 |
|-----------|----------|------|
| 药品追溯要求 | 符合 | 支持全程追溯 |
| 闭环给药要求 | 符合 | 支持床旁扫码 |

---

## 附录

### 附录A: 参考标准

| 标准编号 | 标准名称 |
|----------|----------|
| BR-OP-006 | 门诊处方CDS校验业务规则 |
| BR-IP-005 | 住院医嘱CDS校验业务规则 |
| GS1 | 国际物品编码标准 |

### 附录B: 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| V1.0 | 2026-06-17 | 初始版本，从全局ADR拆分 | YUDAO-AI-HIS架构组 |

---

> **最后更新**: 2026-06-17
