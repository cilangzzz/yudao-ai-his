# 概要设计文档索引

> **更新日期**: 2026-06-22
> **说明**: 本文档为概要设计阶段文档索引，全局设计文档保留在00-全局目录，模块设计文档在各模块目录

---

## 一、全局设计文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 数据库设计文档 | [00-全局/HIS系统-数据库设计文档.md](./00-全局/HIS系统-数据库设计文档.md) | 完整DDL脚本、ER图 |
| 数据模型设计文档 | [00-全局/HIS系统-数据模型设计文档.md](./00-全局/HIS系统-数据模型设计文档.md) | 81个实体定义 |
| 状态机设计文档 | [00-全局/HIS系统-状态机设计文档.md](./00-全局/HIS系统-状态机设计文档.md) | 9个状态机设计 |

---

## 二、模块设计文档索引

### M01 门诊管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M01-门诊管理/M01-门诊管理-数据库设计.md](./M01-门诊管理/M01-门诊管理-数据库设计.md) | 挂号、处方等表结构 |
| 状态机设计 | [M01-门诊管理/M01-门诊管理-状态机设计.md](./M01-门诊管理/M01-门诊管理-状态机设计.md) | 挂号、预约、处方状态机 |

**包含表**: his_patient, his_allergy, op_schedule, op_appointment, op_register, op_prescription, op_prescription_item, his_diagnosis

---

### M02 住院管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M02-住院管理/M02-住院管理-数据库设计.md](./M02-住院管理/M02-住院管理-数据库设计.md) | 入院、医嘱、护理等表结构 |
| 状态机设计 | [M02-住院管理/M02-住院管理-状态机设计.md](./M02-住院管理/M02-住院管理-状态机设计.md) | 医嘱、eMAR、出入院状态机 |

**包含表**: his_admission, his_order, his_medication_admin, his_nursing_record, his_vital_sign, his_nursing_assessment, his_bed

---

### M03 电子病历

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M03-电子病历/M03-电子病历-数据库设计.md](./M03-电子病历/M03-电子病历-数据库设计.md) | 病历模板、文书、审签等表结构 |
| 状态机设计 | [M03-电子病历/M03-电子病历-状态机设计.md](./M03-电子病历/M03-电子病历-状态机设计.md) | 病历状态机 |

**包含表**: his_emr_template, his_emr_document, his_emr_sign, his_emr_qc, his_emr_archive, his_emr_seal, his_emr_borrow

---

### M04 检验管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M04-检验管理/M04-检验管理-数据库设计.md](./M04-检验管理/M04-检验管理-数据库设计.md) | 检验申请、标本、结果等表结构 |
| 状态机设计 | [M04-检验管理/M04-检验管理-状态机设计.md](./M04-检验管理/M04-检验管理-状态机设计.md) | 标本、危急值状态机 |

**包含表**: his_lab_request, his_lab_specimen, his_lab_specimen_track, his_lab_item, his_lab_result, his_lab_report, his_critical_value, his_lab_instrument

---

### M05 影像管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M05-影像管理/M05-影像管理-数据库设计.md](./M05-影像管理/M05-影像管理-数据库设计.md) | 影像申请、检查、报告等表结构 |
| 状态机设计 | [M05-影像管理/M05-影像管理-状态机设计.md](./M05-影像管理/M05-影像管理-状态机设计.md) | 影像检查状态机 |

**包含表**: his_imaging_request, his_imaging_study, his_imaging_series, his_imaging_image, his_imaging_report, his_imaging_storage, his_imaging_instrument

---

### M06 药品管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M06-药品管理/M06-药品管理-数据库设计.md](./M06-药品管理/M06-药品管理-数据库设计.md) | 药品目录、库存等表结构 |
| 状态机设计 | [M06-药品管理/M06-药品管理-状态机设计.md](./M06-药品管理/M06-药品管理-状态机设计.md) | 处方状态机(药品视角) |

**包含表**: his_drug, his_drug_stock, his_drug_batch, his_drug_interaction

---

### M07 手术麻醉

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M07-手术麻醉/M07-手术麻醉-数据库设计.md](./M07-手术麻醉/M07-手术麻醉-数据库设计.md) | 手术申请、排期、记录等表结构 |
| 状态机设计 | [M07-手术麻醉/M07-手术麻醉-状态机设计.md](./M07-手术麻醉/M07-手术麻醉-状态机设计.md) | 手术、麻醉状态机 |

**包含表**: his_surgery_request, his_operating_room, his_surgery_schedule, his_surgery_record, his_anesthesia_record, his_anesthesia_vital, his_surgery_followup, his_surgery_checklist

---

### M08 财务管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M08-财务管理/M08-财务管理-数据库设计.md](./M08-财务管理/M08-财务管理-数据库设计.md) | 收费项目、医保结算等表结构 |
| 状态机设计 | [M08-财务管理/M08-财务管理-状态机设计.md](./M08-财务管理/M08-财务管理-状态机设计.md) | 费用、结算状态机 |

**包含表**: his_charge_item_def, his_charge_price, his_charge_price_history, his_insurance_mapping, his_insurance_settlement, his_charge_detail, his_payment_record, his_daily_report, his_monthly_report

---

### M09 系统管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M09-系统管理/M09-系统管理-数据库设计.md](./M09-系统管理/M09-系统管理-数据库设计.md) | 用户、角色、权限等表结构 |

**包含表**: sys_user, sys_role, sys_permission, sys_user_role, sys_role_permission, sys_dept, sys_dict_type, sys_dict_data, sys_audit_log

---

### M10 集成平台

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M10-集成平台/M10-集成平台-数据库设计.md](./M10-集成平台/M10-集成平台-数据库设计.md) | EMPI、消息引擎等表结构 |
| 状态机设计 | [M10-集成平台/M10-集成平台-状态机设计.md](./M10-集成平台/M10-集成平台-状态机设计.md) | 消息处理状态机 |

**包含表**: his_patient_empi, his_patient_merge, his_master_data_sync, his_master_data_log, his_message_queue, his_interface_config, his_interface_log

---

### M11 患者服务

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M11-患者服务/M11-患者服务-数据库设计.md](./M11-患者服务/M11-患者服务-数据库设计.md) | 患者门户、预约等表结构 |
| 状态机设计 | [M11-患者服务/M11-患者服务-状态机设计.md](./M11-患者服务/M11-患者服务-状态机设计.md) | 预约、支付状态机 |

**包含表**: his_patient_user, his_patient_card, his_patient_bindcard, his_appointment, his_payment_record, his_health_indicator, his_patient_family

---

### M12 运营管理

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M12-运营管理/M12-运营管理-数据库设计.md](./M12-运营管理/M12-运营管理-数据库设计.md) | 绩效、报表等表结构 |
| 状态机设计 | [M12-运营管理/M12-运营管理-状态机设计.md](./M12-运营管理/M12-运营管理-状态机设计.md) | 报表生成状态机 |

**包含表**: his_perf_indicator, his_perf_score, his_ops_report, his_ops_statistics, his_dashboard_config

---

### M13 AI辅助

| 文档类型 | 文件路径 | 说明 |
|----------|----------|------|
| 数据库设计 | [M13-AI辅助/M13-AI辅助-数据库设计.md](./M13-AI辅助/M13-AI辅助-数据库设计.md) | AI模型、结果等表结构 |
| 状态机设计 | [M13-AI辅助/M13-AI辅助-状态机设计.md](./M13-AI辅助/M13-AI辅助-状态机设计.md) | AI分析状态机 |

**包含表**: his_ai_model, his_ai_result, his_ai_config, his_ai_triage_log, his_ai_imaging_result, his_ai_emr_qc_result

---

## 三、设计文档统计

| 类型 | 全局文档 | 模块文档 | 总计 |
|------|----------|----------|------|
| 数据库设计 | 1 | 13 | 14 |
| 数据模型 | 1 | 0 | 1 |
| 状态机设计 | 1 | 13 | 14 |

---

## 四、数据库表统计

| 模块 | 表数量 | 年增量估算 |
|------|--------|------------|
| M01 门诊管理 | 8 | 约2000万条 |
| M02 住院管理 | 7 | 约3000万条 |
| M03 电子病历 | 9 | 约500万条 |
| M04 检验管理 | 12 | 约800万条 |
| M05 影像管理 | 7 | 约200万条 |
| M06 药品管理 | 4 | 约50万条 |
| M07 手术麻醉 | 8 | 约600万条 |
| M08 财务管理 | 9 | 约4000万条 |
| M09 系统管理 | 9 | 约1亿条 |
| M10 集成平台 | 7 | 约5000万条 |
| M11 患者服务 | 7 | 约200万条 |
| M12 运营管理 | 5 | 约600万条 |
| M13 AI辅助 | 11 | 约200万条 |
| **总计** | **103** | **约2亿条/年** |

---

> **最后更新**: 2026-06-22
