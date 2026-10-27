/** Usage labels shared by account dictionaries. */
export const usageEn = {
  usageProviderName: 'DeepSeek', usageTokenUnit: 'Token',
  usageTitle: 'Usage overview', usageScope: 'Tokens from all providers in this local Harness. Not an account-wide bill.',
  usageRefresh: 'Refresh', usageProvider: 'Provider account', usageAvailable: 'Available', usageUsed: 'Used', usageTotal: 'Total credited',
  usageAmountNote: 'Amounts not supplied by the provider appear as —. View the platform bill for complete account charges.',
  usageToday: 'Today', usageMonth: 'Selected month', usageAll: 'All time', usageCache: 'Today’s prompt cache hit rate',
  usageDaily: 'Daily token usage', usagePrevious: 'Previous month', usageNext: 'Next month', usageLess: 'Less', usageMore: 'More',
  usageSelectDay: 'Select a day to see its token usage.', usageUpdated: 'Updated', usageStale: 'Previous data; refresh failed',
  usageFailed: 'Usage could not be loaded. Refresh to try again; restart the app if the problem persists.',
} as const
/** Chinese account usage labels. */
export const usageZh: Record<keyof typeof usageEn, string> = {
  usageProviderName: 'DeepSeek', usageTokenUnit: 'Token',
  usageTitle: '用量总览', usageScope: 'Token 统计涵盖本机 Harness 的全部供应商，不代表账号全平台账单。',
  usageRefresh: '刷新', usageProvider: '供应商账户', usageAvailable: '可用余额', usageUsed: '已用金额', usageTotal: '累计入账',
  usageAmountNote: '供应商未提供的金额显示为 —；完整账户费用请在开放平台账单中查看。',
  usageToday: '今日', usageMonth: '所选月份', usageAll: '累计', usageCache: '今日输入缓存命中率',
  usageDaily: '每日 Token 用量', usagePrevious: '上个月', usageNext: '下个月', usageLess: '少', usageMore: '多',
  usageSelectDay: '点击日期，查看当天的 Token 用量。', usageUpdated: '更新于', usageStale: '显示上次数据，刷新失败',
  usageFailed: '暂时无法读取用量，请刷新重试；如果仍未恢复，请重启应用。',
}
