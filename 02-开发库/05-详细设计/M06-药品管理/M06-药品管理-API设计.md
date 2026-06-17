# M06 药品管理 - API设计文档

> **文档编号**: YUDAO-HIS-API-M06-001
> **版本**: V1.0
> **创建日期**: 2026-06-17
> **状态**: 设计中
> **参考文档**: YUDAO-HIS-API-001 全局API设计规范

---

## 1. 概述

本文档定义药品管理模块的API接口规范，包括药品目录、库存管理和处方审核等子系统。

### 1.1 模块接口清单

| 子系统 | 接口数量 | 说明 |
|--------|----------|------|
| 药品目录 | 2 | 查询药品列表、创建药品 |
| 库存管理 | 3 | 查询库存、入库、出库 |
| 处方审核 | 1 | 处方审核 |
| **合计** | **6** | - |

---

## 2. 药品目录 API

### 2.1 查询药品列表

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

---

### 2.2 创建药品

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

---

## 3. 库存管理 API

### 3.1 查询库存

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

---

### 3.2 入库

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

---

### 3.3 出库

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

---

## 4. 处方审核 API

### 4.1 处方审核

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

## 附录A: 药品模块业务错误码

| 错误码 | 错误消息 | 说明 |
|--------|----------|------|
| 1007001001 | 处方存在药物相互作用 | 药品-审核-合理性 |

---

## 附录B: 药品模块枚举定义

### B.1 药品类型

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 西药 | 化学药品 |
| 2 | 中成药 | 中成药制剂 |
| 3 | 中草药 | 中药材 |
| 4 | 生物制品 | 生物制品 |

### B.2 管制类型

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 普通 | 普通药品 |
| 1 | 精神药品 | 精神药品管理 |
| 2 | 麻醉药品 | 麻醉药品管理 |

### B.3 出库类型

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 发药 | 处方发药 |
| 2 | 调拨 | 科室调拨 |
| 3 | 报损 | 报损出库 |

### B.4 处方审核结果

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 通过 | 审核通过 |
| 2 | 退回 | 退回修改 |

---

> **编制**: YUDAO-AI-HIS架构组
> **最后更新**: 2026-06-17