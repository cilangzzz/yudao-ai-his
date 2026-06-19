export const meta = {
  name: 'his-batch-requirement-development',
  description: 'HIS系统批量需求开发工作流 - 依次完成所有剩余模块的需求开发',
  phases: [
    { title: 'M03: 电子病历', detail: '病历模板、编辑、审签、归档、质控' },
    { title: 'M04: 检验管理', detail: '标本管理、检验执行、报告发布、危急值' },
    { title: 'M05: 影像管理', detail: '影像申请、DICOM采集、报告发布' },
    { title: 'M08: 财务管理', detail: '收费项目、医保结算、费用记账' },
    { title: 'M10: 集成平台', detail: 'EMPI、主数据、消息引擎' },
    { title: 'M07: 手术麻醉', detail: '手术排期、麻醉记录、术后管理' },
    { title: 'M11: 患者服务', detail: '患者门户、预约挂号、报告查询' },
    { title: 'M12: 运营管理', detail: '运营看板、统计报表、绩效管理' },
    { title: 'M13: AI辅助', detail: '智能分诊、影像AI、病历质控AI' },
  ],
}

// HIS系统待开发模块列表(按优先级和依赖顺序)
const REMAINING_MODULES = [
  { id: 'M03', name: '电子病历', priority: 'P1', estimatedFeatures: 19 },
  { id: 'M04', name: '检验管理', priority: 'P1', estimatedFeatures: 21 },
  { id: 'M05', name: '影像管理', priority: 'P1', estimatedFeatures: 18 },
  { id: 'M08', name: '财务管理', priority: 'P1', estimatedFeatures: 17 },
  { id: 'M10', name: '集成平台', priority: 'P1', estimatedFeatures: 15 },
  { id: 'M07', name: '手术麻醉', priority: 'P1', estimatedFeatures: 19 },
  { id: 'M11', name: '患者服务', priority: 'P1', estimatedFeatures: 14 },
  { id: 'M12', name: '运营管理', priority: 'P2', estimatedFeatures: 13 },
  { id: 'M13', name: 'AI辅助', priority: 'P2', estimatedFeatures: 12 },
]

const AGENT_MODEL_PATH = 'F:/sandbox/workflow/1.0-软件开发流程角色agent模型/产品/'
const PROJECT_PATH = 'f:/projects/yudao-ai-his/02-开发库/01-需求开发/'

// 模块需求开发Schema
const MODULE_REQUIREMENT_SCHEMA = {
  type: 'object',
  properties: {
    moduleId: { type: 'string' },
    moduleName: { type: 'string' },
    status: { type: 'string' },
    userStoriesCount: { type: 'number' },
    acceptanceCriteriaCount: { type: 'number' },
    businessRulesCount: { type: 'number' },
    subModules: { type: 'array' },
    completedAt: { type: 'string' },
  },
  required: ['moduleId', 'moduleName', 'status'],
}

// pipeline处理所有模块
const results = await pipeline(
  REMAINING_MODULES,

  // Stage 1: 需求分析
  async (module) => {
    const result = await agent(
      `作为B端产品经理，开发${module.id} ${module.name}模块的需求文档。

任务:
1. 首先阅读PRD文档: ${PROJECT_PATH}00-全局文档/01-需求概览/HIS系统-模块划分文档.md
   找到${module.id}模块的功能定义部分

2. 检查是否已存在PRD文档: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-PRD.md
   - 如果不存在，需要基于模块划分文档创建PRD
   - 如果存在，直接使用

3. 编写需求文档:
   - 用户故事: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-用户故事.md
   - 验收标准: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-验收标准.md
   - 业务规则: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-业务规则.md

参考:
- 产品agent模型: ${AGENT_MODEL_PATH}
- 已完成模块参考: ${PROJECT_PATH}M01-门诊管理/

质量要求:
- 用户故事符合INVEST原则
- 验收标准使用Gherkin格式
- 业务规则分类: VAL(校验)、FLOW(流转)、PERM(权限)、CALC(计算)、INT(集成)

输出: 返回模块开发完成状态`,
      { label: `开发:${module.id}`, phase: `${module.id}: ${module.name}`, schema: MODULE_REQUIREMENT_SCHEMA }
    )
    return result
  },

  // Stage 2: 验证和质量检查
  async (result, module) => {
    if (!result) {
      log(`${module.id} 开发失败`)
      return { module, status: 'failed' }
    }

    log(`${module.id} ${module.name} 完成: 用户故事${result.userStoriesCount || 0}个, 验收标准${result.acceptanceCriteriaCount || 0}个, 业务规则${result.businessRulesCount || 0}条`)

    return {
      module,
      result,
      status: 'completed'
    }
  }
)

// 统计结果
const completed = results.filter(r => r && r.status === 'completed')
const failed = results.filter(r => !r || r.status === 'failed')

log(`批量需求开发完成`)
log(`成功: ${completed.length}个模块`)
log(`失败: ${failed.length}个模块`)

// 返回汇总
return {
  totalModules: REMAINING_MODULES.length,
  completed: completed.length,
  failed: failed.length,
  results: completed.map(c => ({
    moduleId: c.module.id,
    moduleName: c.module.name,
    userStories: c.result?.userStoriesCount || 0,
    acceptanceCriteria: c.result?.acceptanceCriteriaCount || 0,
    businessRules: c.result?.businessRulesCount || 0,
  })),
  summary: `HIS系统需求开发工作流完成，共开发${completed.length}个模块`
}