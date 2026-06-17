# M02 住院管理 - API设计文档

> **文档编号**: YUDAO-HIS-API-M02-001
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 设计中
> **参考文档**: YUDAO-HIS-API-001 全局API设计规范

---

## 1. 概述

本文档定义住院管理模块的API接口规范，包括入院管理、医嘱管理、护理工作站、eMAR给药管理和出院管理等子系统。

### 1.1 模块接口清单

| 子系统 | 接口数量 | 说明 |
|--------|----------|------|
| 入院管理 | 3 | 入院登记、查询入院信息、入院护理评估 |
| 医嘱管理 | 4 | 创建医嘱、查询医嘱列表、停止医嘱、作废医嘱 |
| 护理工作站 | 2 | 创建护理记录、查询护理记录 |
| eMAR给药管理 | 3 | 扫描腕带验证、扫描药品验证、确认给药 |
| 出院管理 | 2 | 出院申请、查询出院信息 |
| **合计** | **14** | - |

---

## 2. 入院管理 API

### 2.1 入院登记

```
POST /api/v1/ip/admissions
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | Long | 是 | 患者ID |
| patientName | String | 是 | 患者姓名 |
| idCardNo | String | 是 | 身份证号 |
| admissionDate | Date | 是 | 入院日期 |
| deptId | Long | 是 | 入院科室ID |
| bedId | Long | 是 | 床位ID |
| diagnosisCode | String | 是 | 入院诊断ICD-10编码 |
| diagnosisName | String | 是 | 入院诊断名称 |
| admissionType | Integer | 是 | 入院类型：1门诊/2急诊/3转院 |
| admittingDoctorId | Long | 是 | 收治医生ID |
| prepayment | Decimal | 是 | 预交金金额 |
| insuranceType | Integer | 否 | 医保类型 |
| emergencyContact | String | 是 | 紧急联系人 |
| emergencyPhone | String | 是 | 紧急联系电话 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "admissionId": 10001,
    "admissionNo": "ZY202606160001",
    "bedNo": "101-1",
    "deptName": "内科一病区",
    "nursingLevel": "二级护理",
    "dietType": "普食"
  }
}
```

---

### 2.2 查询入院信息

```
GET /api/v1/ip/admissions/{id}
```

---

### 2.3 入院护理评估

```
POST /api/v1/ip/admissions/{id}/nursing-assessment
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fallRisk | Integer | 是 | 跌倒风险评分 |
| pressureRisk | Integer | 是 | 压疮风险评分 |
| selfCareAbility | Integer | 是 | 自理能力评分 |
| allergyHistory | String | 否 | 过敏史 |
| pastHistory | String | 否 | 既往史 |

---

## 3. 医嘱管理 API

### 3.1 创建医嘱

```
POST /api/v1/ip/orders
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admissionId | Long | 是 | 入院ID |
| orderType | Integer | 是 | 医嘱类型：1长期/2临时 |
| orderCategory | Integer | 是 | 医嘱分类：1药品/2检查/3检验/4护理/5饮食 |
| orderContent | String | 是 | 医嘱内容 |
| drugId | Long | 否 | 药品ID（药品医嘱） |
| dosage | Decimal | 否 | 剂量 |
| dosageUnit | String | 否 | 剂量单位 |
| frequency | String | 否 | 执行频次 |
| route | String | 否 | 给药途径 |
| startTime | DateTime | 否 | 开始时间 |
| endTime | DateTime | 否 | 结束时间（长期医嘱） |
| urgentFlag | Integer | 否 | 是否紧急：0否/1是 |
| remark | String | 否 | 备注 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "orderId": 10001,
    "orderNo": "YI202606160001",
    "orderStatus": 1,
    "cdsCheckResult": {
      "passed": true,
      "warnings": []
    }
  }
}
```

---

### 3.2 查询医嘱列表

```
GET /api/v1/ip/orders
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admissionId | Long | 是 | 入院ID |
| orderType | Integer | 否 | 医嘱类型 |
| orderCategory | Integer | 否 | 医嘱分类 |
| orderStatus | Integer | 否 | 医嘱状态 |
| startDate | Date | 否 | 开始日期 |
| endDate | Date | 否 | 结束日期 |

---

### 3.3 停止医嘱

```
PUT /api/v1/ip/orders/{id}/stop
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| stopReason | String | 是 | 停止原因 |
| stopDoctorId | Long | 是 | 停嘱医生ID |
| stopTime | DateTime | 否 | 停止时间，默认当前时间 |

---

### 3.4 作废医嘱

```
PUT /api/v1/ip/orders/{id}/cancel
```

---

## 4. 护理工作站 API

### 4.1 创建护理记录

```
POST /api/v1/ip/nursing-records
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admissionId | Long | 是 | 入院ID |
| recordType | Integer | 是 | 记录类型：1体温单/2护理记录/3评估记录 |
| recordTime | DateTime | 是 | 记录时间 |
| temperature | Decimal | 否 | 体温 |
| pulse | Integer | 否 | 脉搏 |
| respiration | Integer | 否 | 呼吸 |
| bloodPressureSystolic | Integer | 否 | 收缩压 |
| bloodPressureDiastolic | Integer | 否 | 舒张压 |
| content | String | 否 | 护理内容 |

---

### 4.2 查询护理记录

```
GET /api/v1/ip/nursing-records
```

---

## 5. eMAR给药管理 API

### 5.1 扫描腕带验证

```
POST /api/v1/ip/emar/verify-wristband
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admissionId | Long | 是 | 入院ID |
| wristbandCode | String | 是 | 腕带条码 |
| nurseId | Long | 是 | 护士ID |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "matchResult": true,
    "patientName": "张三",
    "bedNo": "101-1",
    "pendingOrders": [
      {
        "orderId": 10001,
        "drugName": "阿莫西林胶囊",
        "dosage": "0.5g",
        "frequency": "tid"
      }
    ]
  }
}
```

**业务规则**:
- BR-IP-010: 腕带不匹配必须停止给药并核实

---

### 5.2 扫描药品验证

```
POST /api/v1/ip/emar/verify-drug
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admissionId | Long | 是 | 入院ID |
| orderId | Long | 是 | 医嘱ID |
| drugBarcode | String | 是 | 药品条码 |
| nurseId | Long | 是 | 护士ID |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "matchResult": true,
    "drugName": "阿莫西林胶囊",
    "specification": "0.25g*24粒",
    "batchNo": "20260101",
    "expiryDate": "2027-01-01"
  }
}
```

**业务规则**:
- BR-IP-011: 药品不匹配必须停止给药

---

### 5.3 确认给药

```
POST /api/v1/ip/emar
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admissionId | Long | 是 | 入院ID |
| orderId | Long | 是 | 医嘱ID |
| executeTime | DateTime | 是 | 执行时间 |
| nurseId | Long | 是 | 执行护士ID |
| wristbandVerified | Boolean | 是 | 腕带已验证 |
| drugVerified | Boolean | 是 | 药品已验证 |
| remark | String | 否 | 备注 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "emarId": 10001,
    "emarNo": "EMAR202606160001",
    "executeTime": "2026-06-16 09:00:00",
    "nurseName": "王护士"
  }
}
```

---

## 6. 出院管理 API

### 6.1 出院申请

```
POST /api/v1/ip/discharge
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admissionId | Long | 是 | 入院ID |
| dischargeType | Integer | 是 | 出院类型：1正常/2转院/3死亡 |
| dischargeDate | Date | 是 | 出院日期 |
| dischargeDiagnosis | String | 是 | 出院诊断 |
| dischargeSummary | String | 是 | 出院小结 |
| dischargeMedication | String | 否 | 出院带药 |

---

### 6.2 查询出院信息

```
GET /api/v1/ip/discharge/{id}
```

---

## 附录A: 住院模块业务错误码

| 错误码 | 错误消息 | 说明 |
|--------|----------|------|
| 1003001001 | 患者腕带不匹配，停止给药 | 住院-给药-身份校验 |
| 1003001002 | 药品条码不匹配，停止给药 | 住院-给药-药品校验 |

---

## 附录B: 住院模块枚举定义

### B.1 医嘱状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 开立 | 医嘱开立 |
| 2 | 审核 | 护士审核通过 |
| 3 | 执行中 | 正在执行 |
| 4 | 已完成 | 执行完成 |
| 5 | 已停止 | 医生停嘱 |
| 6 | 已作废 | 作废 |

### B.2 医嘱类型

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 长期医嘱 | 需持续执行的医嘱 |
| 2 | 临时医嘱 | 一次性执行的医嘱 |

### B.3 医嘱分类

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 药品医嘱 | 药物治疗 |
| 2 | 检查医嘱 | 检查项目 |
| 3 | 检验医嘱 | 检验项目 |
| 4 | 护理医嘱 | 护理操作 |
| 5 | 饮食医嘱 | 饮食管理 |

### B.4 护理等级

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 特级护理 | 重症监护 |
| 2 | 一级护理 | 严重病情 |
| 3 | 二级护理 | 一般病情 |
| 4 | 三级护理 | 轻症 |

---

> **编制**: YUDAO-AI-HIS架构组
> **最后更新**: 2026-06-17