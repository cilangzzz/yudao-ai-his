# HIS系统 - 数据字典

> **文档编号**: YUDAO-HIS-DD-001
> **版本**: V1.0
> **编制日期**: 2026-06-15
> **参考标准**: 国卫规划发〔2018〕4号《全国医院信息化建设标准与规范》| HL7 FHIR R4 | ICD-10 | DICOM

---

## 1. 文档说明

### 1.1 编写目的

本文档定义YUDAO-AI-HIS系统的核心数据实体、数据表结构、字段定义和数据编码标准。数据字典作为数据库设计和系统开发的基础参考，确保数据的一致性、完整性和标准化。

### 1.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 表名 | 小写，下划线分隔，模块前缀 | his_patient, op_register |
| 字段名 | 小写，下划线分隔 | patient_id, create_time |
| 主键 | 表名_id 或 id | patient_id |
| 外键 | 关联表名_id | dept_id |
| 状态字段 | 以_status结尾 | visit_status |
| 时间字段 | 以_time或_date结尾 | create_time, visit_date |
| 标志字段 | 以_flag或_is_开头 | is_deleted, pay_flag |

### 1.3 数据类型映射

| 业务类型 | MySQL类型 | 说明 |
|----------|-----------|------|
| 主键 | BIGINT | 自增主键 |
| 短文本 | VARCHAR(50) | 姓名、编码等 |
| 长文本 | VARCHAR(200) | 地址、备注等 |
| 超长文本 | TEXT | 病历内容、报告内容 |
| 整数 | INT | 数量、序号等 |
| 金额 | DECIMAL(12,2) | 费用金额 |
| 日期 | DATE | 日期 |
| 时间 | DATETIME | 精确到秒的时间 |
| 布尔 | TINYINT(1) | 0/1表示 |
| 枚举 | TINYINT | 状态枚举值 |

---

## 2. 患者基本信息（Patient）

**表名**: `his_patient`
**FHIR映射**: Patient Resource
**说明**: 患者主索引，全院唯一标识患者身份

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| patient_id | BIGINT | 是 | 自增 | 患者ID（主键） | Patient.id |
| patient_no | VARCHAR(20) | 是 | | 患者编号（院内唯一） | Patient.identifier |
| id_card_no | VARCHAR(18) | 否 | | 身份证号 | Patient.identifier[official] |
| name | VARCHAR(50) | 是 | | 姓名 | Patient.name |
| gender | TINYINT | 是 | | 性别：1-男 2-女 9-未知 | Patient.gender |
| birth_date | DATE | 是 | | 出生日期 | Patient.birthDate |
| age | INT | 否 | | 年龄（系统计算） | |
| age_unit | TINYINT | 否 | | 年龄单位：1-岁 2-月 3-天 | |
| nation | VARCHAR(20) | 否 | | 民族 | Patient.extension |
| nationality | VARCHAR(20) | 否 | 中国 | 国籍 | |
| phone | VARCHAR(20) | 否 | | 联系电话 | Patient.telecom |
| address | VARCHAR(200) | 否 | | 家庭住址 | Patient.address |
| marital_status | TINYINT | 否 | | 婚姻状况：1-未婚 2-已婚 3-离异 4-丧偶 | Patient.maritalStatus |
| occupation | VARCHAR(50) | 否 | | 职业 | Patient.extension |
| contact_name | VARCHAR(50) | 否 | | 联系人姓名 | Patient.contact.name |
| contact_phone | VARCHAR(20) | 否 | | 联系人电话 | Patient.contact.telecom |
| contact_relation | VARCHAR(20) | 否 | | 联系人关系 | Patient.contact.relationship |
| blood_type | TINYINT | 否 | | 血型：1-A 2-B 3-AB 4-O 5-不详 | |
| rh_blood | TINYINT | 否 | | RH血型：1-阳性 2-阴性 | |
| insurance_type | TINYINT | 否 | | 医保类型：1-城镇职工 2-城镇居民 3-新农合 4-自费 | |
| insurance_no | VARCHAR(30) | 否 | | 医保卡号 | |
| allergy_history | TEXT | 否 | | 过敏史 | AllergyIntolerance |
| medical_history | TEXT | 否 | | 既往病史 | Condition |
| family_history | TEXT | 否 | | 家族史 | |
| photo_url | VARCHAR(200) | 否 | | 照片URL | Patient.photo |
| status | TINYINT | 是 | 1 | 状态：1-正常 2-注销 3-死亡 | Patient.active |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 | |
| update_time | DATETIME | 是 | | 更新时间 | |
| create_by | VARCHAR(50) | 是 | | 创建人 | |
| is_deleted | TINYINT | 是 | 0 | 逻辑删除标志 | |

---

## 3. 就诊记录（Encounter）

**表名**: `his_encounter`
**FHIR映射**: Encounter Resource
**说明**: 记录患者每次就诊信息

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| encounter_id | BIGINT | 是 | 自增 | 就诊ID（主键） | Encounter.id |
| encounter_no | VARCHAR(30) | 是 | | 就诊编号 | Encounter.identifier |
| patient_id | BIGINT | 是 | | 患者ID（外键） | Encounter.subject |
| encounter_type | TINYINT | 是 | | 就诊类型：1-门诊 2-急诊 3-住院 | Encounter.class |
| visit_date | DATETIME | 是 | | 就诊日期 | Encounter.period.start |
| dept_id | BIGINT | 是 | | 就诊科室 | Encounter.location |
| doctor_id | BIGINT | 是 | | 接诊医生 | Encounter.participant |
| diagnosis_code | VARCHAR(20) | 否 | | 主诊断ICD-10编码 | Encounter.diagnosis |
| diagnosis_name | VARCHAR(100) | 否 | | 主诊断名称 | |
| chief_complaint | TEXT | 否 | | 主诉 | |
| present_illness | TEXT | 否 | | 现病史 | |
| visit_status | TINYINT | 是 | | 就诊状态：1-候诊 2-就诊中 3-已完成 4-取消 | Encounter.status |
| end_time | DATETIME | 否 | | 就诊结束时间 | Encounter.period.end |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 | |
| update_time | DATETIME | 是 | | 更新时间 | |

---

## 4. 住院信息（Admission）

**表名**: `his_admission`
**FHIR映射**: Encounter Resource (inpatient)
**说明**: 住院患者入院信息

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| admission_id | BIGINT | 是 | 自增 | 入院ID（主键） | |
| admission_no | VARCHAR(20) | 是 | | 住院号 | Encounter.identifier |
| patient_id | BIGINT | 是 | | 患者ID | Encounter.subject |
| admission_date | DATETIME | 是 | | 入院日期 | Encounter.period.start |
| admission_dept | BIGINT | 是 | | 入院科室 | |
| admission_ward | VARCHAR(50) | 否 | | 入院病区 | |
| bed_no | VARCHAR(10) | 否 | | 床号 | |
| admission_diagnosis | VARCHAR(200) | 否 | | 入院诊断 | |
| diagnosis_code | VARCHAR(20) | 否 | | 入院诊断ICD-10编码 | |
| attending_doctor | BIGINT | 是 | | 主治医师 | |
| resident_doctor | BIGINT | 否 | | 住院医师 | |
| admission_way | TINYINT | 否 | | 入院方式：1-门诊 2-急诊 3-转院 | |
| admission_condition | TINYINT | 否 | | 入院情况：1-危 2-急 3-一般 | |
| insurance_type | TINYINT | 否 | | 医保类型 | |
| insurance_no | VARCHAR(30) | 否 | | 医保号 | |
| deposit_amount | DECIMAL(12,2) | 否 | 0.00 | 预交金总额 | |
| discharge_date | DATETIME | 否 | | 出院日期 | Encounter.period.end |
| discharge_dept | BIGINT | 否 | | 出院科室 | |
| discharge_diagnosis | VARCHAR(200) | 否 | | 出院诊断 | |
| discharge_code | VARCHAR(20) | 否 | | 出院诊断ICD-10编码 | |
| discharge_way | TINYINT | 否 | | 出院方式：1-医嘱出院 2-自动出院 3-转院 4-死亡 | |
| admission_status | TINYINT | 是 | | 状态：1-在院 2-出院 3-转科 | |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 | |
| update_time | DATETIME | 是 | | 更新时间 | |

---

## 5. 医嘱（Order）

**表名**: `his_order`
**FHIR映射**: ServiceRequest / MedicationRequest
**说明**: 医嘱信息，包括药品医嘱、检验医嘱、检查医嘱等

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| order_id | BIGINT | 是 | 自增 | 医嘱ID（主键） | |
| order_no | VARCHAR(30) | 是 | | 医嘱编号 | |
| encounter_id | BIGINT | 是 | | 就诊/住院ID | ServiceRequest.encounter |
| patient_id | BIGINT | 是 | | 患者ID | ServiceRequest.subject |
| order_type | TINYINT | 是 | | 医嘱类型：1-药品 2-检验 3-检查 4-护理 5-手术 6-饮食 7-其他 | |
| order_category | TINYINT | 是 | | 医嘱分类：1-长期 2-临时 | |
| order_content | VARCHAR(500) | 是 | | 医嘱内容 | |
| item_code | VARCHAR(20) | 否 | | 项目编码 | |
| item_name | VARCHAR(100) | 否 | | 项目名称 | |
| dosage | VARCHAR(50) | 否 | | 剂量 | MedicationRequest.dosageInstruction |
| dosage_unit | VARCHAR(20) | 否 | | 剂量单位 | |
| frequency_code | VARCHAR(20) | 否 | | 频次编码 | |
| frequency_name | VARCHAR(50) | 否 | | 频次名称 | |
| route_code | VARCHAR(20) | 否 | | 途径编码 | |
| route_name | VARCHAR(50) | 否 | | 途径名称 | |
| duration | INT | 否 | | 疗程（天） | |
| start_time | DATETIME | 否 | | 开始时间 | |
| stop_time | DATETIME | 否 | | 停止时间 | |
| prescribing_doctor | BIGINT | 是 | | 开立医生 | ServiceRequest.requester |
| audit_nurse | BIGINT | 否 | | 审核护士 | |
| audit_time | DATETIME | 否 | | 审核时间 | |
| execute_nurse | BIGINT | 否 | | 执行护士 | |
| execute_time | DATETIME | 否 | | 执行时间 | |
| order_status | TINYINT | 是 | | 状态：1-开立 2-审核 3-执行中 4-已完成 5-已停止 6-已作废 | ServiceRequest.status |
| urgency | TINYINT | 否 | 0 | 紧急标志：0-常规 1-紧急 | ServiceRequest.priority |
| remarks | VARCHAR(500) | 否 | | 备注 | |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 | |
| update_time | DATETIME | 是 | | 更新时间 | |

---

## 6. 处方（Prescription）

**表名**: `his_prescription`
**说明**: 处方主表

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| prescription_id | BIGINT | 是 | 自增 | 处方ID（主键） |
| prescription_no | VARCHAR(30) | 是 | | 处方编号 |
| encounter_id | BIGINT | 是 | | 就诊ID |
| patient_id | BIGINT | 是 | | 患者ID |
| prescription_type | TINYINT | 是 | | 处方类型：1-普通 2-急诊 3-儿科 4-麻醉 5-精神 6-中药 |
| dept_id | BIGINT | 是 | | 开方科室 |
| doctor_id | BIGINT | 是 | | 开方医生 |
| diagnose_code | VARCHAR(20) | 否 | | 诊断编码 |
| diagnose_name | VARCHAR(100) | 否 | | 诊断名称 |
| total_amount | DECIMAL(12,2) | 否 | | 处方总金额 |
| pharmacist_id | BIGINT | 否 | | 审方药师 |
| audit_time | DATETIME | 否 | | 审方时间 |
| audit_result | TINYINT | 否 | | 审方结果：1-通过 2-退回 |
| dispense_pharmacist | BIGINT | 否 | | 调配药师 |
| dispense_time | DATETIME | 否 | | 调配时间 |
| prescription_status | TINYINT | 是 | | 状态：1-开立 2-审核通过 3-审核退回 4-已调配 5-已发药 6-已退药 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 7. 处方明细（Prescription Item）

**表名**: `his_prescription_item`
**说明**: 处方药品明细

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| item_id | BIGINT | 是 | 自增 | 明细ID（主键） |
| prescription_id | BIGINT | 是 | | 处方ID（外键） |
| drug_id | BIGINT | 是 | | 药品ID（外键） |
| drug_code | VARCHAR(20) | 是 | | 药品编码 |
| drug_name | VARCHAR(100) | 是 | | 药品通用名 |
| drug_spec | VARCHAR(100) | 否 | | 药品规格 |
| manufacturer | VARCHAR(100) | 否 | | 生产厂家 |
| dosage | DECIMAL(10,4) | 是 | | 单次剂量 |
| dosage_unit | VARCHAR(20) | 是 | | 剂量单位 |
| frequency_code | VARCHAR(20) | 是 | | 频次编码 |
| frequency_name | VARCHAR(50) | 是 | | 频次名称（如：每日三次） |
| route_code | VARCHAR(20) | 是 | | 用药途径编码 |
| route_name | VARCHAR(50) | 是 | | 用药途径名称（如：口服、静滴） |
| quantity | DECIMAL(10,2) | 是 | | 数量 |
| unit | VARCHAR(20) | 是 | | 单位 |
| unit_price | DECIMAL(10,4) | 是 | | 单价 |
| amount | DECIMAL(12,2) | 是 | | 金额 |
| days | INT | 否 | | 用药天数 |
| skin_test | TINYINT | 否 | 0 | 皮试标志：0-不需要 1-需要 2-已做通过 3-已做未通过 |
| remarks | VARCHAR(200) | 否 | | 用药备注 |
| sort_order | INT | 否 | | 排序号 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |

---

## 8. 诊断信息（Diagnosis）

**表名**: `his_diagnosis`
**FHIR映射**: Condition Resource
**说明**: 诊断信息，基于ICD-10编码

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| diagnosis_id | BIGINT | 是 | 自增 | 诊断ID（主键） | Condition.id |
| encounter_id | BIGINT | 是 | | 就诊ID | Condition.encounter |
| patient_id | BIGINT | 是 | | 患者ID | Condition.subject |
| diagnosis_type | TINYINT | 是 | | 诊断类型：1-门诊 2-入院 3-出院 4-修正 5-补充 | |
| diagnosis_code | VARCHAR(20) | 是 | | ICD-10诊断编码 | Condition.code |
| diagnosis_name | VARCHAR(200) | 是 | | 诊断名称 | |
| diagnosis_seq | INT | 是 | 1 | 诊断序号（1=主诊断） | |
| diagnosis_status | TINYINT | 是 | | 状态：1-初步 2-确定 3-修正 | Condition.clinicalStatus |
| diagnose_doctor | BIGINT | 是 | | 诊断医生 | Condition.asserter |
| diagnose_time | DATETIME | 是 | | 诊断时间 | Condition.onsetDateTime |
| remarks | VARCHAR(500) | 否 | | 备注 | |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 | |

**ICD-10编码结构说明**：
- 第1位：字母A-Z（疾病类别章节）
- 第2-3位：数字（亚类）
- 第4位：小数点后（细节分类）
- 第5-7位：扩展码（病因、部位、严重程度等）

---

## 9. 药品信息（Drug）

**表名**: `his_drug`
**说明**: 药品目录/药品字典

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| drug_id | BIGINT | 是 | 自增 | 药品ID（主键） |
| drug_code | VARCHAR(20) | 是 | | 药品编码（唯一） |
| drug_name | VARCHAR(100) | 是 | | 药品通用名 |
| drug_trade_name | VARCHAR(100) | 否 | | 药品商品名 |
| drug_type | TINYINT | 是 | | 药品类型：1-西药 2-中成药 3-中草药 4-生物制品 |
| drug_category | VARCHAR(50) | 否 | | 药品类别 |
| dosage_form | VARCHAR(50) | 否 | | 剂型（片剂、注射剂等） |
| spec | VARCHAR(100) | 否 | | 规格 |
| unit | VARCHAR(20) | 是 | | 基本单位 |
| manufacturer | VARCHAR(100) | 否 | | 生产厂家 |
| approval_no | VARCHAR(50) | 否 | | 批准文号 |
| retail_price | DECIMAL(10,4) | 是 | | 零售价 |
| purchase_price | DECIMAL(10,4) | 否 | | 采购价 |
| insurance_code | VARCHAR(20) | 否 | | 医保目录编码 |
| insurance_category | TINYINT | 否 | | 医保类别：1-甲类 2-乙类 3-丙类 |
| otc_flag | TINYINT | 否 | | OTC标志：0-处方药 1-OTC |
| narcotic_flag | TINYINT | 否 | 0 | 麻醉药品标志 |
| psychotropic_flag | TINYINT | 否 | 0 | 精神药品标志 |
| toxic_flag | TINYINT | 否 | 0 | 毒性药品标志 |
| antibiotic_flag | TINYINT | 否 | 0 | 抗菌药物标志 |
| storage_condition | VARCHAR(100) | 否 | | 储存条件 |
| shelf_life | INT | 否 | | 有效期（月） |
| barcode | VARCHAR(30) 否 | | 条形码 |
| status | TINYINT | 是 | 1 | 状态：1-在用 2-停用 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 10. 收费项目（Charge Item）

**表名**: `his_charge_item`
**说明**: 医疗服务收费项目字典

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| charge_item_id | BIGINT | 是 | 自增 | 收费项目ID（主键） |
| item_code | VARCHAR(20) | 是 | | 项目编码（唯一） |
| item_name | VARCHAR(200) | 是 | | 项目名称 |
| item_category | TINYINT | 是 | | 项目类别：1-挂号费 2-诊查费 3-检查费 4-治疗费 5-手术费 6-化验费 7-材料费 8-药品费 9-床位费 10-护理费 11-其他 |
| item_subcategory | VARCHAR(50) | 否 | | 子类别 |
| spec | VARCHAR(100) | 否 | | 规格 |
| unit | VARCHAR(20) | 是 | | 计价单位 |
| unit_price | DECIMAL(12,4) | 是 | | 单价 |
| insurance_code | VARCHAR(20) | 否 | | 医保编码 |
| insurance_price | DECIMAL(12,4) | 否 | | 医保定价 |
| insurance_category | TINYINT | 否 | | 医保类别：1-甲类 2-乙类 3-丙类 |
| execution_dept | BIGINT | 否 | | 执行科室 |
| status | TINYINT | 是 | 1 | 状态：1-在用 2-停用 |
| effective_date | DATE | 否 | | 生效日期 |
| expire_date | DATE | 否 | | 失效日期 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 11. 费用明细（Charge Detail）

**表名**: `his_charge_detail`
**说明**: 患者费用明细记录

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| detail_id | BIGINT | 是 | 自增 | 明细ID（主键） |
| encounter_id | BIGINT | 是 | | 就诊/住院ID |
| patient_id | BIGINT | 是 | | 患者ID |
| charge_item_id | BIGINT | 是 | | 收费项目ID |
| item_code | VARCHAR(20) | 是 | | 项目编码 |
| item_name | VARCHAR(200) | 是 | | 项目名称 |
| quantity | DECIMAL(10,2) | 是 | | 数量 |
| unit_price | DECIMAL(12,4) | 是 | | 单价 |
| amount | DECIMAL(12,2) | 是 | | 金额 |
| fee_category | TINYINT | 是 | | 费用类别：同charge_item.item_category |
| pay_type | TINYINT | 否 | | 支付方式：1-自费 2-医保 3-公费 |
| order_id | BIGINT | 否 | | 关联医嘱ID |
| execute_dept | BIGINT | 否 | | 执行科室 |
| charge_time | DATETIME | 是 | | 计费时间 |
| cashier_id | BIGINT | 否 | | 收费员 |
| charge_status | TINYINT | 是 | | 状态：1-已计费 2-已收费 3-已退费 |
| refund_detail_id | BIGINT | 否 | | 退费关联明细ID |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |

---

## 12. 检验结果（Lab Result）

**表名**: `his_lab_result`
**FHIR映射**: Observation Resource
**说明**: 检验结果记录

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| result_id | BIGINT | 是 | 自增 | 结果ID（主键） | Observation.id |
| encounter_id | BIGINT | 是 | | 就诊ID | Observation.encounter |
| patient_id | BIGINT | 是 | | 患者ID | Observation.subject |
| order_id | BIGINT | 是 | | 检验医嘱ID | |
| report_no | VARCHAR(30) | 是 | | 报告编号 | |
| item_code | VARCHAR(20) | 是 | | 检验项目编码 | Observation.code |
| item_name | VARCHAR(100) | 是 | | 检验项目名称 | |
| result_value | VARCHAR(200) | 是 | | 结果值 | Observation.value |
| result_unit | VARCHAR(20) | 否 | | 结果单位 | |
| reference_range | VARCHAR(100) | 否 | | 参考范围 | Observation.referenceRange |
| abnormal_flag | TINYINT | 否 | | 异常标志：0-正常 1-偏高 2-偏低 3-危急值 | Observation.interpretation |
| specimen_type | VARCHAR(50) | 否 | | 标本类型 | |
| specimen_no | VARCHAR(30) | 否 | | 标本编号 | |
| instrument_code | VARCHAR(20) | 否 | | 仪器编码 | |
| report_time | DATETIME | 是 | | 报告时间 | Observation.effectiveDateTime |
| report_doctor | BIGINT | 是 | | 报告医生 | Observation.performer |
| audit_doctor | BIGINT | 否 | | 审核医生 | |
| audit_time | DATETIME | 否 | | 审核时间 | |
| result_status | TINYINT | 是 | | 状态：1-待审核 2-已审核 3-已发布 4-已作废 | Observation.status |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |

---

## 13. 影像检查（Imaging Study）

**表名**: `his_imaging_study`
**FHIR映射**: ImagingStudy Resource
**说明**: 影像检查记录

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| study_id | BIGINT | 是 | 自增 | 检查ID（主键） | ImagingStudy.id |
| encounter_id | BIGINT | 是 | | 就诊ID | |
| patient_id | BIGINT | 是 | | 患者ID | ImagingStudy.subject |
| order_id | BIGINT | 是 | | 检查医嘱ID | |
| study_uid | VARCHAR(64) | 是 | | DICOM Study Instance UID | ImagingStudy.uid |
| accession_no | VARCHAR(30) | 否 | | 检查号 | ImagingStudy.accession |
| modality | VARCHAR(10) | 是 | | 检查模态（CT/MR/DR/US等） | ImagingStudy.modality |
| modality_name | VARCHAR(50) | 否 | | 检查模态名称 | |
| study_desc | VARCHAR(200) | 否 | | 检查描述 | ImagingStudy.description |
| body_site | VARCHAR(100) | 否 | | 检查部位 | |
| device_name | VARCHAR(100) | 否 | | 设备名称 | |
| study_time | DATETIME | 是 | | 检查时间 | ImagingStudy.started |
| technician | BIGINT | 否 | | 检查技师 | |
| report_doctor | BIGINT | 否 | | 报告医生 | |
| report_content | TEXT | 否 | | 报告内容 | DiagnosticReport |
| report_time | DATETIME | 否 | | 报告时间 | |
| report_status | TINYINT | 是 | | 报告状态：1-待报告 2-已书写 3-已审核 4-已发布 | |
| image_count | INT | 否 | | 影像数量 | |
| pacs_url | VARCHAR(500) | 否 | | PACS影像查看URL | |
| study_status | TINYINT | 是 | | 检查状态：1-已预约 2-已登记 3-检查中 4-已完成 | |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 14. 手术信息（Surgery）

**表名**: `his_surgery`
**FHIR映射**: Procedure Resource
**说明**: 手术/操作记录

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| surgery_id | BIGINT | 是 | 自增 | 手术ID（主键） | Procedure.id |
| encounter_id | BIGINT | 是 | | 住院ID | Procedure.encounter |
| patient_id | BIGINT | 是 | | 患者ID | Procedure.subject |
| surgery_code | VARCHAR(20) | 否 | | 手术编码（ICD-9-CM-3） | Procedure.code |
| surgery_name | VARCHAR(200) | 是 | | 手术名称 | |
| surgery_level | TINYINT | 否 | | 手术等级：1-一级 2-二级 3-三级 4-四级 | |
| surgery_type | TINYINT | 否 | | 手术类型：1-择期 2-急诊 | |
| surgeon | BIGINT | 是 | | 主刀医生 | Procedure.performer |
| assistant1 | BIGINT | 否 | | 一助 | |
| assistant2 | BIGINT | 否 | | 二助 | |
| anesthesiologist | BIGINT | 否 | | 麻醉医生 | |
| anesthetist | BIGINT | 否 | | 麻醉护士 | |
| nurse | BIGINT | 否 | | 巡回护士 | |
| instrument_nurse | BIGINT | 否 | | 器械护士 | |
| anesthesia_type | TINYINT | 否 | | 麻醉方式：1-全麻 2-局麻 3-硬膜外 4-脊麻 5-神经阻滞 | |
| surgery_date | DATETIME | 否 | | 手术日期 | Procedure.performedDateTime |
| start_time | DATETIME | 否 | | 手术开始时间 | |
| end_time | DATETIME | 否 | | 手术结束时间 | |
| surgery_duration | INT | 否 | | 手术时长（分钟） | |
| operative_diagnosis | VARCHAR(200) | 否 | | 术中诊断 | |
| operative_findings | TEXT | 否 | | 术中所见 | |
| surgery_process | TEXT | 否 | | 手术经过 | |
| blood_loss | INT | 否 | | 出血量（ml） | |
| blood_transfusion | INT | 否 | | 输血量（ml） | |
| specimen | VARCHAR(200) | 否 | | 术中标本 | |
| surgery_room | VARCHAR(20) | 否 | | 手术间 | |
| surgery_status | TINYINT | 是 | | 状态：1-已申请 2-已排期 3-术中 4-已完成 5-已取消 | Procedure.status |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 15. 科室信息（Department）

**表名**: `his_department`
**FHIR映射**: Organization Resource
**说明**: 科室/组织架构字典

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| dept_id | BIGINT | 是 | 自增 | 科室ID（主键） |
| dept_code | VARCHAR(20) | 是 | | 科室编码（唯一） |
| dept_name | VARCHAR(100) | 是 | | 科室名称 |
| dept_short_name | VARCHAR(50) | 否 | | 科室简称 |
| dept_type | TINYINT | 是 | | 科室类型：1-临床 2-医技 3-行政 4-后勤 |
| parent_id | BIGINT | 否 | 0 | 上级科室ID |
| dept_level | TINYINT | 否 | | 科室层级 |
| sort_order | INT | 否 | | 排序号 |
| phone | VARCHAR(20) | 否 | | 科室电话 |
| location | VARCHAR(100) | 否 | | 科室位置 |
| bed_count | INT | 否 | | 编制床位数 |
| status | TINYINT | 是 | 1 | 状态：1-正常 2-停用 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 16. 医护人员（Staff）

**表名**: `his_staff`
**FHIR映射**: Practitioner Resource
**说明**: 医护人员信息

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| staff_id | BIGINT | 是 | 自增 | 人员ID（主键） |
| staff_code | VARCHAR(20) | 是 | | 人员编码（唯一） |
| name | VARCHAR(50) | 是 | | 姓名 |
| gender | TINYINT | 是 | | 性别 |
| birth_date | DATE | 否 | | 出生日期 |
| id_card_no | VARCHAR(18) | 否 | | 身份证号 |
| phone | VARCHAR(20) | 否 | | 联系电话 |
| dept_id | BIGINT | 是 | | 所属科室 |
| position | VARCHAR(50) | 否 | | 职务 |
| title | VARCHAR(50) | 否 | | 职称 |
| specialty | VARCHAR(100) | 否 | | 专业特长 |
| doctor_flag | TINYINT | 否 | 0 | 是否医生 |
| nurse_flag | TINYINT | 否 | 0 | 是否护士 |
| pharmacist_flag | TINYINT | 否 | 0 | 是否药师 |
| lab_tech_flag | TINYINT | 否 | 0 | 是否检验技师 |
| rad_tech_flag | TINYINT | 否 | 0 | 是否放射技师 |
| status | TINYINT | 是 | 1 | 状态：1-在职 2-离职 3-退休 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 17. 床位信息（Bed）

**表名**: `his_bed`
**说明**: 床位管理

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| bed_id | BIGINT | 是 | 自增 | 床位ID（主键） |
| bed_no | VARCHAR(10) | 是 | | 床号 |
| ward_id | BIGINT | 是 | | 病区ID |
| room_no | VARCHAR(10) | 否 | | 房间号 |
| bed_type | TINYINT | 否 | | 床位类型：1-普通 2-抢救 3-ICU 4-隔离 |
| bed_class | TINYINT | 否 | | 床位等级：1-普通 2-双人 3-单人 4-VIP |
| daily_price | DECIMAL(10,2) | 否 | | 床位日单价 |
| bed_status | TINYINT | 是 | | 状态：1-空床 2-占用 3-预约 4-清洁 5-维修 |
| current_patient_id | BIGINT | 否 | | 当前患者ID |
| admission_id | BIGINT | 否 | | 当前住院ID |
| sort_order | INT | 否 | | 排序号 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | 是 | | 更新时间 |

---

## 18. 护理记录（Nursing Record）

**表名**: `his_nursing_record`
**说明**: 护理记录单

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| record_id | BIGINT | 是 | 自增 | 记录ID（主键） |
| encounter_id | BIGINT | 是 | | 住院ID |
| patient_id | BIGINT | 是 | | 患者ID |
| record_type | TINYINT | 是 | | 记录类型：1-一般护理 2-危重护理 3-手术护理 4-出入量 5-健康教育 |
| record_time | DATETIME | 是 | | 记录时间 |
| nurse_id | BIGINT | 是 | | 记录护士 |
| temperature | DECIMAL(4,1) | 否 | | 体温(°C) |
| pulse | INT | 否 | | 脉搏(次/分) |
| respiration | INT | 否 | | 命吸(次/分) |
| blood_pressure_high | INT | 否 | | 收缩压(mmHg) |
| blood_pressure_low | INT | 否 | | 舒张压(mmHg) |
| blood_oxygen | INT | 否 | | 血氧饱和度(%) |
| consciousness | TINYINT | 否 | | 意识状态：1-清醒 2-嗜睡 3-昏迷 |
| intake_amount | DECIMAL(8,1) | 否 | | 入量(ml) |
| output_amount | DECIMAL(8,1) | 否 | | 出量(ml) |
| pain_score | INT | 否 | | 疼痛评分(0-10) |
| nursing_content | TEXT | 否 | | 护理内容 |
| nursing_measures | TEXT | 否 | | 护理措施 |
| patient_condition | TEXT | 否 | | 病情观察 |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |

---

## 19. 给药记录（Medication Administration Record - eMAR）

**表名**: `his_medication_admin`
**FHIR映射**: MedicationAdministration Resource
**说明**: 电子给药记录，用于闭环药物管理（HIMSS EMRAM Stage 5要求）

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 | FHIR映射 |
|--------|----------|------|--------|------|----------|
| admin_id | BIGINT | 是 | 自增 | 给药ID（主键） | |
| encounter_id | BIGINT | 是 | | 住院ID | |
| patient_id | BIGINT | 是 | | 患者ID | MedicationAdministration.subject |
| order_id | BIGINT | 是 | | 医嘱ID | |
| prescription_item_id | BIGINT | 否 | | 处方明细ID | |
| drug_id | BIGINT | 是 | | 药品ID | |
| drug_name | VARCHAR(100) | 是 | | 药品名称 | |
| dosage | DECIMAL(10,4) | 是 | | 给药剂量 | |
| dosage_unit | VARCHAR(20) | 是 | | 剂量单位 | |
| route_code | VARCHAR(20) | 是 | | 给药途径 | MedicationAdministration.dosage.route |
| scheduled_time | DATETIME | 是 | | 预定给药时间 | |
| actual_time | DATETIME | 否 | | 实际给药时间 | MedicationAdministration.effectiveDateTime |
| nurse_id | BIGINT | 否 | | 给药护士 | MedicationAdministration.performer |
| patient_wristband_scan | TINYINT | 否 | | 患者腕带扫描：0-未扫描 1-已扫描匹配 2-不匹配 | |
| drug_barcode_scan | TINYINT | 否 | | 药品条码扫描：0-未扫描 1-已扫描匹配 2-不匹配 | |
| admin_status | TINYINT | 是 | | 状态：1-待执行 2-已执行 3-未执行（拒服）4-延迟执行 | MedicationAdministration.status |
| skip_reason | VARCHAR(200) | 否 | | 未执行原因 | |
| remarks | VARCHAR(500) | 否 | | 备注 | |
| create_time | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |

---

## 20. 系统日志（Audit Log）

**表名**: `sys_audit_log`
**说明**: 系统操作审计日志

| 字段名 | 数据类型 | 必填 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| log_id | BIGINT | 是 | 自增 | 日志ID（主键） |
| user_id | BIGINT | 是 | | 操作用户ID |
| username | VARCHAR(50) | 是 | | 用户名 |
| operation_type | TINYINT | 是 | | 操作类型：1-查询 2-新增 3-修改 4-删除 5-导出 6-打印 |
| module_code | VARCHAR(50) | 是 | | 模块编码 |
| operation_desc | VARCHAR(500) | 否 | | 操作描述 |
| request_url | VARCHAR(500) | 否 | | 请求URL |
| request_method | VARCHAR(10) | 否 | | 请求方法 |
| request_params | TEXT | 否 | | 请求参数（脱敏） |
| response_code | INT | 否 | | 响应状态码 |
| ip_address | VARCHAR(50) | 否 | | 操作IP地址 |
| user_agent | VARCHAR(500) | 否 | | 用户代理 |
| operation_time | DATETIME | 是 | CURRENT_TIMESTAMP | 操作时间 |
| execution_time | INT | 否 | | 执行时长(ms) |
| status | TINYINT | 是 | | 状态：1-成功 2-失败 |
| error_msg | TEXT | 否 | | 错误信息 |

---

## 21. 数据编码标准对照

### 21.1 性别编码

| 编码 | 名称 | 标准 |
|------|------|------|
| 1 | 男 (Male) | GB/T 2261.1 |
| 2 | 女 (Female) | GB/T 2261.1 |
| 9 | 未知 (Unknown) | HL7 FHIR |

### 21.2 就诊类型编码

| 编码 | 名称 | FHIR Encounter.class |
|------|------|----------------------|
| 1 | 门诊 (Outpatient) | AMB |
| 2 | 急诊 (Emergency) | EMER |
| 3 | 住院 (Inpatient) | IMP |
| 4 | 体检 (Health Checkup) | |
| 5 | 家庭病床 (Home) | HH |

### 21.3 医嘱状态编码

| 编码 | 名称 | FHIR映射 |
|------|------|----------|
| 1 | 开立 (Draft) | draft |
| 2 | 审核 (Active) | active |
| 3 | 执行中 (In Progress) | active |
| 4 | 已完成 (Completed) | completed |
| 5 | 已停止 (Stopped) | revoked |
| 6 | 已作废 (Cancelled) | revoked |

### 21.4 药品频次编码

| 编码 | 名称 | 说明 |
|------|------|------|
| QD | 每日一次 | 每天1次 |
| BID | 每日两次 | 每天2次 |
| TID | 每日三次 | 每天3次 |
| QID | 每日四次 | 每天4次 |
| QN | 每晚一次 | 每晚睡前 |
| Q12H | 每12小时 | |
| Q8H | 每8小时 | |
| Q6H | 每6小时 | |
| Q4H | 每4小时 | |
| PRN | 需要时 | 必要时使用 |
| ST | 立即 | 即刻使用 |

### 21.5 给药途径编码

| 编码 | 名称 |
|------|------|
| PO | 口服 |
| IV | 静脉注射 |
| IVGTT | 静脉滴注 |
| IM | 肌肉注射 |
| IH | 皮下注射 |
| ID | 皮内注射 |
| PR | 直肠给药 |
| TOP | 外用 |
| INH | 吸入 |
| SL | 舌下含服 |
| NS | 鼻饲 |
| EYE | 滴眼 |
| EAR | 滴耳 |

### 21.6 检验标本类型编码

| 编码 | 名称 |
|------|------|
| BLD | 全血 |
| SER | 血清 |
| PLA | 血浆 |
| URN | 尿液 |
| STL | 粪便 |
| CSF | 脑脊液 |
| SPT | 痰液 |
| BLD_GAS | 血气 |
| PLT | 胸腹水 |
| SWB | 拭子 |

### 21.7 影像模态编码（DICOM Modality）

| 编码 | 名称 |
|------|------|
| CR | 计算机X线摄影 |
| DR | 数字X线摄影 |
| CT | 计算机断层扫描 |
| MR | 磁共振成像 |
| US | 超声 |
| NM | 核医学 |
| PT | 正电子发射断层扫描 |
| XA | X线血管造影 |
| MG | 乳腺X线摄影 |
| RF | 透视 |
| DX | 数字X线 |
| DX | 口腔全景 |

---

## 22. 数据库设计规范

### 22.1 公共字段

所有业务表必须包含以下公共字段：

| 字段名 | 数据类型 | 说明 |
|--------|----------|------|
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |
| create_by | VARCHAR(50) | 创建人 |
| update_by | VARCHAR(50) | 更新人 |
| is_deleted | TINYINT | 逻辑删除：0-正常 1-已删除 |
| tenant_id | BIGINT | 租户ID（多租户支持） |

### 22.2 索引设计规范

- 所有外键字段必须建立索引
- 高频查询字段（如patient_no, encounter_no）建立唯一索引
- 组合查询场景建立联合索引
- 时间范围查询字段建立索引

### 22.3 分表策略

| 数据表 | 分表策略 | 说明 |
|--------|----------|------|
| his_charge_detail | 按年分表 | 费用明细数据量大 |
| his_lab_result | 按年分表 | 检验结果数据量大 |
| his_nursing_record | 按年分表 | 护理记录数据量大 |
| sys_audit_log | 按月分表 | 审计日志数据量极大 |
| his_medication_admin | 按年分表 | 给药记录数据量大 |

---

> **文档维护记录**

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|----------|------|
| V1.0 | 2026-06-15 | 初始版本 | YUDAO-AI-HIS项目组 |
