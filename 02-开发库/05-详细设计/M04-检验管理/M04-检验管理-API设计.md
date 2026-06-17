# M04 检验管理 - API设计文档

> **文档编号**: YUDAO-HIS-API-M04-001
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 设计中
> **参考文档**: YUDAO-HIS-API-001 全局API设计规范

---

## 1. 概述

本文档定义检验管理模块的API接口规范，包括检验申请、标本追踪和危急值管理等子系统。

### 1.1 模块接口清单

| 子系统 | 接口数量 | 说明 |
|--------|----------|------|
| 检验申请 | 1 | 创建检验申请 |
| 标本追踪 | 1 | 查询标本状态 |
| 危急值管理 | 2 | 上报告危急值、确认危急值 |
| **合计** | **4** | - |

---

## 2. 检验申请 API

### 2.1 创建检验申请

```
POST /api/v1/lis/requests
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | Long | 是 | 患者ID |
| patientName | String | 是 | 患者姓名 |
| admissionId | Long | 否 | 入院ID（住院） |
| registerId | Long | 否 | 挂号ID（门诊） |
| requestDeptId | Long | 是 | 申请科室ID |
| requestDoctorId | Long | 是 | 申请医生ID |
| testItems | Array | 是 | 检验项目列表 |
| urgentFlag | Integer | 否 | 是否紧急 |
| clinicalDiagnosis | String | 否 | 临床诊断 |

**请求示例**:

```json
{
  "patientId": 1001,
  "patientName": "张三",
  "registerId": 10001,
  "requestDeptId": 10,
  "requestDoctorId": 100,
  "testItems": [
    {
      "itemCode": "CBC",
      "itemName": "血常规"
    },
    {
      "itemCode": "GLU",
      "itemName": "血糖"
    }
  ],
  "urgentFlag": 0,
  "clinicalDiagnosis": "上呼吸道感染"
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "requestId": 10001,
    "requestNo": "JY202606160001",
    "specimenBarcode": "BC202606160001",
    "estimatedTime": "2小时"
  }
}
```

---

## 3. 标本追踪 API

### 3.1 查询标本状态

```
GET /api/v1/lis/specimen/{barcode}
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| barcode | String | 标本条码 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "specimenId": 10001,
    "specimenBarcode": "BC202606160001",
    "specimenType": "血液",
    "patientName": "张三",
    "testItems": ["血常规", "血糖"],
    "status": 3,
    "statusName": "检验中",
    "trackingRecords": [
      {
        "time": "2026-06-16 08:00:00",
        "status": "采集",
        "operator": "王护士"
      },
      {
        "time": "2026-06-16 08:15:00",
        "status": "运送",
        "operator": "运送员A"
      },
      {
        "time": "2026-06-16 08:30:00",
        "status": "接收",
        "operator": "检验技师B"
      },
      {
        "time": "2026-06-16 08:45:00",
        "status": "检验中",
        "operator": "检验技师B"
      }
    ]
  }
}
```

---

## 4. 危急值管理 API

### 4.1 上报告危急值

```
POST /api/v1/lis/critical-value
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| requestId | Long | 是 | 检验申请ID |
| specimenId | Long | 是 | 标本ID |
| itemId | Long | 是 | 检验项目ID |
| itemName | String | 是 | 项目名称 |
| resultValue | Decimal | 是 | 结果值 |
| unit | String | 是 | 单位 |
| referenceLow | Decimal | 是 | 参考下限 |
| referenceHigh | Decimal | 是 | 参考上限 |
| criticalLevel | Integer | 是 | 危急等级：1低危/2高危 |
| reporterId | Long | 是 | 报告人ID |
| reporterName | String | 是 | 报告人姓名 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "criticalId": 10001,
    "criticalNo": "WJZ202606160001",
    "notifyTime": "2026-06-16 09:00:00",
    "notifyTarget": "内科 李主任",
    "deadline": "2026-06-16 09:15:00"
  }
}
```

---

### 4.2 确认危急值

```
PUT /api/v1/lis/critical-value/{id}/confirm
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| confirmerId | Long | 是 | 确认人ID |
| confirmerName | String | 是 | 确认人姓名 |
| confirmTime | DateTime | 是 | 确认时间 |
| handleAction | String | 是 | 处理措施 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "criticalId": 10001,
    "confirmTime": "2026-06-16 09:10:00",
    "timeElapsed": "10分钟",
    "status": 2
  }
}
```

**业务规则**:
- BR-LIS-002: 危急值必须15分钟内通知临床科室并确认接收

---

## 附录A: 检验模块业务错误码

| 错误码 | 错误消息 | 说明 |
|--------|----------|------|
| 1005001001 | 危急值未在规定时间内确认 | 检验-危急值-超时 |

---

## 附录B: 检验模块枚举定义

### B.1 标本状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 待采集 | 等待采集标本 |
| 2 | 已采集 | 标本已采集 |
| 3 | 运送中 | 标本运送中 |
| 4 | 已接收 | 检验科已接收 |
| 5 | 检验中 | 正在检验 |
| 6 | 已完成 | 检验完成 |
| 7 | 已作废 | 标本作废 |

### B.2 危急值等级

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 低危 | 需要关注 |
| 2 | 高危 | 需要立即处理 |

### B.3 危急值状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 待确认 | 等待临床确认 |
| 2 | 已确认 | 临床已确认处理 |

---

> **编制**: YUDAO-AI-HIS架构组
> **最后更新**: 2026-06-17