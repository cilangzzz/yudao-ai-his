# M01 门诊管理 - API设计文档

> **文档编号**: YUDAO-HIS-API-M01-001
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 设计中
> **参考文档**: YUDAO-HIS-API-001 全局API设计规范

---

## 1. 概述

本文档定义门诊管理模块的API接口规范，包括挂号管理、预约挂号、号源管理、分诊排队和医保挂号等子系统。

### 1.1 模块接口清单

| 子系统 | 接口数量 | 说明 |
|--------|----------|------|
| 挂号管理 | 5 | 创建挂号、查询详情、查询列表、退号、就诊确认 |
| 预约挂号 | 4 | 创建预约、查询列表、预约签到、取消预约 |
| 号源管理 | 6 | 查询号源、创建排班、更新排班、加号、停诊、批量排班 |
| 分诊排队 | 4 | 查询候诊队列、叫号、调整排队、过号处理 |
| 医保挂号 | 3 | 医保身份验证、医保费用预结算、医保实时结算 |
| **合计** | **22** | - |

---

## 2. 挂号管理 API

### 2.1 创建挂号

**接口说明**: 为患者创建挂号记录

```
POST /api/v1/op/registers
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | Long | 是 | 患者ID |
| patientName | String | 是 | 患者姓名 |
| idCardNo | String | 是 | 身份证号 |
| registerDate | Date | 是 | 挂号日期，格式：yyyy-MM-dd |
| deptId | Long | 是 | 挂号科室ID |
| doctorId | Long | 是 | 挂号医生ID |
| scheduleId | Long | 是 | 排班ID |
| registerType | Integer | 是 | 挂号类型：1普通/2专家/3急诊 |
| payType | Integer | 是 | 支付方式：1现金/2医保/3微信/4支付宝/5银行卡 |
| isAppointment | Integer | 否 | 是否预约挂号：0现场(默认)/1预约 |
| appointmentId | Long | 否 | 预约ID（预约挂号时必填） |
| triageLevel | String | 否 | 急诊分级：I/II/III/IV（急诊挂号时必填） |

**请求示例**:

```json
{
  "patientId": 1001,
  "patientName": "张三",
  "idCardNo": "310101199001011234",
  "registerDate": "2026-06-16",
  "deptId": 10,
  "doctorId": 100,
  "scheduleId": 50,
  "registerType": 2,
  "payType": 3
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "registerId": 10001,
    "registerNo": "GH202606160001",
    "queueNo": "N005",
    "patientName": "张三",
    "deptName": "内科",
    "doctorName": "李主任",
    "registerType": "专家号",
    "registerFee": 50.00,
    "diagnoseFee": 20.00,
    "totalFee": 70.00,
    "insurancePay": 0.00,
    "personalPay": 70.00,
    "registerTime": "2026-06-16 08:30:00",
    "waitCount": 4
  }
}
```

**业务规则**:
- BR-OP-001: 患者身份信息必须完整
- BR-OP-002: 同一患者同一科室同日不可重复挂号
- BR-OP-003: 号源必须可用（剩余数量>0）
- BR-OP-004: 医保挂号需实时验证医保身份

---

### 2.2 查询挂号详情

```
GET /api/v1/op/registers/{id}
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 挂号ID |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "registerId": 10001,
    "registerNo": "GH202606160001",
    "queueNo": "N005",
    "patientId": 1001,
    "patientName": "张三",
    "patientPhone": "138****0000",
    "idCardNo": "3101**********1234",
    "registerDate": "2026-06-16",
    "deptId": 10,
    "deptName": "内科",
    "doctorId": 100,
    "doctorName": "李主任",
    "scheduleId": 50,
    "registerType": 2,
    "registerTypeName": "专家号",
    "registerFee": 50.00,
    "diagnoseFee": 20.00,
    "totalFee": 70.00,
    "insurancePay": 0.00,
    "personalPay": 70.00,
    "payType": 3,
    "payTypeName": "微信支付",
    "payTime": "2026-06-16 08:30:00",
    "registerStatus": 1,
    "registerStatusName": "已挂号",
    "visitTime": null,
    "isAppointment": 0,
    "isPriority": 0,
    "isMissed": 0,
    "createTime": "2026-06-16 08:30:00"
  }
}
```

---

### 2.3 查询挂号列表

```
GET /api/v1/op/registers
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| registerDate | Date | 否 | 挂号日期 |
| deptId | Long | 否 | 科室ID |
| doctorId | Long | 否 | 医生ID |
| patientId | Long | 否 | 患者ID |
| patientName | String | 否 | 患者姓名（模糊查询） |
| registerStatus | Integer | 否 | 挂号状态 |
| registerType | Integer | 否 | 挂号类型 |
| registerNo | String | 否 | 挂号编号 |
| idCardNo | String | 否 | 身份证号 |
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页条数，默认20 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 100,
    "list": [
      {
        "registerId": 10001,
        "registerNo": "GH202606160001",
        "queueNo": "N005",
        "patientName": "张三",
        "deptName": "内科",
        "doctorName": "李主任",
        "registerTypeName": "专家号",
        "registerStatusName": "已挂号",
        "registerTime": "2026-06-16 08:30:00"
      }
    ]
  }
}
```

---

### 2.4 退号

```
POST /api/v1/op/registers/{id}/refund
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 挂号ID |

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refundReason | String | 是 | 退号原因 |
| operatorId | Long | 是 | 操作人ID |
| operatorName | String | 是 | 操作人姓名 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "registerId": 10001,
    "registerNo": "GH202606160001",
    "refundAmount": 70.00,
    "refundTime": "2026-06-16 09:00:00",
    "refundNo": "TF202606160001"
  }
}
```

**业务规则**:
- BR-OP-005: 已就诊状态不可退号
- BR-OP-006: 医保退号需同步撤销医保结算
- BR-OP-007: 退号费用原路退回

---

### 2.5 就诊确认

```
PUT /api/v1/op/registers/{id}/visit
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 挂号ID |

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| doctorId | Long | 是 | 接诊医生ID |
| visitTime | DateTime | 否 | 就诊时间，默认当前时间 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "registerId": 10001,
    "registerStatus": 2,
    "visitTime": "2026-06-16 09:30:00"
  }
}
```

---

## 3. 预约挂号 API

### 3.1 创建预约

```
POST /api/v1/op/appointments
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | Long | 是 | 患者ID |
| patientName | String | 是 | 患者姓名 |
| patientPhone | String | 是 | 患者手机号 |
| idCardNo | String | 是 | 身份证号 |
| appointmentDate | Date | 是 | 预约日期 |
| timeSlotStart | Time | 是 | 时间段开始，格式：HH:mm |
| timeSlotEnd | Time | 是 | 时间段结束，格式：HH:mm |
| deptId | Long | 是 | 预约科室ID |
| doctorId | Long | 是 | 预约医生ID |
| scheduleId | Long | 是 | 排班ID |
| registerType | Integer | 是 | 挂号类型：1普通/2专家 |
| createChannel | Integer | 是 | 创建渠道：1微信/2APP/3网站 |

**请求示例**:

```json
{
  "patientId": 1001,
  "patientName": "张三",
  "patientPhone": "13800000000",
  "idCardNo": "310101199001011234",
  "appointmentDate": "2026-06-20",
  "timeSlotStart": "09:00",
  "timeSlotEnd": "09:30",
  "deptId": 10,
  "doctorId": 100,
  "scheduleId": 55,
  "registerType": 2,
  "createChannel": 1
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "appointmentId": 10001,
    "appointmentNo": "YY202606200001",
    "appointmentDate": "2026-06-20",
    "timeSlot": "09:00-09:30",
    "deptName": "内科",
    "doctorName": "李主任",
    "registerTypeName": "专家号",
    "appointmentStatus": 1,
    "expireTime": "2026-06-20 10:00:00"
  }
}
```

**业务规则**:
- BR-OP-008: 预约日期范围：当前日期+1天至+30天
- BR-OP-009: 同一科室每日限预约1次
- BR-OP-010: 预约成功后号源锁定

---

### 3.2 查询预约列表

```
GET /api/v1/op/appointments
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | Long | 否 | 患者ID |
| appointmentDate | Date | 否 | 预约日期 |
| deptId | Long | 否 | 科室ID |
| appointmentStatus | Integer | 否 | 预约状态 |
| idCardNo | String | 否 | 身份证号 |
| pageNum | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页条数 |

---

### 3.3 预约签到

```
PUT /api/v1/op/appointments/{id}/checkin
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 预约ID |

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| checkinChannel | Integer | 是 | 签到渠道：1窗口/2自助机/3手机 |
| operatorId | Long | 否 | 操作人ID（窗口签到时必填） |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "appointmentId": 10001,
    "appointmentStatus": 2,
    "registerId": 10002,
    "registerNo": "GH202606200001",
    "queueNo": "N001"
  }
}
```

---

### 3.4 取消预约

```
PUT /api/v1/op/appointments/{id}/cancel
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cancelReason | String | 是 | 取消原因 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "appointmentId": 10001,
    "appointmentStatus": 3,
    "cancelTime": "2026-06-19 10:00:00"
  }
}
```

**业务规则**:
- BR-OP-011: 预约时间前24小时内不可取消
- BR-OP-012: 取消后号源释放

---

## 4. 号源管理 API

### 4.1 查询号源

```
GET /api/v1/op/schedules
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleDate | Date | 是 | 排班日期 |
| deptId | Long | 否 | 科室ID |
| doctorId | Long | 否 | 医生ID |
| registerType | Integer | 否 | 挂号类型 |
| pageNum | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页条数 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 10,
    "list": [
      {
        "scheduleId": 50,
        "scheduleDate": "2026-06-16",
        "deptId": 10,
        "deptName": "内科",
        "doctorId": 100,
        "doctorName": "李主任",
        "doctorTitle": "主任医师",
        "timePeriod": "AM",
        "timeStart": "08:00",
        "timeEnd": "12:00",
        "expertTotal": 20,
        "expertRemaining": 10,
        "normalTotal": 30,
        "normalRemaining": 15,
        "scheduleStatus": 1,
        "scheduleStatusName": "正常"
      }
    ]
  }
}
```

---

### 4.2 创建排班

```
POST /api/v1/op/schedules
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deptId | Long | 是 | 科室ID |
| doctorId | Long | 是 | 医生ID |
| scheduleDate | Date | 是 | 排班日期 |
| timePeriod | String | 是 | 时段：AM/PM |
| timeStart | Time | 是 | 开始时间 |
| timeEnd | Time | 是 | 结束时间 |
| expertTotal | Integer | 是 | 专家号总数 |
| normalTotal | Integer | 是 | 普通号总数 |

**请求示例**:

```json
{
  "deptId": 10,
  "doctorId": 100,
  "scheduleDate": "2026-06-20",
  "timePeriod": "AM",
  "timeStart": "08:00",
  "timeEnd": "12:00",
  "expertTotal": 20,
  "normalTotal": 30
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "scheduleId": 55,
    "scheduleNo": "PB20260620001"
  }
}
```

---

### 4.3 更新排班

```
PUT /api/v1/op/schedules/{id}
```

---

### 4.4 加号

```
POST /api/v1/op/schedules/{id}/add
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| addCount | Integer | 是 | 加号数量 |
| addReason | String | 是 | 加号原因 |
| approverId | Long | 是 | 审批人ID |
| approverName | String | 是 | 审批人姓名 |

---

### 4.5 停诊

```
PUT /api/v1/op/schedules/{id}/suspend
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| suspendReason | String | 是 | 停诊原因 |
| notifyPatients | Boolean | 否 | 是否通知患者，默认true |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "scheduleId": 50,
    "scheduleStatus": 2,
    "affectedPatients": 5,
    "notifyStatus": "已发送"
  }
}
```

---

### 4.6 批量排班

```
POST /api/v1/op/schedules/batch
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| templateId | Long | 否 | 排班模板ID |
| deptId | Long | 是 | 科室ID |
| doctorIds | Array[Long] | 是 | 医生ID列表 |
| dateStart | Date | 是 | 开始日期 |
| dateEnd | Date | 是 | 结束日期 |
| timePeriods | Array | 是 | 时段配置 |
| expertTotal | Integer | 是 | 专家号数量 |
| normalTotal | Integer | 是 | 普通号数量 |

---

## 5. 分诊排队 API

### 5.1 查询候诊队列

```
GET /api/v1/op/triage
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deptId | Long | 是 | 科室ID |
| queueDate | Date | 否 | 排队日期，默认今日 |
| queueStatus | Integer | 否 | 队列状态：1候诊/2就诊中/3过号 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "currentPatient": {
      "queueNo": "N001",
      "patientName": "张三",
      "registerTypeName": "专家号",
      "waitTime": 30
    },
    "waitingList": [
      {
        "queueNo": "N002",
        "patientName": "李四",
        "registerTypeName": "普通号",
        "registerTime": "08:20",
        "waitTime": 10,
        "queueStatus": 1
      }
    ],
    "total": 10,
    "priorityCount": 1
  }
}
```

---

### 5.2 叫号

```
PUT /api/v1/op/triage/call
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deptId | Long | 是 | 科室ID |
| queueNo | String | 否 | 排队号，不填则呼叫下一位 |

---

### 5.3 调整排队顺序

```
PUT /api/v1/op/triage/{id}/priority
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetPosition | Integer | 是 | 目标位置 |
| reason | String | 是 | 调整原因 |

---

### 5.4 过号处理

```
PUT /api/v1/op/triage/{id}/miss
```

---

## 6. 医保挂号 API

### 6.1 医保身份验证

```
POST /api/v1/op/insurance/verify
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| idCardNo | String | 是 | 身份证号 |
| insuranceCardNo | String | 否 | 医保卡号 |
| verifyType | Integer | 是 | 验证方式：1读卡/2人脸 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "insuranceType": "城镇职工医保",
    "insuranceNo": "310100********1234",
    "validStatus": 1,
    "validStatusName": "正常",
    "balance": 1500.00,
    "annualQuota": 5000.00,
    "annualUsed": 3000.00
  }
}
```

---

### 6.2 医保费用预结算

```
POST /api/v1/op/insurance/pre-settle
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| registerFee | Decimal | 是 | 挂号费 |
| diagnoseFee | Decimal | 是 | 诊查费 |
| patientId | Long | 是 | 患者ID |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "totalFee": 70.00,
    "insurancePay": 15.00,
    "personalPay": 55.00,
    "settleDetail": [
      {
        "feeItem": "诊查费",
        "fee": 20.00,
        "insurancePay": 15.00,
        "personalPay": 5.00
      },
      {
        "feeItem": "挂号费",
        "fee": 50.00,
        "insurancePay": 0.00,
        "personalPay": 50.00
      }
    ]
  }
}
```

---

### 6.3 医保实时结算

```
POST /api/v1/op/insurance/settle
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| registerId | Long | 是 | 挂号ID |
| patientId | Long | 是 | 患者ID |
| totalFee | Decimal | 是 | 费用合计 |
| insurancePay | Decimal | 是 | 医保支付 |
| personalPay | Decimal | 是 | 个人支付 |

---

## 附录A: 门诊模块业务错误码

| 错误码 | 错误消息 | 说明 |
|--------|----------|------|
| 1002001001 | 号源已满，无法挂号 | 门诊-挂号-号源不足 |
| 1002001002 | 患者今日已有有效挂号记录 | 门诊-挂号-重复挂号 |
| 1002001003 | 已就诊状态不可退号 | 门诊-挂号-状态冲突 |
| 1002002001 | 预约时间已过，无法取消 | 门诊-预约-时间限制 |
| 1002003001 | 医保身份验证失败 | 门诊-医保-接口错误 |

---

## 附录B: 门诊模块枚举定义

### B.1 挂号状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 已挂号 | 挂号成功 |
| 2 | 已就诊 | 完成就诊 |
| 3 | 已退号 | 已退号退款 |
| 4 | 已取消 | 预约取消 |

### B.2 预约状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 已预约 | 预约成功 |
| 2 | 已签到 | 已签到挂号 |
| 3 | 已取消 | 取消预约 |
| 4 | 已过期 | 超时未签到 |

### B.3 支付方式

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 现金 | 现金支付 |
| 2 | 医保 | 医保支付 |
| 3 | 微信 | 微信支付 |
| 4 | 支付宝 | 支付宝支付 |
| 5 | 银行卡 | 银行卡支付 |

---

> **编制**: YUDAO-AI-HIS架构组
> **最后更新**: 2026-06-17