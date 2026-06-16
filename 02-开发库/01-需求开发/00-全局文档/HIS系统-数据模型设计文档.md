# YUDAO-AI-HIS 智慧医疗信息系统 - 数据模型设计文档

> **文档编号**: YUDAO-HIS-DM-001
> **版本**: V1.0
> **创建日期**: 2026-06-16
> **状态**: 设计中
> **参考标准**: HL7 FHIR R4 | ICD-10 | DICOM | 国家医保接口规范
> **关联文档**: YUDAO-HIS-PRD-001, YUDAO-HIS-BR-001

---

## 1. 设计概述

### 1.1 设计目标

| 目标类型 | 目标描述 | 衡量指标 |
|----------|----------|----------|
| 标准化目标 | 符合HL7 FHIR R4标准 | 12种FHIR资源完整映射 |
| 安全目标 | 满足等保三级数据安全要求 | 敏感数据加密存储 |
| 性能目标 | 支撑高并发业务场景 | 日门诊量5000+人次 |
| 扩展目标 | 支持业务灵活扩展 | 自定义字段、分表策略 |
| 互操作性目标 | 实现院内/院间数据交换 | FHIR接口互联互通 |

### 1.2 设计原则

1. **标准化原则**: 核心业务实体遵循HL7 FHIR R4资源定义
2. **唯一性原则**: 患者主索引(EMPI)全局唯一，支持重复检测和合并
3. **完整性原则**: 业务数据完整性约束，外键关联严格校验
4. **时效性原则**: 关键业务数据时效约束(病历24h、危急值15min)
5. **追溯性原则**: 药品批号全流程追溯，操作日志完整记录
6. **分表策略**: 大数据量表按年/月分表，优化查询性能

### 1.3 数据量估算

| 数据实体 | 年增量估算 | 分表策略 | 保留期限 |
|----------|------------|----------|----------|
| 患者主索引 | 约50万条 | 无需分表 | 永久保留 |
| 就诊记录 | 约200万条 | 按年分表 | 门诊≥15年，住院≥30年 |
| 医嘱 | 约1000万条 | 按年分表 | 住院≥30年 |
| 处方 | 约300万条 | 按年分表 | ≥15年 |
| 给药记录(eMAR) | 约2000万条 | 按年分表 | ≥30年 |
| 费用明细 | 约3000万条 | 按年分表 | ≥15年 |
| 操作日志 | 约500万条 | 按月分表 | ≥3年 |

---

## 2. 实体清单汇总表

### 2.1 按模块分类

| 模块 | 实体数量 | 核心实体 | 说明 |
|------|----------|----------|------|
| M09 系统管理 | 12 | 用户、角色、权限、科室、字典 | 基础支撑实体 |
| M01 门诊管理 | 15 | 挂号、就诊、处方、诊断 | 门诊业务实体 |
| M02 住院管理 | 18 | 入院、医嘱、eMAR、护理记录、床位 | 住院业务实体 |
| M06 药品管理 | 10 | 药品目录、库存、入库、出库 | 药品管理实体 |
| M03 电子病历 | 5 | 病历文书、病历模板 | 病历文档实体 |
| M04 检验管理 | 6 | 检验申请、标本、结果 | LIS业务实体 |
| M05 影像管理 | 6 | 影像检查、报告 | PACS业务实体 |
| M08 财务管理 | 8 | 费用、结算、预交金 | 财务业务实体 |

### 2.2 实体清单详情

#### M09 系统管理实体

| 实体编号 | 实体名称(中文) | 实体名称(英文) | 表名 | FHIR映射 | 数据量级 |
|----------|----------------|----------------|------|----------|----------|
| E-SYS-001 | 用户 | User | sys_user | Practitioner | 约5000条 |
| E-SYS-002 | 角色 | Role | sys_role | - | 约50条 |
| E-SYS-003 | 菜单 | Menu | sys_menu | - | 约200条 |
| E-SYS-004 | 科室 | Department | sys_dept | Organization | 约200条 |
| E-SYS-005 | 岗位 | Post | sys_post | - | 约50条 |
| E-SYS-006 | 字典类型 | DictType | sys_dict_type | - | 约100条 |
| E-SYS-007 | 字典数据 | DictData | sys_dict_data | - | 约20000条 |
| E-SYS-008 | 用户角色关联 | UserRole | sys_user_role | - | 约10000条 |
| E-SYS-009 | 角色菜单关联 | RoleMenu | sys_role_menu | - | 约5000条 |
| E-SYS-010 | 角色科室关联 | RoleDept | sys_role_dept | - | 约2000条 |
| E-SYS-011 | 操作日志 | OperateLog | sys_operate_log | - | 约500万条/年 |
| E-SYS-012 | 登录日志 | LoginLog | sys_login_log | - | 约200万条/年 |

#### M01 门诊管理实体

| 实体编号 | 实体名称(中文) | 实体名称(英文) | 表名 | FHIR映射 | 数据量级 |
|----------|----------------|----------------|------|----------|----------|
| E-OP-001 | 患者主索引 | Patient | his_patient | Patient | 约50万条/年 |
| E-OP-002 | 挂号记录 | Registration | op_register | Encounter | 约200万条/年 |
| E-OP-003 | 预约记录 | Appointment | op_appointment | - | 约100万条/年 |
| E-OP-004 | 排班记录 | Schedule | op_schedule | - | 约5万条/年 |
| E-OP-005 | 就诊记录 | Encounter | op_encounter | Encounter | 约200万条/年 |
| E-OP-006 | 诊断记录 | Diagnosis | op_diagnosis | Condition | 约200万条/年 |
| E-OP-007 | 处方记录 | Prescription | op_prescription | MedicationRequest | 约300万条/年 |
| E-OP-008 | 处方明细 | PrescriptionItem | op_prescription_item | - | 约1000万条/年 |
| E-OP-009 | CDS校验记录 | CdsCheck | op_cds_check | - | 约500万条/年 |
| E-OP-010 | 检验申请 | LabRequest | op_lab_request | ServiceRequest | 约100万条/年 |
| E-OP-011 | 检查申请 | ImageRequest | op_image_request | ServiceRequest | 约50万条/年 |
| E-OP-012 | 门诊病历 | OutpatientEmr | op_emr | DocumentReference | 约200万条/年 |
| E-OP-013 | 门诊收费 | OutpatientCharge | op_charge | - | 约200万条/年 |
| E-OP-014 | 门诊收费明细 | OutpatientChargeItem | op_charge_item | - | 约1000万条/年 |
| E-OP-015 | 过敏记录 | AllergyIntolerance | his_allergy | AllergyIntolerance | 约10万条/年 |

#### M02 住院管理实体

| 实体编号 | 实体名称(中文) | 实体名称(英文) | 表名 | FHIR映射 | 数据量级 |
|----------|----------------|----------------|------|----------|----------|
| E-IP-001 | 入院记录 | Admission | ip_admission | Encounter(inpatient) | 约30万条/年 |
| E-IP-002 | 住院床位 | Bed | ip_bed | Location | 约1000条 |
| E-IP-003 | 床位分配 | BedAllocation | ip_bed_allocation | - | 约30万条/年 |
| E-IP-004 | 预交金 | Prepayment | ip_prepayment | - | 约50万条/年 |
| E-IP-005 | 医嘱 | Order | ip_order | MedicationRequest/ServiceRequest | 约1000万条/年 |
| E-IP-006 | 医嘱执行 | OrderExecution | ip_order_execution | - | 约2000万条/年 |
| E-IP-007 | eMAR给药记录 | MedicationAdmin | ip_medication_admin | MedicationAdministration | 约2000万条/年 |
| E-IP-008 | 护理记录 | NursingRecord | ip_nursing_record | Observation | 约500万条/年 |
| E-IP-009 | 体温单 | VitalSign | ip_vital_sign | Observation | 约1000万条/年 |
| E-IP-010 | 护理评估 | NursingAssessment | ip_nursing_assessment | Observation | 约50万条/年 |
| E-IP-011 | 跌倒评估 | FallAssessment | ip_fall_assessment | Observation | 约50万条/年 |
| E-IP-012 | 压疮评估 | PressureAssessment | ip_pressure_assessment | Observation | 约50万条/年 |
| E-IP-013 | 交接班记录 | Handover | ip_handover | - | 约20万条/年 |
| E-IP-014 | 出院记录 | Discharge | ip_discharge | Encounter(discharge) | 约30万条/年 |
| E-IP-015 | 住院诊断 | InpatientDiagnosis | ip_diagnosis | Condition | 约50万条/年 |
| E-IP-016 | 入院诊断 | AdmissionDiagnosis | ip_admission_diagnosis | Condition | 约30万条/年 |
| E-IP-017 | 出院诊断 | DischargeDiagnosis | ip_discharge_diagnosis | Condition | 约30万条/年 |
| E-IP-018 | 腕带记录 | Wristband | ip_wristband | - | 约30万条/年 |

#### M06 药品管理实体

| 实体编号 | 实体名称(中文) | 实体名称(英文) | 表名 | FHIR映射 | 数据量级 |
|----------|----------------|----------------|------|----------|----------|
| E-PHARM-001 | 药品目录 | Drug | drug_catalog | Medication | 约5万条 |
| E-PHARM-002 | 药品库存 | DrugStock | drug_stock | - | 约10万条 |
| E-PHARM-003 | 入库记录 | Inbound | drug_inbound | - | 约5万条/年 |
| E-PHARM-004 | 入库明细 | InboundItem | drug_inbound_item | - | 约20万条/年 |
| E-PHARM-005 | 出库记录 | Outbound | drug_outbound | - | 约10万条/年 |
| E-PHARM-006 | 出库明细 | OutboundItem | drug_outbound_item | - | 约50万条/年 |
| E-PHARM-007 | 库存盘点 | Inventory | drug_inventory | - | 约2万条/年 |
| E-PHARM-008 | 盘点明细 | InventoryItem | drug_inventory_item | - | 约10万条/年 |
| E-PHARM-009 | 效期预警 | ExpiryWarning | drug_expiry_warning | - | 约5000条/年 |
| E-PHARM-010 | 库存预警 | StockWarning | drug_stock_warning | - | 约5000条/年 |

---

## 3. 实体详细定义表

### 3.1 M09 系统管理实体定义

#### E-SYS-001 用户 (sys_user)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| user_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 用户ID |
| username | VARCHAR | 30 | Y | UNIQUE, REGEX^[a-zA-Z][a-zA-Z0-9_]{2,19}$ | - | 用户名 |
| password | VARCHAR | 100 | Y | ENCRYPTED | - | 密码(加密存储) |
| real_name | VARCHAR | 50 | Y | - | - | 真实姓名 |
| id_card | VARCHAR | 18 | N | UNIQUE | - | 身份证号 |
| phone | VARCHAR | 20 | N | - | - | 手机号 |
| email | VARCHAR | 50 | N | - | - | 邮箱 |
| gender | TINYINT | - | N | 1男/2女/0未知 | 0 | 性别 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 所属科室ID |
| post_id | BIGINT | - | N | FK->sys_post | - | 岗位ID |
| status | TINYINT | - | Y | 1正常/2停用 | 1 | 状态 |
| avatar | VARCHAR | 200 | N | - | - | 头像URL |
| login_ip | VARCHAR | 50 | N | - | - | 最后登录IP |
| login_date | DATETIME | - | N | - | - | 最后登录时间 |
| pwd_update_date | DATETIME | - | N | - | - | 密码更新时间 |
| fail_count | INT | - | N | - | 0 | 连续登录失败次数 |
| lock_time | DATETIME | - | N | - | - | 账户锁定时间 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |
| update_by | VARCHAR | 50 | N | - | - | 更新人 |
| del_flag | TINYINT | - | Y | 0正常/2删除 | 0 | 删除标志 |

**业务规则约束**:
- BR-SYS-001: 用户名唯一，格式校验^[a-zA-Z][a-zA-Z0-9_]{2,19}$
- BR-SYS-002: 密码复杂度要求≥8位，含3类字符
- BR-SYS-003: 连续失败5次锁定30分钟
- BR-SYS-004: 密码必须加密存储

**数据来源**: 用户管理模块创建/修改
**数据去向**: 登录认证、权限校验、业务操作人员记录

---

#### E-SYS-002 角色 (sys_role)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| role_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 角色ID |
| role_name | VARCHAR | 50 | Y | - | - | 角色名称 |
| role_key | VARCHAR | 30 | Y | UNIQUE | - | 角色标识(英文) |
| role_sort | INT | - | Y | - | 0 | 显示顺序 |
| data_scope | TINYINT | - | Y | 1全部/2自定义/3本部门/4本部门及下级/5仅本人 | 1 | 数据权限范围 |
| status | TINYINT | - | Y | 1正常/2停用 | 1 | 状态 |
| remark | VARCHAR | 500 | N | - | - | 备注 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |
| update_by | VARCHAR | 50 | N | - | - | 更新人 |
| del_flag | TINYINT | - | Y | 0正常/2删除 | 0 | 删除标志 |

**业务规则约束**:
- BR-SYS-010: 角色标识唯一
- BR-SYS-011: 有用户分配的角色不可删除
- BR-SYS-012: 菜单权限控制未授权菜单隐藏
- BR-SYS-013: 按钮权限控制未授权按钮隐藏
- BR-SYS-014: 数据权限按范围过滤数据

**数据来源**: 角色管理模块创建/修改
**数据去向**: 用户角色分配、权限校验

---

#### E-SYS-004 科室 (sys_dept)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| dept_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 科室ID |
| dept_code | VARCHAR | 20 | Y | UNIQUE | - | 科室编码 |
| dept_name | VARCHAR | 50 | Y | - | - | 科室名称 |
| dept_short_name | VARCHAR | 30 | N | - | - | 科室简称 |
| dept_type | TINYINT | - | Y | 1临床/2医技/3行政/4后勤 | 1 | 科室类型 |
| parent_id | BIGINT | - | Y | FK->sys_dept, 0为顶级 | 0 | 上级科室ID |
| dept_level | INT | - | N | 1-5 | 1 | 科室层级 |
| leader | VARCHAR | 50 | N | - | - | 科室负责人 |
| phone | VARCHAR | 20 | N | - | - | 科室电话 |
| email | VARCHAR | 50 | N | - | - | 科室邮箱 |
| location | VARCHAR | 100 | N | - | - | 科室位置 |
| bed_count | INT | - | N | - | 0 | 编制床位数 |
| sort_order | INT | - | N | - | 0 | 排序号 |
| status | TINYINT | - | Y | 1正常/2停用 | 1 | 状态 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |
| update_by | VARCHAR | 50 | N | - | - | 更新人 |
| del_flag | TINYINT | - | Y | 0正常/2删除 | 0 | 删除标志 |

**业务规则约束**:
- BR-SYS-015: 科室编码唯一
- BR-SYS-016: 有下级科室不可删除
- BR-SYS-017: 有关联用户不可删除
- BR-SYS-042: 科室层级最大5级

**数据来源**: 组织架构管理模块创建/修改
**数据去向**: 用户归属、数据权限过滤、业务科室关联

**FHIR映射**: Organization资源

---

#### E-SYS-006/E-SYS-007 数据字典 (sys_dict_type/sys_dict_data)

**字典类型表 (sys_dict_type)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| dict_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 字典ID |
| dict_name | VARCHAR | 100 | Y | - | - | 字典名称 |
| dict_type | VARCHAR | 100 | Y | UNIQUE | - | 字典类型编码 |
| status | TINYINT | - | Y | 1正常/2停用 | 1 | 状态 |
| remark | VARCHAR | 500 | N | - | - | 备注 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |
| update_by | VARCHAR | 50 | N | - | - | 更新人 |

**字典数据表 (sys_dict_data)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| dict_code | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 字典数据ID |
| dict_type | VARCHAR | 100 | Y | FK->sys_dict_type | - | 字典类型 |
| dict_label | VARCHAR | 100 | Y | - | - | 字典标签(显示值) |
| dict_value | VARCHAR | 100 | Y | - | - | 字典键值(存储值) |
| dict_sort | INT | - | N | - | 0 | 排序号 |
| css_class | VARCHAR | 100 | N | - | - | CSS样式属性 |
| list_class | VARCHAR | 100 | N | - | - | 表格回显样式 |
| is_default | TINYINT | - | N | 1是/0否 | 0 | 是否默认 |
| status | TINYINT | - | Y | 1正常/2停用 | 1 | 状态 |
| remark | VARCHAR | 500 | N | - | - | 备注 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |
| update_by | VARCHAR | 50 | N | - | - | 更新人 |

**核心字典类型清单**:

| 字典类型 | 字典名称 | 数据来源 | 数据量 |
|----------|----------|----------|--------|
| sys_gender | 性别字典 | GB/T 2261.1 | 3条 |
| sys_status | 状态字典 | 系统定义 | 5条 |
| icd10 | ICD-10诊断编码 | WHO | 约20000条 |
| drug_freq | 药品频次编码 | 行业标准 | 约15条 |
| drug_route | 用药途径编码 | 行业标准 | 约20条 |
| drug_dose_unit | 剂量单位 | 行业标准 | 约30条 |
| specimen_type | 标本类型 | LIS标准 | 约15条 |
| dicom_modality | 影像模态 | DICOM标准 | 约20条 |
| visit_type | 就诊类型 | HIS标准 | 5条 |
| order_status | 医嘱状态 | HIS标准 | 7条 |
| prescription_status | 处方状态 | HIS标准 | 7条 |
| charge_category | 费用类别 | 财务标准 | 12条 |
| insurance_type | 医保类型 | 医保标准 | 5条 |

**业务规则约束**:
- BR-SYS-018: 字典类型编码唯一
- BR-SYS-006: 被引用字典数据不可删除，只能停用
- BR-SYS-007: 字典变更必须记录版本历史
- BR-SYS-020: 停用数据下拉不显示

---

#### E-SYS-011/E-SYS-012 操作日志/登录日志

**操作日志表 (sys_operate_log)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| log_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 日志ID |
| user_id | BIGINT | - | Y | - | - | 操作用户ID |
| username | VARCHAR | 50 | Y | - | - | 用户名 |
| operation_type | TINYINT | - | Y | 1查询/2新增/3修改/4删除/5导出/6打印 | - | 操作类型 |
| module_code | VARCHAR | 50 | Y | - | - | 模块编码 |
| module_name | VARCHAR | 100 | Y | - | - | 模块名称 |
| operation_desc | VARCHAR | 200 | N | - | - | 操作描述 |
| request_url | VARCHAR | 200 | N | - | - | 请求URL |
| request_method | VARCHAR | 10 | N | - | - | 请求方法 |
| request_params | TEXT | - | N | MASKED | - | 请求参数(脱敏) |
| response_code | INT | - | N | - | - | 响应状态码 |
| response_msg | VARCHAR | 200 | N | - | - | 响应消息 |
| ip_address | VARCHAR | 50 | N | - | - | 操作IP地址 |
| location | VARCHAR | 100 | N | - | - | 操作地点 |
| user_agent | VARCHAR | 200 | N | - | - | 用户代理 |
| browser | VARCHAR | 50 | N | - | - | 浏览器 |
| os | VARCHAR | 50 | N | - | - | 操作系统 |
| operation_time | DATETIME | - | Y | - | NOW() | 操作时间 |
| execution_time | INT | - | N | - | - | 执行时长(ms) |
| status | TINYINT | - | Y | 1成功/2失败 | - | 操作状态 |
| error_msg | TEXT | - | N | - | - | 错误信息 |

**分表策略**: 按月分表 sys_operate_log_YYYYMM

**登录日志表 (sys_login_log)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| info_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 日志ID |
| user_id | BIGINT | - | N | - | - | 用户ID |
| username | VARCHAR | 50 | Y | - | - | 用户名 |
| ip_address | VARCHAR | 50 | N | - | - | 登录IP |
| location | VARCHAR | 100 | N | - | - | 登录地点 |
| browser | VARCHAR | 50 | N | - | - | 浏览器 |
| os | VARCHAR | 50 | N | - | - | 操作系统 |
| login_time | DATETIME | - | Y | - | NOW() | 登录时间 |
| login_status | TINYINT | - | Y | 1成功/2失败 | - | 登录状态 |
| login_msg | VARCHAR | 200 | N | - | - | 登录消息 |
| logout_time | DATETIME | - | N | - | - | 登出时间 |

**业务规则约束**:
- BR-SYS-005: 日志只增不改，禁止UPDATE/DELETE
- BR-SYS-021: 关键操作必须记录日志
- BR-SYS-022: 登录成功/失败必须记录
- BR-SYS-023: 敏感数据脱敏存储
- BR-SYS-051: 日志保留≥3年

---

### 3.2 M01 门诊管理实体定义

#### E-OP-001 患者主索引 (his_patient)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| patient_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 患者ID(EMPI) |
| patient_no | VARCHAR | 30 | Y | UNIQUE | - | 患者编号(就诊卡号) |
| id_card | VARCHAR | 18 | N | UNIQUE | - | 身份证号 |
| patient_name | VARCHAR | 50 | Y | - | - | 患者姓名 |
| gender | TINYINT | - | Y | 1男/2女/9未知 | - | 性别 |
| birth_date | DATE | - | N | - | - | 出生日期 |
| age | INT | - | N | CALCULATED | - | 年龄(计算字段) |
| phone | VARCHAR | 20 | Y | - | - | 手机号 |
| address | VARCHAR | 200 | N | - | - | 地址 |
| emergency_contact | VARCHAR | 50 | N | - | - | 紧急联系人 |
| emergency_phone | VARCHAR | 20 | N | - | - | 紧急联系人电话 |
| insurance_type | TINYINT | - | N | 字典insurance_type | - | 医保类型 |
| insurance_no | VARCHAR | 50 | N | - | - | 医保号 |
| insurance_status | TINYINT | - | N | 1有效/2无效 | - | 医保状态 |
| allergy_history | TEXT | - | N | - | - | 过敏史(JSON数组) |
| past_history | TEXT | - | N | - | - | 既往史(JSON数组) |
| family_history | TEXT | - | N | - | - | 家族史 |
| blood_type | VARCHAR | 10 | N | - | - | 血型 |
| create_time | DATETIME | - | Y | - | NOW() | 建档时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |
| update_by | VARCHAR | 50 | N | - | - | 更新人 |
| del_flag | TINYINT | - | Y | 0正常/2删除 | 0 | 删除标志 |

**唯一标识策略**:
- 主键: patient_id (EMPI全局唯一)
- 业务唯一键: patient_no (就诊卡号)
- 辅助唯一键: id_card (身份证号)

**业务规则约束**:
- BR-INT-002: EMPI全局唯一，支持重复检测和合并
- BR-OP-001: 患者身份信息必填校验

**数据来源**: 挂号建档、预约建档、入院建档
**数据去向**: 挂号、就诊、医嘱、处方、检验检查、住院等所有业务关联

**FHIR映射**: Patient资源

---

#### E-OP-002 挂号记录 (op_register)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| register_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 挂号ID |
| register_no | VARCHAR | 30 | Y | UNIQUE | - | 挂号编号(GH+日期+序号) |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| patient_name | VARCHAR | 50 | Y | - | - | 患者姓名 |
| patient_phone | VARCHAR | 20 | N | - | - | 患者手机号 |
| id_card | VARCHAR | 18 | N | - | - | 身份证号 |
| register_date | DATE | - | Y | - | - | 挂号日期 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 挂号科室ID |
| dept_name | VARCHAR | 100 | Y | - | - | 科室名称 |
| doctor_id | BIGINT | - | Y | FK->sys_user | - | 挂号医生ID |
| doctor_name | VARCHAR | 50 | Y | - | - | 医生姓名 |
| schedule_id | BIGINT | - | Y | FK->op_schedule | - | 排班ID |
| register_type | TINYINT | - | Y | 1普通/2专家/3急诊/4特需 | - | 挂号类型 |
| queue_no | VARCHAR | 10 | Y | - | - | 排队序号(N001/E001) |
| register_fee | DECIMAL | 10,2 | Y | - | 0.00 | 挂号费 |
| diagnose_fee | DECIMAL | 10,2 | Y | - | 0.00 | 诊查费 |
| total_fee | DECIMAL | 10,2 | Y | - | 0.00 | 费用合计 |
| insurance_pay | DECIMAL | 10,2 | N | - | 0.00 | 医保支付 |
| personal_pay | DECIMAL | 10,2 | Y | - | 0.00 | 个人支付 |
| pay_type | TINYINT | - | Y | 1现金/2医保/3微信/4支付宝/5银行卡 | - | 支付方式 |
| pay_time | DATETIME | - | N | - | - | 支付时间 |
| register_status | TINYINT | - | Y | 1已挂号/2已就诊/3已退号/4已取消 | - | 挂号状态 |
| visit_time | DATETIME | - | N | - | - | 就诊时间 |
| is_appointment | TINYINT | - | Y | 0现场/1预约 | 0 | 是否预约挂号 |
| appointment_id | BIGINT | - | N | FK->op_appointment | - | 预约ID |
| is_priority | TINYINT | - | N | 0普通/1优先 | 0 | 是否优先 |
| triage_level | VARCHAR | 2 | N | I/II/III/IV | - | 急诊分级 |
| is_missed | TINYINT | - | N | 0正常/1过号 | 0 | 是否过号 |
| missed_time | DATETIME | - | N | - | - | 过号时间 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |

**唯一标识策略**:
- 主键: register_id
- 业务唯一键: register_no (GH+YYYYMMDD+序号)

**业务规则约束**:
- BR-OP-002: 预约挂号限次(每人每科室每日限1次)
- BR-OP-003: 退号时间限制(已就诊不可退号)
- BR-OP-004: 急诊分级分诊(I级立即就诊)
- BR-OP-005: 医保身份实时验证
- BR-OP-033: 挂号状态流转规则

**数据来源**: 现场挂号、预约签到、急诊挂号
**数据去向**: 就诊记录、收费、病历

**FHIR映射**: Encounter资源(门诊就诊)

---

#### E-OP-003 预约记录 (op_appointment)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| appointment_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 预约ID |
| appointment_no | VARCHAR | 30 | Y | UNIQUE | - | 预约编号 |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| patient_name | VARCHAR | 50 | Y | - | - | 患者姓名 |
| patient_phone | VARCHAR | 20 | Y | - | - | 患者手机号 |
| appointment_date | DATE | - | Y | - | - | 预约日期 |
| time_slot_start | TIME | - | Y | - | - | 时间段开始 |
| time_slot_end | TIME | - | Y | - | - | 时间段结束 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 预约科室ID |
| dept_name | VARCHAR | 100 | Y | - | - | 科室名称 |
| doctor_id | BIGINT | - | Y | FK->sys_user | - | 预约医生ID |
| doctor_name | VARCHAR | 50 | Y | - | - | 医生姓名 |
| schedule_id | BIGINT | - | Y | FK->op_schedule | - | 排班ID |
| register_type | TINYINT | - | Y | 1普通/2专家 | - | 挂号类型 |
| appointment_status | TINYINT | - | Y | 1已预约/2已签到/3已取消/4已过期 | - | 预约状态 |
| register_id | BIGINT | - | N | FK->op_register | - | 签到后挂号ID |
| create_channel | TINYINT | - | Y | 1微信/2APP/3网站/4电话 | - | 创建渠道 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| cancel_time | DATETIME | - | N | - | - | 取消时间 |
| cancel_reason | VARCHAR | 200 | N | - | - | 取消原因 |
| expire_time | DATETIME | - | N | - | - | 过期时间 |

**业务规则约束**:
- BR-OP-001: 预约挂号限次
- BR-OP-002: 预约号源范围(7天内)
- BR-OP-034: 预约状态流转规则

**数据来源**: 微信/APP/网站预约
**数据去向**: 签到生成挂号记录

---

#### E-OP-005 就诊记录 (op_encounter)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| encounter_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 就诊ID |
| encounter_no | VARCHAR | 30 | Y | UNIQUE | - | 就诊编号 |
| register_id | BIGINT | - | Y | FK->op_register | - | 挂号ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| patient_name | VARCHAR | 50 | Y | - | - | 患者姓名 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 科室ID |
| dept_name | VARCHAR | 100 | Y | - | - | 科室名称 |
| doctor_id | BIGINT | - | Y | FK->sys_user | - | 医生ID |
| doctor_name | VARCHAR | 50 | Y | - | - | 医生姓名 |
| encounter_status | TINYINT | - | Y | 1待诊/2就诊中/3已完成 | - | 就诊状态 |
| start_time | DATETIME | - | N | - | - | 就诊开始时间 |
| end_time | DATETIME | - | N | - | - | 就诊结束时间 |
| chief_complaint | VARCHAR | 500 | N | - | - | 主诉 |
| present_illness | TEXT | - | N | - | - | 现病史 |
| physical_exam | TEXT | - | N | - | - | 体格检查 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |

**业务规则约束**:
- BR-OP-036: 就诊状态流转规则
- BR-OP-023: 同时接诊限制(需先完成当前患者)

**数据来源**: 医生接诊开始
**数据去向**: 诊断、处方、病历、检验检查

**FHIR映射**: Encounter资源

---

#### E-OP-006 诊断记录 (op_diagnosis)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| diagnosis_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 诊断ID |
| encounter_id | BIGINT | - | Y | FK->op_encounter | - | 就诊ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| diagnosis_type | TINYINT | - | Y | 1主诊断/2次诊断 | - | 诊断类型 |
| diagnose_code | VARCHAR | 20 | Y | 字典icd10 | - | ICD-10编码 |
| diagnose_name | VARCHAR | 100 | Y | - | - | 诊断名称 |
| diagnosis_order | INT | - | Y | - | - | 诊断顺序 |
| diagnosis_time | DATETIME | - | Y | - | NOW() | 诊断时间 |
| doctor_id | BIGINT | - | Y | FK->sys_user | - | 诊断医生ID |
| doctor_name | VARCHAR | 50 | Y | - | - | 医生姓名 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |

**业务规则约束**:
- BR-OP-006: 诊断必须使用ICD-10编码
- BR-OP-026: 诊断数量上限(最多5个)

**数据来源**: 医生工作站诊断开立
**数据去向**: 病历、处方、住院入院诊断

**FHIR映射**: Condition资源

---

#### E-OP-007/E-OP-008 处方记录/处方明细

**处方记录表 (op_prescription)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| prescription_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 处方ID |
| prescription_no | VARCHAR | 30 | Y | UNIQUE | - | 处方编号 |
| encounter_id | BIGINT | - | Y | FK->op_encounter | - | 就诊ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| prescription_type | TINYINT | - | Y | 1普通/2急诊/3儿科/4麻醉/5精神/6中药 | - | 处方类型 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 开方科室ID |
| doctor_id | BIGINT | - | Y | FK->sys_user | - | 开方医生ID |
| doctor_name | VARCHAR | 50 | Y | - | - | 开方医生姓名 |
| diagnose_code | VARCHAR | 20 | N | - | - | 诊断编码 |
| diagnose_name | VARCHAR | 100 | N | - | - | 诊断名称 |
| total_amount | DECIMAL | 12,2 | N | - | 0.00 | 处方总金额 |
| cds_status | TINYINT | - | Y | 1未校验/2通过/3有警告/4高风险 | - | CDS校验状态 |
| cds_warnings | JSON | - | N | - | - | CDS警告信息(JSON) |
| pharmacist_id | BIGINT | - | N | FK->sys_user | - | 审方药师ID |
| audit_time | DATETIME | - | N | - | - | 审方时间 |
| audit_result | TINYINT | - | N | 1通过/2退回 | - | 审方结果 |
| audit_reason | VARCHAR | 200 | N | - | - | 退回原因 |
| prescription_status | TINYINT | - | Y | 1开立/2审核通过/3审核退回/4已调配/5已发药/6已退药 | - | 处方状态 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |

**处方明细表 (op_prescription_item)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| item_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 明细ID |
| prescription_id | BIGINT | - | Y | FK->op_prescription | - | 处方ID |
| drug_id | BIGINT | - | Y | FK->drug_catalog | - | 药品ID |
| drug_code | VARCHAR | 20 | Y | - | - | 药品编码 |
| drug_name | VARCHAR | 100 | Y | - | - | 药品名称 |
| drug_spec | VARCHAR | 100 | N | - | - | 药品规格 |
| unit | VARCHAR | 20 | Y | - | - | 单位 |
| dosage | DECIMAL | 10,2 | Y | - | - | 单次剂量 |
| dosage_unit | VARCHAR | 20 | Y | - | - | 剂量单位 |
| frequency_code | VARCHAR | 20 | Y | 字典drug_freq | - | 频次编码(QD/BID/TID等) |
| frequency_name | VARCHAR | 50 | Y | - | - | 频次名称 |
| route_code | VARCHAR | 20 | Y | 字典drug_route | - | 用药途径编码 |
| route_name | VARCHAR | 50 | Y | - | - | 用药途径名称 |
| days | INT | - | Y | - | - | 用药天数 |
| quantity | DECIMAL | 10,2 | Y | CALCULATED | - | 药品数量(计算) |
| unit_price | DECIMAL | 10,4 | Y | - | - | 单价 |
| amount | DECIMAL | 12,2 | Y | - | - | 金额 |
| item_order | INT | - | Y | - | - | 序号 |
| remark | VARCHAR | 200 | N | - | - | 备注 |

**业务规则约束**:
- BR-OP-006: 处方开立必须CDS四维校验(相互作用、过敏、剂量、配伍禁忌)
- BR-OP-007: 处方金额超过500元需二次确认
- BR-OP-018: 普通处方最多开具7天药量
- BR-OP-019: 单张处方药品数量上限5种
- BR-OP-028: 处方金额计算规则
- BR-OP-035: 处方状态流转规则

**数据来源**: 门诊医生工作站开方
**数据去向**: 药房审核、发药、收费

**FHIR映射**: MedicationRequest资源

---

#### E-OP-009 CDS校验记录 (op_cds_check)

| 字段名 | 字段类型 | 度度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| cds_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | CDS校验ID |
| prescription_id | BIGINT | - | Y | FK->op_prescription | - | 处方ID |
| check_type | VARCHAR | 20 | Y | INTERACTION/ALLERGY/DOSE/INCOMPATIBILITY/CHILDREN | - | 校验类型 |
| warning_level | VARCHAR | 10 | Y | HIGH/MEDIUM/LOW | - | 警告级别 |
| warning_message | VARCHAR | 500 | Y | - | - | 警告信息 |
| mechanism | VARCHAR | 500 | N | - | - | 机制说明 |
| suggestion | VARCHAR | 500 | N | - | - | 处理建议 |
| is_confirmed | TINYINT | - | Y | 0否/1是 | 0 | 是否已确认 |
| confirm_reason | VARCHAR | 200 | N | - | - | 确认原因 |
| confirm_time | DATETIME | - | N | - | - | 确认时间 |
| confirm_by | VARCHAR | 50 | N | - | - | 确认人 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |

**业务规则约束**:
- BR-OP-006: CDS四维校验必须覆盖全部维度
- HIGH级别警告不可忽略，必须修改处方
- MEDIUM级别警告需确认原因后可继续
- LOW级别警告可忽略

---

#### E-OP-015 过敏记录 (his_allergy)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| allergy_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 过敏记录ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| allergy_type | TINYINT | - | Y | 1药物/2食物/3环境/4其他 | - | 过敏类型 |
| allergy_code | VARCHAR | 50 | N | - | - | 过敏物质编码 |
| allergy_name | VARCHAR | 100 | Y | - | - | 过敏物质名称 |
| reaction | VARCHAR | 200 | N | - | - | 过敏反应描述 |
| severity | TINYINT | - | N | 1轻微/2中等/3严重 | - | 严重程度 |
| confirmed | TINYINT | - | N | 0疑似/1确认 | - | 确认状态 |
| source | VARCHAR | 50 | N | - | - | 信息来源 |
| verify_time | DATETIME | - | N | - | - | 验证时间 |
| status | TINYINT | - | Y | 1有效/2无效 | 1 | 状态 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |

**数据来源**: 患者建档、就诊问询、入院评估
**数据去向**: CDS过敏校验、病历、患者信息展示

**FHIR映射**: AllergyIntolerance资源

---

### 3.3 M02 住院管理实体定义

#### E-IP-001 入院记录 (ip_admission)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| admission_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 入院ID |
| admission_no | VARCHAR | 30 | Y | UNIQUE | - | 住院号(ZY+YYYYMM+序号) |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| patient_name | VARCHAR | 50 | Y | - | - | 患者姓名 |
| admission_date | DATE | - | Y | - | - | 入院日期 |
| admission_time | DATETIME | - | Y | - | - | 入院时间 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 入院科室ID |
| dept_name | VARCHAR | 100 | Y | - | - | 科室名称 |
| ward_id | BIGINT | - | Y | FK->sys_dept | - | 病区ID |
| ward_name | VARCHAR | 100 | Y | - | - | 病区名称 |
| bed_id | BIGINT | - | Y | FK->ip_bed | - | 床位ID |
| bed_no | VARCHAR | 10 | Y | - | - | 床号 |
| admission_type | TINYINT | - | Y | 1门诊/2急诊/3转院/4其他 | - | 入院方式 |
| admission_situation | TINYINT | - | Y | 1危/2急/3一般 | - | 入院情况 |
| attending_doctor_id | BIGINT | - | Y | FK->sys_user | - | 主治医师ID |
| attending_doctor_name | VARCHAR | 50 | Y | - | - | 主治医师姓名 |
| resident_doctor_id | BIGINT | - | N | FK->sys_user | - | 住院医师ID |
| resident_doctor_name | VARCHAR | 50 | N | - | - | 住院医师姓名 |
| nurse_id | BIGINT | - | N | FK->sys_user | - | 责任护士ID |
| nurse_name | VARCHAR | 50 | N | - | - | 责任护士姓名 |
| referring_doctor_id | BIGINT | - | N | FK->sys_user | - | 接诊医生ID |
| referring_encounter_id | BIGINT | - | N | FK->op_encounter | - | 关联门诊就诊ID |
| admission_diagnosis_code | VARCHAR | 20 | N | 字典icd10 | - | 入院诊断编码 |
| admission_diagnosis_name | VARCHAR | 100 | N | - | - | 入院诊断名称 |
| prepayment_total | DECIMAL | 12,2 | N | - | 0.00 | 预交金总额 |
| prepayment_balance | DECIMAL | 12,2 | N | - | 0.00 | 预交金余额 |
| insurance_type | TINYINT | - | N | 字典insurance_type | - | 医保类型 |
| insurance_no | VARCHAR | 50 | N | - | - | 医保号 |
| insurance_register_time | DATETIME | - | N | - | - | 医保登记时间 |
| wristband_no | VARCHAR | 30 | N | - | - | 腕带编号 |
| wristband_status | TINYINT | - | N | 0未打印/1已打印 | 0 | 腕带状态 |
| admission_status | TINYINT | - | Y | 1待入科/2已入科/3在院/4出院 | - | 入院状态 |
| in_ward_time | DATETIME | - | N | - | - | 入科时间 |
| discharge_time | DATETIME | - | N | - | - | 出院时间 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |

**唯一标识策略**:
- 主键: admission_id
- 业务唯一键: admission_no (ZY+YYYYMM+序号)

**业务规则约束**:
- BR-IP-001: 入院必须关联门诊诊断或急诊诊断
- BR-IP-002: 预交金不足预警与限制
- BR-IP-003: 床位分配兼容性校验(性别、病种)
- BR-IP-004: 入院护理评估4小时内完成
- BR-IP-006: 医保登记24小时内完成

**数据来源**: 入院登记
**数据去向**: 医嘱、护理、病历、收费、出院结算

**FHIR映射**: Encounter资源(inpatient)

---

#### E-IP-002 床位 (ip_bed)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| bed_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 床位ID |
| bed_no | VARCHAR | 10 | Y | - | - | 床号(如101-1) |
| ward_id | BIGINT | - | Y | FK->sys_dept | - | 病区ID |
| ward_name | VARCHAR | 100 | Y | - | - | 病区名称 |
| room_no | VARCHAR | 10 | Y | - | - | 房间号 |
| bed_type | TINYINT | - | Y | 1普通/2双人/3单人/4监护/5隔离 | - | 床位类型 |
| bed_level | TINYINT | - | N | 1普通/2中级/3高级 | - | 床位等级 |
| gender_limit | TINYINT | - | N | 0不限/1男/2女 | 0 | 性别限制 |
| is_isolation | TINYINT | - | N | 0否/1是 | 0 | 是否隔离床位 |
| status | TINYINT | - | Y | 1空闲/2占用/3预约/4维修/5停用 | 1 | 床位状态 |
| current_patient_id | BIGINT | - | N | FK->his_patient | - | 当前患者ID |
| current_admission_id | BIGINT | - | N | FK->ip_admission | - | 当前住院ID |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |

**数据来源**: 床位管理配置
**数据去向**: 入院床位分配、床位查询

**FHIR映射**: Location资源

---

#### E-IP-003 床位分配 (ip_bed_allocation)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| allocation_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 分配ID |
| admission_id | BIGINT | - | Y | FK->ip_admission | - | 入院ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| bed_id | BIGINT | - | Y | FK->ip_bed | - | 床位ID |
| bed_no | VARCHAR | 10 | Y | - | - | 床号 |
| allocate_time | DATETIME | - | Y | - | NOW() | 分配时间 |
| allocate_type | TINYINT | - | Y | 1入院分配/2转床/3转科 | - | 分配类型 |
| from_bed_id | BIGINT | - | N | FK->ip_bed | - | 原床位ID(转床时) |
| release_time | DATETIME | - | N | - | - | 释放时间 |
| release_type | TINYINT | - | N | 1出院/2转床/3转科 | - | 释放类型 |
| operator_id | BIGINT | - | Y | FK->sys_user | - | 操作人ID |
| operator_name | VARCHAR | 50 | Y | - | - | 操作人姓名 |

---

#### E-IP-004 预交金 (ip_prepayment)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| prepayment_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 预交金ID |
| admission_id | BIGINT | - | Y | FK->ip_admission | - | 入院ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| prepayment_no | VARCHAR | 30 | Y | UNIQUE | - | 预交金收据号 |
| amount | DECIMAL | 12,2 | Y | - | - | 缴纳金额 |
| pay_type | TINYINT | - | Y | 1现金/2医保/3微信/4支付宝/5银行卡 | - | 支付方式 |
| pay_time | DATETIME | - | Y | - | NOW() | 支付时间 |
| operator_id | BIGINT | - | Y | FK->sys_user | - | 收费员ID |
| operator_name | VARCHAR | 50 | Y | - | - | 收费员姓名 |
| is_refund | TINYINT | - | Y | 0否/1是 | 0 | 是否退款 |
| refund_amount | DECIMAL | 12,2 | N | - | 0.00 | 退款金额 |
| refund_time | DATETIME | - | N | - | - | 退款时间 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |

**业务规则约束**:
- BR-IP-002: 预交金余额预警(80%使用率)
- BR-IP-011: 预交金预警阈值设置

---

#### E-IP-005 医嘱 (ip_order)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| order_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 医嘱ID |
| order_no | VARCHAR | 30 | Y | UNIQUE | - | 医嘱编号 |
| admission_id | BIGINT | - | Y | FK->ip_admission | - | 入院ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| order_category | TINYINT | - | Y | 1长期/2临时 | - | 医嘱分类 |
| order_type | TINYINT | - | Y | 1药品/2检验/3检查/4护理/5饮食/6治疗/7其他 | - | 医嘱类型 |
| order_content | VARCHAR | 500 | Y | - | - | 医嘱内容 |
| drug_id | BIGINT | - | N | FK->drug_catalog | - | 药品ID(药品医嘱) |
| drug_code | VARCHAR | 20 | N | - | - | 药品编码 |
| drug_name | VARCHAR | 100 | N | - | - | 药品名称 |
| drug_spec | VARCHAR | 100 | N | - | - | 药品规格 |
| dosage | DECIMAL | 10,2 | N | - | - | 单次剂量 |
| dosage_unit | VARCHAR | 20 | N | - | - | 剂量单位 |
| frequency_code | VARCHAR | 20 | N | 字典drug_freq | - | 频次编码 |
| frequency_name | VARCHAR | 50 | N | - | - | 频次名称 |
| route_code | VARCHAR | 20 | N | 字典drug_route | - | 用药途径编码 |
| route_name | VARCHAR | 50 | N | - | - | 用药途径名称 |
| days | INT | - | N | - | - | 用药天数 |
| start_time | DATETIME | - | Y | - | NOW() | 开始时间 |
| stop_time | DATETIME | - | N | - | - | 停止时间 |
| stop_reason | VARCHAR | 200 | N | - | - | 停止原因 |
| urgent_flag | TINYINT | - | N | 0常规/1紧急 | 0 | 紧急标志 |
| cds_status | TINYINT | - | N | 1未校验/2通过/3有警告/4高风险 | - | CDS校验状态 |
| cds_warnings | JSON | - | N | - | - | CDS警告信息 |
| order_status | TINYINT | - | Y | 1开立/2审核/3执行中/4已完成/5已停止/6已作废/7退回 | - | 医嘱状态 |
| doctor_id | BIGINT | - | Y | FK->sys_user | - | 开立医生ID |
| doctor_name | VARCHAR | 50 | Y | - | - | 开立医生姓名 |
| nurse_id | BIGINT | - | N | FK->sys_user | - | 审核护士ID |
| nurse_name | VARCHAR | 50 | N | - | - | 审核护士姓名 |
| audit_time | DATETIME | - | N | - | - | 审核时间 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 开立科室ID |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |

**业务规则约束**:
- BR-IP-005: 住院医嘱CDS校验(同门诊处方)
- BR-IP-006: 长期医嘱停止需提前一天
- BR-IP-007: 医嘱状态流转规则(开立→审核→执行→完成)
- BR-ORD-001: 医嘱编号规则
- BR-ORD-002: 医嘱停止权限(只能停止自己开立的)
- BR-ORD-003: 长期医嘱有效期
- BR-ORD-004: 紧急医嘱立即通知护士站

**数据来源**: 住院医生工作站开立
**数据去向**: 护士执行、药房配药、eMAR记录、收费

**FHIR映射**: MedicationRequest(药品)/ServiceRequest(检验检查)

---

#### E-IP-007 eMAR给药记录 (ip_medication_admin)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| emar_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | eMAR记录ID |
| emar_no | VARCHAR | 30 | Y | UNIQUE | - | eMAR编号 |
| admission_id | BIGINT | - | Y | FK->ip_admission | - | 入院ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| order_id | BIGINT | - | Y | FK->ip_order | - | 医嘱ID |
| drug_id | BIGINT | - | Y | FK->drug_catalog | - | 药品ID |
| drug_name | VARCHAR | 100 | Y | - | - | 药品名称 |
| batch_no | VARCHAR | 30 | Y | - | - | 药品批号 |
| expire_date | DATE | - | Y | - | - | 药品效期 |
| scheduled_time | DATETIME | - | Y | - | - | 预定执行时间 |
| actual_time | DATETIME | - | N | - | - | 实际执行时间 |
| dosage | DECIMAL | 10,2 | Y | - | - | 执行剂量 |
| route_code | VARCHAR | 20 | Y | 字典drug_route | - | 给药途径 |
| wristband_scan_time | DATETIME | - | N | - | - | 腕带扫描时间 |
| wristband_match | TINYINT | - | N | 0不匹配/1匹配 | - | 腕带核对结果 |
| drug_scan_time | DATETIME | - | N | - | - | 药品条码扫描时间 |
| drug_match | TINYINT | - | N | 0不匹配/1匹配 | - | 药品核对结果 |
| double_check_pass | TINYINT | - | N | 0未通过/1通过 | - | 双重核对结果 |
| admin_status | TINYINT | - | Y | 1待执行/2已执行/3未执行/4延迟执行 | - | 执行状态 |
| no_exec_reason | VARCHAR | 200 | N | - | - | 未执行原因 |
| delay_reason | VARCHAR | 200 | N | - | - | 延迟原因 |
| nurse_id | BIGINT | - | Y | FK->sys_user | - | 执行护士ID |
| nurse_name | VARCHAR | 50 | Y | - | - | 执行护士姓名 |
| dept_id | BIGINT | - | Y | FK->sys_dept | - | 执行科室ID |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |

**分表策略**: 按年分表 ip_medication_admin_YYYY

**业务规则约束**(HIMSS EMRAM Stage 5核心):
- BR-EMAR-001: 双重核对强制(腕带+药品条码)
- BR-EMAR-002: 腕带扫描顺序(先腕带后药品)
- BR-EMAR-003: 核对失败阻止给药
- BR-EMAR-004: eMAR必填项(时间、剂量、途径、护士、核对结果)
- BR-EMAR-005: 药品过期检查(过期禁止使用)
- BR-EMAR-006: 批号追溯(给药记录关联批号)
- BR-EMAR-007: 延迟给药记录(超过1小时需填写原因)
- BR-EMAR-008: 未执行通知医生

**数据来源**: 护理工作站闭环给药执行
**数据去向**: 医嘱执行状态、费用记账、药品追溯

**FHIR映射**: MedicationAdministration资源

---

#### E-IP-008 护理记录 (ip_nursing_record)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| record_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 记录ID |
| admission_id | BIGINT | - | Y | FK->ip_admission | - | 入院ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| record_type | TINYINT | - | Y | 1一般护理/2危重护理/3手术护理/4特殊护理 | - | 记录类型 |
| record_date | DATE | - | Y | - | - | 记录日期 |
| record_time | DATETIME | - | Y | - | NOW() | 记录时间 |
| content | TEXT | - | Y | - | - | 护理记录内容 |
| assessment_result | VARCHAR | 200 | N | - | - | 评估结果 |
| nursing_measures | VARCHAR | 500 | N | - | - | 护理措施 |
| effect_evaluation | VARCHAR | 200 | N | - | - | 效果评价 |
| nurse_id | BIGINT | - | Y | FK->sys_user | - | 记录护士ID |
| nurse_name | VARCHAR | 50 | Y | - | - | 记录护士姓名 |
| sign_time | DATETIME | - | N | - | - | 签名时间 |
| is_signed | TINYINT | - | N | 0未签名/1已签名 | 0 | 签名状态 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |

**分表策略**: 按年分表 ip_nursing_record_YYYY

**业务规则约束**:
- BR-NR-001: 护理记录时限(护理操作后2小时内完成)
- BR-NR-002: 护理记录签名锁定(签名后不可修改)

**FHIR映射**: Observation资源

---

#### E-IP-009 体温单/生命体征 (ip_vital_sign)

| 字段名 | 字段类型 | 度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| sign_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 记录ID |
| admission_id | BIGINT | - | Y | FK->ip_admission | - | 入院ID |
| patient_id | BIGINT | - | Y | FK->his_patient | - | 患者ID |
| record_date | DATE | - | Y | - | - | 记录日期 |
| record_time | DATETIME | - | Y | - | NOW() | 记录时间 |
| temperature | DECIMAL | 5,2 | N | - | - | 体温(℃) |
| pulse | INT | - | N | - | - | 脉搏(次/分) |
| respiration | INT | - | N | - | - | 呼吸(次/分) |
| blood_pressure_high | INT | - | N | - | - | 收缩压(mmHg) |
| blood_pressure_low | INT | - | N | - | - | 舒张压(mmHg) |
| weight | DECIMAL | 5,2 | N | - | - | 体重(kg) |
| height | DECIMAL | 5,2 | N | - | - | 身高(cm) |
| pain_score | INT | - | N | 0-10 | - | 疼痛评分 |
| is_abnormal | TINYINT | - | N | 0正常/1异常 | 0 | 是否异常 |
| abnormal_items | VARCHAR | 200 | N | - | - | 异常项描述 |
| nurse_id | BIGINT | - | Y | FK->sys_user | - | 测量护士ID |
| nurse_name | VARCHAR | 50 | Y | - | - | 测量护士姓名 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |

**分表策略**: 按年分表 ip_vital_sign_YYYY

**业务规则约束**:
- BR-IP-011: 生命体征异常立即通知医生
- BR-VS-001: 体温异常阈值(>38.5℃为发热需预警)

**FHIR映射**: Observation资源

---

### 3.4 M06 药品管理实体定义

#### E-PHARM-001 药品目录 (drug_catalog)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| drug_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 药品ID |
| drug_code | VARCHAR | 20 | Y | UNIQUE | - | 药品编码 |
| drug_name | VARCHAR | 100 | Y | - | - | 药品名称 |
| drug_spec | VARCHAR | 100 | N | - | - | 药品规格 |
| drug_form | VARCHAR | 50 | N | - | - | 剂型(片剂/注射剂等) |
| drug_type | TINYINT | - | Y | 1西药/2中成药/3中药材/4生物制品 | - | 药品类型 |
| drug_class | VARCHAR | 50 | N | - | - | 药品分类(抗生素/心血管等) |
| manufacturer | VARCHAR | 100 | N | - | - | 生产厂家 |
| origin | VARCHAR | 50 | N | - | - | 产地 |
| unit | VARCHAR | 20 | Y | - | - | 最小单位 |
| package_unit | VARCHAR | 20 | N | - | - | 包装单位 |
| package_quantity | INT | - | N | - | - | 包装数量 |
| purchase_price | DECIMAL | 10,4 | N | - | - | 采购价 |
| retail_price | DECIMAL | 10,4 | Y | - | - | 零售价 |
| is_special | TINYINT | - | N | 0否/1麻醉/2精神/3毒性/4放射性 | 0 | 特殊药品标志 |
| antibiotic_level | TINYINT | - | N | 0非抗菌/1非限制/2限制/3特殊 | 0 | 抗菌药物分级 |
| min_stock | DECIMAL | 10,2 | N | - | - | 最低库存 |
| max_stock | DECIMAL | 10,2 | N | - | - | 最高库存 |
| storage_condition | VARCHAR | 50 | N | - | - | 储存条件 |
| default_frequency | VARCHAR | 20 | N | 字典drug_freq | - | 默认频次 |
| default_route | VARCHAR | 20 | N | 字典drug_route | - | 默认途径 |
| default_dosage | DECIMAL | 10,2 | N | - | - | 默认剂量 |
| status | TINYINT | - | Y | 1正常/2停用 | 1 | 状态 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | N | - | - | 更新时间 |
| create_by | VARCHAR | 50 | Y | - | - | 创建人 |
| update_by | VARCHAR | 50 | N | - | - | 更新人 |

**业务规则约束**:
- BR-PHARM-004: 麻醉药品五专管理(专人、专柜、专锁、专账、专方)
- BR-PHARM-008: 抗菌药物分级管理(特殊级需副高以上医师开立)

**数据来源**: 药品目录维护
**数据去向**: 处方、医嘱、库存、收费

**FHIR映射**: Medication资源

---

#### E-PHARM-002 药品库存 (drug_stock)

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| stock_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 库存ID |
| drug_id | BIGINT | - | Y | FK->drug_catalog | - | 药品ID |
| drug_code | VARCHAR | 20 | Y | - | - | 药品编码 |
| drug_name | VARCHAR | 100 | Y | - | - | 药品名称 |
| drug_spec | VARCHAR | 100 | N | - | - | 药品规格 |
| batch_no | VARCHAR | 30 | Y | - | - | 批号 |
| expire_date | DATE | - | Y | - | - | 效期 |
| purchase_price | DECIMAL | 10,4 | N | - | - | 采购价 |
| retail_price | DECIMAL | 10,4 | Y | - | - | 零售价 |
| quantity | DECIMAL | 10,2 | Y | - | - | 库存数量 |
| unit | VARCHAR | 20 | Y | - | - | 单位 |
| location | VARCHAR | 50 | N | - | - | 存放位置 |
| warehouse_type | TINYINT | - | Y | 1药库/2门诊药房/3住院药房 | - | 库房类型 |
| warehouse_id | BIGINT | - | Y | FK->sys_dept | - | 库房ID |
| min_stock | DECIMAL | 10,2 | N | - | - | 最低库存 |
| max_stock | DECIMAL | 10,2 | N | - | - | 最高库存 |
| status | TINYINT | - | Y | 1正常/2近效期/3已过期/4停用 | 1 | 库存状态 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |
| update_time | DATETIME | - | Y | - | NOW() | 更新时间 |

**业务规则约束**:
- BR-PHARM-002: 近效期预警(≤90天自动预警)
- BR-PHARM-003: 先进先出原则(优先出近效期批次)
- BR-PHARM-007: 库存安全预警(低于最低库存预警)
- BR-PHARM-009: 发药库存扣减原子性
- BR-PHARM-020: 过期药品禁止出库

---

#### E-PHARM-003/E-PHARM-004 入库记录/入库明细

**入库记录表 (drug_inbound)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| inbound_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 入库单ID |
| inbound_no | VARCHAR | 30 | Y | UNIQUE | - | 入库单号 |
| inbound_type | TINYINT | - | Y | 1采购入库/2退货入库/3调拨入库 | - | 入库类型 |
| order_id | BIGINT | - | N | FK->purchase_order | - | 关联采购订单ID |
| warehouse_id | BIGINT | - | Y | FK->sys_dept | - | 入库库房ID |
| supplier_id | BIGINT | - | N | FK->sys_dept | - | 供应商ID |
| supplier_name | VARCHAR | 100 | N | - | - | 供应商名称 |
| total_quantity | DECIMAL | 10,2 | Y | - | - | 入库总数量 |
| total_amount | DECIMAL | 12,2 | Y | - | - | 入库总金额 |
| operator_id | BIGINT | - | Y | FK->sys_user | - | 经办人ID |
| operator_name | VARCHAR | 50 | Y | - | - | 经办人姓名 |
| check_person_id | BIGINT | - | Y | FK->sys_user | - | 验收人ID |
| check_person_name | VARCHAR | 50 | Y | - | - | 验收人姓名 |
| check_time | DATETIME | - | Y | - | NOW() | 验收时间 |
| status | TINYINT | - | Y | 1待验收/2已完成/3已取消 | - | 入库状态 |
| remark | VARCHAR | 500 | N | - | - | 备注 |
| create_time | DATETIME | - | Y | - | NOW() | 创建时间 |

**入库明细表 (drug_inbound_item)**:

| 字段名 | 字段类型 | 长度 | 必填 | 约束 | 默认值 | 说明 |
|--------|----------|------|------|------|--------|------|
| item_id | BIGINT | - | Y | PK, AUTO_INCREMENT | - | 明细ID |
| inbound_id | BIGINT | - | Y | FK->drug_inbound | - | 入库单ID |
| drug_id | BIGINT | - | Y | FK->drug_catalog | - | 药品ID |
| drug_code | VARCHAR | 20 | Y | - | - | 药品编码 |
| drug_name | VARCHAR | 100 | Y | - | - | 药品名称 |
| drug_spec | VARCHAR | 100 | N | - | - | 药品规格 |
| batch_no | VARCHAR | 30 | Y | - | - | 批号 |
| expire_date | DATE | - | Y | - | - | 效期 |
| order_quantity | DECIMAL | 10,2 | Y | - | - | 订购数量 |
| actual_quantity | DECIMAL | 10,2 | Y | - | - | 实收数量 |
| diff_quantity | DECIMAL | 10,2 | N | - | 0.00 | 差异数量 |
| diff_reason | VARCHAR | 200 | N | - | - | 差异原因 |
| purchase_price | DECIMAL | 10,4 | Y | - | - | 采购价 |
| amount | DECIMAL | 12,2 | Y | - | - | 金额 |
| check_result | TINYINT | - | Y | 1合格/2不合格 | - | 验收结果 |
| check_remark | VARCHAR | 200 | N | - | - | 验收备注 |

**业务规则约束**:
- BR-PHARM-001: 药品入库必须验收(品名、规格、批号、效期、数量)

---

### 3.5 实体关系矩阵

| 实体A | 实体B | 关系类型 | 关系描述 | 外键字段 |
|-------|-------|----------|----------|----------|
| 患者 | 挂号记录 | 1:N | 一个患者可以有多次挂号 | register.patient_id |
| 患者 | 入院记录 | 1:N | 一个患者可以有多次入院 | admission.patient_id |
| 患者 | 过敏记录 | 1:N | 一个患者可以有多个过敏记录 | allergy.patient_id |
| 挂号记录 | 就诊记录 | 1:1 | 一个挂号对应一次就诊 | encounter.register_id |
| 挂号记录 | 预约记录 | 1:0..1 | 预约签到生成挂号 | register.appointment_id |
| 就诊记录 | 诊断记录 | 1:N | 一次就诊可以有多个诊断 | diagnosis.encounter_id |
| 就诊记录 | 处方记录 | 1:N | 一次就诊可以有多个处方 | prescription.encounter_id |
| 处方记录 | 处方明细 | 1:N | 一个处方包含多个药品 | item.prescription_id |
| 处方记录 | CDS校验 | 1:N | 一个处方可以有多个CDS警告 | cds_check.prescription_id |
| 入院记录 | 床位分配 | 1:N | 一次入院可以有多次床位分配 | allocation.admission_id |
| 入院记录 | 预交金 | 1:N | 一次入院可以多次缴纳预交金 | prepayment.admission_id |
| 入院记录 | 医嘱 | 1:N | 一次入院可以有多个医嘱 | order.admission_id |
| 医嘱 | eMAR记录 | 1:N | 一个医嘱可以有多次执行记录 | emar.order_id |
| 入院记录 | 护理记录 | 1:N | 一次入院可以有多个护理记录 | nursing_record.admission_id |
| 入院记录 | 生命体征 | 1:N | 一次入院可以有多次体征测量 | vital_sign.admission_id |
| 科室 | 用户 | 1:N | 一个科室有多个用户 | user.dept_id |
| 科室 | 挂号记录 | 1:N | 一个科室可以有多个挂号 | register.dept_id |
| 用户 | 角色 | N:M | 用户与角色多对多关联 | sys_user_role |
| 角色 | 菜单 | N:M | 角色与菜单多对多关联 | sys_role_menu |
| 药品目录 | 药品库存 | 1:N | 一个药品可以有多个批号库存 | stock.drug_id |
| 药品库存 | 入库明细 | 1:N | 库存来源于入库明细 | inbound_item关联stock |

---

## 4. FHIR资源映射对照表

### 4.1 核心FHIR资源映射

| FHIR资源 | HIS实体 | 映射字段 | 用途说明 |
|----------|----------|----------|----------|
| Patient | his_patient | patient_id→identifier, patient_name→name, gender→gender, birth_date→birthDate, phone→telecom | 患者主索引，EMPI全局唯一 |
| Encounter | op_encounter | encounter_id→identifier, patient_id→subject, dept_id→serviceProvider, doctor_id→participant, start_time→period.start | 门诊就诊记录 |
| Encounter(inpatient) | ip_admission | admission_id→identifier, patient_id→subject, ward_id→serviceProvider, admission_type→class, admission_date→period.start | 住院入院记录 |
| Practitioner | sys_user | user_id→identifier, real_name→name, dept_id→organization, gender→gender | 医护人员信息 |
| Organization | sys_dept | dept_id→identifier, dept_name→name, dept_type→type, parent_id→partOf | 科室机构信息 |
| Condition | op_diagnosis/ip_diagnosis | diagnosis_id→identifier, patient_id→subject, diagnose_code→code, diagnose_name→display, diagnosis_time→recordedDate | 诊断信息 |
| MedicationRequest | op_prescription/ip_order | prescription_id→identifier, patient_id→subject, drug_id→medication, dosage→dosage, frequency→frequency | 处方/药品医嘱 |
| MedicationAdministration | ip_medication_admin | emar_id→identifier, patient_id→subject, order_id→request, drug_id→medication, actual_time→effectiveTime | eMAR给药记录 |
| Medication | drug_catalog | drug_id→identifier, drug_name→name, drug_form→form, drug_spec→amount | 药品目录信息 |
| Observation | ip_vital_sign/ip_nursing_record | sign_id→identifier, patient_id→subject, admission_id→encounter, temperature→value | 生命体征/护理记录 |
| AllergyIntolerance | his_allergy | allergy_id→identifier, patient_id→patient, allergy_name→code, reaction→reaction | 过敏史记录 |
| ServiceRequest | op_lab_request/op_image_request/ip_order(检验检查) | request_id→identifier, patient_id→subject, order_content→code | 检验检查申请 |
| DocumentReference | op_emr | emr_id→identifier, patient_id→subject, encounter_id→context | 门诊病历文书 |
| Location | ip_bed | bed_id→identifier, bed_no→name, ward_id→managingOrganization, bed_type→type | 床位位置信息 |

### 4.2 FHIR接口设计

| HIS业务 | FHIR资源 | FHIR操作 | HIS接口 | 说明 |
|----------|----------|----------|----------|----------|
| 患者建档 | Patient | POST /Patient | /api/patient/create | 创建患者主索引 |
| 患者查询 | Patient | GET /Patient/{id} | /api/patient/{id} | 查询患者信息 |
| 门诊挂号 | Encounter | POST /Encounter | /api/register/create | 创建门诊挂号记录 |
| 住院入院 | Encounter | POST /Encounter | /api/admission/create | 创建住院入院记录 |
| 开立处方 | MedicationRequest | POST /MedicationRequest | /api/prescription/create | 创建处方记录 |
| 给药记录 | MedicationAdministration | POST /MedicationAdministration | /api/emar/create | 创建eMAR记录 |
| 诊断录入 | Condition | POST /Condition | /api/diagnosis/create | 创建诊断记录 |
| 检验申请 | ServiceRequest | POST /ServiceRequest | /api/lab/request | 创建检验申请 |

---

## 5. 数据安全设计

### 5.1 数据加密

| 数据类型 | 加密方式 | 存储位置 | 说明 |
|----------|----------|----------|------|
| 密码 | AES256+BCrypt | sys_user.password | 密码加密存储 |
| 身份证号 | AES256 | his_patient.id_card | 敏感身份信息加密 |
| 医保号 | AES256 | his_patient.insurance_no | 医保信息加密 |
| 手机号 | AES256(可选) | his_patient.phone | 联系方式加密 |
| 操作日志请求参数 | AES256(脱敏) | sys_operate_log.request_params | 密码等敏感参数脱敏 |

### 5.2 数据权限

| 数据范围 | 权限标识 | SQL条件 | 适用角色 |
|----------|----------|----------|----------|
| 全部数据 | SCOPE_ALL | 无限制 | 系统管理员、医院管理者 |
| 本部门数据 | SCOPE_DEPT | dept_id = user.dept_id | 科室主任 |
| 本部门及下级 | SCOPE_DEPT_CHILD | dept_id IN (user.dept及下级) | 科室负责人 |
| 仅本人数据 | SCOPE_SELF | create_by = user.username | 普通医生/护士 |
| 自定义数据 | SCOPE_CUSTOM | dept_id IN (自定义科室列表) | 特殊角色 |

### 5.3 数据审计

| 审计类型 | 审计内容 | 审计表 | 保留期限 |
|----------|----------|----------|----------|
| 操作审计 | 所有业务操作记录 | sys_operate_log | ≥3年 |
| 登录审计 | 登录成功/失败记录 | sys_login_log | ≥3年 |
| 数据变更审计 | 关键数据变更前后值 | 业务表变更日志字段 | ≥15年 |
| CDS审计 | CDS校验结果和确认记录 | op_cds_check | ≥15年 |

---

## 6. 分表策略与索引设计

### 6.1 分表策略

| 数据表 | 分表策略 | 分表规则 | 说明 |
|--------|----------|----------|------|
| op_encounter | 按年分表 | op_encounter_YYYY | 就诊记录数据量大 |
| op_prescription_item | 按年分表 | op_prescription_item_YYYY | 处方明细数据量大 |
| ip_order | 按年分表 | ip_order_YYYY | 医嘱数据量大 |
| ip_medication_admin | 按年分表 | ip_medication_admin_YYYY | eMAR记录数据量大 |
| ip_nursing_record | 按年分表 | ip_nursing_record_YYYY | 护理记录数据量大 |
| ip_vital_sign | 按年分表 | ip_vital_sign_YYYY | 生命体征数据量大 |
| his_charge_detail | 按年分表 | his_charge_detail_YYYY | 费用明细数据量大 |
| sys_operate_log | 按月分表 | sys_operate_log_YYYYMM | 操作日志数据量极大 |

### 6.2 核心索引设计

| 数据表 | 索引名称 | 索引字段 | 索引类型 | 说明 |
|--------|----------|----------|----------|------|
| his_patient | idx_patient_no | patient_no | UNIQUE | 患者编号唯一索引 |
| his_patient | idx_id_card | id_card | UNIQUE | 身份证号唯一索引 |
| his_patient | idx_patient_name | patient_name | NORMAL | 患者姓名索引(模糊查询) |
| op_register | idx_register_date | register_date, dept_id | NORMAL | 挂号日期+科室复合索引 |
| op_register | idx_patient_id | patient_id | NORMAL | 患者ID索引 |
| op_encounter | idx_encounter_date | encounter_date, dept_id | NORMAL | 就诊日期+科室复合索引 |
| op_prescription | idx_prescription_status | prescription_status, create_time | NORMAL | 处方状态+时间索引 |
| ip_admission | idx_admission_status | admission_status | NORMAL | 入院状态索引 |
| ip_order | idx_order_admission | admission_id, order_status | NORMAL | 入院ID+医嘱状态复合索引 |
| ip_medication_admin | idx_emar_order | order_id, admin_status | NORMAL | 医嘱ID+执行状态复合索引 |
| ip_bed | idx_bed_status | ward_id, status | NORMAL | 病区+床位状态复合索引 |
| drug_stock | idx_stock_drug | drug_id, warehouse_id | NORMAL | 药品+库房复合索引 |
| drug_stock | idx_stock_expire | expire_date, status | NORMAL | 效期+状态索引(效期检查) |

---

## 7. 附录

### 7.1 状态流转定义

#### 挂号状态流转

| 状态值 | 状态名称 | 可流转状态 | 触发条件 |
|--------|----------|------------|----------|
| 1 | 已挂号 | 2已就诊, 3已退号, 4已取消 | 挂号完成 |
| 2 | 已就诊 | - | 医生接诊 |
| 3 | 已退号 | - | 退号处理(未就诊时) |
| 4 | 已取消 | - | 预约取消 |

#### 医嘱状态流转

| 状态值 | 状态名称 | 可流转状态 | 触发条件 |
|--------|----------|------------|----------|
| 1 | 开立 | 2审核, 6已作废, 7退回 | 医生提交医嘱 |
| 2 | 审核 | 3执行中, 7退回 | 护士审核通过 |
| 3 | 执行中 | 4已完成, 5已停止 | 开始执行 |
| 4 | 已完成 | - | 执行完成 |
| 5 | 已停止 | - | 医生停止长期医嘱 |
| 6 | 已作废 | - | 医生撤销开立状态医嘱 |
| 7 | 退回 | 1开立, 6已作废 | 护士退回审核 |

#### 处方状态流转

| 状态值 | 状态名称 | 可流转状态 | 触发条件 |
|--------|----------|------------|----------|
| 1 | 开立 | 2审核通过, 3审核退回 | 医生提交处方 |
| 2 | 审核通过 | 4已调配, 6已退药 | 药师审核通过 |
| 3 | 审核退回 | 1开立 | 药师退回处方 |
| 4 | 已调配 | 5已发药 | 药房配药完成 |
| 5 | 已发药 | 6已退药 | 发药确认 |
| 6 | 已退药 | - | 退药处理 |

#### 床位状态流转

| 状态值 | 状态名称 | 可流转状态 | 触发条件 |
|--------|----------|------------|----------|
| 1 | 空闲 | 2占用, 3预约 | 床位可用 |
| 2 | 占用 | 1空闲 | 入院分配床位 |
| 3 | 预约 | 1空闲, 2占用 | 预约床位 |
| 4 | 维修 | 1空闲 | 床位维修 |
| 5 | 停用 | - | 床位停用 |

### 7.2 参考标准清单

| 标准名称 | 版本 | 应用范围 |
|----------|------|----------|
| HL7 FHIR R4 | Release 4 | 数据交换接口、实体映射 |
| ICD-10 | 第10次修订本 | 诊断编码标准 |
| DICOM | 3.0 | 影像数据标准 |
| GB/T 2261.1 | - | 性别编码标准 |
| 国家医保接口规范 | V1.0 | 医保结算接口 |
| 等保三级标准 | - | 数据安全要求 |

---

## 附录A: 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| V1.0 | 2026-06-16 | 初始版本，基于PRD和业务规则文档设计数据模型 | YUDAO-AI-HIS数据架构组 |

---

> **数据架构师**: ________________
> **技术负责人**: ________________
> **最后更新**: 2026-06-16