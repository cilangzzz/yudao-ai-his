export const meta = {
  name: 'his-requirement-development',
  description: 'HIS系统需求开发工作流 - 按模块顺序执行需求分析、用户故事、验收标准、业务规则开发',
  phases: [
    { title: 'Phase 1: 需求理解', detail: '理解PRD、提取功能点、分析业务场景' },
    { title: 'Phase 2: 用户故事', detail: '编写INVEST标准用户故事' },
    { title: 'Phase 3: 验收标准', detail: '编写Gherkin格式验收标准' },
    { title: 'Phase 4: 业务规则', detail: '梳理结构化业务规则' },
    { title: 'Phase 5: 质量检查', detail: '检查需求完整性和一致性' },
    { title: 'Phase 6: 功能点需求', detail: '开发子模块功能点需求文档' },
  ],
}

// HIS系统待开发模块列表(按优先级和依赖顺序)
const MODULES = [
  { id: 'M09', name: '系统管理', priority: 'P0', status: 'in_progress', hasSubModules: true },
  { id: 'M03', name: '电子病历', priority: 'P1', status: 'pending', hasSubModules: true },
  { id: 'M04', name: '检验管理', priority: 'P1', status: 'pending', hasSubModules: true },
  { id: 'M05', name: '影像管理', priority: 'P1', status: 'pending', hasSubModules: true },
  { id: 'M08', name: '财务管理', priority: 'P1', status: 'pending', hasSubModules: true },
  { id: 'M10', name: '集成平台', priority: 'P1', status: 'pending', hasSubModules: true },
  { id: 'M07', name: '手术麻醉', priority: 'P1', status: 'pending', hasSubModules: true },
  { id: 'M11', name: '患者服务', priority: 'P1', status: 'pending', hasSubModules: true },
  { id: 'M12', name: '运营管理', priority: 'P2', status: 'pending', hasSubModules: true },
  { id: 'M13', name: 'AI辅助', priority: 'P2', status: 'pending', hasSubModules: true },
]

// 产品agent模型路径
const AGENT_MODEL_PATH = 'F:/sandbox/workflow/1.0-软件开发流程角色agent模型/产品/'
const PROJECT_PATH = 'f:/projects/yudao-ai-his/02-开发库/01-需求开发/'

// 需求分析schema
const REQUIREMENT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    moduleId: { type: 'string', description: '模块编号' },
    moduleName: { type: 'string', description: '模块名称' },
    featurePoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          userRoles: { type: 'array' },
          businessScenarios: { type: 'array' },
        }
      }
    },
    userRoles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          responsibilities: { type: 'array' },
        }
      }
    },
    dependencies: {
      type: 'object',
      properties: {
        upstream: { type: 'array' },
        downstream: { type: 'array' },
      }
    },
    subModules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          featureCount: { type: 'number' },
        }
      }
    },
  },
  required: ['moduleId', 'moduleName', 'featurePoints', 'userRoles'],
}

// 用户故事schema
const USER_STORY_SCHEMA = {
  type: 'object',
  properties: {
    moduleId: { type: 'string' },
    userStories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          story: { type: 'string' },
          role: { type: 'string' },
          action: { type: 'string' },
          value: { type: 'string' },
          priority: { type: 'string' },
          riceScore: { type: 'number' },
          investCheck: {
            type: 'object',
            properties: {
              independent: { type: 'boolean' },
              negotiable: { type: 'boolean' },
              valuable: { type: 'boolean' },
              estimable: { type: 'boolean' },
              small: { type: 'boolean' },
              testable: { type: 'boolean' },
            }
          },
          dependencies: { type: 'array' },
        }
      }
    },
    totalCount: { type: 'number' },
  },
  required: ['moduleId', 'userStories', 'totalCount'],
}

// 验收标准schema
const ACCEPTANCE_CRITERIA_SCHEMA = {
  type: 'object',
  properties: {
    moduleId: { type: 'string' },
    acceptanceCriteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userStoryId: { type: 'string' },
          scenario: { type: 'string' },
          given: { type: 'string' },
          when: { type: 'string' },
          then: { type: 'string' },
          and: { type: 'array' },
        }
      }
    },
    totalCount: { type: 'number' },
  },
  required: ['moduleId', 'acceptanceCriteria', 'totalCount'],
}

// 业务规则schema
const BUSINESS_RULE_SCHEMA = {
  type: 'object',
  properties: {
    moduleId: { type: 'string' },
    businessRules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          triggerCondition: { type: 'string' },
          executionLogic: { type: 'string' },
          exceptions: { type: 'array' },
        }
      }
    },
    totalCount: { type: 'number' },
  },
  required: ['moduleId', 'businessRules', 'totalCount'],
}

// 功能点需求schema
const FEATURE_REQUIREMENT_SCHEMA = {
  type: 'object',
  properties: {
    subModuleId: { type: 'string' },
    subModuleNname: { type: 'string' },
    features: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          pageDesign: { type: 'string' },
          fields: { type: 'array' },
          apiDesign: { type: 'string' },
          statusMachine: { type: 'string' },
        }
      }
    },
  },
  required: ['subModuleId', 'subModuleName', 'features'],
}

// 主工作流
phase('Phase 1: 需求理解')
log('开始HIS系统需求开发工作流')

// 首先分析当前进行中的模块(M09系统管理)
const currentModule = MODULES.find(m => m.status === 'in_progress')
log(`当前开发模块: ${currentModule.id} - ${currentModule.name}`)

// Phase 1: 需求理解与分析
const requirementAnalysis = await agent(
  `作为B端产品经理，分析${currentModule.id} ${currentModule.name}模块的PRD文档。

任务:
1. 阅读PRD文档: ${PROJECT_PATH}${currentModule.id}-${currentModule.name}/${currentModule.id}-${currentModule.name}-PRD.md
2. 阅读模块划分文档: ${PROJECT_PATH}00-全局文档/01-需求概览/HIS系统-模块划分文档.md
3. 提取所有功能点，按子模块分组
4. 识别用户角色及其职责
5. 分析业务场景
6. 梳理上下游依赖关系

参考产品agent模型:
- 需求分析技能: ${AGENT_MODEL_PATH}skill/requirement-analyzer-v2.skill.md
- PRD模板: ${AGENT_MODEL_PATH}references/prd-template.md

输出格式要求:
- 功能点ID格式: F-${currentModule.id}-{子模块序号}-{功能序号}
- 使用INVEST原则和MoSCoW优先级分类
- 计算RICE评分`,
  { label: `需求分析:${currentModule.id}`, phase: 'Phase 1', schema: REQUIREMENT_ANALYSIS_SCHEMA }
)

log(`需求分析完成: ${requirementAnalysis.featurePoints?.length || 0}个功能点, ${requirementAnalysis.userRoles?.length || 0}个用户角色`)

// Phase 2: 用户故事编写
phase('Phase 2: 用户故事')
const userStories = await agent(
  `作为B端产品经理，为${currentModule.id} ${currentModule.name}模块编写用户故事。

基于需求分析结果:
${JSON.stringify(requirementAnalysis, null, 2)}

任务:
1. 为每个功能点编写用户故事
2. 用户故事格式: 作为{角色}, 我想要{功能}, 以便于{价值}
3. 确保符合INVEST原则
4. 使用MoSCoW优先级分类(Must/Should/Could/Won't)
5. 计算RICE评分: RICE = Reach × Impact × Confidence / Effort
6. 标注故事依赖关系

参考:
- 用户故事生成技能: ${AGENT_MODEL_PATH}skill/user-story-generator.skill.md
- 已完成模块参考: ${PROJECT_PATH}M01-门诊管理/M01-门诊管理-用户故事.md

输出:
- 用户故事ID格式: US-${currentModule.id}-{序号}
- 每个故事需包含INVEST检查`,
  { label: `用户故事:${currentModule.id}`, phase: 'Phase 2', schema: USER_STORY_SCHEMA }
)

log(`用户故事编写完成: ${userStories.totalCount || 0}个用户故事`)

// Phase 3: 验收标准定义
phase('Phase 3: 验收标准')
const acceptanceCriteria = await agent(
  `作为B端产品经理，为${currentModule.id} ${currentModule.name}模块编写验收标准。

基于用户故事:
${JSON.stringify(userStories, null, 2)}

任务:
1. 为每个用户故事编写验收标准
2. 使用Gherkin格式(Given-When-Then)
3. 每个故事至少1个主要场景
4. 包含边界条件和异常场景
5. 确保验收标准可测试、可执行

参考:
- 验收标准编写技能: ${AGENT_MODEL_PATH}skill/acceptance-criteria-writer.skill.md
- 已完成模块参考: ${PROJECT_PATH}M01-门诊管理/M01-门诊管理-验收标准.md

输出:
- 验收标准ID格式: AC-{用户故事ID}-{场景序号}
- Gherkin格式: Given {前置条件} When {操作} Then {结果}`,
  { label: `验收标准:${currentModule.id}`, phase: 'Phase 3', schema: ACCEPTANCE_CRITERIA_SCHEMA }
)

log(`验收标准编写完成: ${acceptanceCriteria.totalCount || 0}个验收场景`)

// Phase 4: 业务规则梳理
phase('Phase 4: 业务规则')
const businessRules = await agent(
  `作为B端产品经理，为${currentModule.id} ${currentModule.name}模块梳理业务规则。

基于PRD文档和需求分析:
${JSON.stringify(requirementAnalysis, null, 2)}

任务:
1. 从PRD提取业务规则
2. 按类别分组(数据校验/业务流转/权限控制/计算规则/集成规则)
3. 定义触发条件
4. 定义执行逻辑
5. 定义异常处理

参考:
- 业务规则分析技能: ${AGENT_MODEL_PATH}skill/business-rule-analyzer.skill.md
- 已完成模块参考: ${PROJECT_PATH}M01-门诊管理/M01-门诊管理-业务规则.md

输出:
- 业务规则ID格式: BR-${currentModule.id}-{类别}-{序号}
- 类别: VAL(校验), FLOW(流转), PERM(权限), CALC(计算), INT(集成)`,
  { label: `业务规则:${currentModule.id}`, phase: 'Phase 4', schema: BUSINESS_RULE_SCHEMA }
)

log(`业务规则梳理完成: ${businessRules.totalCount || 0}条业务规则`)

// Phase 5: 质量检查
phase('Phase 5: 质量检查')
const qualityCheck = await agent(
  `作为B端产品经理，对${currentModule.id} ${currentModule.name}模块需求文档进行质量检查。

检查内容:
1. 需求分析结果: ${JSON.stringify(requirementAnalysis, null, 2)}
2. 用户故事: ${JSON.stringify(userStories, null, 2)}
3. 验收标准: ${JSON.stringify(acceptanceCriteria, null, 2)}
4. 业务规则: ${JSON.stringify(businessRules, null, 2)}

质量检查清单:
- 需求覆盖率: 功能点 vs PRD功能清单，目标≥95%
- INVEST符合度: 逐项检查用户故事，目标100%
- 验收标准完整性: 每个故事至少1个场景，目标100%
- 业务规则覆盖: 每个规则有触发条件，目标100%
- 文档格式规范: Markdown格式正确

输出:
- 质量检查报告
- 发现的问题清单
- 改进建议`,
  { label: `质量检查:${currentModule.id}`, phase: 'Phase 5' }
)

log(`质量检查完成: ${qualityCheck}`)

// Phase 6: 功能点需求开发(如果有子模块)
phase('Phase 6: 功能点需求')
if (requirementAnalysis.subModules && requirementAnalysis.subModules.length > 0) {
  log(`开始开发${requirementAnalysis.subModules.length}个子模块的功能点需求`)

  // 并行开发各子模块功能点需求
  const subModuleResults = await parallel(
    requirementAnalysis.subModules.map((subModule, idx) => () =>
      agent(
        `作为B端产品经理，开发${subModule.id} ${subModule.name}的功能点需求文档。

参考PRD文档: ${PROJECT_PATH}${currentModule.id}-${currentModule.name}/${currentModule.id}-${currentModule.name}-PRD.md

任务:
1. 提取子模块所有功能点
2. 编写每个功能点的详细需求:
   - 功能描述
   - 页面设计(ASCII布局)
   - 字段定义(表格)
   - 接口设计
   - 交互流程
   - 状态机设计(如有)

参考已完成模块:
${PROJECT_PATH}M01-门诊管理/M01-01-挂号管理/M01-01-挂号管理-功能点需求.md

输出文件:
写入到 ${PROJECT_PATH}${currentModule.id}-${currentModule.name}/${subModule.id}-${subModule.name}/${subModule.id}-${subModule.name}-功能点需求.md`,
        {
          label: `功能点:${subModule.id}`,
          phase: 'Phase 6',
          schema: FEATURE_REQUIREMENT_SCHEMA,
          isolation: 'worktree'  // 使用worktree隔离，避免文件冲突
        }
      )
    )
  )

  log(`子模块功能点需求开发完成: ${subModuleResults.filter(Boolean).length}/${requirementAnalysis.subModules.length}`)
}

// 返回结果
return {
  module: currentModule,
  requirementAnalysis,
  userStories,
  acceptanceCriteria,
  businessRules,
  qualityCheck,
  summary: {
    featurePoints: requirementAnalysis.featurePoints?.length || 0,
    userStories: userStories.totalCount || 0,
    acceptanceCriteria: acceptanceCriteria.totalCount || 0,
    businessRules: businessRules.totalCount || 0,
    subModules: requirementAnalysis.subModules?.length || 0,
  }
}