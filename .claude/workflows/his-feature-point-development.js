export const meta = {
  name: 'his-feature-point-development',
  description: 'HIS系统功能点需求开发工作流 - 为各模块创建子模块功能点需求文档',
  phases: [
    { title: 'M03 电子病历', detail: '5个子模块功能点需求' },
    { title: 'M04 检验管理', detail: '5个子模块功能点需求' },
    { title: 'M05 影像管理', detail: '5个子模块功能点需求' },
    { title: 'M08 财务管理', detail: '4个子模块功能点需求' },
    { title: 'M10 集成平台', detail: '4个子模块功能点需求' },
    { title: 'M07 手术麻醉', detail: '5个子模块功能点需求' },
    { title: 'M11 患者服务', detail: '5个子模块功能点需求' },
    { title: 'M12 运营管理', detail: '4个子模块功能点需求' },
    { title: 'M13 AI辅助', detail: '4个子模块功能点需求' },
  ],
}

// 需要创建功能点需求的模块和子模块
const MODULES_WITH_SUBMODULES = [
  {
    id: 'M03',
    name: '电子病历',
    subModules: [
      { id: 'M03-01', name: '病历模板管理' },
      { id: 'M03-02', name: '病历编辑' },
      { id: 'M03-03', name: '病历审签' },
      { id: 'M03-04', name: '病历质控' },
      { id: 'M03-05', name: '病历归档' },
    ]
  },
  {
    id: 'M04',
    name: '检验管理',
    subModules: [
      { id: 'M04-01', name: '检验申请管理' },
      { id: 'M04-02', name: '标本管理' },
      { id: 'M04-03', name: '检验执行' },
      { id: 'M04-04', name: '报告管理' },
      { id: 'M04-05', name: '检验项目管理' },
    ]
  },
  {
    id: 'M05',
    name: '影像管理',
    subModules: [
      { id: 'M05-01', name: '影像申请管理' },
      { id: 'M05-02', name: '影像检查执行' },
      { id: 'M05-03', name: '影像存储管理' },
      { id: 'M05-04', name: '影像查看' },
      { id: 'M05-05', name: '影像报告' },
    ]
  },
  {
    id: 'M08',
    name: '财务管理',
    subModules: [
      { id: 'M08-01', name: '收费项目管理' },
      { id: 'M08-02', name: '医保结算' },
      { id: 'M08-03', name: '费用记账' },
      { id: 'M08-04', name: '财务报表' },
    ]
  },
  {
    id: 'M10',
    name: '集成平台',
    subModules: [
      { id: 'M10-01', name: 'EMPI管理' },
      { id: 'M10-02', name: '主数据管理' },
      { id: 'M10-03', name: '消息引擎' },
      { id: 'M10-04', name: '接口适配' },
    ]
  },
  {
    id: 'M07',
    name: '手术麻醉',
    subModules: [
      { id: 'M07-01', name: '手术申请管理' },
      { id: 'M07-02', name: '手术排期' },
      { id: 'M07-03', name: '手术执行' },
      { id: 'M07-04', name: '麻醉管理' },
      { id: 'M07-05', name: '术后管理' },
    ]
  },
  {
    id: 'M11',
    name: '患者服务',
    subModules: [
      { id: 'M11-01', name: '患者门户' },
      { id: 'M11-02', name: '预约挂号' },
      { id: 'M11-03', name: '报告查询' },
      { id: 'M11-04', name: '在线缴费' },
      { id: 'M11-05', name: '健康档案' },
    ]
  },
  {
    id: 'M12',
    name: '运营管理',
    subModules: [
      { id: 'M12-01', name: '运营看板' },
      { id: 'M12-02', name: '统计报表' },
      { id: 'M12-03', name: '绩效管理' },
      { id: 'M12-04', name: '经营分析' },
    ]
  },
  {
    id: 'M13',
    name: 'AI辅助',
    subModules: [
      { id: 'M13-01', name: '智能分诊' },
      { id: 'M13-02', name: '影像AI' },
      { id: 'M13-03', name: '病历质控AI' },
      { id: 'M13-04', name: 'AI模型管理' },
    ]
  },
]

const PROJECT_PATH = 'f:/projects/yudao-ai-his/02-开发库/01-需求开发/'
const REFERENCE_PATH = PROJECT_PATH + 'M01-门诊管理/M01-01-挂号管理/M01-01-挂号管理-功能点需求.md'

// 功能点需求文档Schema
const FEATURE_POINT_SCHEMA = {
  type: 'object',
  properties: {
    moduleId: { type: 'string' },
    subModuleId: { type: 'string' },
    subModuleName: { type: 'string' },
    featuresCount: { type: 'number' },
    status: { type: 'string' },
  },
  required: ['moduleId', 'subModuleId', 'subModuleName', 'featuresCount', 'status'],
}

// 并行处理所有模块的子模块功能点需求
const allResults = []

for (const module of MODULES_WITH_SUBMODULES) {
  phase(`${module.id}: ${module.name}`)
  log(`开始处理${module.id} ${module.name}的${module.subModules.length}个子模块`)

  // 并行处理每个模块的所有子模块
  const moduleResults = await parallel(
    module.subModules.map(subModule => () =>
      agent(
        `作为B端产品经理，创建${subModule.id} ${subModule.name}的功能点需求文档。

输入信息:
- 模块PRD: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-PRD.md
- 模块划分文档: ${PROJECT_PATH}00-全局文档/01-需求概览/HIS系统-模块划分文档.md
- 用户故事: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-用户故事.md
- 验收标准: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-验收标准.md
- 业务规则: ${PROJECT_PATH}${module.id}-${module.name}/${module.id}-${module.name}-业务规则.md

参考模板: ${REFERENCE_PATH}

任务要求:
1. 阅读PRD和模块划分文档，找到${subModule.id}子模块的功能定义
2. 阅读用户故事，提取属于${subModule.id}的用户故事
3. 创建功能点需求文档，包含以下章节:
   - 功能概述(功能定位、业务目标、功能范围、用户角色)
   - 功能列表(功能编号、名称、描述、优先级)
   - 页面设计(ASCII布局图，至少2个核心页面)
   - 字段定义(表格形式，包含字段名、类型、必填、说明)
   - 接口设计(REST API，至少2个核心接口)
   - 交互流程(流程图或步骤说明)
   - 状态机设计(如有状态流转)
   - 业务规则(提取相关业务规则)

3. 将文档写入: ${PROJECT_PATH}${module.id}-${module.name}/${subModule.id}-${subModule.name}/${subModule.id}-${subModule.name}-功能点需求.md

文档命名规范:
- 功能编号: F-${subModule.id}-XXX (如F-M03-01-001)
- 字段定义使用表格格式
- 页面设计使用ASCII框图
- 接口设计包含请求/响应示例`,
        {
          label: `功能点:${subModule.id}`,
          phase: `${module.id}: ${module.name}`,
          schema: FEATURE_POINT_SCHEMA,
          isolation: 'worktree'
        }
      )
    )
  )

  const successCount = moduleResults.filter(Boolean).length
  log(`${module.id} ${module.name} 完成: ${successCount}/${module.subModules.length}个子模块`)

  allResults.push({
    moduleId: module.id,
    moduleName: module.name,
    subModulesCount: module.subModules.length,
    completed: successCount,
    results: moduleResults.filter(Boolean)
  })
}

// 统计总结果
const totalSubModules = MODULES_WITH_SUBMODULES.reduce((sum, m) => sum + m.subModules.length, 0)
const totalCompleted = allResults.reduce((sum, m) => sum + m.completed, 0)

log(`功能点需求开发完成`)
log(`总计: ${totalCompleted}/${totalSubModules}个子模块`)

return {
  totalModules: MODULES_WITH_SUBMODULES.length,
  totalSubModules: totalSubModules,
  completed: totalCompleted,
  failed: totalSubModules - totalCompleted,
  modules: allResults,
  summary: `HIS系统功能点需求开发完成，共创建${totalCompleted}个子模块功能点需求文档`
}