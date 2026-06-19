# M13 AI辅助子系统 - 业务规则文档

> **文档编号**: YUDAO-HIS-BR-M13
> **版本**: V1.0
> **编制日期**: 2026-06-19
> **编制方法**: 从全局业务规则、PRD、用户故事、验收标准中提取和结构化AI辅助业务规则
> **关联文档**: YUDAO-HIS-BR-001, YUDAO-HIS-PRD-M13, YUDAO-HIS-US-M13, YUDAO-HIS-AC-M13

---

## 1. 规则概述

| 项目 | 内容 |
|------|------|
| 规则总数 | 35 |
| 规则前缀 | BR-AI (Business Rule - AI) |
| 覆盖模块 | M13-01智能分诊、M13-02影像AI、M13-03病历质控AI、M13-04辅助诊断建议、M13-05AI模型管理 |

---

## 2. 规则分类统计

| 规则类型 | 数量 | 占比 |
|----------|------|------|
| VAL(校验规则) | 8 | 23% |
| FLOW(流转规则) | 6 | 17% |
| PERM(权限规则) | 5 | 14% |
| CALC(计算规则) | 10 | 29% |
| INT(集成规则) | 6 | 17% |

---

## 3. 规则详细定义

### 3.1 校验规则(VAL)

#### BR-AI-001: 智能分诊置信度阈值

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-001 |
| 规则名称 | 智能分诊置信度阈值校验 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | 分诊记录(triage) |
| 规则描述 | 智能分诊结果置信度必须>=70%才可作为推荐科室，低于70%需人工分诊 |
| 触发时机 | AI分诊分析完成时 |
| 校验逻辑 | ```
// 伪代码
IF ai_confidence_score >= 70 THEN
    triage.recommended_dept = ai_recommended_dept
    triage.status = 'AI_RECOMMENDED'
ELSE
    triage.status = 'MANUAL_REQUIRED'
    triage.recommended_dept = NULL
    SEND_alert_to_nurse("AI置信度较低，需人工分诊")
END IF

RETURN success()
``` |
| 失败处理 | 置信度低于70%时，标记为"需人工分诊"，通知分诊护士 |
| 优先级 | P0 |

---

#### BR-AI-002: 症状描述长度限制

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-002 |
| 规则名称 | 症状描述长度限制 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | 分诊记录(triage) |
| 规则描述 | 患者症状描述文本长度限制在500字以内，超过限制需截断或分段处理 |
| 触发时机 | 症状输入时 |
| 校验逻辑 | ```
// 伪代码
IF LENGTH(symptom_text) > 500 THEN
    RETURN error("症状描述不能超过500字")
END IF

// 语音转文字后长度校验
IF voice_to_text_result.length > 500 THEN
    symptom_text = SUBSTRING(voice_to_text_result, 0, 500)
    SEND_alert("症状描述已截断至500字")
END IF

RETURN success()
``` |
| 失败处理 | 返回错误提示，阻止提交 |
| 优先级 | P0 |

---

#### BR-AI-003: 影像AI分析置信度阈值

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-003 |
| 规则名称 | 影像AI分析置信度阈值 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | 影像AI结果(ai_imaging_result) |
| 规则描述 | 影像AI检测结果置信度>=80%才显示正常，低于80%显示警告提示 |
| 触发时机 | 影像AI分析完成时 |
| 校验逻辑 | ```
// 伪代码
FOR each lesion IN ai_result.lesions DO
    IF lesion.confidence >= 80 THEN
        lesion.display_status = 'NORMAL'
    ELSE IF lesion.confidence >= 60 THEN
        lesion.display_status = 'WARNING'
        lesion.warning_message = '置信度较低，请谨慎参考'
    ELSE
        lesion.display_status = 'LOW_CONFIDENCE'
        lesion.warning_message = '置信度过低，建议谨慎判断'
    END IF
END FOR

// 总体置信度
IF ai_result.overall_confidence < 80 THEN
    ai_result.warning_flag = true
    ai_result.warning_message = 'AI分析置信度较低，请结合临床判断'
END IF

RETURN success()
``` |
| 失败处理 | 低置信度结果显示警告提示 |
| 优先级 | P0 |

---

#### BR-AI-004: 影像质量AI分析条件

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-004 |
| 规则名称 | 影像质量AI分析条件校验 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | 影像检查(imaging_study) |
| 规则描述 | 影像必须满足AI分析的质量要求（分辨率、完整性、格式）才能进行AI分析 |
| 触发时机 | AI分析请求时 |
| 校验逻辑 | ```
// 伪代码
// 检查影像质量
quality_check = {
    'resolution': CHECK_resolution(imaging_study) >= MIN_RESOLUTION,
    'completeness': CHECK_completeness(imaging_study),
    'format': imaging_study.format IN ['DICOM', 'JPEG', 'PNG'],
    'slice_count': imaging_study.slice_count > 0
}

IF NOT quality_check.resolution THEN
    RETURN error("影像分辨率不满足AI分析要求")
END IF

IF NOT quality_check.completeness THEN
    RETURN error("影像数据不完整，无法进行AI分析")
END IF

IF NOT quality_check.format THEN
    RETURN error("影像格式不支持AI分析")
END IF

RETURN success()
``` |
| 失败处理 | 返回错误提示，医生独立诊断 |
| 优先级 | P0 |

---

#### BR-AI-005: 病历质控评分阈值

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-005 |
| 规则名称 | 病历质控评分阈值判定 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | 病历质控结果(qc_result) |
| 规则描述 | 病历质控评分>=90为优秀，>=80为良好，>=60为合格，<60为不合格需整改 |
| 触发时机 | 质控评分计算后 |
| 校验逻辑 | ```
// 伪代码
IF qc_score >= 90 THEN
    qc_level = 'EXCELLENT'  // 优秀
    qc_status = 'PASSED'
ELSE IF qc_score >= 80 THEN
    qc_level = 'GOOD'  // 良好
    qc_status = 'PASSED'
ELSE IF qc_score >= 60 THEN
    qc_level = 'QUALIFIED'  // 合格
    qc_status = 'PASSED'
ELSE
    qc_level = 'UNQUALIFIED'  // 不合格
    qc_status = 'NEED_REVISION'
    SEND_notification_to_doctor("病历质控不合格，需整改")
    SEND_notification_to_qc_admin("病历质控不合格")
END IF

RETURN {qc_level, qc_status}
``` |
| 失败处理 | 不合格病历自动标记需整改，通知医生和质控员 |
| 优先级 | P0 |

---

#### BR-AI-006: 辅助诊断数据完整性校验

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-006 |
| 规则名称 | 辅助诊断数据完整性校验 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | 辅助诊断建议(ai_diagnosis_suggestion) |
| 规则描述 | 辅助诊断需要足够的患者数据（症状、检验、影像）才能生成诊断建议 |
| 触发时机 | 请求辅助诊断时 |
| 校验逻辑 | ```
// 伪代码
data_completeness = {
    'has_symptom': patient.symptom IS NOT NULL,
    'has_lab_result': COUNT(patient.lab_results) > 0,
    'has_imaging': COUNT(patient.imaging_studies) > 0,
    'has_vital_signs': patient.vital_signs IS NOT NULL
}

// 数据完整性评分
completeness_score = CALCULATE_completeness(data_completeness)

IF completeness_score < 50 THEN
    RETURN error("数据不足，无法提供诊断建议", {
        'missing_data': GET_missing_data(data_completeness),
        'suggested_tests': SUGGEST_additional_tests(data_completeness)
    })
END IF

RETURN success()
``` |
| 失败处理 | 返回数据不足提示，显示建议补充的检验项目 |
| 优先级 | P0 |

---

#### BR-AI-007: AI模型参数范围校验

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-007 |
| 规则名称 | AI模型参数范围校验 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | AI模型配置(ai_model_config) |
| 规则描述 | AI模型参数必须在有效范围内，置信度阈值0-100，超时时间>0 |
| 触发时机 | 模型参数配置时 |
| 校验逻辑 | ```
// 伪代码
// 置信度阈值校验
IF confidence_threshold < 0 OR confidence_threshold > 100 THEN
    RETURN error("置信度阈值必须在0-100之间")
END IF

// 超时时间校验
IF timeout_seconds <= 0 THEN
    RETURN error("超时时间必须大于0")
END IF

// 重试次数校验
IF retry_count < 0 OR retry_count > 10 THEN
    RETURN error("重试次数必须在0-10之间")
END IF

// 并发限制校验
IF max_concurrent <= 0 THEN
    RETURN error("并发限制必须大于0")
END IF

RETURN success()
``` |
| 失败处理 | 返回错误提示，阻止保存 |
| 优先级 | P0 |

---

#### BR-AI-008: AI服务可用性校验

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-008 |
| 规则名称 | AI服务可用性校验 |
| 规则类型 | VAL(校验规则) |
| 适用对象 | AI服务(ai_service) |
| 规则描述 | AI服务可用性必须>=99.5%，低于阈值触发告警 |
| 触发时机 | 服务监控检查时 |
| 校验逻辑 | ```
// 伪代码
availability = CALCULATE_availability(ai_service, time_window='24h')

IF availability < 99.5 THEN
    SEND_alert({
        'level': 'WARNING',
        'message': 'AI服务可用性低于99.5%',
        'current_availability': availability,
        'service_id': ai_service.service_id
    })
END IF

IF availability < 95 THEN
    SEND_alert({
        'level': 'CRITICAL',
        'message': 'AI服务可用性严重下降',
        'current_availability': availability
    })
END IF

RETURN availability
``` |
| 失败处理 | 发送告警通知，记录异常日志 |
| 优先级 | P0 |

---

### 3.2 流转规则(FLOW)

#### BR-AI-009: 智能分诊状态流转

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-009 |
| 规则名称 | 智能分诊状态流转规则 |
| 规则类型 | FLOW(流转规则) |
| 适用对象 | 分诊记录(triage) |
| 规则描述 | 分诊状态流转：待分析->AI已分析->待确认->已确认->已挂号；AI置信度低直接转人工分诊 |
| 触发时机 | 分诊状态变更时 |
| 校验逻辑 | ```
// 伪代码
// 状态定义：1-待分析, 2-AI已分析, 3-待确认, 4-已确认, 5-已挂号, 6-人工分诊

valid_transitions = {
    1: [2, 6],  // 待分析 -> AI已分析/人工分诊
    2: [3, 6],  // AI已分析 -> 待确认/人工分诊(置信度低)
    3: [4, 6],  // 待确认 -> 已确认/人工分诊
    4: [5],     // 已确认 -> 已挂号
    5: [],      // 已挂号 -> 终态
    6: [4]      // 人工分诊 -> 已确认
}

IF target_status NOT IN valid_transitions[current_status] THEN
    RETURN error("状态流转不合法")
END IF

// 置信度低直接转人工
IF current_status = 2 AND confidence < 70 THEN
    target_status = 6
END IF

RETURN success()
``` |
| 失败处理 | 返回错误"状态流转不合法" |
| 优先级 | P0 |

---

#### BR-AI-010: 影像AI分析状态流转

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-010 |
| 规则名称 | 影像AI分析状态流转规则 |
| 规则类型 | FLOW(流转规则) |
| 适用对象 | 影像AI结果(ai_imaging_result) |
| 规则描述 | 影像AI状态流转：待分析->分析中->已分析->已复核；分析失败可重试 |
| 触发时机 | AI分析状态变更时 |
| 校验逻辑 | ```
// 伪代码
// 状态定义：1-待分析, 2-分析中, 3-已分析, 4-已复核, 5-分析失败

valid_transitions = {
    1: [2],     // 待分析 -> 分析中
    2: [3, 5],  // 分析中 -> 已分析/分析失败
    3: [4],     // 已分析 -> 已复核
    4: [],      // 已复核 -> 终态
    5: [2]      // 分析失败 -> 分析中(重试)
}

IF target_status NOT IN valid_transitions[current_status] THEN
    RETURN error("状态流转不合法")
END IF

RETURN success()
``` |
| 失败处理 | 返回错误"状态流转不合法" |
| 优先级 | P0 |

---

#### BR-AI-011: 病历质控状态流转

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-011 |
| 规则名称 | 病历质控状态流转规则 |
| 规则类型 | FLOW(流转规则) |
| 适用对象 | 病历质控结果(qc_result) |
| 规则描述 | 质控状态流转：待分析->已分析->待审核->通过/待整改->整改待审核->通过 |
| 触发时机 | 质控状态变更时 |
| 校验逻辑 | ```
// 伪代码
// 状态定义：1-待分析, 2-已分析, 3-待审核, 4-通过, 5-待整改, 6-整改待审核

valid_transitions = {
    1: [2],     // 待分析 -> 已分析
    2: [3],     // 已分析 -> 待审核
    3: [4, 5],  // 待审核 -> 通过/待整改
    4: [],      // 通过 -> 终态
    5: [6],     // 待整改 -> 整改待审核
    6: [4, 5]   // 整改待审核 -> 通过/待整改
}

IF target_status NOT IN valid_transitions[current_status] THEN
    RETURN error("状态流转不合法")
END IF

RETURN success()
``` |
| 失败处理 | 返回错误"状态流转不合法" |
| 优先级 | P0 |

---

#### BR-AI-012: AI结果人工复核流程

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-012 |
| 规则名称 | AI结果人工复核流程 |
| 规则类型 | FLOW(流转规则) |
| 适用对象 | AI分析结果(ai_result) |
| 规则描述 | 关键AI结果必须经过人工复核确认后才能生效，医生可选择确认、调整或忽略 |
| 触发时机 | AI结果复核时 |
| 校验逻辑 | ```
// 伪代码
// 复核选项：1-确认采用, 2-部分采用, 3-调整后采用, 4-忽略

IF confirm_type = 1 THEN
    ai_result.confirm_status = 'CONFIRMED'
    ai_result.is_adopted = 2  // 完全采用
ELSE IF confirm_type = 2 THEN
    ai_result.confirm_status = 'PARTIAL_ADOPTED'
    ai_result.is_adopted = 1  // 部分采用
ELSE IF confirm_type = 3 THEN
    ai_result.confirm_status = 'ADJUSTED'
    ai_result.is_adopted = 1  // 部分采用
    ai_result.adjustment_details = adjustment_input
ELSE IF confirm_type = 4 THEN
    ai_result.confirm_status = 'IGNORED'
    ai_result.is_adopted = 0  // 不采用
END IF

// 记录复核信息
ai_result.reviewer_id = current_user.user_id
ai_result.review_time = NOW()

RETURN success()
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-013: 分诊反馈与模型优化流程

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-013 |
| 规则名称 | 分诊反馈与模型优化流程 |
| 规则类型 | FLOW(流转规则) |
| 适用对象 | 分诊记录(triage) |
| 规则描述 | 分诊结果确认后，记录实际就诊科室作为反馈数据，用于模型持续优化 |
| 触发时机 | 患者就诊完成后 |
| 校验逻辑 | ```
// 伪代码
// 获取实际挂号科室
actual_dept = SELECT dept_id FROM op_register 
               WHERE patient_id = triage.patient_id 
                 AND register_date = triage.create_date

// 判断分诊是否准确
IF actual_dept = triage.recommended_dept_id THEN
    triage.is_correct = true
ELSE
    triage.is_correct = false
END IF

// 记录反馈数据
INSERT INTO ai_feedback_data (
    triage_id,
    patient_id,
    symptom_text,
    symptom_entities,
    recommended_dept,
    actual_dept,
    is_correct,
    confidence_score,
    ai_model_version
) VALUES (...)

// 更新模型统计
UPDATE ai_model_statistics
SET accuracy_rate = CALCULATE_accuracy(model_id)
WHERE model_id = triage.ai_model_id

RETURN success()
``` |
| 失败处理 | - |
| 优先级 | P1 |

---

#### BR-AI-014: 整改超时提醒流程

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-014 |
| 规则名称 | 整改超时提醒流程 |
| 规则类型 | FLOW(流转规则) |
| 适用对象 | 病历质控结果(qc_result) |
| 规则描述 | 病历整改超过24小时未完成，系统发送超时提醒给医生和科室质控员 |
| 触发时机 | 定时检查时 |
| 校验逻辑 | ```
// 伪代码
// 定时任务检查
FOR each qc_result IN SELECT * FROM qc_result 
                       WHERE status = 'NEED_REVISION' 
                         AND DATEDIFF(NOW(), revision_request_time) >= 1 DO
    
    // 发送超时提醒给医生
    SEND_notification({
        'user_id': qc_result.doctor_id,
        'type': 'REVISION_TIMEOUT',
        'message': '病历整改已超时，请尽快完成'
    })
    
    // 通知科室质控员
    SEND_notification({
        'user_id': qc_result.dept_qc_admin_id,
        'type': 'REVISION_TIMEOUT',
        'message': '科室有病历整改超时'
    })
    
    // 记录超时
    qc_result.timeout_count = qc_result.timeout_count + 1
END FOR

RETURN success()
``` |
| 失败处理 | - |
| 优先级 | P1 |

---

### 3.3 权限规则(PERM)

#### BR-AI-015: 智能分诊权限控制

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-015 |
| 规则名称 | 智能分诊权限控制 |
| 规则类型 | PERM(权限规则) |
| 适用对象 | 智能分诊(triage) |
| 规则描述 | 患者可使用智能分诊功能，护士可确认分诊，管理员可查看分诊统计 |
| 触发时机 | 分诊操作时 |
| 校验逻辑 | ```
// 伪代码
CASE operation_type
    WHEN 'TRIAGE_INPUT' THEN
        // 患者输入症状 - 需要患者身份
        IF NOT is_patient(current_user) THEN
            RETURN error("仅患者可使用智能分诊")
        END IF
    WHEN 'TRIAGE_CONFIRM' THEN
        // 护士确认分诊 - 需要护士权限
        IF NOT has_permission(current_user, 'NURSE_TRIAGE') THEN
            RETURN error("无分诊确认权限")
        END IF
    WHEN 'TRIAGE_ADJUST' THEN
        // 护士调整分诊 - 需要护士权限
        IF NOT has_permission(current_user, 'NURSE_TRIAGE') THEN
            RETURN error("无分诊调整权限")
        END IF
    WHEN 'TRIAGE_STATISTICS' THEN
        // 查看分诊统计 - 需要管理员权限
        IF NOT has_permission(current_user, 'AI_ADMIN') THEN
            RETURN error("无查看统计权限")
        END IF
END CASE

RETURN success()
``` |
| 失败处理 | 返回错误"无XX权限" |
| 优先级 | P0 |

---

#### BR-AI-016: 影像AI权限控制

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-016 |
| 规则名称 | 影像AI权限控制 |
| 规则类型 | PERM(权限规则) |
| 适用对象 | 影像AI(ai_imaging) |
| 规则描述 | 影像医生可查看和复核AI结果，放射科主任可查看AI统计 |
| 触发时机 | 影像AI操作时 |
| 校验逻辑 | ```
// 伪代码
CASE operation_type
    WHEN 'VIEW_AI_RESULT' THEN
        // 查看AI结果 - 需要影像医生权限
        IF NOT has_permission(current_user, 'RADIOLOGIST') THEN
            RETURN error("无查看AI结果权限")
        END IF
    WHEN 'CONFIRM_AI_RESULT' THEN
        // 复核AI结果 - 需要影像医生权限
        IF NOT has_permission(current_user, 'RADIOLOGIST') THEN
            RETURN error("无复核AI结果权限")
        END IF
    WHEN 'AI_STATISTICS' THEN
        // 查看AI统计 - 需要放射科主任权限
        IF NOT has_permission(current_user, 'RADIOLOGY_DIRECTOR') THEN
            RETURN error("无查看统计权限")
        END IF
END CASE

RETURN success()
``` |
| 失败处理 | 返回错误"无XX权限" |
| 优先级 | P0 |

---

#### BR-AI-017: 病历质控AI权限控制

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-017 |
| 规则名称 | 病历质控AI权限控制 |
| 规则类型 | PERM(权限规则) |
| 适用对象 | 病历质控AI(qc_ai) |
| 规则描述 | 质控管理员可审核质控结果，医生可查看整改意见 |
| 触发时机 | 质控操作时 |
| 校验逻辑 | ```
// 伪代码
CASE operation_type
    WHEN 'QC_AUDIT' THEN
        // 审核质控结果 - 需要质控管理员权限
        IF NOT has_permission(current_user, 'QC_ADMIN') THEN
            RETURN error("无质控审核权限")
        END IF
    WHEN 'QC_PASS' THEN
        // 质控通过 - 需要质控管理员权限
        IF NOT has_permission(current_user, 'QC_ADMIN') THEN
            RETURN error("无质控通过权限")
        END IF
    WHEN 'QC_REVISION' THEN
        // 提交整改 - 需要是病历书写医生
        IF current_user.user_id != emr.doctor_id THEN
            RETURN error("仅病历书写医生可提交整改")
        END IF
    WHEN 'VIEW_QC_RESULT' THEN
        // 查看质控结果 - 需要医生或质控员权限
        IF NOT (has_permission(current_user, 'DOCTOR') OR has_permission(current_user, 'QC_ADMIN')) THEN
            RETURN error("无查看质控结果权限")
        END IF
END CASE

RETURN success()
``` |
| 失败处理 | 返回错误"无XX权限" |
| 优先级 | P0 |

---

#### BR-AI-018: AI模型管理权限控制

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-018 |
| 规则名称 | AI模型管理权限控制 |
| 规则类型 | PERM(权限规则) |
| 适用对象 | AI模型(ai_model) |
| 规则描述 | AI管理员可配置模型参数，切换版本，启用禁用模型 |
| 触发时机 | 模型管理操作时 |
| 校验逻辑 | ```
// 伪代码
CASE operation_type
    WHEN 'MODEL_CONFIG' THEN
        // 配置模型参数 - 需要AI管理员权限
        IF NOT has_permission(current_user, 'AI_ADMIN') THEN
            RETURN error("无模型配置权限")
        END IF
    WHEN 'MODEL_ENABLE' THEN
        // 启用/禁用模型 - 需要AI管理员权限
        IF NOT has_permission(current_user, 'AI_ADMIN') THEN
            RETURN error("无模型启禁用权限")
        END IF
    WHEN 'MODEL_VERSION_SWITCH' THEN
        // 切换模型版本 - 需要AI管理员权限
        IF NOT has_permission(current_user, 'AI_ADMIN') THEN
            RETURN error("无版本切换权限")
        END IF
    WHEN 'MODEL_VIEW' THEN
        // 查看模型信息 - 需要AI管理员或监控权限
        IF NOT (has_permission(current_user, 'AI_ADMIN') OR has_permission(current_user, 'AI_MONITOR')) THEN
            RETURN error("无查看模型权限")
        END IF
END CASE

RETURN success()
``` |
| 失败处理 | 返回错误"无XX权限" |
| 优先级 | P0 |

---

#### BR-AI-019: AI服务监控权限控制

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-019 |
| 规则名称 | AI服务监控权限控制 |
| 规则类型 | PERM(权限规则) |
| 适用对象 | AI服务监控(ai_monitor) |
| 规则描述 | AI管理员可查看服务状态和调用日志，可接收告警通知 |
| 触发时机 | 监控操作时 |
| 校验逻辑 | ```
// 伪代码
CASE operation_type
    WHEN 'VIEW_SERVICE_STATUS' THEN
        // 查看服务状态 - 需要AI监控权限
        IF NOT has_permission(current_user, 'AI_MONITOR') THEN
            RETURN error("无查看服务状态权限")
        END IF
    WHEN 'VIEW_CALL_LOG' THEN
        // 查看调用日志 - 需要AI监控权限
        IF NOT has_permission(current_user, 'AI_MONITOR') THEN
            RETURN error("无查看调用日志权限")
        END IF
    WHEN 'RECEIVE_ALERT' THEN
        // 接收告警 - 需要AI管理员权限并配置告警接收
        IF NOT has_permission(current_user, 'AI_ADMIN') THEN
            RETURN error("无接收告警权限")
        END IF
END CASE

RETURN success()
``` |
| 失败处理 | 返回错误"无XX权限" |
| 优先级 | P0 |

---

### 3.4 计算规则(CALC)

#### BR-AI-020: 智能分诊置信度计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-020 |
| 规则名称 | 智能分诊置信度计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | 分诊记录(triage) |
| 规则描述 | 根据症状匹配度、症状权重、历史数据计算科室推荐置信度 |
| 触发时机 | AI分诊分析时 |
| 校验逻辑 | ```
// 伪代码
// 症状实体提取
symptom_entities = NLP_EXTRACT(symptom_text)

// 症状标准化
standardized_symptoms = STANDARDIZE(symptom_entities)

// 科室匹配计算
FOR each dept IN department_list DO
    // 计算症状匹配度
    match_score = CALCULATE_symptom_match(standardized_symptoms, dept.symptom_keywords)
    
    // 计算历史匹配度
    history_score = CALCULATE_history_match(patient.history, dept)
    
    // 综合置信度
    confidence = match_score * 0.7 + history_score * 0.3
    
    dept_confidence_list.add({dept, confidence})
END FOR

// 排序取Top3
SORT(dept_confidence_list, by=confidence, desc=true)
recommended_depts = dept_confidence_list[0:3]

RETURN recommended_depts
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-021: 影像病灶测量计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-021 |
| 规则名称 | 影像病灶测量计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | 影像AI结果(ai_imaging_result) |
| 规则描述 | 自动计算病灶最大径、体积，测量精度0.1mm |
| 触发时机 | AI检测到病灶时 |
| 校验逻辑 | ```
// 伪代码
FOR each lesion IN detected_lesions DO
    // 计算最大径（最长轴）
    lesion.max_diameter = CALCULATE_max_diameter(lesion.contour)
    
    // 三维体积计算
    IF imaging_study.dimension = '3D' THEN
        lesion.volume = CALCULATE_volume(lesion.contour_3d)
    END IF
    
    // 面积计算
    lesion.area = CALCULATE_area(lesion.contour)
    
    // 精度控制
    lesion.max_diameter = ROUND(lesion.max_diameter, 1)  // 0.1mm
    lesion.volume = ROUND(lesion.volume, 2)  // 0.01cm3
END FOR

RETURN lesions
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-022: 影像AI置信度计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-022 |
| 规则名称 | 影像AI置信度计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | 影像AI结果(ai_imaging_result) |
| 规则描述 | 根据病灶检测概率、图像质量、模型可靠性计算综合置信度 |
| 触发时机 | AI分析完成时 |
| 校验逻辑 | ```
// 伪代码
FOR each lesion IN detected_lesions DO
    // 模型输出概率
    model_probability = lesion.model_probability
    
    // 图像质量因子
    quality_factor = CALCULATE_image_quality_factor(imaging_study)
    
    // 病灶清晰度因子
    clarity_factor = CALCULATE_lesion_clarity(lesion)
    
    // 综合置信度
    lesion.confidence = model_probability * quality_factor * clarity_factor * 100
    
    // 限制范围
    lesion.confidence = MIN(100, MAX(0, lesion.confidence))
END FOR

// 总体置信度
overall_confidence = AVERAGE(lesion.confidence FOR each lesion)

RETURN {lesions, overall_confidence}
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-023: 病历质控评分计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-023 |
| 规则名称 | 病历质控评分计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | 病历质控结果(qc_result) |
| 规则描述 | 根据完整性、规范性、逻辑性检查结果计算质控评分 |
| 触发时机 | 质控分析完成时 |
| 校验逻辑 | ```
// 伪代码
base_score = 100

// 完整性扣分
FOR each missing_field IN completeness_check.failed DO
    IF missing_field.importance = 'REQUIRED' THEN
        base_score = base_score - 10
    ELSE IF missing_field.importance = 'IMPORTANT' THEN
        base_score = base_score - 5
    ELSE
        base_score = base_score - 2
    END IF
END FOR

// 规范性扣分
FOR each format_issue IN conformity_check.failed DO
    base_score = base_score - format_issue.deduction_points
END FOR

// 逻辑性扣分
FOR each logic_issue IN logic_check.failed DO
    base_score = base_score - logic_issue.deduction_points
END FOR

// 最低分限制
qc_score = MAX(0, base_score)

RETURN qc_score
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-024: 辅助诊断置信度计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-024 |
| 规则名称 | 辅助诊断置信度计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | 辅助诊断建议(ai_diagnosis_suggestion) |
| 规则描述 | 根据症状匹配、检验指标、影像特征综合计算诊断置信度 |
| 触发时机 | AI诊断分析时 |
| 校验逻辑 | ```
// 伪代码
FOR each candidate_diagnosis IN diagnosis_candidates DO
    confidence = 0
    
    // 症状匹配贡献
    IF has_symptom_data THEN
        symptom_match = CALCULATE_symptom_diagnosis_match(patient.symptoms, candidate_diagnosis)
        confidence = confidence + symptom_match * 0.4
    END IF
    
    // 检验指标贡献
    IF has_lab_data THEN
        lab_match = CALCULATE_lab_diagnosis_match(patient.lab_results, candidate_diagnosis)
        confidence = confidence + lab_match * 0.3
    END IF
    
    // 影像特征贡献
    IF has_imaging_data THEN
        imaging_match = CALCULATE_imaging_diagnosis_match(patient.imaging_findings, candidate_diagnosis)
        confidence = confidence + imaging_match * 0.3
    END IF
    
    candidate_diagnosis.confidence = confidence * 100
END FOR

// 排序
SORT(diagnosis_candidates, by=confidence, desc=true)

RETURN diagnosis_candidates
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-025: AI模型准确率计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-025 |
| 规则名称 | AI模型准确率计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | AI模型统计(ai_model_statistics) |
| 规则描述 | 根据反馈数据计算模型准确率、用户满意度等指标 |
| 触发时机 | 定时统计时 |
| 校验逻辑 | ```
// 伪代码
// 统计时间窗口
time_window = '30d'

// 计算准确率
correct_count = SELECT COUNT(*) FROM ai_feedback_data 
                 WHERE model_id = :model_id 
                   AND is_correct = true
                   AND create_time >= NOW() - INTERVAL time_window

total_count = SELECT COUNT(*) FROM ai_feedback_data 
               WHERE model_id = :model_id 
                 AND create_time >= NOW() - INTERVAL time_window

accuracy_rate = (correct_count / total_count) * 100 IF total_count > 0 ELSE 0

// 计算用户满意度
feedback_scores = SELECT feedback_score FROM ai_feedback_data 
                   WHERE model_id = :model_id 
                     AND feedback_score IS NOT NULL
                     AND create_time >= NOW() - INTERVAL time_window

user_satisfaction = AVG(feedback_scores) IF COUNT(feedback_scores) > 0 ELSE 0

// 更新模型统计
UPDATE ai_model_statistics
SET accuracy_rate = accuracy_rate,
    user_satisfaction = user_satisfaction,
    total_call_count = total_count,
    update_time = NOW()
WHERE model_id = :model_id

RETURN {accuracy_rate, user_satisfaction}
``` |
| 失败处理 | - |
| 优先级 | P1 |

---

#### BR-AI-026: AI服务响应时间计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-026 |
| 规则名称 | AI服务响应时间计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | AI服务监控(ai_service_monitor) |
| 规则描述 | 记录AI调用响应时间，计算平均值、P95、P99 |
| 触发时机 | AI调用完成时 |
| 校验逻辑 | ```
// 伪代码
// 计算响应时间
response_time_ms = (response_time - request_time) * 1000

// 记录调用日志
INSERT INTO ai_call_log (
    service_id, model_id, request_id,
    request_time, response_time, response_time_ms,
    status, error_message
) VALUES (...)

// 更新实时统计
UPDATE ai_service_realtime_stats
SET 
    total_calls = total_calls + 1,
    total_response_time = total_response_time + response_time_ms,
    avg_response_time = total_response_time / total_calls,
    last_call_time = NOW()
WHERE service_id = :service_id

// 定时计算P95、P99
avg_response_time = SELECT AVG(response_time_ms) FROM ai_call_log 
                     WHERE service_id = :service_id 
                       AND create_time >= NOW() - INTERVAL '1h'

p95_response_time = SELECT PERCENTILE(response_time_ms, 0.95) FROM ai_call_log 
                     WHERE service_id = :service_id 
                       AND create_time >= NOW() - INTERVAL '1h'

p99_response_time = SELECT PERCENTILE(response_time_ms, 0.99) FROM ai_call_log 
                     WHERE service_id = :service_id 
                       AND create_time >= NOW() - INTERVAL '1h'

RETURN {avg_response_time, p95_response_time, p99_response_time}
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-027: AI服务可用性计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-027 |
| 规则名称 | AI服务可用性计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | AI服务监控(ai_service_monitor) |
| 规则描述 | 根据成功调用次数和总调用次数计算服务可用性 |
| 触发时机 | 定时统计时 |
| 校验逻辑 | ```
// 伪代码
// 统计时间窗口
time_window = '24h'

// 成功调用次数
success_count = SELECT COUNT(*) FROM ai_call_log 
                 WHERE service_id = :service_id 
                   AND status = 'SUCCESS'
                   AND create_time >= NOW() - INTERVAL time_window

// 总调用次数
total_count = SELECT COUNT(*) FROM ai_call_log 
               WHERE service_id = :service_id 
                 AND create_time >= NOW() - INTERVAL time_window

// 可用性计算
availability = (success_count / total_count) * 100 IF total_count > 0 ELSE 100

// 更新服务可用性
UPDATE ai_service_availability
SET 
    availability_24h = availability,
    success_count_24h = success_count,
    total_count_24h = total_count,
    update_time = NOW()
WHERE service_id = :service_id

// 可用性低于阈值告警
IF availability < 99.5 THEN
    SEND_alert({
        'level': 'WARNING',
        'service_id': service_id,
        'availability': availability,
        'message': 'AI服务可用性低于99.5%'
    })
END IF

RETURN availability
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-028: AI调用成功率计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-028 |
| 规则名称 | AI调用成功率计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | AI服务监控(ai_service_monitor) |
| 规则描述 | 计算AI调用成功率，区分不同错误类型 |
| 触发时机 | 定时统计时 |
| 校验逻辑 | ```
// 伪代码
// 按错误类型统计
error_stats = SELECT 
                error_type,
                COUNT(*) as error_count
              FROM ai_call_log
              WHERE service_id = :service_id
                AND status != 'SUCCESS'
                AND create_time >= NOW() - INTERVAL '1h'
              GROUP BY error_type

// 成功率计算
success_rate = (total_count - SUM(error_stats.error_count)) / total_count * 100

// 错误率阈值告警
IF success_rate < 95 THEN
    SEND_alert({
        'level': 'WARNING',
        'service_id': service_id,
        'success_rate': success_rate,
        'error_stats': error_stats,
        'message': 'AI服务成功率低于95%'
    })
END IF

RETURN {success_rate, error_stats}
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

#### BR-AI-029: 分诊优先级计算

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-029 |
| 规则名称 | 分诊优先级计算 |
| 规则类型 | CALC(计算规则) |
| 适用对象 | 分诊记录(triage) |
| 规则描述 | 根据症状严重程度、生命体征计算分诊优先级（普通/优先/紧急） |
| 触发时机 | AI分诊分析时 |
| 校验逻辑 | ```
// 伪代码
priority_score = 0

// 症状严重程度评分
FOR each symptom IN symptom_entities DO
    IF symptom.severity = 'SEVERE' THEN
        priority_score = priority_score + 30
    ELSE IF symptom.severity = 'MODERATE' THEN
        priority_score = priority_score + 15
    ELSE
        priority_score = priority_score + 5
    END IF
END FOR

// 生命体征评分
IF vital_signs.temperature > 39 THEN
    priority_score = priority_score + 10
END IF
IF vital_signs.heart_rate > 120 OR vital_signs.heart_rate < 50 THEN
    priority_score = priority_score + 10
END IF
IF vital_signs.blood_pressure_systolic > 180 OR vital_signs.blood_pressure_systolic < 90 THEN
    priority_score = priority_score + 15
END IF

// 确定优先级
IF priority_score >= 60 THEN
    triage_level = 3  // 紧急
ELSE IF priority_score >= 30 THEN
    triage_level = 2  // 优先
ELSE
    triage_level = 1  // 普通
END IF

RETURN triage_level
``` |
| 失败处理 | - |
| 优先级 | P0 |

---

### 3.5 集成规则(INT)

#### BR-AI-030: AI服务调用超时控制

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-030 |
| 规则名称 | AI服务调用超时控制 |
| 规则类型 | INT(集成规则) |
| 适用对象 | AI服务调用(ai_service_call) |
| 规则描述 | 智能分诊超时5秒，影像AI超时60秒，病历质控超时20秒，超时后返回错误并提供降级处理 |
| 触发时机 | AI服务调用时 |
| 校验逻辑 | ```
// 伪代码
// 超时配置
timeout_config = {
    'TRIAGE': 5000,      // 智能分诊 5秒
    'IMAGING': 60000,    // 影像AI 60秒
    'QC': 20000,         // 病历质控 20秒
    'DIAGNOSIS': 10000   // 辅助诊断 10秒
}

timeout_ms = timeout_config[service_type]

TRY
    result = CALL_ai_service_with_timeout(service_endpoint, request, timeout_ms)
    
    IF result.status = 'TIMEOUT' THEN
        LOG_warning("AI服务调用超时", {service_type, timeout_ms})
        RETURN error("AI服务响应超时，请稍后重试", {
            'fallback_available': true,
            'manual_processing': true
        })
    END IF
    
    RETURN result
CATCH exception
    LOG_error("AI服务调用异常", exception)
    RETURN error("AI服务暂时不可用", {
        'fallback_available': true,
        'manual_processing': true
    })
END TRY
``` |
| 失败处理 | 返回错误提示，提供降级处理入口 |
| 优先级 | P0 |

---

#### BR-AI-031: AI服务重试策略

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-031 |
| 规则名称 | AI服务重试策略 |
| 规则类型 | INT(集成规则) |
| 适用对象 | AI服务调用(ai_service_call) |
| 规则描述 | AI服务调用失败后重试2次，间隔1秒，超过重试次数返回错误 |
| 触发时机 | AI服务调用失败时 |
| 校验逻辑 | ```
// 伪代码
max_retry = 2
retry_interval_ms = 1000

FOR attempt = 1 TO max_retry + 1 DO
    result = CALL_ai_service(service_endpoint, request)
    
    IF result.status = 'SUCCESS' THEN
        RETURN result
    END IF
    
    // 记录失败
    LOG_warning("AI服务调用失败", {
        attempt: attempt,
        error: result.error
    })
    
    // 非最后一次失败，等待后重试
    IF attempt <= max_retry THEN
        SLEEP(retry_interval_ms)
    END IF
END FOR

// 重试耗尽
LOG_error("AI服务重试耗尽", {service_type, max_retry})
RETURN error("AI服务暂时不可用，请稍后重试", {
    'fallback_available': true,
    'manual_processing': true
})
``` |
| 失败处理 | 重试耗尽后返回错误提示 |
| 优先级 | P0 |

---

#### BR-AI-032: AI服务结果缓存

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-032 |
| 规则名称 | AI服务结果缓存 |
| 规则类型 | INT(集成规则) |
| 适用对象 | AI分析结果(ai_result) |
| 规则描述 | 影像AI结果缓存24小时，避免重复调用；缓存键使用study_id+series_id |
| 触发时机 | AI服务调用前 |
| 校验逻辑 | ```
// 伪代码
// 缓存配置
cache_config = {
    'IMAGING': {enabled: true, ttl: 86400},  // 影像AI缓存24小时
    'QC': {enabled: true, ttl: 3600},        // 病历质控缓存1小时
    'TRIAGE': {enabled: false},              // 智能分诊不缓存
    'DIAGNOSIS': {enabled: false}            // 辅助诊断不缓存
}

config = cache_config[service_type]

IF config.enabled THEN
    cache_key = GENERATE_cache_key(service_type, request_params)
    cached_result = GET_from_cache(cache_key)
    
    IF cached_result IS NOT NULL THEN
        LOG_info("AI结果命中缓存", {cache_key})
        RETURN cached_result
    END IF
END IF

// 调用AI服务
result = CALL_ai_service(service_endpoint, request)

// 缓存结果
IF config.enabled AND result.status = 'SUCCESS' THEN
    SET_cache(cache_key, result, config.ttl)
END IF

RETURN result
``` |
| 失败处理 | - |
| 优先级 | P1 |

---

#### BR-AI-033: AI服务异常降级处理

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-033 |
| 规则名称 | AI服务异常降级处理 |
| 规则类型 | INT(集成规则) |
| 适用对象 | AI服务(ai_service) |
| 规则描述 | AI服务不可用时，提供降级处理：智能分诊转人工、影像独立诊断、病历人工质控 |
| 触发时机 | AI服务异常时 |
| 校验逻辑 | ```
// 伪代码
CASE service_type
    WHEN 'TRIAGE' THEN
        // 智能分诊降级：转人工分诊
        RETURN {
            'status': 'FALLBACK',
            'message': 'AI分诊服务暂时不可用',
            'fallback_action': 'MANUAL_TRIAGE',
            'fallback_message': '请前往分诊台进行人工分诊'
        }
    WHEN 'IMAGING' THEN
        // 影像AI降级：医生独立诊断
        RETURN {
            'status': 'FALLBACK',
            'message': 'AI分析服务暂时不可用',
            'fallback_action': 'MANUAL_DIAGNOSIS',
            'fallback_message': '请医生独立进行影像诊断'
        }
    WHEN 'QC' THEN
        // 病历质控降级：人工质控
        RETURN {
            'status': 'FALLBACK',
            'message': 'AI质控服务暂时不可用',
            'fallback_action': 'MANUAL_QC',
            'fallback_message': '病历将进入人工质控队列'
        }
    WHEN 'DIAGNOSIS' THEN
        // 辅助诊断降级：医生独立诊断
        RETURN {
            'status': 'FALLBACK',
            'message': 'AI诊断服务暂时不可用',
            'fallback_action': 'MANUAL_DIAGNOSIS',
            'fallback_message': '请医生独立进行诊断'
        }
END CASE
``` |
| 失败处理 | 返回降级处理方案 |
| 优先级 | P0 |

---

#### BR-AI-034: 外部AI服务接口集成

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-034 |
| 规则名称 | 外部AI服务接口集成 |
| 规则类型 | INT(集成规则) |
| 适用对象 | AI模型(ai_model) |
| 规则描述 | 支持对接外部AI服务（REST/gRPC），配置API端点、认证方式、请求格式 |
| 触发时机 | AI服务调用时 |
| 校验逻辑 | ```
// 伪代码
// 获取模型配置
model_config = SELECT * FROM ai_model WHERE model_id = :model_id

// 构建请求
request = BUILD_ai_request({
    'input_data': input_data,
    'model_params': model_config.model_params
})

// 认证处理
headers = {}
CASE model_config.auth_type
    WHEN 'API_KEY' THEN
        headers['X-API-Key'] = model_config.api_key
    WHEN 'BEARER_TOKEN' THEN
        headers['Authorization'] = 'Bearer ' + model_config.bearer_token
    WHEN 'BASIC_AUTH' THEN
        headers['Authorization'] = 'Basic ' + BASE64(model_config.username + ':' + model_config.password)
END CASE

// 调用外部服务
IF model_config.protocol = 'REST' THEN
    response = HTTP_REQUEST({
        'method': 'POST',
        'url': model_config.model_endpoint,
        'headers': headers,
        'body': JSON.stringify(request),
        'timeout': model_config.timeout_seconds * 1000
    })
ELSE IF model_config.protocol = 'GRPC' THEN
    response = GRPC_CALL({
        'endpoint': model_config.model_endpoint,
        'method': model_config.grpc_method,
        'request': request,
        'timeout': model_config.timeout_seconds * 1000
    })
END IF

// 解析响应
IF response.status_code = 200 THEN
    result = JSON.parse(response.body)
ELSE
    RETURN error("AI服务调用失败: " + response.status_code)
END IF

RETURN result
``` |
| 失败处理 | 返回错误提示 |
| 优先级 | P0 |

---

#### BR-AI-035: AI结果追溯记录

| 属性 | 内容 |
|------|------|
| 规则编号 | BR-AI-035 |
| 规则名称 | AI结果追溯记录 |
| 规则类型 | INT(集成规则) |
| 适用对象 | AI分析结果(ai_result) |
| 规则描述 | 所有AI调用和结果必须完整记录，包括请求参数、响应结果、模型版本、时间戳 |
| 触发时机 | AI服务调用完成时 |
| 校验逻辑 | ```
// 伪代码
// 记录AI调用日志
INSERT INTO ai_call_log (
    call_id,
    service_type,
    model_id,
    model_version,
    model_endpoint,
    request_id,
    patient_id,
    encounter_id,
    request_params,
    request_time,
    response_result,
    response_time,
    response_duration_ms,
    confidence_score,
    status,
    error_message,
    reviewer_id,
    review_time,
    review_status,
    is_adopted,
    feedback_score
) VALUES (
    GENERATE_UUID(),
    service_type,
    model_id,
    model_version,
    model_endpoint,
    request_id,
    patient_id,
    encounter_id,
    JSON.stringify(request_params),
    request_time,
    JSON.stringify(response_result),
    response_time,
    response_duration_ms,
    confidence_score,
    status,
    error_message,
    NULL,  // 复核人待填写
    NULL,  // 复核时间待填写
    'PENDING',  // 待复核
    NULL,  // 是否采用待确认
    NULL   // 反馈评分待填写
)

RETURN success()
``` |
| 失败处理 | 记录日志失败不影响主流程 |
| 优先级 | P0 |

---

## 4. 规则冲突检测

| 规则1 | 规则2 | 冲突类型 | 处理建议 |
|-------|-------|----------|----------|
| BR-AI-001(置信度阈值) | BR-AI-020(置信度计算) | 规则依赖 | 置信度计算规则输出用于阈值判断 |
| BR-AI-003(影像置信度阈值) | BR-AI-022(影像置信度计算) | 规则依赖 | 置信度计算规则输出用于阈值判断 |
| BR-AI-030(超时控制) | BR-AI-031(重试策略) | 规则补充 | 超时后触发重试，重试耗尽后返回错误 |
| BR-AI-032(结果缓存) | BR-AI-035(追溯记录) | 规则独立 | 缓存命中时仍需记录调用日志 |
| BR-AI-033(异常降级) | BR-AI-031(重试策略) | 规则顺序 | 重试耗尽后触发降级处理 |

---

## 5. 规则依赖关系图

```
BR-AI-001(分诊置信度阈值) ──> BR-AI-020(分诊置信度计算) ──> BR-AI-029(分诊优先级计算)

BR-AI-003(影像置信度阈值) ──> BR-AI-022(影像置信度计算) ──> BR-AI-021(病灶测量计算)

BR-AI-005(质控评分阈值) ──> BR-AI-023(质控评分计算)

BR-AI-006(诊断数据完整性) ──> BR-AI-024(诊断置信度计算)

BR-AI-007(模型参数范围) ──> BR-AI-018(模型管理权限)

BR-AI-008(服务可用性) ──> BR-AI-027(可用性计算) ──> BR-AI-028(成功率计算)

BR-AI-009(分诊状态流转) ──> BR-AI-012(人工复核流程) ──> BR-AI-013(反馈与优化)

BR-AI-010(影像状态流转) ──> BR-AI-012(人工复核流程)

BR-AI-011(质控状态流转) ──> BR-AI-014(整改超时提醒)

BR-AI-030(超时控制) ──> BR-AI-031(重试策略) ──> BR-AI-033(异常降级)

BR-AI-034(外部服务集成) ──> BR-AI-035(追溯记录)

BR-AI-015(分诊权限) ──> BR-AI-009(分诊状态流转)
BR-AI-016(影像AI权限) ──> BR-AI-010(影像状态流转)
BR-AI-017(质控AI权限) ──> BR-AI-011(质控状态流转)
BR-AI-018(模型管理权限) ──> BR-AI-007(模型参数范围)
BR-AI-019(监控权限) ──> BR-AI-026(响应时间计算)
```

---

## 6. 规则执行顺序

### 6.1 智能分诊流程规则执行顺序

| 执行顺序 | 规则编号 | 规则名称 | 执行阶段 |
|----------|----------|----------|----------|
| 1 | BR-AI-015 | 智能分诊权限控制 | 权限检查 |
| 2 | BR-AI-002 | 症状描述长度限制 | 数据校验 |
| 3 | BR-AI-020 | 智能分诊置信度计算 | AI分析 |
| 4 | BR-AI-029 | 分诊优先级计算 | AI分析 |
| 5 | BR-AI-001 | 智能分诊置信度阈值 | 结果判断 |
| 6 | BR-AI-009 | 智能分诊状态流转 | 状态变更 |
| 7 | BR-AI-012 | AI结果人工复核流程 | 人工复核 |
| 8 | BR-AI-013 | 分诊反馈与模型优化 | 反馈记录 |
| 9 | BR-AI-035 | AI结果追溯记录 | 日志记录 |

### 6.2 影像AI分析流程规则执行顺序

| 执行顺序 | 规则编号 | 规则名称 | 执行阶段 |
|----------|----------|----------|----------|
| 1 | BR-AI-016 | 影像AI权限控制 | 权限检查 |
| 2 | BR-AI-004 | 影像质量AI分析条件 | 质量检查 |
| 3 | BR-AI-030 | AI服务调用超时控制 | 服务调用 |
| 4 | BR-AI-031 | AI服务重试策略 | 服务调用 |
| 5 | BR-AI-032 | AI服务结果缓存 | 结果处理 |
| 6 | BR-AI-021 | 影像病灶测量计算 | 结果计算 |
| 7 | BR-AI-022 | 影像AI置信度计算 | 结果计算 |
| 8 | BR-AI-003 | 影像AI分析置信度阈值 | 结果判断 |
| 9 | BR-AI-010 | 影像AI分析状态流转 | 状态变更 |
| 10 | BR-AI-012 | AI结果人工复核流程 | 人工复核 |
| 11 | BR-AI-035 | AI结果追溯记录 | 日志记录 |

### 6.3 病历质控AI流程规则执行顺序

| 执行顺序 | 规则编号 | 规则名称 | 执行阶段 |
|----------|----------|----------|----------|
| 1 | BR-AI-017 | 病历质控AI权限控制 | 权限检查 |
| 2 | BR-AI-030 | AI服务调用超时控制 | 服务调用 |
| 3 | BR-AI-023 | 病历质控评分计算 | 结果计算 |
| 4 | BR-AI-005 | 病历质控评分阈值 | 结果判断 |
| 5 | BR-AI-011 | 病历质控状态流转 | 状态变更 |
| 6 | BR-AI-014 | 整改超时提醒流程 | 流程监控 |
| 7 | BR-AI-035 | AI结果追溯记录 | 日志记录 |

---

## 7. 规则变更记录

| 版本 | 变更内容 | 变更原因 | 变更日期 |
|------|----------|----------|----------|
| V1.0 | 初始版本：35条规则，从全局业务规则、PRD、用户故事、验收标准中提取和结构化 | 新增 | 2026-06-19 |

---

## 附录A：规则快速索引

| 规则编号 | 规则名称 | 规则类型 | 优先级 |
|----------|----------|----------|--------|
| BR-AI-001 | 智能分诊置信度阈值校验 | VAL | P0 |
| BR-AI-002 | 症状描述长度限制 | VAL | P0 |
| BR-AI-003 | 影像AI分析置信度阈值 | VAL | P0 |
| BR-AI-004 | 影像质量AI分析条件校验 | VAL | P0 |
| BR-AI-005 | 病历质控评分阈值判定 | VAL | P0 |
| BR-AI-006 | 辅助诊断数据完整性校验 | VAL | P0 |
| BR-AI-007 | AI模型参数范围校验 | VAL | P0 |
| BR-AI-008 | AI服务可用性校验 | VAL | P0 |
| BR-AI-009 | 智能分诊状态流转规则 | FLOW | P0 |
| BR-AI-010 | 影像AI分析状态流转规则 | FLOW | P0 |
| BR-AI-011 | 病历质控状态流转规则 | FLOW | P0 |
| BR-AI-012 | AI结果人工复核流程 | FLOW | P0 |
| BR-AI-013 | 分诊反馈与模型优化流程 | FLOW | P1 |
| BR-AI-014 | 整改超时提醒流程 | FLOW | P1 |
| BR-AI-015 | 智能分诊权限控制 | PERM | P0 |
| BR-AI-016 | 影像AI权限控制 | PERM | P0 |
| BR-AI-017 | 病历质控AI权限控制 | PERM | P0 |
| BR-AI-018 | AI模型管理权限控制 | PERM | P0 |
| BR-AI-019 | AI服务监控权限控制 | PERM | P0 |
| BR-AI-020 | 智能分诊置信度计算 | CALC | P0 |
| BR-AI-021 | 影像病灶测量计算 | CALC | P0 |
| BR-AI-022 | 影像AI置信度计算 | CALC | P0 |
| BR-AI-023 | 病历质控评分计算 | CALC | P0 |
| BR-AI-024 | 辅助诊断置信度计算 | CALC | P0 |
| BR-AI-025 | AI模型准确率计算 | CALC | P1 |
| BR-AI-026 | AI服务响应时间计算 | CALC | P0 |
| BR-AI-027 | AI服务可用性计算 | CALC | P0 |
| BR-AI-028 | AI调用成功率计算 | CALC | P0 |
| BR-AI-029 | 分诊优先级计算 | CALC | P0 |
| BR-AI-030 | AI服务调用超时控制 | INT | P0 |
| BR-AI-031 | AI服务重试策略 | INT | P0 |
| BR-AI-032 | AI服务结果缓存 | INT | P1 |
| BR-AI-033 | AI服务异常降级处理 | INT | P0 |
| BR-AI-034 | 外部AI服务接口集成 | INT | P0 |
| BR-AI-035 | AI结果追溯记录 | INT | P0 |

---

## 附录B：与全局业务规则对照

| 全局规则编号 | 全局规则名称 | AI辅助规则编号 | 说明 |
|--------------|--------------|----------------|------|
| BR-AI-001 | AI结果必须人工复核 | BR-AI-012 | AI辅助模块细化了复核流程 |
| BR-AI-002 | AI置信度透明展示 | BR-AI-001, BR-AI-003 | 细化了各模块置信度阈值 |
| BR-AI-003 | AI服务可用性要求 | BR-AI-008, BR-AI-027 | 细化了可用性计算和告警 |
| BR-AI-004 | AI结果可追溯 | BR-AI-035 | 完全一致 |
| BR-AI-005 | AI辅助原则 | 全部规则 | 贯穿所有AI辅助规则 |

---

> **业务分析师**: ________________
> **产品负责人**: ________________
> **最后更新**: 2026-06-19
