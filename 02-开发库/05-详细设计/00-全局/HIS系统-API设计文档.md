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

## 2. 模块API文档索引

各模块的详细API设计请参考对应的模块文档：

| 模块 | 文档路径 | 说明 |
|------|----------|------|
| M01 门诊管理 | [M01-门诊管理-API设计.md](./M01-门诊管理/M01-门诊管理-API设计.md) | 挂号、预约、号源、分诊、医保挂号 |
| M02 住院管理 | [M02-住院管理-API设计.md](./M02-住院管理/M02-住院管理-API设计.md) | 入院、医嘱、护理、eMAR、出院 |
| M04 检验管理 | [M04-检验管理-API设计.md](./M04-检验管理/M04-检验管理-API设计.md) | 检验申请、标本追踪、危急值 |
| M06 药品管理 | [M06-药品管理-API设计.md](./M06-药品管理/M06-药品管理-API设计.md) | 药品目录、库存、处方审核 |
| M09 系统管理 | [M09-系统管理-API设计.md](./M09-系统管理/M09-系统管理-API设计.md) | 用户、角色、权限、数据字典 |

---

## 3. 外部接口设计

### 3.1 接口适配器架构

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

### 3.2 医保接口适配器

#### 3.2.1 接口概述

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

#### 3.2.2 医保接口适配器API

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

### 3.3 HL7 FHIR R4 接口

#### 3.3.1 FHIR资源映射

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

#### 3.3.2 FHIR接口端点

```
GET/POST /api/v1/fhir/Patient
GET/POST /api/v1/fhir/Encounter
GET/POST /api/v1/fhir/Practitioner
GET/POST /api/v1/fhir/Condition
GET/POST /api/v1/fhir/Observation
GET/POST /api/v1/fhir/MedicationRequest
GET/POST /api/v1/fhir/DiagnosticReport
```

#### 3.3.3 Patient资源示例

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

### 3.4 DICOM接口

#### 3.4.1 DICOM接口概述

| 接口 | 说明 |
|------|------|
| C-STORE | 影像存储 |
| C-FIND | 影像查询 |
| C-MOVE | 影像传输 |
| C-GET | 影像获取 |

#### 3.4.2 影像接口API

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

### 3.5 第三方接口适配器

#### 3.5.1 支付接口

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

#### 3.5.2 短信接口

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

#### 3.5.3 CA电子签名接口

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

## 4. 接口安全设计

### 4.1 认证机制

| 认证方式 | 适用场景 | 说明 |
|----------|----------|------|
| JWT Token | 普通用户 | 无状态认证，Token有效期2小时 |
| API Key | 系统对接 | 用于外部系统调用 |
| CA证书 | 电子签名 | 符合《电子签名法》要求 |

### 4.2 数据安全

| 安全措施 | 说明 |
|----------|------|
| HTTPS传输 | TLS 1.2+加密传输 |
| 敏感数据加密 | 身份证号、手机号加密存储 |
| 数据脱敏 | 接口返回数据脱敏处理 |
| 请求签名 | 外部接口请求签名验证 |

### 4.3 访问控制

```
权限校验流程:
1. JWT Token解析获取用户身份
2. 查询用户角色和权限列表
3. 校验接口权限标识
4. 校验数据权限范围
5. 记录访问日志
```

### 4.4 接口限流

| 限流策略 | 说明 |
|----------|------|
| 用户级限流 | 单用户100次/分钟 |
| IP级限流 | 单IP 1000次/分钟 |
| 接口级限流 | 敏感接口单独限流 |

---

## 5. 接口版本管理

### 5.1 版本策略

- URL路径版本控制：`/api/v1/`、`/api/v2/`
- 向下兼容原则：新版本保留旧版本功能
- 废弃公告：旧版本提前3个月公告废弃

### 5.2 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| V1.0 | 2026-06-16 | 初始版本，包含核心模块API |
| V1.1 | 2026-06-17 | 拆分模块API到独立文档 |

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

| 模块 | 接口数量 | 文档位置 |
|------|----------|----------|
| M01 门诊管理 | 22 | [M01-门诊管理-API设计.md](./M01-门诊管理/M01-门诊管理-API设计.md) |
| M02 住院管理 | 14 | [M02-住院管理-API设计.md](./M02-住院管理/M02-住院管理-API设计.md) |
| M04 检验管理 | 4 | [M04-检验管理-API设计.md](./M04-检验管理/M04-检验管理-API设计.md) |
| M06 药品管理 | 6 | [M06-药品管理-API设计.md](./M06-药品管理/M06-药品管理-API设计.md) |
| M09 系统管理 | 9 | [M09-系统管理-API设计.md](./M09-系统管理/M09-系统管理-API设计.md) |
| 外部接口 | 15 | 本文档第3节 |
| **合计** | **70** | - |

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

---

> **编制**: YUDAO-AI-HIS架构组
> **最后更新**: 2026-06-17