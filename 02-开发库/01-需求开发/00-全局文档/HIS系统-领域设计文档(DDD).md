# YUDAO-AI-HIS 智慧医疗信息系统 - 领域设计文档 (DDD)

> **文档编号**: YUDAO-HIS-DDD-001
> **版本**: V1.0
> **创建日期**: 2026-06-16
> **状态**: 评审中
> **设计方法**: 领域驱动设计 (Domain-Driven Design)
> **参考标准**: Eric Evans《领域驱动设计》| Vernon《实现领域驱动设计》| HL7 FHIR R4

---

## 1. 领域概述

### 1.1 业务领域分析

YUDAO-AI-HIS智慧医疗信息系统的核心领域是**医疗服务提供**，核心业务围绕患者就诊全流程展开。根据PRD分析，系统需覆盖门诊、住院、药品、检验、影像、电子病历等13个子系统，核心目标是达到HIMSS EMRAM Stage 5+水平，实现闭环医疗管理和AI辅助决策。

### 1.2 核心业务场景

| 场景 | 描述 | 复杂度 |
|------|------|--------|
| 门诊就诊 | 挂号→候诊→接诊→开方→缴费→取药 | 高 |
| 住院诊疗 | 入院→医嘱→执行→病历→出院 | 高 |
| 闭环给药 | 医嘱→审核→配药→核对→给药→记录 | 高 |
| 危急值管理 | 检验→危急值检出→通知→确认→处理 | 中 |
| 医保结算 | 计费→医保对接→结算→报销 | 中 |

### 1.3 领域语言 (Ubiquitous Language)

| 术语 | 英文 | 定义 |
|------|------|------|
| 患者 | Patient | 接受医疗服务的主体，具有唯一主索引(EMPI) |
| 就诊 | Encounter | 患者与医疗机构的一次医疗服务交互 |
| 医嘱 | Order | 医生对患者的诊疗指令，包括药品、检查、检验等 |
| 处方 | Prescription | 医生开具的药品使用指令 |
| 诊断 | Diagnosis | 医生对疾病的专业判断(ICD-10编码) |
| 危急值 | Critical Value | 检验/检查结果中可能危及患者生命的异常值 |
| 闭环给药 | Closed-Loop Medication | 通过腕带+条码双重核对确保给药安全的流程 |
| CDS | Clinical Decision Support | 临床决策支持系统，自动校验用药合理性 |

---

## 2. 界限上下文 (Bounded Context)

### 2.1 界限上下文定义表

| 上下文编号 | 上下文名称 | 英文标识 | 边界范围 | 核心职责 | 对应模块 |
|------------|------------|----------|----------|----------|----------|
| BC-001 | 门诊上下文 | OutpatientContext | 门诊业务域 | 管理门诊挂号、接诊、处方、收费、发药全流程 | M01 |
| BC-002 | 住院上下文 | InpatientContext | 住院业务域 | 管理入院、医嘱、护理、出院全流程 | M02 |
| BC-003 | 药品上下文 | MedicationContext | 药品管理域 | 管理药品目录、库存、处方审核、调配发药 | M06 |
| BC-004 | 检验上下文 | LaboratoryContext | 检验业务域 | 管理检验申请、标本、结果、报告 | M04 |
| BC-005 | 影像上下文 | RadiologyContext | 影像业务域 | 管理影像检查申请、采集、存储、报告 | M05 |
| BC-006 | 电子病历上下文 | EMRContext | 病历管理域 | 管理病历文书、归档、质控、签名 | M03 |
| BC-007 | 系统上下文 | SystemContext | 系统管理域 | 管理用户、权限、字典、日志 | M09 |
| BC-008 | 财务上下文 | FinanceContext | 财务管理域 | 管理收费、结算、医保对接、财务报表 | M08 |

### 2.2 界限上下文详细定义

#### BC-001 门诊上下文 (OutpatientContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                      OutpatientContext                          │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - Registration (挂号单)                                       │
│   - OutpatientEncounter (门诊就诊)                              │
│   - OutpatientPrescription (门诊处方)                           │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - RegistrationService (挂号服务)                              │
│   - TriageService (分诊服务)                                    │
│   - OutpatientCdsService (门诊CDS服务)                          │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - PatientRegistered (患者挂号完成)                            │
│   - OutpatientEncounterStarted (就诊开始)                       │
│   - PrescriptionCreated (处方开立)                              │
│   - PaymentCompleted (收费完成)                                 │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-OP-001: 预约挂号限次 (每人每科室每日限1次)
- BR-OP-002: 预约号源范围 (7天内)
- BR-OP-006: 处方CDS校验 (药物相互作用/过敏/剂量/配伍)
- BR-OP-008: 门诊病历时限 (24小时内完成)

#### BC-002 住院上下文 (InpatientContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                      InpatientContext                           │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - Admission (入院记录)                                        │
│   - InpatientEncounter (住院就诊)                               │
│   - Order (医嘱)                                                │
│   - MedicationAdministration (给药记录/eMAR)                    │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - AdmissionService (入院服务)                                 │
│   - OrderService (医嘱服务)                                     │
│   - BedAllocationService (床位分配服务)                         │
│   - ClosedLoopMedicationService (闭环给药服务)                  │
│   - DischargeService (出院服务)                                 │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - PatientAdmitted (患者入院)                                  │
│   - OrderCreated (医嘱开立)                                     │
│   - OrderVerified (医嘱审核)                                    │
│   - MedicationAdministered (给药完成)                           │
│   - PatientDischarged (患者出院)                                │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-IP-001: 入院关联诊断
- BR-IP-003: 床位分配校验 (性别/病种/感染)
- BR-IP-007: 医嘱状态流转 (开立→审核→执行→完成)
- BR-IP-010: 闭环给药双重核对 (腕带+条码)
- BR-IP-012: 出院前停止长期医嘱

#### BC-003 药品上下文 (MedicationContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                      MedicationContext                          │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - Drug (药品)                                                 │
│   - DrugInventory (药品库存)                                    │
│   - PrescriptionReview (处方审核)                               │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - DrugCatalogService (药品目录服务)                           │
│   - InventoryService (库存管理服务)                             │
│   - PrescriptionReviewService (处方审核服务)                    │
│   - DrugInteractionService (药物相互作用服务)                   │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - DrugDispensed (药品发放)                                    │
│   - InventoryLowAlert (库存不足预警)                            │
│   - DrugExpiredAlert (近效期预警)                               │
│   - PrescriptionReviewed (处方审核完成)                         │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-PHARM-002: 近效期预警 (≤3个月)
- BR-PHARM-003: 先进先出原则
- BR-PHARM-004: 麻醉药品五专管理
- BR-PHARM-005: 处方必须审核
- BR-PHARM-008: 抗菌药物分级管理

#### BC-004 检验上下文 (LaboratoryContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                      LaboratoryContext                          │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - LabOrder (检验申请)                                         │
│   - Specimen (标本)                                             │
│   - LabReport (检验报告)                                        │
│   - CriticalValue (危急值)                                      │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - SpecimenTrackingService (标本追踪服务)                      │
│   - LabResultService (检验结果服务)                             │
│   - CriticalValueService (危急值管理服务)                       │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - SpecimenCollected (标本采集)                                │
│   - SpecimenReceived (标本接收)                                 │
│   - LabResultReady (检验结果就绪)                               │
│   - CriticalValueDetected (危急值检出)                          │
│   - CriticalValueConfirmed (危急值确认)                         │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-LIS-001: 标本全程追踪
- BR-LIS-002: 危急值15分钟通报
- BR-LIS-003: 常规检验报告时限 (≤2小时)
- BR-LIS-004: 结果异常自动标识

#### BC-005 影像上下文 (RadiologyContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                      RadiologyContext                           │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - ImagingOrder (影像检查申请)                                 │
│   - ImagingStudy (影像检查)                                     │
│   - ImagingReport (影像报告)                                    │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - ImagingOrderService (影像申请服务)                          │
│   - DicomStorageService (DICOM存储服务)                         │
│   - ImagingReportService (影像报告服务)                         │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - ImagingOrderCreated (影像申请创建)                          │
│   - ImagingStudyCompleted (影像检查完成)                        │
│   - ImagingReportReady (影像报告就绪)                           │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-RIS-001: DICOM标准合规
- BR-RIS-002: 影像三级存储
- BR-RIS-004: 常规报告时限 (≤4小时)

#### BC-006 电子病历上下文 (EMRContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                        EMRContext                               │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - MedicalRecord (病历文书)                                    │
│   - MedicalRecordArchive (病案归档)                             │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - MedicalRecordService (病历服务)                             │
│   - EmrTemplateService (病历模板服务)                           │
│   - QualityControlService (质控服务)                            │
│   - ElectronicSignatureService (电子签名服务)                   │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - MedicalRecordCreated (病历创建)                             │
│   - MedicalRecordSigned (病历签名)                              │
│   - MedicalRecordArchived (病历归档)                            │
│   - MedicalRecordSealed (病历封存)                              │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-EMR-001: 病历归档锁定
- BR-EMR-002: CA数字签名合规
- BR-EMR-003: 病历封存规则
- BR-EMR-004: 病历查阅权限分级

#### BC-007 系统上下文 (SystemContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                       SystemContext                             │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - User (用户)                                                 │
│   - Role (角色)                                                 │
│   - DataDictionary (数据字典)                                   │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - AuthenticationService (认证服务)                            │
│   - AuthorizationService (授权服务)                             │
│   - AuditLogService (审计日志服务)                              │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - UserCreated (用户创建)                                      │
│   - UserLoggedIn (用户登录)                                     │
│   - PermissionGranted (权限授予)                                │
│   - AuditLogCreated (审计日志创建)                              │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-SYS-001: 用户名校验
- BR-SYS-002: 密码复杂度
- BR-SYS-003: 登录失败锁定
- BR-SYS-004: RBAC三级权限
- BR-SYS-005: 审计日志不可篡改

#### BC-008 财务上下文 (FinanceContext)

```
┌─────────────────────────────────────────────────────────────────┐
│                       FinanceContext                            │
├─────────────────────────────────────────────────────────────────┤
│ 聚合根:                                                         │
│   - ChargeItem (收费项目)                                       │
│   - BillingAccount (计费账户)                                   │
│   - Settlement (结算单)                                         │
├─────────────────────────────────────────────────────────────────┤
│ 领域服务:                                                       │
│   - BillingService (计费服务)                                   │
│   - InsuranceSettlementService (医保结算服务)                   │
│   - PaymentService (支付服务)                                   │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件:                                                       │
│   - ChargeCreated (费用产生)                                    │
│   - SettlementCompleted (结算完成)                              │
│   - PaymentReceived (收款完成)                                  │
│   - RefundProcessed (退费处理)                                  │
└─────────────────────────────────────────────────────────────────┘
```

**业务规则约束**:
- BR-FIN-001: 医保实时结算
- BR-FIN-002: 财务操作审计
- BR-FIN-004: 费用自动记账

---

## 3. 聚合根 (Aggregate Root)

### 3.1 聚合根定义表

| 聚合根编号 | 聚合根名称 | 英文标识 | 所属上下文 | 职责 | 一致性边界 |
|------------|------------|----------|------------|------|------------|
| AR-001 | 患者聚合 | PatientAggregate | 共享内核 | 患者主索引管理 | 患者基本信息、过敏史、联系方式 |
| AR-002 | 就诊聚合 | EncounterAggregate | 门诊/住院 | 就诊记录管理 | 就诊信息、诊断、关联医嘱 |
| AR-003 | 医嘱聚合 | OrderAggregate | 住院 | 医嘱全生命周期管理 | 医嘱、医嘱明细、执行记录 |
| AR-004 | 处方聚合 | PrescriptionAggregate | 门诊/住院 | 处方管理 | 处方、处方明细、审核记录 |
| AR-005 | 药品聚合 | DrugAggregate | 药品 | 药品目录管理 | 药品信息、规格、库存 |
| AR-006 | 检验申请聚合 | LabOrderAggregate | 检验 | 检验申请管理 | 申请单、标本、结果 |
| AR-007 | 影像检查聚合 | ImagingStudyAggregate | 影像 | 影像检查管理 | 检查申请、影像、报告 |
| AR-008 | 病历聚合 | MedicalRecordAggregate | 电子病历 | 病历文书管理 | 病历内容、签名、归档状态 |
| AR-009 | 用户聚合 | UserAggregate | 系统 | 用户账号管理 | 用户信息、角色、权限 |

### 3.2 聚合根详细设计

#### AR-001 患者聚合 (PatientAggregate)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PatientAggregate                            │
│                      [聚合根: Patient]                          │
├─────────────────────────────────────────────────────────────────┤
│ 实体 (Entity):                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Patient (患者主索引)                                    │   │
│   │ - patientId: PatientId (患者ID)                        │   │
│   │ - name: PersonName (姓名)                              │   │
│   │ - gender: Gender (性别)                                │   │
│   │ - birthDate: BirthDate (出生日期)                      │   │
│   │ - idType: IdType (证件类型)                            │   │
│   │ - idNumber: IdNumber (证件号码)                        │   │
│   │ - phone: PhoneNumber (联系电话)                        │   │
│   │ - address: Address (地址)                              │   │
│   │ - empNo: EmpiNo (EMPI编号)                             │   │
│   │ - status: PatientStatus (状态)                         │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 实体集合 (Entity Collection):                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ AllergyIntolerance (过敏信息)                          │   │
│   │ - allergyId: AllergyId                                 │   │
│   │ - allergen: Allergen (过敏原)                          │   │
│   │ - reaction: Reaction (反应)                            │   │
│   │ - severity: Severity (严重程度)                        │   │
│   │ - verifiedDate: VerifiedDate (确认日期)                │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ContactPerson (联系人)                                 │   │
│   │ - contactId: ContactId                                 │   │
│   │ - relationship: Relationship (关系)                    │   │
│   │ - name: PersonName                                     │   │
│   │ - phone: PhoneNumber                                   │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 值对象 (Value Object):                                          │
│   - PatientId: 患者唯一标识                                     │
│   - PersonName: 姓名(姓+名)                                     │
│   - Gender: 性别枚举                                            │
│   - BirthDate: 出生日期                                         │
│   - PhoneNumber: 电话号码                                       │
│   - Address: 地址(省/市/区/详细)                                │
│   - EmpiNo: 患者主索引号                                        │
├─────────────────────────────────────────────────────────────────┤
│ 领域行为 (Domain Behavior):                                     │
│   + updateBasicInfo(): 更新基本信息                             │
│   + addAllergy(Allergen): 添加过敏信息                          │
│   + removeAllergy(AllergyId): 移除过敏信息                      │
│   + addContact(ContactPerson): 添加联系人                       │
│   + mergeWith(Patient): 合并患者(EMPI合并)                      │
│   + activate(): 激活患者                                        │
│   + deactivate(): 停用患者                                      │
├─────────────────────────────────────────────────────────────────┤
│ 不变量 (Invariant):                                             │
│   - 患者ID全局唯一                                              │
│   - EMPI编号全局唯一                                            │
│   - 证件号码同一类型唯一                                         │
│   - 过敏信息不可重复                                             │
└─────────────────────────────────────────────────────────────────┘
```

**FHIR映射**: `Patient` 资源

#### AR-002 就诊聚合 (EncounterAggregate)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EncounterAggregate                           │
│                     [聚合根: Encounter]                         │
├─────────────────────────────────────────────────────────────────┤
│ 实体 (Entity):                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Encounter (就诊记录)                                    │   │
│   │ - encounterId: EncounterId (就诊ID)                    │   │
│   │ - patientId: PatientId (患者ID)                        │   │
│   │ - encounterType: EncounterType (门诊/住院/急诊)        │   │
│   │ - status: EncounterStatus (状态)                       │   │
│   │ - serviceType: ServiceType (就诊类型)                  │   │
│   │ - departmentId: DepartmentId (科室)                    │   │
│   │ - practitionerId: PractitionerId (接诊医生)            │   │
│   │ - period: Period (就诊时间段)                          │   │
│   │ - reasonForVisit: ReasonForVisit (就诊原因)            │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 实体集合 (Entity Collection):                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Diagnosis (诊断)                                       │   │
│   │ - diagnosisId: DiagnosisId                             │   │
│   │ - icdCode: IcdCode (ICD-10编码)                        │   │
│   │ - diagnosisName: DiagnosisName (诊断名称)              │   │
│   │ - diagnosisType: DiagnosisType (主诊/副诊)             │   │
│   │ - diagnosisDate: DiagnosisDate (诊断日期)              │   │
│   │ - practitionerId: PractitionerId (诊断医生)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ EncounterLocation (就诊位置)                           │   │
│   │ - locationId: LocationId                               │   │
│   │ - bedId: BedId (床位ID)                                │   │
│   │ - period: Period (占用时间)                            │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 值对象 (Value Object):                                          │
│   - EncounterId: 就诊唯一标识                                   │
│   - EncounterType: 就诊类型枚举(门诊/住院/急诊)                  │
│   - EncounterStatus: 就诊状态枚举                               │
│   - Period: 时间段(开始时间+结束时间)                            │
│   - IcdCode: ICD-10编码                                         │
├─────────────────────────────────────────────────────────────────┤
│ 领域行为 (Domain Behavior):                                     │
│   + start(): 开始就诊                                           │
│   + addDiagnosis(Diagnosis): 添加诊断                           │
│   + updateStatus(EncounterStatus): 更新状态                     │
│   + assignBed(BedId): 分配床位(住院)                            │
│   + discharge(): 结束就诊                                       │
├─────────────────────────────────────────────────────────────────┤
│ 不变量 (Invariant):                                             │
│   - 就诊必须关联有效患者                                         │
│   - 主诊断唯一                                                   │
│   - 状态流转符合状态机规则                                       │
└─────────────────────────────────────────────────────────────────┘
```

**FHIR映射**: `Encounter` 资源

#### AR-003 医嘱聚合 (OrderAggregate)

```
┌─────────────────────────────────────────────────────────────────┐
│                      OrderAggregate                             │
│                       [聚合根: Order]                           │
├─────────────────────────────────────────────────────────────────┤
│ 实体 (Entity):                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Order (医嘱)                                           │   │
│   │ - orderId: OrderId (医嘱ID)                            │   │
│   │ - encounterId: EncounterId (就诊ID)                    │   │
│   │ - patientId: PatientId (患者ID)                        │   │
│   │ - orderType: OrderType (医嘱类型)                      │   │
│   │ - orderCategory: OrderCategory (长期/临时)             │   │
│   │ - status: OrderStatus (状态)                           │   │
│   │ - orderingPractitioner: PractitionerId (开立医生)      │   │
│   │ - orderTime: OrderTime (开立时间)                      │   │
│   │ - verifyingNurse: PractitionerId (审核护士)            │   │
│   │ - verifyTime: VerifyTime (审核时间)                    │   │
│   │ - effectivePeriod: EffectivePeriod (有效时间)          │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 实体集合 (Entity Collection):                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ OrderItem (医嘱明细)                                   │   │
│   │ - itemId: OrderItemId                                  │   │
│   │ - itemType: ItemType (药品/检查/检验/护理)             │   │
│   │ - itemCode: ItemCode (项目编码)                        │   │
│   │ - itemName: ItemName (项目名称)                        │   │
│   │ - dosage: Dosage (剂量)                                │   │
│   │ - route: Route (给药途径)                              │   │
│   │ - frequency: Frequency (频次)                          │   │
│   │ - duration: Duration (天数)                            │   │
│   │ - quantity: Quantity (数量)                            │   │
│   │ - instructions: Instructions (用法说明)                │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ OrderExecution (医嘱执行记录)                          │   │
│   │ - executionId: ExecutionId                             │   │
│   │ - executeTime: ExecuteTime (执行时间)                  │   │
│   │ - executor: PractitionerId (执行人)                    │   │
│   │ - executeResult: ExecuteResult (执行结果)              │   │
│   │ - executeStatus: ExecuteStatus (执行状态)              │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 值对象 (Value Object):                                          │
│   - OrderId: 医嘱唯一标识                                       │
│   - OrderType: 医嘱类型枚举(药品/检查/检验/护理/膳食)            │
│   - OrderCategory: 医嘱类别枚举(长期/临时)                       │
│   - OrderStatus: 医嘱状态枚举                                   │
│   - Dosage: 剂量(值+单位)                                       │
│   - Route: 给药途径枚举                                         │
│   - Frequency: 频次枚举                                         │
├─────────────────────────────────────────────────────────────────┤
│ 领域行为 (Domain Behavior):                                     │
│   + create(): 创建医嘱                                          │
│   + verify(PractitionerId): 审核医嘱                            │
│   + reject(String): 退回医嘱                                    │
│   + execute(ExecutionRecord): 执行医嘱                          │
│   + complete(): 完成医嘱                                        │
│   + discontinue(String): 停止医嘱                               │
│   + void(String): 作废医嘱                                      │
├─────────────────────────────────────────────────────────────────┤
│ 状态机 (State Machine):                                         │
│   ┌─────────┐    提交    ┌─────────┐    审核通过    ┌─────────┐│
│   │  开立   │ ─────────> │  审核   │ ────────────> │ 执行中  ││
│   └─────────┘            └─────────┘               └─────────┘│
│        │                      │                        │       │
│        │ 作废                 │ 退回                   │ 完成   │
│        v                      v                        v       │
│   ┌─────────┐            ┌─────────┐            ┌─────────┐   │
│   │ 已作废  │            │  开立   │            │ 已完成  │   │
│   └─────────┘            └─────────┘            └─────────┘   │
│                              │                                  │
│                              │ 停止                             │
│                              v                                  │
│                         ┌─────────┐                            │
│                         │ 已停止  │                            │
│                         └─────────┘                            │
├─────────────────────────────────────────────────────────────────┤
│ 不变量 (Invariant):                                             │
│   - 医嘱必须关联有效就诊                                         │
│   - 长期医嘱停止需提前一天                                        │
│   - 状态流转严格按状态机                                         │
│   - 已执行医嘱不可作废                                           │
└─────────────────────────────────────────────────────────────────┘
```

**FHIR映射**: `ServiceRequest` / `MedicationRequest` 资源

#### AR-004 处方聚合 (PrescriptionAggregate)

```
┌─────────────────────────────────────────────────────────────────┐
│                   PrescriptionAggregate                         │
│                    [聚合根: Prescription]                       │
├─────────────────────────────────────────────────────────────────┤
│ 实体 (Entity):                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Prescription (处方)                                     │   │
│   │ - prescriptionId: PrescriptionId (处方ID)              │   │
│   │ - prescriptionNo: PrescriptionNo (处方编号)            │   │
│   │ - encounterId: EncounterId (就诊ID)                    │   │
│   │ - patientId: PatientId (患者ID)                        │   │
│   │ - prescriber: PractitionerId (开方医生)                │   │
│   │ - prescriptionTime: PrescriptionTime (开方时间)        │   │
│   │ - status: PrescriptionStatus (状态)                    │   │
│   │ - prescriptionType: PrescriptionType (处方类型)        │   │
│   │ - totalAmount: Money (总金额)                          │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 实体集合 (Entity Collection):                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ PrescriptionItem (处方明细)                            │   │
│   │ - itemId: PrescriptionItemId                           │   │
│   │ - drugId: DrugId (药品ID)                              │   │
│   │ - drugName: DrugName (药品名称)                        │   │
│   │ - specification: Specification (规格)                  │   │
│   │ - dosage: Dosage (剂量)                                │   │
│   │ - route: Route (给药途径)                              │   │
│   │ - frequency: Frequency (频次)                          │   │
│   │ - duration: Duration (天数)                            │   │
│   │ - quantity: Quantity (数量)                            │   │
│   │ - unitPrice: Money (单价)                              │   │
│   │ - amount: Money (金额)                                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ PrescriptionReview (处方审核记录)                      │   │
│   │ - reviewId: ReviewId                                   │   │
│   │ - reviewer: PractitionerId (审核药师)                  │   │
│   │ - reviewTime: ReviewTime (审核时间)                    │   │
│   │ - reviewResult: ReviewResult (审核结果)                │   │
│   │ - reviewComments: ReviewComments (审核意见)            │   │
│   │ - cdsAlerts: List<CdsAlert> (CDS警告)                  │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 值对象 (Value Object):                                          │
│   - PrescriptionId: 处方唯一标识                                │
│   - PrescriptionStatus: 处方状态枚举                            │
│   - PrescriptionType: 处方类型枚举(普通/急诊/儿科/麻醉)          │
│   - Money: 金额(值+币种)                                        │
│   - CdsAlert: CDS警告信息                                       │
├─────────────────────────────────────────────────────────────────┤
│ 领域行为 (Domain Behavior):                                     │
│   + create(): 创建处方                                          │
│   + submit(): 提交处方                                          │
│   + review(ReviewResult): 审核处方                              │
│   + dispense(DispenseRecord): 调配发药                         │
│   + return(String): 退药                                        │
├─────────────────────────────────────────────────────────────────┤
│ 状态机 (State Machine):                                         │
│   ┌─────────┐    提交    ┌─────────┐    审核通过    ┌─────────┐│
│   │  开立   │ ─────────> │ 审核中  │ ────────────> │审核通过 ││
│   └─────────┘            └─────────┘               └─────────┘│
│                                │                      │        │
│                                │ 退回                 │ 调配    │
│                                v                      v        │
│                          ┌─────────┐            ┌─────────┐    │
│                          │审核退回 │            │ 已调配  │    │
│                          └─────────┘            └─────────┘    │
│                                                      │        │
│                                                      │ 发药    │
│                                                      v        │
│                                                 ┌─────────┐   │
│                                                 │ 已发药  │   │
│                                                 └─────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 不变量 (Invariant):                                             │
│   - 处方必须经审核方可调配                                       │
│   - 麻醉处方需五专管理                                           │
│   - 处方金额>500元需二次确认                                     │
│   - 发药时库存原子扣减                                           │
└─────────────────────────────────────────────────────────────────┘
```

**FHIR映射**: `MedicationRequest` 资源

#### AR-005 药品聚合 (DrugAggregate)

```
┌─────────────────────────────────────────────────────────────────┐
│                      DrugAggregate                              │
│                       [聚合根: Drug]                            │
├─────────────────────────────────────────────────────────────────┤
│ 实体 (Entity):                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Drug (药品)                                             │   │
│   │ - drugId: DrugId (药品ID)                              │   │
│   │ - drugCode: DrugCode (药品编码)                        │   │
│   │ - drugName: DrugName (药品名称)                        │   │
│   │ - genericName: GenericName (通用名)                    │   │
│   │ - specification: Specification (规格)                  │   │
│   │ - dosageForm: DosageForm (剂型)                        │   │
│   │ - manufacturer: Manufacturer (生产厂家)                │   │
│   │ - drugCategory: DrugCategory (药品类别)                │   │
│   │ - controlledLevel: ControlledLevel (管制级别)          │   │
│   │ - status: DrugStatus (状态)                            │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 实体集合 (Entity Collection):                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ DrugInventory (药品库存)                               │   │
│   │ - inventoryId: InventoryId                             │   │
│   │ - batchNo: BatchNo (批号)                              │   │
│   │ - expiryDate: ExpiryDate (效期)                        │   │
│   │ - quantity: Quantity (库存数量)                        │   │
│   │ - safetyStock: SafetyStock (安全库存)                  │   │
│   │ - location: Location (货位)                            │   │
│   │ - purchasePrice: Money (进价)                          │   │
│   │ - retailPrice: Money (零售价)                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ DrugInteraction (药物相互作用)                         │   │
│   │ - interactionId: InteractionId                         │   │
│   │ - interactingDrugId: DrugId (相互作用药品)             │   │
│   │ - interactionType: InteractionType (相互作用类型)      │   │
│   │ - severity: Severity (严重程度)                        │   │
│   │ - description: Description (描述)                      │   │
│   │ - recommendation: Recommendation (建议)                │   │
│   └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ 值对象 (Value Object):                                          │
│   - DrugId: 药品唯一标识                                        │
│   - DrugCode: 药品编码                                          │
│   - DosageForm: 剂型枚举                                        │
│   - ControlledLevel: 管制级别枚举(普通/精神/麻醉)                │
│   - DrugStatus: 药品状态枚举                                    │
│   - BatchNo: 批号                                               │
│   - ExpiryDate: 效期                                            │
├─────────────────────────────────────────────────────────────────┤
│ 领域行为 (Domain Behavior):                                     │
│   + activate(): 启用药品                                        │
│   + deactivate(): 停用药品                                      │
│   + addInventory(BatchNo, Quantity): 入库                       │
│   + deductInventory(BatchNo, Quantity): 出库                    │
│   + checkExpiry(): 检查效期                                     │
│   + checkSafetyStock(): 检查安全库存                            │
├─────────────────────────────────────────────────────────────────┤
│ 不变量 (Invariant):                                             │
│   - 药品编码全局唯一                                             │
│   - 库存不可为负                                                 │
│   - 麻醉药品需五专管理                                           │
│   - 出库遵循先进先出原则                                         │
└─────────────────────────────────────────────────────────────────┘
```

**FHIR映射**: `Medication` 资源

---

## 4. 领域服务 (Domain Service)

### 4.1 领域服务定义表

| 服务编号 | 服务名称 | 英文标识 | 所属上下文 | 职责 | 关联聚合根 |
|----------|----------|----------|------------|------|------------|
| DS-001 | CDS校验服务 | CdsService | 共享内核 | 临床决策支持，药物相互作用/过敏/剂量校验 | Order, Prescription |
| DS-002 | 闭环给药服务 | ClosedLoopMedicationService | 住院 | 腕带+条码双重核对，确保给药安全 | Order, MedicationAdmin |
| DS-003 | 危急值管理服务 | CriticalValueService | 检验 | 危急值检出、通知、确认、超时升级 | LabReport, CriticalValue |
| DS-004 | 床位分配服务 | BedAllocationService | 住院 | 根据性别/病种/感染因素分配床位 | Admission, Encounter |
| DS-005 | EMPI服务 | EmpiService | 共享内核 | 患者主索引管理，重复检测与合并 | Patient |
| DS-006 | 处方审核服务 | PrescriptionReviewService | 药品 | 处方合理性审核，配伍禁忌检查 | Prescription |
| DS-007 | 标本追踪服务 | SpecimenTrackingService | 检验 | 标本全流程条码追踪 | Specimen |
| DS-008 | 病历质控服务 | QualityControlService | 电子病历 | 病历时限质控，完整性检查 | MedicalRecord |
| DS-009 | 医保结算服务 | InsuranceSettlementService | 财务 | 医保实时对接结算 | Settlement |
| DS-010 | 权限授权服务 | AuthorizationService | 系统 | RBAC权限校验 | User, Role |

### 4.2 核心领域服务详细设计

#### DS-001 CDS校验服务 (CdsService)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CdsService                              │
│                     [领域服务: 临床决策支持]                     │
├─────────────────────────────────────────────────────────────────┤
│ 职责描述:                                                       │
│   在医嘱/处方开立时进行四维临床决策支持校验：                    │
│   1. 药物-药物相互作用检查                                      │
│   2. 基于患者过敏史的药物过敏警告                               │
│   3. 基于年龄/体重/肾功能的剂量合理性提示                        │
│   4. 配伍禁忌检查                                               │
├─────────────────────────────────────────────────────────────────┤
│ 接口定义:                                                       │
│   + validateDrugInteraction(drugs: List<DrugId>): CdsResult    │
│   + validateAllergy(patientId: PatientId, drugs: List<DrugId>):│
│     CdsResult                                                   │
│   + validateDosage(patientId: PatientId, drug: DrugId,         │
│     dosage: Dosage): CdsResult                                  │
│   + validateIncompatibility(drugs: List<DrugId>): CdsResult    │
│   + validatePrescription(prescription: Prescription): CdsResult│
├─────────────────────────────────────────────────────────────────┤
│ 业务规则:                                                       │
│   - BR-OP-006: 处方开立CDS校验                                  │
│   - BR-IP-005: 住院医嘱CDS校验                                  │
│   - BR-PHARM-006: 药物相互作用全覆盖检查                        │
├─────────────────────────────────────────────────────────────────┤
│ 跨上下文依赖:                                                   │
│   - PatientAggregate (患者过敏信息)                             │
│   - DrugAggregate (药物相互作用数据)                            │
├─────────────────────────────────────────────────────────────────┤
│ 返回值对象:                                                     │
│   CdsResult {                                                   │
│     passed: Boolean                                             │
│     alerts: List<CdsAlert>                                      │
│   }                                                             │
│   CdsAlert {                                                    │
│     alertType: AlertType (相互作用/过敏/剂量/配伍)              │
│     severity: Severity (高/中/低)                               │
│     message: String                                             │
│     recommendation: String                                      │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

#### DS-002 闭环给药服务 (ClosedLoopMedicationService)

```
┌─────────────────────────────────────────────────────────────────┐
│               ClosedLoopMedicationService                       │
│                  [领域服务: 闭环给药]                            │
├─────────────────────────────────────────────────────────────────┤
│ 职责描述:                                                       │
│   实现HIMSS EMRAM Stage 5级闭环给药流程：                       │
│   1. 扫描患者腕带验证身份                                       │
│   2. 扫描药品条码验证药品                                       │
│   3. 双重匹配确认后执行给药                                     │
│   4. 记录eMAR并自动记账                                         │
├─────────────────────────────────────────────────────────────────┤
│ 接口定义:                                                       │
│   + scanWristband(orderId: OrderId, wristbandCode: String):   │
│     ScanResult                                                  │
│   + scanDrugBarcode(orderId: OrderId, drugBarcode: String):   │
│     ScanResult                                                  │
│   + verifyAndAdminister(orderId: OrderId, nurseId:             │
│     PractitionerId): AdministrationResult                       │
│   + recordAdministration(orderId: OrderId, record:             │
│     AdministrationRecord): void                                 │
├─────────────────────────────────────────────────────────────────┤
│ 业务规则:                                                       │
│   - BR-IP-010: 腕带+条码双重核对                                │
│   - BR-IP-011: 腕带/条码不匹配停止给药                          │
├─────────────────────────────────────────────────────────────────┤
│ 跨上下文依赖:                                                   │
│   - OrderAggregate (医嘱信息)                                   │
│   - PatientAggregate (患者信息)                                 │
│   - DrugAggregate (药品信息)                                    │
│   - FinanceContext (自动记账)                                   │
├─────────────────────────────────────────────────────────────────┤
│ 返回值对象:                                                     │
│   ScanResult {                                                  │
│     matched: Boolean                                            │
│     patientInfo: PatientInfo                                    │
│     drugInfo: DrugInfo                                          │
│     errorMessage: String                                        │
│   }                                                             │
│   AdministrationResult {                                        │
│     success: Boolean                                            │
│     administrationId: AdministrationId                          │
│     timestamp: DateTime                                         │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

#### DS-003 危急值管理服务 (CriticalValueService)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CriticalValueService                         │
│                   [领域服务: 危急值管理]                         │
├─────────────────────────────────────────────────────────────────┤
│ 职责描述:                                                       │
│   管理检验危急值全流程：                                         │
│   1. 检验结果危急值自动识别                                     │
│   2. 15分钟内通知临床科室                                       │
│   3. 确认接收，超时自动升级                                     │
├─────────────────────────────────────────────────────────────────┤
│ 接口定义:                                                       │
│   + detectCriticalValue(labResult: LabResult):                  │
│     CriticalValueDetectedEvent                                  │
│   + notifyClinicalDept(criticalValueId: CriticalValueId):      │
│     NotificationResult                                          │
│   + confirmReceipt(criticalValueId: CriticalValueId,          │
│     receiverId: PractitionerId): void                           │
│   + escalateIfNeeded(criticalValueId: CriticalValueId): void   │
├─────────────────────────────────────────────────────────────────┤
│ 业务规则:                                                       │
│   - BR-LIS-002: 危急值15分钟内通报                              │
│   - BR-LIS-004: 结果异常自动标识                                │
├─────────────────────────────────────────────────────────────────┤
│ 领域事件发布:                                                   │
│   - CriticalValueDetected (危急值检出)                          │
│   - CriticalValueNotified (危急值已通知)                        │
│   - CriticalValueConfirmed (危急值已确认)                       │
│   - CriticalValueEscalated (危急值升级)                         │
├─────────────────────────────────────────────────────────────────┤
│ 定时任务:                                                       │
│   - 每1分钟检查未确认危急值，超15分钟自动升级                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 领域事件 (Domain Event)

### 5.1 领域事件定义表

| 事件编号 | 事件名称 | 英文标识 | 发布方 | 订阅方 | 事件数据 | 触发场景 |
|----------|----------|----------|--------|--------|----------|----------|
| DE-001 | 患者挂号完成 | PatientRegistered | 门诊上下文 | 财务/检验/影像 | patientId, registrationId, deptId | 患者完成挂号 |
| DE-002 | 就诊开始 | EncounterStarted | 门诊/住院上下文 | 系统 | encounterId, patientId, practitionerId | 医生开始接诊 |
| DE-003 | 医嘱开立 | OrderCreated | 住院上下文 | 药品/检验/影像/财务 | orderId, patientId, orderType | 医生提交医嘱 |
| DE-004 | 医嘱审核完成 | OrderVerified | 住院上下文 | 药品/财务 | orderId, verifierId | 护士审核医嘱 |
| DE-005 | 医嘱执行完成 | OrderExecuted | 住院上下文 | 财务 | orderId, executorId, executeTime | 医嘱执行完成 |
| DE-006 | 处方开立 | PrescriptionCreated | 门诊上下文 | 药品 | prescriptionId, patientId | 医生开具处方 |
| DE-007 | 处方审核完成 | PrescriptionReviewed | 药品上下文 | 财务 | prescriptionId, reviewerId, result | 药师审核处方 |
| DE-008 | 药品发放完成 | DrugDispensed | 药品上下文 | 财务 | prescriptionId, drugIds | 药房发药 |
| DE-009 | 给药完成 | MedicationAdministered | 住院上下文 | 财务 | orderId, patientId, nurseId, time | 护士完成给药 |
| DE-010 | 危急值检出 | CriticalValueDetected | 检验上下文 | 住院/系统 | criticalValueId, patientId, labResult | 检验发现危急值 |
| DE-011 | 危急值确认 | CriticalValueConfirmed | 检验上下文 | 系统 | criticalValueId, confirmerId | 临床确认危急值 |
| DE-012 | 检验报告发布 | LabReportReady | 检验上下文 | 门诊/住院 | reportId, patientId | 检验报告完成 |
| DE-013 | 影像报告发布 | ImagingReportReady | 影像上下文 | 门诊/住院 | reportId, patientId | 影像报告完成 |
| DE-014 | 患者入院 | PatientAdmitted | 住院上下文 | 系统/财务 | admissionId, patientId, bedId | 患者办理入院 |
| DE-015 | 患者出院 | PatientDischarged | 住院上下文 | 财务/系统 | admissionId, patientId, dischargeTime | 患者办理出院 |
| DE-016 | 病历归档 | MedicalRecordArchived | 电子病历上下文 | 系统 | recordId, patientId | 病历归档完成 |
| DE-017 | 库存不足预警 | InventoryLowAlert | 药品上下文 | 系统 | drugId, currentStock, safetyStock | 库存低于安全线 |
| DE-018 | 近效期预警 | DrugExpiringAlert | 药品上下文 | 系统 | drugId, batchNo, expiryDate | 药品效期≤3个月 |
| DE-019 | 结算完成 | SettlementCompleted | 财务上下文 | 系统 | settlementId, patientId, amount | 费用结算完成 |
| DE-020 | 诊断更新 | DiagnosisUpdated | 门诊/住院上下文 | 电子病历 | encounterId, diagnosisIds | 诊断信息变更 |

### 5.2 领域事件详细定义

#### DE-003 医嘱开立事件 (OrderCreated)

```json
{
  "eventId": "uuid",
  "eventType": "OrderCreated",
  "eventTime": "2026-06-16T10:30:00Z",
  "aggregateId": "orderId",
  "aggregateType": "Order",
  "eventData": {
    "orderId": "ORD20260616001",
    "encounterId": "ENC20260616001",
    "patientId": "PAT00001",
    "patientName": "张三",
    "orderType": "MEDICATION",
    "orderCategory": "LONG_TERM",
    "orderItems": [
      {
        "itemId": "ITEM001",
        "itemCode": "DRUG001",
        "itemName": "头孢呋辛钠注射液",
        "dosage": "1.5g",
        "route": "IV",
        "frequency": "Q12H"
      }
    ],
    "orderingPractitioner": {
      "practitionerId": "DOC001",
      "practitionerName": "李医生"
    },
    "orderTime": "2026-06-16T10:30:00Z"
  },
  "metadata": {
    "source": "InpatientContext",
    "version": "1.0"
  }
}
```

#### DE-010 危急值检出事件 (CriticalValueDetected)

```json
{
  "eventId": "uuid",
  "eventType": "CriticalValueDetected",
  "eventTime": "2026-06-16T14:00:00Z",
  "aggregateId": "criticalValueId",
  "aggregateType": "CriticalValue",
  "eventData": {
    "criticalValueId": "CV20260616001",
    "patientId": "PAT00001",
    "patientName": "张三",
    "encounterId": "ENC20260616001",
    "labResultId": "LAB20260616001",
    "testItem": "血钾",
    "testValue": "6.8 mmol/L",
    "referenceRange": "3.5-5.3 mmol/L",
    "criticalLevel": "HIGH",
    "specimenTime": "2026-06-16T13:30:00Z",
    "detectedBy": {
      "technicianId": "TECH001",
      "technicianName": "王技师"
    },
    "notificationDeadline": "2026-06-16T14:15:00Z"
  },
  "metadata": {
    "source": "LaboratoryContext",
    "version": "1.0"
  }
}
```

### 5.3 事件驱动流程

#### 闭环给药事件流

```
┌─────────────────────────────────────────────────────────────────┐
│                      闭环给药事件流                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [住院上下文]              [药品上下文]              [财务上下文]│
│       │                        │                        │       │
│   OrderCreated ─────────────────┼────────────────────────│       │
│       │                        │                        │       │
│       v                        v                        │       │
│   OrderVerified ────────> PrescriptionReviewed          │       │
│       │                        │                        │       │
│       │                        v                        │       │
│       │                  DrugDispensed ─────────────────┤       │
│       │                        │                        │       │
│       v                        │                        │       │
│  MedicationAdministered ───────┼───────────────────> ChargeCreated
│       │                        │                        │       │
│       v                        │                        v       │
│  OrderExecuted                 │                  SettlementCompleted
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 上下文映射 (Context Map)

### 6.1 上下文映射图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              YUDAO-AI-HIS Context Map                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         共享内核 (Shared Kernel)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  PatientAggregate (患者聚合)                                    │    │   │
│  │  │  - PatientId, PersonName, Gender, BirthDate                    │    │   │
│  │  │  - AllergyIntolerance, ContactPerson                           │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  DomainEvent (领域事件定义)                                     │    │   │
│  │  │  - 事件ID, 事件类型, 事件时间, 事件数据结构                     │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────────┐    OHS/PLW     ┌───────────────────┐                    │
│  │  系统上下文        │<──────────────│  门诊上下文        │                    │
│  │  SystemContext    │                │  OutpatientContext│                    │
│  │  [ACL]            │    OHS/PLW     │                   │                    │
│  │                   │<───────────────│                   │                    │
│  └───────────────────┘                └───────────────────┘                    │
│          │                                    │                                │
│          │ OHS/PLW                             │ CF                             │
│          v                                    v                                │
│  ┌───────────────────┐    CF/ACL      ┌───────────────────┐                    │
│  │  财务上下文        │<──────────────│  住院上下文        │                    │
│  │  FinanceContext   │                │  InpatientContext │                    │
│  │                   │    CF          │                   │                    │
│  │                   │<───────────────│                   │                    │
│  └───────────────────┘                └───────────────────┘                    │
│          │                                    │                                │
│          │                                    │ ACL                            │
│          │                                    v                                │
│          │                           ┌───────────────────┐                    │
│          │                           │  药品上下文        │                    │
│          │                           │  MedicationContext│                    │
│          │                           │                   │                    │
│          │                           └───────────────────┘                    │
│          │                                    │                                │
│          │                                    │ ACL                            │
│          │                                    v                                │
│          │                           ┌───────────────────┐                    │
│          │                           │  检验上下文        │                    │
│          │                           │  LaboratoryContext│                    │
│          │                           │                   │                    │
│          │                           └───────────────────┘                    │
│          │                                    │                                │
│          │                                    │ ACL                            │
│          │                                    v                                │
│          │                           ┌───────────────────┐                    │
│          │                           │  影像上下文        │                    │
│          │                           │  RadiologyContext │                    │
│          │                           │                   │                    │
│          │                           └───────────────────┘                    │
│          │                                    │                                │
│          │                                    │ OHS/PLW                        │
│          v                                    v                                │
│  ┌───────────────────┐    ACL          ┌───────────────────┐                    │
│  │  电子病历上下文    │<───────────────│  (所有临床上下文)  │                    │
│  │  EMRContext       │                 │                   │                    │
│  │                   │                 │                   │                    │
│  └───────────────────┘                 └───────────────────┘                    │
│                                                                                 │
│  图例:                                                                          │
│  OHS = Open Host Service (开放主机服务)                                         │
│  PLW = Published Language (发布语言)                                            │
│  CF = Customer-Supplier (客户-供应商)                                           │
│  ACL = Anti-Corruption Layer (防腐层)                                           │
│  SK = Shared Kernel (共享内核)                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 上下文关系定义表

| 上游上下文 | 下游上下文 | 关系模式 | 集成方式 | 说明 |
|------------|------------|----------|----------|------|
| 共享内核 | 所有上下文 | 共享内核 (SK) | 直接引用 | 患者聚合、领域事件定义共享 |
| 系统上下文 | 门诊上下文 | 开放主机服务 (OHS) | API调用 | 权限校验、用户信息查询 |
| 系统上下文 | 住院上下文 | 开放主机服务 (OHS) | API调用 | 权限校验、用户信息查询 |
| 门诊上下文 | 财务上下文 | 客户-供应商 (CF) | 领域事件 | 处方/收费触发计费 |
| 住院上下文 | 财务上下文 | 客户-供应商 (CF) | 领域事件 | 医嘱执行自动记账 |
| 住院上下文 | 药品上下文 | 防腐层 (ACL) | 领域事件+API | 医嘱转处方，库存校验 |
| 门诊上下文 | 药品上下文 | 防腐层 (ACL) | 领域事件+API | 处方审核、发药 |
| 检验上下文 | 住院上下文 | 防腐层 (ACL) | 领域事件 | 危急值通知、报告回传 |
| 影像上下文 | 住院上下文 | 防腐层 (ACL) | 领域事件 | 报告回传 |
| 所有临床上下文 | 电子病历上下文 | 开放主机服务 (OHS) | 领域事件 | 病历数据归档 |

### 6.3 防腐层设计 (Anti-Corruption Layer)

#### 住院上下文 → 药品上下文 防腐层

```
┌─────────────────────────────────────────────────────────────────┐
│                    Anti-Corruption Layer                        │
│              InpatientContext → MedicationContext              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              OrderToPrescriptionTranslator                │  │
│  │  [医嘱转处方翻译器]                                        │  │
│  │                                                           │  │
│  │  + translate(order: Order): PrescriptionDTO              │  │
│  │    - 药品医嘱 → 处方DTO                                   │  │
│  │    - 映射药品编码、剂量、频次                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MedicationFacade                             │  │
│  │  [药品服务门面]                                            │  │
│  │                                                           │  │
│  │  + checkDrugStock(drugId: DrugId): StockResult           │  │
│  │  + submitPrescription(dto: PrescriptionDTO): Result      │  │
│  │  + getDrugInfo(drugId: DrugId): DrugInfo                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              InventoryEventSubscriber                     │  │
│  │  [库存事件订阅者]                                          │  │
│  │                                                           │  │
│  │  + onInventoryLowAlert(event: InventoryLowAlert): void   │  │
│  │  + onDrugExpiringAlert(event: DrugExpiringAlert): void   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. 值对象定义 (Value Object)

### 7.1 核心值对象定义表

| 值对象编号 | 值对象名称 | 英文标识 | 属性 | 所属聚合 | 业务含义 |
|------------|------------|----------|------|----------|----------|
| VO-001 | 患者ID | PatientId | String id | Patient | 患者唯一标识 |
| VO-002 | 就诊ID | EncounterId | String id | Encounter | 就诊唯一标识 |
| VO-003 | 医嘱ID | OrderId | String id | Order | 医嘱唯一标识 |
| VO-004 | 处方ID | PrescriptionId | String id | Prescription | 处方唯一标识 |
| VO-005 | 时间段 | Period | DateTime start, DateTime end | Encounter/Order | 开始和结束时间 |
| VO-006 | 剂量 | Dosage | BigDecimal value, String unit | Order/Prescription | 药品剂量 |
| VO-007 | 给药途径 | Route | String code, String name | Order/Prescription | 药品给药方式 |
| VO-008 | 频次 | Frequency | String code, String name, Integer timesPerDay | Order/Prescription | 用药频次 |
| VO-009 | ICD-10编码 | IcdCode | String code, String name | Diagnosis | 疾病诊断编码 |
| VO-010 | 金额 | Money | BigDecimal amount, String currency | Prescription/Settlement | 货币金额 |
| VO-011 | 电话号码 | PhoneNumber | String countryCode, String number | Patient/Contact | 联系电话 |
| VO-012 | 地址 | Address | String province, String city, String district, String detail | Patient | 居住地址 |
| VO-013 | 批号 | BatchNo | String code, Date productionDate, Date expiryDate | DrugInventory | 药品批次标识 |
| VO-014 | CDS警告 | CdsAlert | AlertType type, Severity severity, String message, String recommendation | Prescription | 临床决策警告 |

### 7.2 值对象详细定义

#### VO-006 剂量 (Dosage)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Dosage                                 │
│                      [值对象: 剂量]                              │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                           │
│   - value: BigDecimal (剂量值)                                  │
│   - unit: String (剂量单位: mg/g/ml/片/粒)                      │
├─────────────────────────────────────────────────────────────────┤
│ 行为:                                                           │
│   + format(): String (格式化输出，如"500mg")                    │
│   + convertTo(targetUnit: String): Dosage (单位换算)            │
│   + isGreaterThan(other: Dosage): Boolean                      │
│   + isLessThan(other: Dosage): Boolean                         │
│   + equals(other: Dosage): Boolean                             │
├─────────────────────────────────────────────────────────────────┤
│ 不可变性:                                                       │
│   值对象创建后不可修改，任何变更返回新实例                       │
├─────────────────────────────────────────────────────────────────┤
│ 示例:                                                           │
│   Dosage(500, "mg") → "500mg"                                   │
│   Dosage(1.5, "g") → "1.5g"                                     │
│   Dosage(10, "ml") → "10ml"                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### VO-008 频次 (Frequency)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frequency                               │
│                      [值对象: 频次]                              │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                           │
│   - code: String (频次编码: QD/BID/TID/QID/Q4H/Q8H/PRN)        │
│   - name: String (频次名称: 每日一次/每日二次/每日三次...)      │
│   - timesPerDay: Integer (每日次数)                             │
│   - intervalHours: Integer (间隔小时数)                         │
├─────────────────────────────────────────────────────────────────┤
│ 预定义常量:                                                     │
│   QD = Frequency("QD", "每日一次", 1, 24)                       │
│   BID = Frequency("BID", "每日二次", 2, 12)                     │
│   TID = Frequency("TID", "每日三次", 3, 8)                      │
│   QID = Frequency("QID", "每日四次", 4, 6)                      │
│   Q4H = Frequency("Q4H", "每4小时一次", 6, 4)                   │
│   Q8H = Frequency("Q8H", "每8小时一次", 3, 8)                   │
│   Q12H = Frequency("Q12H", "每12小时一次", 2, 12)               │
│   PRN = Frequency("PRN", "必要时", null, null)                  │
│   STAT = Frequency("STAT", "立即", 1, 0)                        │
├─────────────────────────────────────────────────────────────────┤
│ 行为:                                                           │
│   + format(): String (格式化输出)                               │
│   + calculateTimesPerDay(): Integer (计算每日次数)              │
│   + isScheduled(): Boolean (是否定时给药)                       │
│   + isPrn(): Boolean (是否按需给药)                             │
└─────────────────────────────────────────────────────────────────┘
```

#### VO-009 ICD-10编码 (IcdCode)

```
┌─────────────────────────────────────────────────────────────────┐
│                          IcdCode                                │
│                    [值对象: ICD-10编码]                          │
├─────────────────────────────────────────────────────────────────┤
│ 属性:                                                           │
│   - code: String (ICD-10编码，如"J18.9")                        │
│   - name: String (诊断名称，如"肺炎")                           │
│   - chapter: String (章节，如"呼吸系统疾病")                    │
│   - category: String (类别)                                     │
├─────────────────────────────────────────────────────────────────┤
│ 校验规则:                                                       │
│   - 编码格式: 1位字母 + 2位数字 + 可选.小数点 + 1-2位数字       │
│   - 正则: ^[A-Z]\d{2}(\.\d{1,2})?$                             │
├─────────────────────────────────────────────────────────────────┤
│ 行为:                                                           │
│   + format(): String (格式化输出)                               │
│   + getChapter(): String (获取章节)                             │
│   + isValid(): Boolean (校验编码有效性)                         │
│   + isChronic(): Boolean (是否慢性病)                           │
│   + isInfectious(): Boolean (是否传染病)                        │
├─────────────────────────────────────────────────────────────────┤
│ 示例:                                                           │
│   IcdCode("J18.9", "肺炎，未特指")                              │
│   IcdCode("I10", "原发性高血压")                                │
│   IcdCode("E11.9", "2型糖尿病")                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 枚举定义 (Enumeration)

### 8.1 核心枚举定义表

| 枚举编号 | 枚举名称 | 英文标识 | 值 | 所属上下文 |
|----------|----------|----------|-----|------------|
| ENUM-001 | 性别 | Gender | MALE, FEMALE, UNKNOWN, OTHER | 共享内核 |
| ENUM-002 | 就诊类型 | EncounterType | OUTPATIENT(门诊), INPATIENT(住院), EMERGENCY(急诊) | 门诊/住院 |
| ENUM-003 | 就诊状态 | EncounterStatus | PLANNED, IN_PROGRESS, FINISHED, CANCELLED | 门诊/住院 |
| ENUM-004 | 医嘱类型 | OrderType | MEDICATION(药品), EXAMINATION(检查), LAB(检验), NURSING(护理), DIET(膳食) | 住院 |
| ENUM-005 | 医嘱类别 | OrderCategory | LONG_TERM(长期), TEMPORARY(临时) | 住院 |
| ENUM-006 | 医嘱状态 | OrderStatus | CREATED(开立), VERIFIED(审核), IN_PROGRESS(执行中), COMPLETED(已完成), DISCONTINUED(已停止), VOIDED(已作废) | 住院 |
| ENUM-007 | 处方类型 | PrescriptionType | NORMAL(普通), EMERGENCY(急诊), PEDIATRIC(儿科), NARCOTIC(麻醉), PSYCHOTROPIC(精神) | 门诊/药品 |
| ENUM-008 | 处方状态 | PrescriptionStatus | CREATED(开立), UNDER_REVIEW(审核中), APPROVED(审核通过), REJECTED(审核退回), DISPENSED(已调配), DISPENSED(已发药), RETURNED(已退药) | 药品 |
| ENUM-009 | 药品管制级别 | ControlledLevel | NORMAL(普通), PSYCHOTROPIC_2(第二类精神), PSYCHOTROPIC_1(第一类精神), NARCOTIC(麻醉) | 药品 |
| ENUM-010 | 危急值级别 | CriticalLevel | LOW(偏低), HIGH(偏高), CRITICAL_LOW(危急偏低), CRITICAL_HIGH(危急偏高) | 检验 |
| ENUM-011 | 标本状态 | SpecimenStatus | COLLECTED(已采集), IN_TRANSIT(运送中), RECEIVED(已接收), REJECTED(已拒收), TESTING(检验中), COMPLETED(已完成) | 检验 |
| ENUM-012 | CDS警告类型 | CdsAlertType | DRUG_INTERACTION(药物相互作用), ALLERGY(过敏), DOSAGE(剂量), INCOMPATIBILITY(配伍禁忌) | 共享内核 |
| ENUM-013 | CDS警告级别 | CdsAlertSeverity | HIGH(高), MEDIUM(中), LOW(低) | 共享内核 |
| ENUM-014 | 病历状态 | MedicalRecordStatus | DRAFT(草稿), SIGNED(已签名), SUBMITTED(已提交), ARCHIVED(已归档), SEALED(已封存) | 电子病历 |

---

## 9. 仓储定义 (Repository)

### 9.1 仓储接口定义表

| 仓储编号 | 仓储名称 | 英文标识 | 所属上下文 | 聚合根 | 核心方法 |
|----------|----------|----------|------------|--------|----------|
| REPO-001 | 患者仓储 | PatientRepository | 共享内核 | Patient | findById, findByEmpiNo, findByIdNumber, save |
| REPO-002 | 就诊仓储 | EncounterRepository | 门诊/住院 | Encounter | findById, findByPatientId, findActiveByPatientId, save |
| REPO-003 | 医嘱仓储 | OrderRepository | 住院 | Order | findById, findByEncounterId, findActiveOrdersByPatientId, save |
| REPO-004 | 处方仓储 | PrescriptionRepository | 门诊/药品 | Prescription | findById, findByEncounterId, findPendingByPatientId, save |
| REPO-005 | 药品仓储 | DrugRepository | 药品 | Drug | findById, findByDrugCode, findByName, save |
| REPO-006 | 库存仓储 | InventoryRepository | 药品 | DrugInventory | findByDrugId, findByBatchNo, deductStock, addStock |
| REPO-007 | 检验申请仓储 | LabOrderRepository | 检验 | LabOrder | findById, findByEncounterId, findPendingByPatientId, save |
| REPO-008 | 标本仓储 | SpecimenRepository | 检验 | Specimen | findById, findByBarcode, updateStatus, save |
| REPO-009 | 病历仓储 | MedicalRecordRepository | 电子病历 | MedicalRecord | findById, findByEncounterId, findArchivedByPatientId, save |

### 9.2 仓储接口定义示例

#### REPO-003 医嘱仓储 (OrderRepository)

```java
/**
 * 医嘱仓储接口
 * 负责医嘱聚合根的持久化和查询
 */
public interface OrderRepository {

    /**
     * 根据ID查找医嘱
     */
    Order findById(OrderId orderId);

    /**
     * 根据就诊ID查找所有医嘱
     */
    List<Order> findByEncounterId(EncounterId encounterId);

    /**
     * 查找患者当前有效的医嘱
     */
    List<Order> findActiveOrdersByPatientId(PatientId patientId);

    /**
     * 查找待审核的医嘱列表
     */
    List<Order> findPendingVerificationByWard(String wardId);

    /**
     * 查找待执行的医嘱列表
     */
    List<Order> findPendingExecutionByNurse(String nurseId);

    /**
     * 保存医嘱
     */
    Order save(Order order);

    /**
     * 批量保存医嘱
     */
    List<Order> saveAll(List<Order> orders);

    /**
     * 删除医嘱（仅用于测试）
     */
    void delete(Order order);
}
```

---

## 10. 领域模型图

### 10.1 核心领域模型关系图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           YUDAO-AI-HIS 核心领域模型                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         PatientAggregate [共享内核]                       │  │
│  │  ┌────────────────┐                                                       │  │
│  │  │    Patient     │◄─────────────────────────────────────────────────┐   │  │
│  │  │   (聚合根)      │                                                    │   │  │
│  │  │                │                                                    │   │  │
│  │  │ - patientId    │                                                    │   │  │
│  │  │ - name         │           ┌────────────────┐                      │   │  │
│  │  │ - gender       │           │ AllergyIntol- │                      │   │  │
│  │  │ - birthDate    │──────────►│   erance      │                      │   │  │
│  │  │ - empNo        │           │   (实体)      │                      │   │  │
│  │  └────────────────┘           └────────────────┘                      │   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│                                         │ 1:N                                  │
│                                         v                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                       EncounterAggregate                                  │  │
│  │  ┌────────────────┐    1:N    ┌────────────────┐                        │  │
│  │  │   Encounter    │──────────►│   Diagnosis    │                        │  │
│  │  │   (聚合根)      │           │   (实体)       │                        │  │
│  │  │                │           └────────────────┘                        │  │
│  │  │ - encounterId  │                                                    │  │
│  │  │ - patientId    │           ┌────────────────┐                        │  │
│  │  │ - status       │──────────►│ EncounterLoc-  │                        │  │
│  │  │ - period       │    1:1    │   ation        │                        │  │
│  │  └────────────────┘           │ (床位分配)     │                        │  │
│  └───────────────────────────────┴────────────────┘────────────────────────┘  │
│                                         │                                      │
│                                         │ 1:N                                  │
│                                         v                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         OrderAggregate                                    │  │
│  │  ┌────────────────┐    1:N    ┌────────────────┐    1:N    ┌──────────┐ │  │
│  │  │     Order      │──────────►│   OrderItem    │──────────►│ OrderEx- │ │  │
│  │  │   (聚合根)      │           │   (实体)       │           │ ecution  │ │  │
│  │  │                │           └────────────────┘           │ (执行记录)│ │  │
│  │  │ - orderId      │                                        └──────────┘ │  │
│  │  │ - status       │                                                     │  │
│  │  │ - orderType    │                                                     │  │
│  │  └────────────────┘                                                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│              ┌──────────────────────────┼──────────────────────────┐           │
│              │                          │                          │           │
│              v                          v                          v           │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐       │
│  │ PrescriptionAggr.  │  │   LabOrderAggr.    │  │ ImagingStudyAggr.  │       │
│  │ (处方聚合)         │  │ (检验申请聚合)     │  │ (影像检查聚合)     │       │
│  │                    │  │                    │  │                    │       │
│  │ - Prescription     │  │ - LabOrder         │  │ - ImagingStudy     │       │
│  │ - PrescriptionItem │  │ - Specimen         │  │ - ImagingReport    │       │
│  │ - PrescriptionReview│  │ - LabReport        │  │                    │       │
│  │                    │  │ - CriticalValue    │  │                    │       │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘       │
│              │                          │                          │           │
│              v                          │                          │           │
│  ┌────────────────────┐                 │                          │           │
│  │   DrugAggregate    │                 │                          │           │
│  │ (药品聚合)         │                 │                          │           │
│  │                    │                 │                          │           │
│  │ - Drug             │                 │                          │           │
│  │ - DrugInventory    │                 │                          │           │
│  │ - DrugInteraction  │                 │                          │           │
│  └────────────────────┘                 │                          │           │
│                                         │                          │           │
│                                         v                          v           │
│                              ┌────────────────────────────────────────┐       │
│                              │        MedicalRecordAggregate          │       │
│                              │           (病历聚合)                   │       │
│                              │                                        │       │
│                              │  - MedicalRecord (病历文书)            │       │
│                              │  - MedicalRecordArchive (病案归档)     │       │
│                              └────────────────────────────────────────┘       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. 模块划分建议

### 11.1 代码模块结构

```
yudao-module-his/
├── yudao-module-patient/              # 患者共享内核模块
│   ├── yudao-module-patient-api/      # 患者API接口
│   │   └── src/main/java/.../api/
│   │       ├── dto/                   # DTO定义
│   │       └── rpc/                   # RPC接口
│   └── yudao-module-patient-biz/      # 患者业务实现
│       └── src/main/java/.../
│           ├── domain/                # 领域层
│           │   ├── aggregate/         # 聚合根
│           │   ├── entity/            # 实体
│           │   ├── valueobject/       # 值对象
│           │   ├── event/             # 领域事件
│           │   └── service/           # 领域服务
│           ├── application/           # 应用层
│           │   ├── service/           # 应用服务
│           │   └── assembler/         # DTO装配器
│           ├── infrastructure/        # 基础设施层
│           │   ├── repository/        # 仓储实现
│           │   ├── gateway/           # 外部网关
│           │   └── mq/                # 消息队列
│           └── interfaces/            # 接口层
│               ├── controller/        # REST控制器
│               └── convertor/         # 对象转换器
│
├── yudao-module-outpatient/           # 门诊上下文模块
│   ├── yudao-module-outpatient-api/
│   └── yudao-module-outpatient-biz/
│
├── yudao-module-inpatient/            # 住院上下文模块
│   ├── yudao-module-inpatient-api/
│   └── yudao-module-inpatient-biz/
│
├── yudao-module-medication/           # 药品上下文模块
│   ├── yudao-module-medication-api/
│   └── yudao-module-medication-biz/
│
├── yudao-module-laboratory/           # 检验上下文模块
│   ├── yudao-module-laboratory-api/
│   └── yudao-module-laboratory-biz/
│
├── yudao-module-radiology/            # 影像上下文模块
│   ├── yudao-module-radiology-api/
│   └── yudao-module-radiology-biz/
│
├── yudao-module-emr/                  # 电子病历上下文模块
│   ├── yudao-module-emr-api/
│   └── yudao-module-emr-biz/
│
├── yudao-module-finance/              # 财务上下文模块
│   ├── yudao-module-finance-api/
│   └── yudao-module-finance-biz/
│
└── yudao-module-system/               # 系统上下文模块
    ├── yudao-module-system-api/
    └── yudao-module-system-biz/
```

---

## 12. 设计决策记录

### 12.1 关键设计决策

| 决策编号 | 决策标题 | 决策内容 | 决策原因 | 替代方案 | 决策日期 |
|----------|----------|----------|----------|----------|----------|
| DDD-001 | 患者聚合放共享内核 | 患者聚合作为共享内核，所有上下文共享 | 患者是核心概念，被所有业务上下文引用 | 每个上下文独立患者实体 | 2026-06-16 |
| DDD-002 | 医嘱和处方分离 | 医嘱聚合属于住院上下文，处方聚合属于药品上下文 | 医嘱是医生的临床决策，处方是药品管理入口 | 合并为一个聚合 | 2026-06-16 |
| DDD-003 | 危急值作为独立实体 | 危急值作为检验聚合内的独立实体 | 危急值有自己的生命周期和状态管理 | 作为检验报告的值对象 | 2026-06-16 |
| DDD-004 | CDS作为领域服务 | CDS校验作为共享的领域服务 | CDS被多个上下文使用，统一规则 | 在各聚合内实现 | 2026-06-16 |
| DDD-005 | 事件驱动集成 | 上下文间通过领域事件异步集成 | 解耦上下文，提高系统弹性 | 同步API调用 | 2026-06-16 |

---

## 附录A: FHIR资源映射表

| DDD概念 | FHIR R4资源 | 映射说明 |
|---------|-------------|----------|
| Patient | Patient | 患者基本信息 |
| Encounter | Encounter | 就诊记录 |
| Diagnosis | Condition | 诊断信息 |
| Order | ServiceRequest / MedicationRequest | 医嘱(检查检验/药品) |
| Prescription | MedicationRequest | 处方 |
| Drug | Medication | 药品信息 |
| AllergyIntolerance | AllergyIntolerance | 过敏信息 |
| LabReport | DiagnosticReport | 检验报告 |
| LabResult | Observation | 检验结果 |
| ImagingStudy | ImagingStudy | 影像检查 |
| ImagingReport | DiagnosticReport | 影像报告 |
| Specimen | Specimen | 标本 |
| MedicationAdministration | MedicationAdministration | 给药记录 |
| MedicalRecord | DocumentReference | 病历文书 |

---

## 附录B: 参考文档

1. Eric Evans - 《领域驱动设计：软件核心复杂性应对之道》
2. Vaughn Vernon - 《实现领域驱动设计》
3. Vaughn Vernon - 《领域驱动设计精粹》
4. HL7 FHIR R4 Specification - https://www.hl7.org/fhir/
5. YUDAO-AI-HIS 产品需求文档 (YUDAO-HIS-PRD-001)
6. YUDAO-AI-HIS 业务规则文档 (YUDAO-HIS-BR-001)
7. HIMSS EMRAM Stage 5 Requirements

---

## 附录C: 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| V1.0 | 2026-06-16 | 初始版本，定义8个界限上下文、9个聚合根、20个领域事件 | YUDAO-AI-HIS架构组 |

---

> **架构师**: ________________
> **领域专家**: ________________
> **最后更新**: 2026-06-16
