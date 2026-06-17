# M09 系统管理 - API设计文档

> **文档编号**: YUDAO-HIS-API-M09-001
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 设计中
> **参考文档**: YUDAO-HIS-API-001 全局API设计规范

---

## 1. 概述

本文档定义系统管理模块的API接口规范，包括用户管理、角色管理、权限管理和数据字典等子系统。

### 1.1 模块接口清单

| 子系统 | 接口数量 | 说明 |
|--------|----------|------|
| 用户管理 | 5 | 创建用户、查询用户列表、更新用户、删除用户、重置密码 |
| 角色管理 | 2 | 创建角色、查询角色列表 |
| 权限管理 | 1 | 查询当前用户权限 |
| 数据字典 | 1 | 查询字典列表 |
| **合计** | **9** | - |

---

## 2. 用户管理 API

### 2.1 创建用户

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

---

### 2.2 查询用户列表

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

---

### 2.3 更新用户

```
PUT /api/v1/sys/users/{id}
```

---

### 2.4 删除用户

```
DELETE /api/v1/sys/users/{id}
```

---

### 2.5 重置密码

```
PUT /api/v1/sys/users/{id}/reset-password
```

---

## 3. 角色管理 API

### 3.1 创建角色

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

---

### 3.2 查询角色列表

```
GET /api/v1/sys/roles
```

---

## 4. 权限管理 API

### 4.1 查询当前用户权限

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

---

## 5. 数据字典 API

### 5.1 查询字典列表

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

---

## 附录A: 常用字典类型

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

## 附录B: 数据权限范围

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 全部数据 | 可查看所有数据 |
| 2 | 本部门数据 | 仅查看本部门数据 |
| 3 | 本部门及以下 | 查看本部门及子部门数据 |
| 4 | 仅本人数据 | 仅查看个人数据 |
| 5 | 自定义 | 自定义数据范围 |

---

> **编制**: YUDAO-AI-HIS架构组
> **最后更新**: 2026-06-17