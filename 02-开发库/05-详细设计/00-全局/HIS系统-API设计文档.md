# YUDAO-AI-HIS 智慧医疗信息系统 - API设计文档

> **文档编号**: YUDAO-HIS-API-001
> **版本**: V1.0
> **创建日期**: 2026-06-16
> **状态**: 设计中
> **参考文档**: YUDAO-HIS-PRD-001, YUDAO-HIS-FP-M01-01
> **接口标准**: RESTful API / HL7 FHIR R4

---

## 1. API设计规范

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| RESTful风格 | 遵循REST架构风格，资源导向设计 |
| 统一接口规范 | 统一的URL命名、请求格式、响应格式 |
| 版本管理 | 通过URL路径进行版本控制，如 /api/v1/ |
| 安全性 | HTTPS传输，JWT认证，RBAC权限控制 |
| 幂等性 | PUT、DELETE操作保证幂等性 |
| 可追溯 | 所有请求记录审计日志 |

### 1.2 URL命名规范

```
基础URL: https://{domain}/api/{version}/{module}/{resource}

命名规则:
- 使用小写字母和连字符
- 资源名称使用复数形式
- 避免使用动词，通过HTTP方法表达操作
- 路径参数用于标识具体资源

示例:
- GET    /api/v1/op/registers          # 获取挂号列表
- POST   /api/v1/op/registers          # 创建挂号
- GET    /api/v1/op/registers/{id}    # 获取指定挂号详情
- PUT    /api/v1/op/registers/{id}    # 更新指定挂号
- DELETE /api/v1/op/registers/{id}    # 删除指定挂号
```

### 1.3 HTTP方法规范

| HTTP方法 | 操作类型 | 幂等性 | 使用场景 |
|----------|----------|--------|----------|
| GET | 查询 | 是 | 获取资源，不修改数据 |
| POST | 创建 | 否 | 创建新资源 |
| PUT | 全量更新 | 是 | 全量更新资源 |
| PATCH | 部分更新 | 否 | 部分更新资源 |
| DELETE | 删除 | 是 | 删除资源 |

### 1.4 统一响应格式

#### 1.4.1 标准响应结构

```json
{
  "code": 0,
  "msg": "",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 错误码，0表示成功，非0表示失败 |
| msg | String | 错误提示，成功时为空字符串 |
| data | Object | 响应数据，可为对象或数组 |

> **说明**: 响应格式基于 `CommonResult<T>` 通用返回类，详见 `yudao-common` 模块。

#### 1.4.2 分页响应结构

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 100,
    "list": []
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 错误码，0表示成功 |
| msg | String | 错误提示 |
| data.total | Long | 总记录数 |
| data.list | Array | 数据列表 |

> **说明**: 分页响应基于 `PageResult<T>` 分页结果类，包含 `total` 总量和 `list` 数据列表。

### 1.5 错误码定义

#### 1.5.1 HTTP状态码规范

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 0 | 成功 | 请求处理成功 |
| 400 | 请求参数不正确 | 参数校验失败 |
| 401 | 账号未登录 | 未登录或Token失效 |
| 403 | 没有该操作权限 | 无操作权限 |
| 404 | 请求未找到 | 资源不存在 |
| 405 | 请求方法不正确 | HTTP方法错误 |
| 423 | 请求失败，请稍后重试 | 并发请求冲突 |
| 429 | 请求过于频繁，请稍后重试 | 请求频率超限 |
| 500 | 系统异常 | 系统内部错误 |
| 501 | 功能未实现/未开启 | 功能未实现 |
| 502 | 错误的配置项 | 配置错误 |
| 900 | 重复请求，请稍后重试 | 重复请求 |
| 901 | 演示模式，禁止写操作 | 演示环境限制 |
| 999 | 未知错误 | 未知错误 |

> **说明**: 全局错误码占用 [0, 999]，详见 `GlobalErrorCodeConstants`。

#### 1.5.2 业务错误码规范

错误码格式：10位数字，分成四段

```
第一段（1位）- 类型：
    1 - 业务级别异常

第二段（3位）- 系统类型：
    001 - 系统管理
    002 - 门诊管理
    003 - 住院管理
    004 - 电子病历
    005 - 检验管理
    006 - 影像管理
    007 - 药品管理
    008 - 手术麻醉
    009 - 财务管理

第三段（3位）- 模块：
    不限制规则，各系统内部定义

第四段（3位）- 错误码：
    各模块自增
```

**业务错误码示例：**

| 错误码 | 错误消息 | 说明 |
|--------|----------|------|
| 1002001001 | 号源已满，无法挂号 | 门诊-挂号-号源不足 |
| 1002001002 | 患者今日已有有效挂号记录 | 门诊-挂号-重复挂号 |
| 1002001003 | 已就诊状态不可退号 | 门诊-挂号-状态冲突 |
| 1002002001 | 预约时间已过，无法取消 | 门诊-预约-时间限制 |
| 1002003001 | 医保身份验证失败 | 门诊-医保-接口错误 |
| 1003001001 | 患者腕带不匹配，停止给药 | 住院-给药-身份校验 |
| 1003001002 | 药品条码不匹配，停止给药 | 住院-给药-药品校验 |
| 1005001001 | 危急值未在规定时间内确认 | 检验-危急值-超时 |
| 1007001001 | 处方存在药物相互作用 | 药品-审核-合理性 |

> **说明**: 全局错误码占用 [0, 999]，业务异常错误码占用 [1_000_000_000, +∞)。详见 `GlobalErrorCodeConstants` 和 `ServiceErrorCodeRange`。

### 1.6 请求参数规范

#### 1.6.1 公共请求头

| 请求头 | 必填 | 说明 |
|--------|------|------|
| Authorization | 是 | Bearer {token}，JWT认证令牌 |
| Content-Type | 是 | application/json |
| Accept | 是 | application/json |
| X-Request-Id | 否 | 请求唯一标识，用于幂等性控制 |
| X-Tenant-Id | 否 | 租户ID（多租户场景） |
| X-Hospital-Id | 否 | 医院ID（多院区场景） |

#### 1.6.2 分页查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| pageNum | Integer | 1 | 页码 |
| pageSize | Integer | 20 | 每页条数，最大100 |
| orderBy | String | createTime | 排序字段 |
| orderType | String | desc | 排序方式：asc/desc |

#### 1.6.3 时间范围参数

| 参数 | 类型 | 说明 |
|------|------|------|
| startTime | DateTime | 开始时间，格式：yyyy-MM-dd HH:mm:ss |
| endTime | DateTime | 结束时间，格式：yyyy-MM-dd HH:mm:ss |

### 1.7 认证与授权

#### 1.7.1 JWT Token结构

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1001",
    "name": "张三",
    "roles": ["OP_DOCTOR"],
    "permissions": ["op:register:create", "op:prescription:create"],
    "deptId": 10,
    "hospitalId": 1,
    "exp": 1718582400,
    "iat": 1718496000
  }
}
```

#### 1.7.2 权限标识规范

```
{模块}:{资源}:{操作}

示例:
- sys:user:create    # 创建用户
- sys:user:read      # 查看用户
- sys:user:update    # 更新用户
- sys:user:delete    # 删除用户
- op:register:create # 创建挂号
- ip:order:stop      # 停止医嘱
- pharm:audit:pass   # 审核通过处方
```

---

## 2. M01 门诊管理 API

### 2.1 挂号管理 API

#### 2.1.1 创建挂号

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

#### 2.1.2 查询挂号详情

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

#### 2.1.3 查询挂号列表

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

#### 2.1.4 退号

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

#### 2.1.5 就诊确认

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

### 2.2 预约挂号 API

#### 2.2.1 创建预约

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

#### 2.2.2 查询预约列表

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

#### 2.2.3 预约签到

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

#### 2.2.4 取消预约

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

### 2.3 号源管理 API

#### 2.3.1 查询号源

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

#### 2.3.2 创建排班

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

#### 2.3.3 更新排班

```
PUT /api/v1/op/schedules/{id}
```

#### 2.3.4 加号

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

#### 2.3.5 停诊

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

#### 2.3.6 批量排班

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

### 2.4 分诊排队 API

#### 2.4.1 查询候诊队列

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

#### 2.4.2 叫号

```
PUT /api/v1/op/triage/call
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deptId | Long | 是 | 科室ID |
| queueNo | String | 否 | 排队号，不填则呼叫下一位 |

#### 2.4.3 调整排队顺序

```
PUT /api/v1/op/triage/{id}/priority
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetPosition | Integer | 是 | 目标位置 |
| reason | String | 是 | 调整原因 |

#### 2.4.4 过号处理

```
PUT /api/v1/op/triage/{id}/miss
```

### 2.5 医保挂号 API

#### 2.5.1 医保身份验证

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

#### 2.5.2 医保费用预结算

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

#### 2.5.3 医保实时结算

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

## 3. M02 住院管理 API

### 3.1 入院管理 API

#### 3.1.1 入院登记

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

#### 3.1.2 查询入院信息

```
GET /api/v1/ip/admissions/{id}
```

#### 3.1.3 入院护理评估

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

### 3.2 医嘱管理 API

#### 3.2.1 创建医嘱

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

#### 3.2.2 查询医嘱列表

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

#### 3.2.3 停止医嘱

```
PUT /api/v1/ip/orders/{id}/stop
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| stopReason | String | 是 | 停止原因 |
| stopDoctorId | Long | 是 | 停嘱医生ID |
| stopTime | DateTime | 否 | 停止时间，默认当前时间 |

#### 3.2.4 作废医嘱

```
PUT /api/v1/ip/orders/{id}/cancel
```

### 3.3 护理工作站 API

#### 3.3.1 创建护理记录

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

#### 3.3.2 查询护理记录

```
GET /api/v1/ip/nursing-records
```

### 3.4 eMAR给药管理 API

#### 3.4.1 扫描腕带验证

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

#### 3.4.2 扫描药品验证

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

#### 3.4.3 确认给药

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

### 3.5 出院管理 API

#### 3.5.1 出院申请

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

#### 3.5.2 查询出院信息

```
GET /api/v1/ip/discharge/{id}
```

---

## 4. M06 药品管理 API

### 4.1 药品目录 API

#### 4.1.1 查询药品列表

```
GET /api/v1/pharm/drugs
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | String | 否 | 关键词（名称/编码） |
| drugType | Integer | 否 | 药品类型 |
| drugCategory | Integer | 否 | 药品分类 |
| status | Integer | 否 | 状态 |
| pageNum | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页条数 |

#### 4.1.2 创建药品

```
POST /api/v1/pharm/drugs
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| drugCode | String | 是 | 药品编码 |
| drugName | String | 是 | 药品名称 |
| drugType | Integer | 是 | 药品类型 |
| specification | String | 是 | 规格 |
| manufacturer | String | 是 | 生产厂家 |
| unit | String | 是 | 单位 |
| price | Decimal | 是 | 价格 |
| storageCondition | String | 否 | 储存条件 |
| controlledType | Integer | 否 | 管制类型：0普通/1精神/2麻醉 |

### 4.2 库存管理 API

#### 4.2.1 查询库存

```
GET /api/v1/pharm/inventory
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| drugId | Long | 否 | 药品ID |
| deptId | Long | 否 | 部门ID |
| batchNo | String | 否 | 批号 |
| lowStock | Boolean | 否 | 是否低库存 |

#### 4.2.2 入库

```
POST /api/v1/pharm/inventory/in
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| drugId | Long | 是 | 药品ID |
| batchNo | String | 是 | 批号 |
| expiryDate | Date | 是 | 有效期 |
| quantity | Integer | 是 | 入库数量 |
| supplierId | Long | 是 | 供应商ID |
| purchasePrice | Decimal | 是 | 进货价 |
| purchaseNo | String | 是 | 采购单号 |
| operatorId | Long | 是 | 操作人ID |

#### 4.2.3 出库

```
POST /api/v1/pharm/inventory/out
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| drugId | Long | 是 | 药品ID |
| batchNo | String | 是 | 批号 |
| quantity | Integer | 是 | 出库数量 |
| deptId | Long | 是 | 领用部门ID |
| outType | Integer | 是 | 出库类型：1发药/2调拨/3报损 |
| operatorId | Long | 是 | 操作人ID |

### 4.3 处方审核 API

#### 4.3.1 处方审核

```
POST /api/v1/pharm/audit
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prescriptionId | Long | 是 | 处方ID |
| prescriptionType | Integer | 是 | 处方类型：1门诊/2住院 |
| pharmacistId | Long | 是 | 审核药师ID |
| auditResult | Integer | 是 | 审核结果：1通过/2退回 |
| auditOpinion | String | 否 | 审核意见 |
| drugInteractionCheck | Boolean | 否 | 药物相互作用检查 |
| allergyCheck | Boolean | 否 | 过敏史检查 |
| dosageCheck | Boolean | 否 | 剂量合理性检查 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "auditId": 10001,
    "auditResult": 1,
    "cdsResult": {
      "drugInteractions": [],
      "allergyWarnings": [],
      "dosageWarnings": [],
      "passed": true
    }
  }
}
```

**业务规则**:
- BR-PHARM-005: 所有处方必须经过合理性审核
- BR-PHARM-006: 药物相互作用检查必须覆盖所有高风险组合

---

## 5. M04 检验管理 API

### 5.1 检验申请 API

#### 5.1.1 创建检验申请

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

### 5.2 标本追踪 API

#### 5.2.1 查询标本状态

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

### 5.3 危急值管理 API

#### 5.3.1 上报告危急值

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

#### 5.3.2 确认危急值

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

## 6. M09 系统管理 API

### 6.1 用户管理 API

#### 6.1.1 创建用户

```
POST /api/v1/sys/users
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名（唯一） |
| password | String | 是 | 密码（加密传输） |
| realName | String | 是 | 真实姓名 |
| employeeNo | String | 是 | 工号 |
| deptId | Long | 是 | 部门ID |
| mobile | String | 是 | 手机号 |
| email | String | 否 | 邮箱 |
| roleIdList | Array[Long] | 是 | 角色ID列表 |
| status | Integer | 否 | 状态：0停用/1正常 |

#### 6.1.2 查询用户列表

```
GET /api/v1/sys/users
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 否 | 用户名 |
| realName | String | 否 | 真实姓名 |
| deptId | Long | 否 | 部门ID |
| status | Integer | 否 | 状态 |
| pageNum | Integer | 否 | 页码 |
| pageSize | Integer | 否 | 每页条数 |

#### 6.1.3 更新用户

```
PUT /api/v1/sys/users/{id}
```

#### 6.1.4 删除用户

```
DELETE /api/v1/sys/users/{id}
```

#### 6.1.5 重置密码

```
PUT /api/v1/sys/users/{id}/reset-password
```

### 6.2 角色管理 API

#### 6.2.1 创建角色

```
POST /api/v1/sys/roles
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roleName | String | 是 | 角色名称 |
| roleCode | String | 是 | 角色编码 |
| description | String | 否 | 描述 |
| menuIdList | Array[Long] | 是 | 菜单权限列表 |
| permissionList | Array[String] | 是 | 按钮权限列表 |
| dataScope | Integer | 是 | 数据权限范围 |

#### 6.2.2 查询角色列表

```
GET /api/v1/sys/roles
```

### 6.3 权限管理 API

#### 6.3.1 查询当前用户权限

```
GET /api/v1/sys/permissions
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "userId": 1001,
    "username": "zhangsan",
    "realName": "张三",
    "roles": ["OP_DOCTOR"],
    "permissions": [
      "op:register:create",
      "op:register:read",
      "op:prescription:create",
      "op:prescription:read"
    ],
    "menus": [
      {
        "menuId": 1,
        "menuName": "门诊管理",
        "menuPath": "/op",
        "children": [
          {
            "menuId": 11,
            "menuName": "挂号管理",
            "menuPath": "/op/register"
          }
        ]
      }
    ],
    "dataScope": {
      "scopeType": 2,
      "scopeName": "本部门",
      "deptIdList": [10]
    }
  }
}
```

### 6.4 数据字典 API

#### 6.4.1 查询字典列表

```
GET /api/v1/sys/dict/{type}
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| type | String | 字典类型 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "dictValue": "1",
      "dictLabel": "男",
      "dictSort": 1
    },
    {
      "dictValue": "2",
      "dictLabel": "女",
      "dictSort": 2
    }
  ]
}
```

**常用字典类型**:

| 字典类型 | 说明 |
|----------|------|
| sys_gender | 性别 |
| sys_status | 状态 |
| sys_yes_no | 是否 |
| op_register_type | 挂号类型 |
| op_register_status | 挂号状态 |
| op_pay_type | 支付方式 |
| op_insurance_type | 医保类型 |
| ip_order_type | 医嘱类型 |
| ip_order_status | 医嘱状态 |
| ip_nursing_level | 护理等级 |
| lis_specimen_status | 标本状态 |
| lis_critical_level | 危急值等级 |
| pharm_drug_type | 药品类型 |

---

## 7. 外部接口设计

### 7.1 接口适配器架构

```
┌─────────────────────────────────────────────────────────────┐
│                      业务系统层                              │
│    门诊管理 │ 住院管理 │ 检验管理 │ 药品管理 │ 财务管理      │
├─────────────────────────────────────────────────────────────┤
│                     接口适配层                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 医保适配 │ │ FHIR适配 │ │DICOM适配 │ │第三方适配 │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│                     协议转换层                               │
│  HTTP/REST │ HL7 FHIR │ ASTM │ DICOM │ XML │ JSON          │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 医保接口适配器

#### 7.2.1 接口概述

| 接口编号 | 接口名称 | 接口类型 | 说明 |
|----------|----------|----------|------|
| INS-001 | 人员信息获取 | 查询 | 获取参保人员基本信息 |
| INS-002 | 在院信息查询 | 查询 | 查询患者在院状态 |
| INS-003 | 门诊费用上传 | 交易 | 上传门诊费用明细 |
| INS-004 | 门诊结算 | 交易 | 门诊费用医保结算 |
| INS-005 | 住院登记 | 交易 | 住院医保登记 |
| INS-006 | 住院费用上传 | 交易 | 上传住院费用明细 |
| INS-007 | 住院结算 | 交易 | 住院费用医保结算 |
| INS-008 | 结算撤销 | 交易 | 撤销已结算记录 |

#### 7.2.2 医保接口适配器API

```
POST /api/v1/adapter/insurance/{action}
```

**请求示例（人员信息获取）**:

```json
{
  "action": "1101",
  "data": {
    "psnNo": "310100********1234",
    "certType": "01",
    "certNo": "310101199001011234"
  }
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "psnName": "张三",
    "psnCertType": "01",
    "psnNo": "310100********1234",
    "insutype": "310",
    "insuOrgCode": "310100",
    "balc": 1500.00
  }
}
```

### 7.3 HL7 FHIR R4 接口

#### 7.3.1 FHIR资源映射

| FHIR资源 | HIS资源 | 说明 |
|----------|---------|------|
| Patient | his_patient | 患者主索引 |
| Encounter | his_encounter | 就诊记录 |
| Practitioner | sys_user | 医护人员 |
| Organization | sys_dept | 机构/科室 |
| Condition | his_diagnosis | 诊断信息 |
| Observation | his_lab_result | 检验结果 |
| MedicationRequest | his_prescription | 处方/医嘱 |
| DiagnosticReport | his_report | 检验/检查报告 |

#### 7.3.2 FHIR接口端点

```
GET/POST /api/v1/fhir/Patient
GET/POST /api/v1/fhir/Encounter
GET/POST /api/v1/fhir/Practitioner
GET/POST /api/v1/fhir/Condition
GET/POST /api/v1/fhir/Observation
GET/POST /api/v1/fhir/MedicationRequest
GET/POST /api/v1/fhir/DiagnosticReport
```

#### 7.3.3 Patient资源示例

```json
{
  "resourceType": "Patient",
  "id": "1001",
  "identifier": [
    {
      "system": "urn:oid:2.16.840.1.113883.2.4.6.3",
      "value": "310101199001011234"
    }
  ],
  "name": [
    {
      "use": "official",
      "text": "张三",
      "family": "张",
      "given": ["三"]
    }
  ],
  "gender": "male",
  "birthDate": "1990-01-01",
  "telecom": [
    {
      "system": "phone",
      "value": "13800000000",
      "use": "mobile"
    }
  ],
  "address": [
    {
      "city": "上海市",
      "district": "黄浦区"
    }
  ]
}
```

### 7.4 DICOM接口

#### 7.4.1 DICOM接口概述

| 接口 | 说明 |
|------|------|
| C-STORE | 影像存储 |
| C-FIND | 影像查询 |
| C-MOVE | 影像传输 |
| C-GET | 影像获取 |

#### 7.4.2 影像接口API

```
POST /api/v1/pacs/images
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| patientId | Long | 是 | 患者ID |
| studyUid | String | 是 | 检查UID |
| seriesUid | String | 否 | 序列UID |
| instanceUid | String | 否 | 实例UID |

```
GET /api/v1/pacs/images/{studyUid}
```

### 7.5 第三方接口适配器

#### 7.5.1 支付接口

```
POST /api/v1/adapter/payment/{channel}
```

| 渠道 | 说明 |
|------|------|
| wechat | 微信支付 |
| alipay | 支付宝 |
| unionpay | 银联支付 |

**请求示例**:

```json
{
  "orderNo": "GH202606160001",
  "amount": 70.00,
  "subject": "挂号费",
  "notifyUrl": "https://xxx/api/v1/callback/payment"
}
```

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "transactionId": "WX202606160001",
    "payTime": "2026-06-16 08:30:00",
    "payAmount": 70.00
  }
}
```

#### 7.5.2 短信接口

```
POST /api/v1/adapter/sms/send
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | 是 | 手机号 |
| templateCode | String | 是 | 模板编码 |
| params | Object | 否 | 模板参数 |

**请求示例**:

```json
{
  "mobile": "13800000000",
  "templateCode": "APPOINTMENT_SUCCESS",
  "params": {
    "patientName": "张三",
    "appointmentDate": "2026-06-20",
    "deptName": "内科",
    "doctorName": "李主任"
  }
}
```

#### 7.5.3 CA电子签名接口

```
POST /api/v1/adapter/ca/sign
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | Long | 是 | 用户ID |
| documentContent | String | 是 | 文档内容（Base64） |
| documentType | String | 是 | 文档类型 |

**响应示例**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "signatureValue": "MIIB+gY...",
    "signTime": "2026-06-16 10:00:00",
    "certSerial": "12345678"
  }
}
```

---

## 8. 接口安全设计

### 8.1 认证机制

| 认证方式 | 适用场景 | 说明 |
|----------|----------|------|
| JWT Token | 普通用户 | 无状态认证，Token有效期2小时 |
| API Key | 系统对接 | 用于外部系统调用 |
| CA证书 | 电子签名 | 符合《电子签名法》要求 |

### 8.2 数据安全

| 安全措施 | 说明 |
|----------|------|
| HTTPS传输 | TLS 1.2+加密传输 |
| 敏感数据加密 | 身份证号、手机号加密存储 |
| 数据脱敏 | 接口返回数据脱敏处理 |
| 请求签名 | 外部接口请求签名验证 |

### 8.3 访问控制

```
权限校验流程:
1. JWT Token解析获取用户身份
2. 查询用户角色和权限列表
3. 校验接口权限标识
4. 校验数据权限范围
5. 记录访问日志
```

### 8.4 接口限流

| 限流策略 | 说明 |
|----------|------|
| 用户级限流 | 单用户100次/分钟 |
| IP级限流 | 单IP 1000次/分钟 |
| 接口级限流 | 敏感接口单独限流 |

---

## 9. 接口版本管理

### 9.1 版本策略

- URL路径版本控制：`/api/v1/`、`/api/v2/`
- 向下兼容原则：新版本保留旧版本功能
- 废弃公告：旧版本提前3个月公告废弃

### 9.2 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| V1.0 | 2026-06-16 | 初始版本，包含核心模块API |

---

## 附录A: 公共枚举定义

### A.1 挂号状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 已挂号 | 挂号成功 |
| 2 | 已就诊 | 完成就诊 |
| 3 | 已退号 | 已退号退款 |
| 4 | 已取消 | 预约取消 |

### A.2 预约状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 已预约 | 预约成功 |
| 2 | 已签到 | 已签到挂号 |
| 3 | 已取消 | 取消预约 |
| 4 | 已过期 | 超时未签到 |

### A.3 医嘱状态

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 开立 | 医嘱开立 |
| 2 | 审核 | 护士审核通过 |
| 3 | 执行中 | 正在执行 |
| 4 | 已完成 | 执行完成 |
| 5 | 已停止 | 医生停嘱 |
| 6 | 已作废 | 作废 |

### A.4 支付方式

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 现金 | 现金支付 |
| 2 | 医保 | 医保支付 |
| 3 | 微信 | 微信支付 |
| 4 | 支付宝 | 支付宝支付 |
| 5 | 银行卡 | 银行卡支付 |

---

## 附录B: 接口清单汇总

| 模块 | 接口数量 | 说明 |
|------|----------|------|
| M01 门诊管理 | 25 | 挂号、预约、号源、分诊、医保 |
| M02 住院管理 | 18 | 入院、医嘱、护理、eMAR、出院 |
| M04 检验管理 | 8 | 检验申请、标本追踪、危急值 |
| M06 药品管理 | 10 | 药品目录、库存、处方审核 |
| M09 系统管理 | 12 | 用户、角色、权限、字典 |
| 外部接口 | 15 | 医保、FHIR、DICOM、第三方 |
| **合计** | **88** | - |

---

> **编制**: YUDAO-AI-HIS架构组
> **最后更新**: 2026-06-16

---

## 附录C: 后端响应类参考

本API设计文档的响应格式基于 `yudao-framework` 框架的通用响应类：

### C.1 CommonResult<T> 通用返回类

**源码位置**: `yudao-framework/yudao-common/src/main/java/cn/iocoder/yudao/framework/common/pojo/CommonResult.java`

```java
@Data
public class CommonResult<T> implements Serializable {
    /**
     * 错误码
     * @see ErrorCode#getCode()
     */
    private Integer code;
    /**
     * 错误提示，用户可阅读
     * @see ErrorCode#getMsg()
     */
    private String msg;
    /**
     * 返回数据
     */
    private T data;
}
```

### C.2 PageResult<T> 分页结果类

**源码位置**: `yudao-framework/yudao-common/src/main/java/cn/iocoder/yudao/framework/common/pojo/PageResult.java`

```java
@Data
public final class PageResult<T> implements Serializable {
    @Schema(description = "总量")
    private Long total;

    @Schema(description = "数据")
    private List<T> list;
}
```

### C.3 GlobalErrorCodeConstants 全局错误码常量

**源码位置**: `yudao-framework/yudao-common/src/main/java/cn/iocoder/yudao/framework/common/exception/enums/GlobalErrorCodeConstants.java`

| 错误码 | 常量名 | 错误提示 |
|--------|--------|----------|
| 0 | SUCCESS | 成功 |
| 400 | BAD_REQUEST | 请求参数不正确 |
| 401 | UNAUTHORIZED | 账号未登录 |
| 403 | FORBIDDEN | 没有该操作权限 |
| 404 | NOT_FOUND | 请求未找到 |
| 405 | METHOD_NOT_ALLOWED | 请求方法不正确 |
| 423 | LOCKED | 请求失败，请稍后重试 |
| 429 | TOO_MANY_REQUESTS | 请求过于频繁，请稍后重试 |
| 500 | INTERNAL_SERVER_ERROR | 系统异常 |
| 501 | NOT_IMPLEMENTED | 功能未实现/未开启 |
| 502 | ERROR_CONFIGURATION | 错误的配置项 |
| 900 | REPEATED_REQUESTS | 重复请求，请稍后重试 |
| 901 | DEMO_DENY | 演示模式，禁止写操作 |
| 999 | UNKNOWN | 未知错误 |

### C.4 ServiceErrorCodeRange 业务错误码区间

**源码位置**: `yudao-framework/yudao-common/src/main/java/cn/iocoder/yudao/framework/common/exception/enums/ServiceErrorCodeRange.java`

业务异常错误码占用 [1_000_000_000, +∞)，采用10位数字分段编码：

```
第一段（1位）- 类型：1 业务级别异常
第二段（3位）- 系统类型：001-用户系统, 002-商品系统, ...
第三段（3位）- 模块：各系统内部定义
第四段（3位）- 错误码：各模块自增
```
