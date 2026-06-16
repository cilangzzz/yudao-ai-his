# YUDAO-AI-HIS 智慧医疗信息系统 - 系统架构图(C4模型)

> **文档编号**: YUDAO-HIS-ARCH-001
> **版本**: V1.0
> **创建日期**: 2026-06-16
> **状态**: 设计中
> **参考文档**: YUDAO-HIS-PRD-001, YUDAO-HIS-MDD-001, YUDAO-HIS-DM-001, YUDAO-HIS-API-001
> **架构标准**: C4 Model | HIMSS EMRAM Stage 5+ | HL7 FHIR R4

---

## 1. C4模型概述

### 1.1 架构分层说明

C4模型是一种分层架构设计方法，通过四个层次的抽象来描述软件系统架构：

| 层级 | 名称 | 关注点 | 目标受众 |
|------|------|--------|----------|
| Level 1 | 系统上下文图 (System Context) | 系统与外部世界的关系 | 非技术人员、管理层 |
| Level 2 | 容器图 (Container Diagram) | 系统内部高层结构 | 技术决策者、架构师 |
| Level 3 | 组件图 (Component Diagram) | 容器内部的组件构成 | 开发人员、架构师 |
| Level 4 | 代码图 (Code Diagram) | 组件内部的代码结构 | 开发人员 |

### 1.2 系统定位

YUDAO-AI-HIS智慧医疗信息系统是一套面向三级医院的综合医院信息系统，目标达到HIMSS EMRAM Stage 5+水平，核心特性包括：

- **闭环给药管理**: 腕带+药品条码双重核对，给药差错率降低90%
- **临床决策支持(CDS)**: 药物相互作用、过敏检查、剂量合理性四维校验
- **标准互操作**: 基于HL7 FHIR R4实现院内/院间互联互通
- **AI辅助诊断**: 智能分诊、影像AI、病历质控AI

---

## 2. Level 1: 系统上下文图 (System Context)

### 2.1 架构图

```mermaid
C4Context
    title YUDAO-AI-HIS智慧医疗信息系统 - 系统上下文图

    Person(doctor, "医生", "门诊/住院医生\n接诊、开方、医嘱管理")
    Person(nurse, "护士", "护理工作站\n医嘱执行、eMAR给药")
    Person(pharmacist, "药师", "药房管理\n处方审核、药品调配")
    Person(cashier, "收费员", "收费管理\n费用结算、医保结算")
    Person(admin, "系统管理员", "系统运维\n用户权限、系统配置")
    Person(patient, "患者", "自助服务\n预约挂号、报告查询")

    System(his, "YUDAO-AI-HIS", "智慧医疗信息系统\nHIMSS EMRAM Stage 5+")

    System_Ext(insurance, "医保信息平台", "国家医保局\n费用结算、目录对照")
    System_Ext(lis, "LIS检验系统", "检验设备对接\n结果回传")
    System_Ext(pacs, "PACS影像系统", "DICOM影像存储\n影像调阅")
    System_Ext(region, "区域卫生信息平台", "健康档案共享\n双向转诊")
    System_Ext(payment, "支付平台", "微信/支付宝/银联\n在线支付")
    System_Ext(ca, "CA电子签名", "电子签名服务\n符合电子签名法")
    System_Ext(sms, "短信平台", "预约提醒\n验证码通知")
    System_Ext(ai, "AI辅助诊断服务", "影像AI、NLP\n辅助诊断建议")

    Rel(doctor, his, "接诊、开方、医嘱管理")
    Rel(nurse, his, "医嘱执行、eMAR给药")
    Rel(pharmacist, his, "处方审核、药品调配")
    Rel(cashier, his, "费用结算、医保结算")
    Rel(admin, his, "用户管理、系统配置")
    Rel(patient, his, "预约挂号、报告查询")

    Rel(his, insurance, "医保结算\n国家医保局接口规范")
    Rel(his, lis, "检验申请/结果\nHL7 FHIR/ASTM")
    Rel(his, pacs, "影像申请/调阅\nDICOM/HL7")
    Rel(his, region, "健康档案共享\nHL7 CDA/FHIR")
    Rel(his, payment, "在线支付\nREST API")
    Rel(his, ca, "电子签名\nPKI/CA")
    Rel(his, sms, "短信通知\nREST API")
    Rel(his, ai, "AI辅助诊断\nREST/gRPC")
```

### 2.2 系统上下文说明

#### 2.2.1 用户角色

| 用户角色 | 主要职责 | 核心功能需求 |
|----------|----------|--------------|
| 医生 | 接诊、诊断、开方、医嘱管理 | 门诊医生工作站、住院医生工作站、CDS校验 |
| 护士 | 医嘱执行、护理记录、给药管理 | 护理工作站、eMAR闭环给药、体温单 |
| 药师 | 处方审核、药品调配、发药 | 门诊药房、住院药房、合理用药审核 |
| 收费员 | 费用结算、医保结算、退费管理 | 门诊收费、出院结算、日结对账 |
| 系统管理员 | 系统运维、权限管理、数据维护 | 用户管理、角色权限、字典管理 |
| 患者 | 自助挂号、报告查询、在线缴费 | 患者门户(微信小程序)、预约挂号 |

#### 2.2.2 外部系统

| 外部系统 | 接口编号 | 协议标准 | 交互内容 |
|----------|----------|----------|----------|
| 医保信息平台 | IF-001 | 国家医保局接口规范 | 医保身份验证、费用结算、目录对照 |
| LIS检验系统 | IF-002 | HL7 FHIR / ASTM | 检验申请、标本追踪、结果回传 |
| PACS影像系统 | IF-003 | DICOM / HL7 | 影像申请、DICOM存储、报告回传 |
| 区域卫生信息平台 | IF-005 | HL7 CDA / FHIR | 健康档案共享、双向转诊、EMPI同步 |
| 支付平台 | IF-006 | HTTPS REST API | 微信/支付宝/银联支付、退款 |
| CA电子签名 | IF-008 | PKI/CA | 电子签名、时间戳、签名验证 |
| 短信平台 | IF-009 | REST API | 预约提醒、验证码、危急值通知 |
| AI辅助诊断服务 | IF-010 | REST API / gRPC | 影像AI、智能分诊、病历质控AI |

### 2.3 关键设计决策

| 决策编号 | 决策内容 | 决策原因 |
|----------|----------|----------|
| ADR-001 | 采用HL7 FHIR R4作为互操作标准 | 符合国际医疗信息化标准，支持资源映射，便于院内/院间数据交换 |
| ADR-002 | 集成CA电子签名服务 | 符合《电子签名法》要求，病历文书具有法律效力 |
| ADR-003 | 对接AI辅助诊断服务 | 提升诊断效率，支持智慧医疗能力建设 |

---

## 3. Level 2: 容器图 (Container Diagram)

### 3.1 整体架构图

```mermaid
C4Container
    title YUDAO-AI-HIS智慧医疗信息系统 - 容器图

    Person(doctor, "医生", "门诊/住院医生")
    Person(nurse, "护士", "护理工作站")
    Person(pharmacist, "药师", "药房管理")
    Person(cashier, "收费员", "收费管理")
    Person(admin, "系统管理员", "系统运维")
    Person(patient, "患者", "自助服务")

    System_Boundary(his, "YUDAO-AI-HIS智慧医疗信息系统") {

        Container(web, "Vue3 Web应用", "Vue3 + Element Plus + TypeScript", "医护人员工作台\n门诊/住院/药房/管理后台")
        Container(miniapp, "微信小程序", "微信小程序原生/Taro", "患者自助服务\n预约挂号、报告查询、在线缴费")
        Container(selfservice, "自助机客户端", "Electron/Qt", "自助挂号、自助缴费、报告打印")

        Container(op_service, "门诊服务", "Spring Boot 3.x", "门诊业务\n挂号、医生工作站、收费、药房")
        Container(ip_service, "住院服务", "Spring Boot 3.x", "住院业务\n入院、医生工作站、护理、出院")
        Container(pharm_service, "药品服务", "Spring Boot 3.x", "药品管理\n药库、药房、库存、处方审核")
        Container(lis_service, "检验服务", "Spring Boot 3.x", "检验管理\n申请、标本、结果、危急值")
        Container(ris_service, "影像服务", "Spring Boot 3.x", "影像管理\n申请、DICOM、报告")
        Container(sys_service, "系统服务", "Spring Boot 3.x", "系统管理\n用户、角色、权限、字典")
        Container(integration_service, "集成平台", "Spring Boot 3.x", "集成服务\nEMPI、消息引擎、接口适配器")

        ContainerDb(mysql, "MySQL主库", "MySQL 8.x", "业务数据存储\n患者、就诊、医嘱、处方等")
        ContainerDb(redis, "Redis缓存", "Redis 7.x", "会话缓存\n热点数据、分布式锁")
        ContainerDb(minio, "MinIO对象存储", "MinIO", "文件存储\nDICOM影像、病历附件")
        ContainerDb(mq, "RabbitMQ消息队列", "RabbitMQ", "异步消息\n医嘱执行、费用记账、通知")
    }

    System_Ext(insurance, "医保信息平台")
    System_Ext(lis, "LIS检验系统")
    System_Ext(pacs, "PACS影像系统")
    System_Ext(region, "区域卫生信息平台")
    System_Ext(payment, "支付平台")
    System_Ext(ca, "CA电子签名")
    System_Ext(sms, "短信平台")
    System_Ext(ai, "AI辅助诊断服务")

    Rel(doctor, web, "接诊、开方、医嘱管理", "HTTPS/REST")
    Rel(nurse, web, "医嘱执行、eMAR给药", "HTTPS/REST")
    Rel(pharmacist, web, "处方审核、药品调配", "HTTPS/REST")
    Rel(cashier, web, "费用结算、医保结算", "HTTPS/REST")
    Rel(admin, web, "用户管理、系统配置", "HTTPS/REST")
    Rel(patient, miniapp, "预约挂号、报告查询", "HTTPS/REST")
    Rel(patient, selfservice, "自助挂号、缴费", "HTTPS/REST")

    Rel(web, op_service, "门诊业务", "REST API")
    Rel(web, ip_service, "住院业务", "REST API")
    Rel(web, pharm_service, "药品业务", "REST API")
    Rel(web, sys_service, "系统管理", "REST API")

    Rel(miniapp, integration_service, "患者服务", "REST API")
    Rel(selfservice, integration_service, "自助服务", "REST API")

    Rel(op_service, mysql, "数据读写", "JDBC")
    Rel(ip_service, mysql, "数据读写", "JDBC")
    Rel(pharm_service, mysql, "数据读写", "JDBC")
    Rel(lis_service, mysql, "数据读写", "JDBC")
    Rel(ris_service, mysql, "数据读写", "JDBC")
    Rel(sys_service, mysql, "数据读写", "JDBC")
    Rel(integration_service, mysql, "EMPI数据", "JDBC")

    Rel(op_service, redis, "缓存/分布式锁", "Redis Protocol")
    Rel(ip_service, redis, "缓存/分布式锁", "Redis Protocol")
    Rel(sys_service, redis, "会话缓存", "Redis Protocol")

    Rel(ris_service, minio, "DICOM影像存储", "S3 API")

    Rel(op_service, mq, "处方消息", "AMQP")
    Rel(ip_service, mq, "医嘱消息", "AMQP")
    Rel(lis_service, mq, "危急值通知", "AMQP")

    Rel(integration_service, insurance, "医保结算", "国家医保接口")
    Rel(lis_service, lis, "检验申请/结果", "HL7 FHIR/ASTM")
    Rel(ris_service, pacs, "影像申请/调阅", "DICOM")
    Rel(integration_service, region, "健康档案共享", "HL7 FHIR/CDA")
    Rel(integration_service, payment, "在线支付", "REST API")
    Rel(sys_service, ca, "电子签名", "PKI/CA")
    Rel(integration_service, sms, "短信通知", "REST API")
    Rel(integration_service, ai, "AI辅助诊断", "REST/gRPC")
```

### 3.2 容器说明

#### 3.2.1 前端应用容器

| 容器名称 | 技术栈 | 功能职责 | 用户群体 |
|----------|--------|----------|----------|
| Vue3 Web应用 | Vue3 + Element Plus + TypeScript | 医护人员工作台，包含门诊/住院/药房/管理后台 | 医生、护士、药师、收费员、管理员 |
| 微信小程序 | 微信小程序原生/Taro | 患者自助服务入口 | 患者 |
| 自助机客户端 | Electron/Qt | 自助挂号、缴费、打印 | 患者 |

#### 3.2.2 后端服务容器

| 服务名称 | 模块编号 | 核心职责 | 数据边界 |
|----------|----------|----------|----------|
| 门诊服务 (op-service) | M01 | 挂号、门诊医生工作站、收费、药房 | op_register, op_encounter, op_prescription |
| 住院服务 (ip-service) | M02 | 入院、医生工作站、护理、eMAR、出院 | ip_admission, ip_order, ip_medication_admin |
| 药品服务 (pharm-service) | M06 | 药库、药房库存、处方审核、CDS引擎 | drug_catalog, drug_stock, drug_interaction |
| 检验服务 (lis-service) | M04 | 检验申请、标本管理、结果、危急值 | lis_request, lis_specimen, lis_result |
| 影像服务 (ris-service) | M05 | 影像申请、DICOM存储、报告 | ris_request, ris_study, ris_report |
| 系统服务 (sys-service) | M09 | 用户、角色、权限、字典、日志 | sys_user, sys_role, sys_dict |
| 集成平台 (integration-service) | M10 | EMPI、主数据、消息引擎、接口适配器 | his_patient, his_interface_log |

#### 3.2.3 数据存储容器

| 存储名称 | 技术选型 | 存储内容 | 数据量估算 |
|----------|----------|----------|------------|
| MySQL主库 | MySQL 8.x | 业务数据（患者、就诊、医嘱、处方等） | 年增量约5亿条 |
| Redis缓存 | Redis 7.x | 会话缓存、热点数据、分布式锁 | 内存容量 |
| MinIO对象存储 | MinIO | DICOM影像、病历附件 | 年增量约50TB |
| RabbitMQ消息队列 | RabbitMQ | 异步消息（医嘱执行、费用记账、通知） | 日均约100万条 |

#### 3.2.4 外部接口适配器

| 适配器名称 | 对接系统 | 协议标准 | 核心功能 |
|------------|----------|----------|----------|
| 医保适配器 | 医保信息平台 | 国家医保局接口规范 | 医保身份验证、费用结算、目录对照 |
| FHIR适配器 | 区域平台/LIS | HL7 FHIR R4 | FHIR资源转换、消息路由 |
| DICOM适配器 | PACS | DICOM 3.0 | C-STORE/C-FIND/C-MOVE |
| 支付适配器 | 微信/支付宝/银联 | REST API | 统一支付接口、异步回调 |
| CA适配器 | CA签名服务 | PKI/CA | 电子签名、签名验证 |

### 3.3 关键设计决策

| 决策编号 | 决策内容 | 决策原因 |
|----------|----------|----------|
| ADR-004 | 采用微服务架构，按业务领域拆分服务 | 业务模块边界清晰，支持独立部署和扩展，降低耦合度 |
| ADR-005 | 使用RabbitMQ作为消息中间件 | 解耦业务流程，支持异步处理，提升系统吞吐量 |
| ADR-006 | 采用MinIO作为对象存储 | 兼容S3协议，支持DICOM影像存储，成本可控 |
| ADR-007 | 前后端分离，Vue3 SPA架构 | 提升开发效率，支持敏捷迭代，用户体验更好 |

---

## 4. Level 3: 组件图 (Component Diagram)

### 4.1 门诊服务组件图

```mermaid
C4Component
    title 门诊服务 (op-service) - 组件图

    Container(op_service, "门诊服务", "Spring Boot 3.x")

    System_Boundary(op, "门诊服务组件") {
        Component(register_module, "挂号模块", "Spring MVC", "现场挂号、预约挂号、急诊挂号、退号管理")
        Component(appointment_module, "预约模块", "Spring MVC", "预约创建、号源管理、预约签到、取消预约")
        Component(triage_module, "分诊模块", "Spring MVC", "候诊队列、叫号管理、过号处理")
        Component(prescription_module, "处方模块", "Spring MVC", "处方开立、处方模板、CDS校验触发")
        Component(charge_module, "收费模块", "Spring MVC", "费用汇总、医保结算、退费管理")
        Component(op_pharmacy_module, "门诊药房模块", "Spring MVC", "处方接收、处方审核、调配发药")

        Component(register_repo, "挂号数据访问", "MyBatis-Plus", "挂号数据持久化")
        Component(appointment_repo, "预约数据访问", "MyBatis-Plus", "预约数据持久化")
        Component(prescription_repo, "处方数据访问", "MyBatis-Plus", "处方数据持久化")
        Component(charge_repo, "收费数据访问", "MyBatis-Plus", "收费数据持久化")

        Component(cds_client, "CDS客户端", "Feign Client", "调用CDS校验服务")
        Component(pharm_client, "药品服务客户端", "Feign Client", "调用药品服务")
        Component(insurance_adapter, "医保适配器", "SDK集成", "医保接口调用")
    }

    ContainerDb(mysql, "MySQL主库", "op_register, op_appointment, op_prescription等")

    Container(sys_service, "系统服务", "用户、权限、字典")
    Container(pharm_service, "药品服务", "CDS引擎、处方审核")
    Container(integration_service, "集成平台", "医保接口适配")

    Rel(register_module, register_repo, "数据访问")
    Rel(appointment_module, appointment_repo, "数据访问")
    Rel(prescription_module, prescription_repo, "数据访问")
    Rel(charge_module, charge_repo, "数据访问")

    Rel(register_repo, mysql, "JDBC")
    Rel(appointment_repo, mysql, "JDBC")
    Rel(prescription_repo, mysql, "JDBC")
    Rel(charge_repo, mysql, "JDBC")

    Rel(prescription_module, cds_client, "CDS校验")
    Rel(cds_client, pharm_service, "Feign调用")

    Rel(register_module, insurance_adapter, "医保验证")
    Rel(insurance_adapter, integration_service, "医保接口")

    Rel(charge_module, pharm_client, "药品库存查询")
    Rel(pharm_client, pharm_service, "Feign调用")

    Rel(op_service, sys_service, "用户/字典查询", "Feign")
```

### 4.2 住院服务组件图

```mermaid
C4Component
    title 住院服务 (ip-service) - 组件图

    Container(ip_service, "住院服务", "Spring Boot 3.x")

    System_Boundary(ip, "住院服务组件") {
        Component(admission_module, "入院模块", "Spring MVC", "入院登记、床位分配、预交金管理、医保登记")
        Component(order_module, "医嘱模块", "Spring MVC", "医嘱开立、医嘱审核、停止医嘱、CDS校验")
        Component(nursing_module, "护理模块", "Spring MVC", "医嘱执行、护理记录、体温单、护理评估")
        Component(emar_module, "eMAR给药模块", "Spring MVC", "腕带扫描、药品扫描、给药确认、eMAR记录")
        Component(bed_module, "床位模块", "Spring MVC", "床位图、床位状态、床位调动")
        Component(discharge_module, "出院模块", "Spring MVC", "出院申请、出院结算、出院带药、病案归档")

        Component(admission_repo, "入院数据访问", "MyBatis-Plus", "入院数据持久化")
        Component(order_repo, "医嘱数据访问", "MyBatis-Plus", "医嘱数据持久化")
        Component(emar_repo, "eMAR数据访问", "MyBatis-Plus", "eMAR数据持久化")
        Component(nursing_repo, "护理数据访问", "MyBatis-Plus", "护理数据持久化")

        Component(wristband_validator, "腕带校验器", "业务逻辑", "腕带条码解析、患者身份匹配")
        Component(drug_validator, "药品校验器", "业务逻辑", "药品条码解析、医嘱匹配")
        Component(cds_client, "CDS客户端", "Feign Client", "调用CDS校验服务")
        Component(mq_producer, "消息生产者", "RabbitMQ", "医嘱消息、费用记账消息")
    }

    ContainerDb(mysql, "MySQL主库", "ip_admission, ip_order, ip_medication_admin等")
    ContainerDb(mq, "RabbitMQ", "医嘱消息队列、费用记账队列")

    Container(sys_service, "系统服务")
    Container(pharm_service, "药品服务")
    Container(integration_service, "集成平台")

    Rel(admission_module, admission_repo, "数据访问")
    Rel(order_module, order_repo, "数据访问")
    Rel(emar_module, emar_repo, "数据访问")
    Rel(nursing_module, nursing_repo, "数据访问")

    Rel(admission_repo, mysql, "JDBC")
    Rel(order_repo, mysql, "JDBC")
    Rel(emar_repo, mysql, "JDBC")
    Rel(nursing_repo, mysql, "JDBC")

    Rel(emar_module, wristband_validator, "腕带校验")
    Rel(emar_module, drug_validator, "药品校验")

    Rel(order_module, cds_client, "CDS校验")
    Rel(cds_client, pharm_service, "Feign调用")

    Rel(order_module, mq_producer, "发送医嘱消息")
    Rel(mq_producer, mq, "AMQP")

    Rel(ip_service, sys_service, "用户/字典查询", "Feign")
```

### 4.3 药品服务组件图

```mermaid
C4Component
    title 药品服务 (pharm-service) - 组件图

    Container(pharm_service, "药品服务", "Spring Boot 3.x")

    System_Boundary(pharm, "药品服务组件") {
        Component(drug_catalog_module, "药品目录模块", "Spring MVC", "药品信息维护、分类管理、医保对照")
        Component(inventory_module, "库存模块", "Spring MVC", "入库管理、出库管理、库存盘点、效期预警")
        Component(audit_module, "处方审核模块", "Spring MVC", "处方接收、合理用药审核、审核退回")
        Component(cds_engine, "CDS引擎", "规则引擎", "药物相互作用、过敏检查、剂量校验、配伍禁忌")

        Component(drug_repo, "药品数据访问", "MyBatis-Plus", "药品目录持久化")
        Component(stock_repo, "库存数据访问", "MyBatis-Plus", "库存数据持久化")
        Component(interaction_repo, "相互作用数据访问", "MyBatis-Plus", "药物相互作用库")

        Component(drug_interaction_checker, "相互作用检查器", "规则计算", "药物相互作用检查")
        Component(allergy_checker, "过敏检查器", "规则计算", "患者过敏史检查")
        Component(dosage_checker, "剂量检查器", "规则计算", "剂量合理性校验")
        Component(incompatibility_checker, "配伍禁忌检查器", "规则计算", "配伍禁忌检查")

        Component(cds_cache, "CDS缓存", "Redis", "相互作用规则缓存")
    }

    ContainerDb(mysql, "MySQL主库", "drug_catalog, drug_stock, drug_interaction等")
    ContainerDb(redis, "Redis", "CDS规则缓存")

    Rel(drug_catalog_module, drug_repo, "数据访问")
    Rel(inventory_module, stock_repo, "数据访问")
    Rel(cds_engine, interaction_repo, "规则数据")

    Rel(drug_repo, mysql, "JDBC")
    Rel(stock_repo, mysql, "JDBC")
    Rel(interaction_repo, mysql, "JDBC")

    Rel(cds_engine, drug_interaction_checker, "相互作用检查")
    Rel(cds_engine, allergy_checker, "过敏检查")
    Rel(cds_engine, dosage_checker, "剂量检查")
    Rel(cds_engine, incompatibility_checker, "配伍禁忌检查")

    Rel(drug_interaction_checker, cds_cache, "读取缓存")
    Rel(cds_cache, redis, "Redis协议")
```

### 4.4 系统服务组件图

```mermaid
C4Component
    title 系统服务 (sys-service) - 组件图

    Container(sys_service, "系统服务", "Spring Boot 3.x")

    System_Boundary(sys, "系统服务组件") {
        Component(user_module, "用户模块", "Spring MVC", "用户管理、密码重置、账户锁定")
        Component(role_module, "角色模块", "Spring MVC", "角色管理、权限配置、角色分配")
        Component(menu_module, "菜单模块", "Spring MVC", "菜单管理、菜单权限")
        Component(dict_module, "字典模块", "Spring MVC", "字典类型、字典数据、ICD-10编码")
        Component(dept_module, "科室模块", "Spring MVC", "科室管理、病区管理、床位管理")
        Component(log_module, "日志模块", "Spring MVC", "操作日志、登录日志、异常告警")
        Component(config_module, "配置模块", "Spring MVC", "参数配置、定时任务")

        Component(user_repo, "用户数据访问", "MyBatis-Plus", "用户数据持久化")
        Component(role_repo, "角色数据访问", "MyBatis-Plus", "角色数据持久化")
        Component(dict_repo, "字典数据访问", "MyBatis-Plus", "字典数据持久化")
        Component(log_repo, "日志数据访问", "MyBatis-Plus", "日志数据持久化")

        Component(auth_service, "认证服务", "Spring Security + JWT", "登录认证、Token生成、权限校验")
        Component(rbac_service, "RBAC服务", "业务逻辑", "菜单权限、按钮权限、数据权限")
        Component(session_cache, "会话缓存", "Redis", "Token缓存、权限缓存")
    }

    ContainerDb(mysql, "MySQL主库", "sys_user, sys_role, sys_dict等")
    ContainerDb(redis, "Redis", "会话缓存、权限缓存")

    Rel(user_module, user_repo, "数据访问")
    Rel(role_module, role_repo, "数据访问")
    Rel(dict_module, dict_repo, "数据访问")
    Rel(log_module, log_repo, "数据访问")

    Rel(user_repo, mysql, "JDBC")
    Rel(role_repo, mysql, "JDBC")
    Rel(dict_repo, mysql, "JDBC")
    Rel(log_repo, mysql, "JDBC")

    Rel(auth_service, session_cache, "Token缓存")
    Rel(rbac_service, session_cache, "权限缓存")
    Rel(session_cache, redis, "Redis协议")

    Rel(user_module, auth_service, "认证服务")
    Rel(role_module, rbac_service, "权限服务")
```

### 4.5 集成平台组件图

```mermaid
C4Component
    title 集成平台 (integration-service) - 组件图

    Container(integration_service, "集成平台", "Spring Boot 3.x")

    System_Boundary(integration, "集成平台组件") {
        Component(empi_module, "EMPI模块", "Spring MVC", "患者主索引创建、重复检测、患者合并、EMPI查询")
        Component(masterdata_module, "主数据模块", "Spring MVC", "科室同步、人员同步、诊断编码同步")
        Component(message_engine, "消息引擎", "消息处理", "HL7消息解析、FHIR资源转换、消息路由")
        Component(interface_adapter, "接口适配模块", "适配器模式", "接口配置、接口日志、接口监控")

        Component(empi_repo, "EMPI数据访问", "MyBatis-Plus", "EMPI数据持久化")
        Component(interface_log_repo, "接口日志数据访问", "MyBatis-Plus", "接口日志持久化")

        Component(fhir_converter, "FHIR转换器", "HAPI FHIR", "FHIR资源序列化/反序列化")
        Component(hl7_parser, "HL7解析器", "HAPI HL7", "HL7 v2消息解析")
        Component(dicom_adapter, "DICOM适配器", "dcm4che", "DICOM C-STORE/C-FIND")

        Component(insurance_adapter, "医保适配器", "SDK集成", "国家医保接口封装")
        Component(payment_adapter, "支付适配器", "SDK集成", "微信/支付宝/银联支付封装")
        Component(ca_adapter, "CA适配器", "SDK集成", "CA电子签名封装")
        Component(sms_adapter, "短信适配器", "SDK集成", "短信平台封装")
    }

    ContainerDb(mysql, "MySQL主库", "his_patient, his_interface_log等")

    System_Ext(insurance, "医保信息平台")
    System_Ext(payment, "支付平台")
    System_Ext(ca, "CA电子签名")
    System_Ext(sms, "短信平台")

    Rel(empi_module, empi_repo, "数据访问")
    Rel(interface_adapter, interface_log_repo, "日志记录")

    Rel(empi_repo, mysql, "JDBC")
    Rel(interface_log_repo, mysql, "JDBC")

    Rel(message_engine, fhir_converter, "FHIR转换")
    Rel(message_engine, hl7_parser, "HL7解析")

    Rel(interface_adapter, insurance_adapter, "医保接口")
    Rel(interface_adapter, payment_adapter, "支付接口")
    Rel(interface_adapter, ca_adapter, "CA签名")
    Rel(interface_adapter, sms_adapter, "短信接口")

    Rel(insurance_adapter, insurance, "国家医保接口")
    Rel(payment_adapter, payment, "REST API")
    Rel(ca_adapter, ca, "PKI/CA")
    Rel(sms_adapter, sms, "REST API")
```

### 4.6 组件职责说明

#### 4.6.1 门诊服务组件

| 组件名称 | 职责描述 | 核心接口 |
|----------|----------|----------|
| 挂号模块 | 现场挂号、预约挂号、急诊挂号、退号管理 | POST /api/v1/op/registers |
| 预约模块 | 预约创建、号源管理、预约签到、取消预约 | POST /api/v1/op/appointments |
| 分诊模块 | 候诊队列、叫号管理、过号处理 | GET /api/v1/op/triage |
| 处方模块 | 处方开立、处方模板、CDS校验触发 | POST /api/v1/op/prescriptions |
| 收费模块 | 费用汇总、医保结算、退费管理 | POST /api/v1/op/charges |

#### 4.6.2 住院服务组件

| 组件名称 | 职责描述 | 核心接口 |
|----------|----------|----------|
| 入院模块 | 入院登记、床位分配、预交金管理、医保登记 | POST /api/v1/ip/admissions |
| 医嘱模块 | 医嘱开立、医嘱审核、停止医嘱、CDS校验 | POST /api/v1/ip/orders |
| 护理模块 | 医嘱执行、护理记录、体温单、护理评估 | POST /api/v1/ip/nursing-records |
| eMAR给药模块 | 腕带扫描、药品扫描、给药确认、eMAR记录 | POST /api/v1/ip/emar |
| 出院模块 | 出院申请、出院结算、出院带药、病案归档 | POST /api/v1/ip/discharge |

#### 4.6.3 药品服务组件

| 组件名称 | 职责描述 | 核心能力 |
|----------|----------|----------|
| 药品目录模块 | 药品信息维护、分类管理、医保对照 | 药品CRUD、分类树、医保对照 |
| 库存模块 | 入库管理、出库管理、库存盘点、效期预警 | 先进先出、效期预警、五专管理 |
| 处方审核模块 | 处方接收、合理用药审核、审核退回 | 处方审核流程、审核结果通知 |
| CDS引擎 | 药物相互作用、过敏检查、剂量校验、配伍禁忌 | 四维校验、规则缓存 |

### 4.7 关键设计决策

| 决策编号 | 决策内容 | 决策原因 |
|----------|----------|----------|
| ADR-008 | CDS引擎独立部署在药品服务 | CDS规则与药品知识库紧密关联，便于规则维护和更新 |
| ADR-009 | eMAR闭环给药采用腕带+药品条码双重校验 | 符合HIMSS EMRAM Stage 5要求，杜绝给药差错 |
| ADR-010 | 集成平台统一管理外部接口适配器 | 统一接口日志、监控、限流，便于运维管理 |
| ADR-011 | 采用Feign实现服务间调用 | 声明式HTTP客户端，与Spring Cloud生态集成良好 |

---

## 5. Level 4: 代码图 (Code Diagram)

### 5.1 eMAR闭环给药组件类图

```mermaid
classDiagram
    class MedicationAdminController {
        +verifyWristband(VerifyWristbandRequest) Result
        +verifyDrug(VerifyDrugRequest) Result
        +confirmAdministration(ConfirmAdminRequest) Result
        +getEMARList(Long admissionId) List~EMARRecord~
    }

    class MedicationAdminService {
        -EMARRepository emarRepository
        -OrderRepository orderRepository
        -PatientRepository patientRepository
        -WristbandValidator wristbandValidator
        -DrugValidator drugValidator
        -ApplicationEventPublisher eventPublisher
        +verifyWristband(Long admissionId, String wristbandCode) VerifyResult
        +verifyDrug(Long orderId, String drugBarcode) VerifyResult
        +confirmAdministration(ConfirmAdminDTO dto) EMARRecord
        -validateDoubleCheck(VerifyResult wristband, VerifyResult drug) boolean
    }

    class WristbandValidator {
        -PatientRepository patientRepository
        -AdmissionRepository admissionRepository
        +validate(String wristbandCode, Long admissionId) VerifyResult
        +parseWristbandCode(String code) WristbandInfo
        -matchPatient(WristbandInfo info, Long admissionId) boolean
    }

    class DrugValidator {
        -DrugRepository drugRepository
        -OrderRepository orderRepository
        +validate(String drugBarcode, Long orderId) VerifyResult
        +parseDrugBarcode(String barcode) DrugInfo
        -matchOrder(DrugInfo info, Long orderId) boolean
        -checkExpiryDate(Date expiryDate) boolean
    }

    class EMARRecord {
        -Long emarId
        -String emarNo
        -Long admissionId
        -Long patientId
        -Long orderId
        -Long drugId
        -String batchNo
        -Date expireDate
        -Date scheduledTime
        -Date actualTime
        -BigDecimal dosage
        -String routeCode
        -Date wristbandScanTime
        -Integer wristbandMatch
        -Date drugScanTime
        -Integer drugMatch
        -Integer doubleCheckPass
        -Integer adminStatus
        -Long nurseId
        -String nurseName
    }

    class VerifyResult {
        -Boolean matchResult
        -String patientName
        -String bedNo
        -String drugName
        -String batchNo
        -Date expireDate
        -List~String~ warnings
    }

    class AdministrationConfirmedEvent {
        -Long emarId
        -Long admissionId
        -Long orderId
        -Date executeTime
        -Long nurseId
    }

    class EMAREventListener {
        +onAdministrationConfirmed(AdministrationConfirmedEvent) void
        -updateOrderStatus(Long orderId) void
        -triggerChargeBilling(Long admissionId, Long orderId) void
        -sendNotification(Long patientId, String message) void
    }

    MedicationAdminController --> MedicationAdminService
    MedicationAdminService --> WristbandValidator
    MedicationAdminService --> DrugValidator
    MedicationAdminService --> EMARRecord
    MedicationAdminService --> VerifyResult
    MedicationAdminService --> AdministrationConfirmedEvent
    EMAREventListener --> AdministrationConfirmedEvent
```

### 5.2 CDS临床决策支持组件类图

```mermaid
classDiagram
    class CDSService {
        -DrugInteractionChecker interactionChecker
        -AllergyChecker allergyChecker
        -DosageChecker dosageChecker
        -IncompatibilityChecker incompatibilityChecker
        -CDSRuleCache ruleCache
        +check(CheckRequest request) CheckResult
        +checkDrugInteraction(List~DrugInfo~ drugs) List~InteractionWarning~
        +checkAllergy(Long patientId, List~DrugInfo~ drugs) List~AllergyWarning~
        +checkDosage(DosageCheckRequest request) List~DosageWarning~
        +checkIncompatibility(List~DrugInfo~ drugs) List~IncompatibilityWarning~
    }

    class DrugInteractionChecker {
        -DrugInteractionRepository interactionRepo
        -RedisTemplate redisTemplate
        +check(List~DrugInfo~ drugs) List~InteractionWarning~
        -buildInteractionKey(DrugInfo drug1, DrugInfo drug2) String
        -loadInteractionRules() void
    }

    class AllergyChecker {
        -AllergyRepository allergyRepo
        +check(Long patientId, List~DrugInfo~ drugs) List~AllergyWarning~
        -getPatientAllergies(Long patientId) List~Allergy~
        -matchAllergyDrug(String allergyCode, String drugCode) boolean
    }

    class DosageChecker {
        -DrugRepository drugRepo
        -PatientRepository patientRepo
        +check(DosageCheckRequest request) List~DosageWarning~
        -calculateRenalDosage(PatientInfo patient, DrugInfo drug) BigDecimal
        -calculatePediatricDosage(PatientInfo patient, DrugInfo drug) BigDecimal
        -checkAgeContraindication(PatientInfo patient, DrugInfo drug) boolean
    }

    class IncompatibilityChecker {
        -IncompatibilityRepository incompatibilityRepo
        +check(List~DrugInfo~ drugs) List~IncompatibilityWarning~
        -checkYSiteIncompatibility(DrugInfo drug1, DrugInfo drug2) boolean
    }

    class CDSCheckResult {
        -Boolean passed
        -List~CDSCheckWarning~ warnings
        -String severity
        -List~String~ suggestions
    }

    class CDSCheckWarning {
        -String checkType
        -String warningLevel
        -String warningMessage
        -String mechanism
        -String suggestion
        -Boolean isConfirmed
    }

    class DrugInteractionRule {
        -Long ruleId
        -String drugCode1
        -String drugCode2
        -String interactionType
        -String severity
        -String mechanism
        -String clinicalEffect
        -String management
    }

    class CDSRuleCache {
        -RedisTemplate redisTemplate
        +getInteractionRule(String key) DrugInteractionRule
        +cacheInteractionRule(String key, DrugInteractionRule rule) void
        +invalidateCache() void
    }

    CDSService --> DrugInteractionChecker
    CDSService --> AllergyChecker
    CDSService --> DosageChecker
    CDSService --> IncompatibilityChecker
    CDSService --> CDSRuleCache
    CDSService --> CDSCheckResult
    CDSCheckResult --> CDSCheckWarning
    DrugInteractionChecker --> DrugInteractionRule
    DrugInteractionChecker --> CDSRuleCache
```

### 5.3 代码设计说明

#### 5.3.1 eMAR闭环给药设计要点

| 设计要点 | 说明 |
|----------|------|
| 双重校验模式 | 先扫描腕带验证患者身份，再扫描药品条码验证药品匹配，两者都通过才允许给药 |
| 事件驱动架构 | 给药确认后发布事件，异步更新医嘱状态、触发费用记账、发送通知 |
| 领域模型 | EMARRecord为核心领域对象，包含完整的给药记录信息 |
| 校验器模式 | WristbandValidator和DrugValidator分别处理腕带和药品校验逻辑 |

#### 5.3.2 CDS引擎设计要点

| 设计要点 | 说明 |
|----------|------|
| 四维校验 | 药物相互作用、过敏检查、剂量合理性、配伍禁忌四个维度独立校验 |
| 规则缓存 | 使用Redis缓存药物相互作用规则，提升校验性能 |
| 严重程度分级 | HIGH（必须修改）、MEDIUM（需确认原因）、LOW（可忽略） |
| 扩展性 | 每个检查器独立实现，便于新增检查维度 |

### 5.4 关键设计决策

| 决策编号 | 决策内容 | 决策原因 |
|----------|----------|----------|
| ADR-012 | eMAR采用事件驱动架构 | 解耦给药确认与后续处理（状态更新、费用记账），提升响应速度 |
| ADR-013 | CDS规则使用Redis缓存 | 药物相互作用规则数据量大（约5000条），缓存可显著提升性能 |
| ADR-014 | 校验器采用策略模式 | 便于扩展新的校验规则，符合开闭原则 |

---

## 6. 架构决策记录 (ADR)

### 6.1 架构决策汇总

| 决策编号 | 决策标题 | 状态 | 日期 |
|----------|----------|------|------|
| ADR-001 | 采用HL7 FHIR R4作为互操作标准 | 已采纳 | 2026-06-16 |
| ADR-002 | 集成CA电子签名服务 | 已采纳 | 2026-06-16 |
| ADR-003 | 对接AI辅助诊断服务 | 已采纳 | 2026-06-16 |
| ADR-004 | 采用微服务架构 | 已采纳 | 2026-06-16 |
| ADR-005 | 使用RabbitMQ作为消息中间件 | 已采纳 | 2026-06-16 |
| ADR-006 | 采用MinIO作为对象存储 | 已采纳 | 2026-06-16 |
| ADR-007 | 前后端分离，Vue3 SPA架构 | 已采纳 | 2026-06-16 |
| ADR-008 | CDS引擎独立部署在药品服务 | 已采纳 | 2026-06-16 |
| ADR-009 | eMAR闭环给药采用双重校验 | 已采纳 | 2026-06-16 |
| ADR-010 | 集成平台统一管理外部接口适配器 | 已采纳 | 2026-06-16 |
| ADR-011 | 采用Feign实现服务间调用 | 已采纳 | 2026-06-16 |
| ADR-012 | eMAR采用事件驱动架构 | 已采纳 | 2026-06-16 |
| ADR-013 | CDS规则使用Redis缓存 | 已采纳 | 2026-06-16 |
| ADR-014 | 校验器采用策略模式 | 已采纳 | 2026-06-16 |

### 6.2 架构原则

| 原则编号 | 原则名称 | 说明 |
|----------|----------|------|
| AP-001 | 业务领域驱动 | 按门诊、住院、药品等业务领域划分服务边界 |
| AP-002 | 标准先行 | 遵循HL7 FHIR、ICD-10、DICOM等国际标准 |
| AP-003 | 安全合规 | 符合等保三级、电子签名法要求 |
| AP-004 | 高可用设计 | 关键服务冗余部署，支持故障自动切换 |
| AP-005 | 可观测性 | 完善的日志、监控、链路追踪能力 |

---

## 7. 技术选型

### 7.1 技术栈总览

| 层级 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| 前端框架 | Vue3 + Element Plus | 3.x | 医护工作台 |
| 移动端 | 微信小程序/Taro | - | 患者自助服务 |
| 后端框架 | Spring Boot | 3.x | 微服务基础框架 |
| 数据库 | MySQL | 8.x | 业务数据存储 |
| 缓存 | Redis | 7.x | 会话缓存、热点数据 |
| 消息队列 | RabbitMQ | 3.x | 异步消息处理 |
| 对象存储 | MinIO | - | DICOM影像、附件 |
| 容器编排 | Kubernetes | 1.28+ | 容器化部署 |

### 7.2 中间件选型

| 中间件 | 选型 | 说明 |
|--------|------|------|
| 注册中心 | Nacos | 服务注册与发现、配置中心 |
| 网关 | Spring Cloud Gateway | API路由、限流、鉴权 |
| 链路追踪 | SkyWalking | 分布式链路追踪 |
| 监控 | Prometheus + Grafana | 指标监控、告警 |
| 日志 | ELK Stack | 日志收集、分析、展示 |

---

## 8. 部署架构

### 8.1 部署拓扑图

```mermaid
graph TB
    subgraph "用户接入层"
        LB[负载均衡<br/>Nginx/云LB]
    end

    subgraph "DMZ区"
        Gateway[API网关<br/>Spring Cloud Gateway]
    end

    subgraph "应用区"
        subgraph "前端服务"
            Web[Vue3 Web应用]
            MiniApp[微信小程序后端]
        end

        subgraph "业务服务"
            OpService[门诊服务]
            IpService[住院服务]
            PharmService[药品服务]
            LisService[检验服务]
            RisService[影像服务]
            SysService[系统服务]
            IntegrationService[集成平台]
        end
    end

    subgraph "数据区"
        MySQL[MySQL主从集群]
        Redis[Redis集群]
        MQ[RabbitMQ集群]
        MinIO[MinIO集群]
    end

    subgraph "外部系统"
        Insurance[医保平台]
        LIS[LIS系统]
        PACS[PACS系统]
    end

    LB --> Gateway
    Gateway --> Web
    Gateway --> MiniApp
    Gateway --> OpService
    Gateway --> IpService
    Gateway --> PharmService
    Gateway --> SysService

    OpService --> MySQL
    IpService --> MySQL
    PharmService --> MySQL
    SysService --> MySQL

    OpService --> Redis
    IpService --> Redis
    SysService --> Redis

    OpService --> MQ
    IpService --> MQ

    RisService --> MinIO

    IntegrationService --> Insurance
    LisService --> LIS
    RisService --> PACS
```

---

## 9. 附录

### 9.1 术语表

| 术语 | 全称 | 说明 |
|------|------|------|
| HIS | Hospital Information System | 医院信息系统 |
| EMR | Electronic Medical Record | 电子病历 |
| eMAR | Electronic Medication Administration Record | 电子给药记录 |
| CDS | Clinical Decision Support | 临床决策支持 |
| EMPI | Enterprise Master Patient Index | 企业级患者主索引 |
| FHIR | Fast Healthcare Interoperability Resources | 快速医疗互操作性资源 |
| DICOM | Digital Imaging and Communications in Medicine | 医学数字影像和通信标准 |

### 9.2 参考文档

1. YUDAO-HIS-PRD-001 产品需求文档
2. YUDAO-HIS-MDD-001 模块划分文档
3. YUDAO-HIS-DM-001 数据模型设计文档
4. YUDAO-HIS-API-001 API设计文档
5. HIMSS EMRAM Stage 5+ 标准
6. HL7 FHIR R4 规范

### 9.3 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| V1.0 | 2026-06-16 | 初始版本，完成C4模型四层架构设计 | YUDAO-AI-HIS架构组 |

---

> **架构设计师**: ________________
> **技术负责人**: ________________
> **最后更新**: 2026-06-16
