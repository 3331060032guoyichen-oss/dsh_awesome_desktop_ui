/** Locale bundles for the built-in plugins settings section. */

/** Locale keys the section renders. */
export type PluginsSettingsLocaleKey = 'nav' | 'title' | 'intro' | 'tabs' | 'empty' | 'search'

/** English copy. */
export const en: Record<PluginsSettingsLocaleKey, string> = {
  search: 'Search plugins',
  nav: 'Plugin market',
  title: 'Plugin market',
  intro: 'Find extensions for your workspace.',
  tabs: 'Plugin views',
  empty: 'This deployment exposes no plugin views.',
}

/** Simplified Chinese copy. */
export const zh: Record<PluginsSettingsLocaleKey, string> = {
  search: '搜索名称、功能或插件',
  nav: '插件市场',
  title: '插件市场',
  intro: '发现新的能力，也让每个插件各得其所。',
  tabs: '插件视图',
  empty: '本部署没有开放任何插件视图。',
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  search: 'プラグインを検索',
  'nav': 'プラグインマーケット',
  'title': 'プラグインマーケット',
  'intro': 'ワークスペースの拡張機能を探します。',
  'tabs': 'プラグインビュー',
  'empty': 'このデプロイメントにはプラグインビューがありません。',
} satisfies Record<keyof typeof en, string>

/** Spanish dictionary, checked against the English keys. */
export const es = {
  search: 'Buscar complementos',
  nav: 'Mercado de complementos',
  title: 'Mercado de complementos',
  intro: 'Descubre extensiones para tu espacio de trabajo.',
  tabs: 'Vistas de complementos',
  empty: 'Esta implementación no expone vistas de complementos.',
} satisfies Record<keyof typeof en, string>

/** French dictionary, checked against the English keys. */
export const fr = {
  search: 'Rechercher des plugins',
  nav: 'Marché des plugins',
  title: 'Marché des plugins',
  intro: 'Découvrez des extensions pour votre espace de travail.',
  tabs: 'Vues des plugins',
  empty: "Ce déploiement n'expose aucune vue de plugin.",
} satisfies Record<keyof typeof en, string>

/** German dictionary, checked against the English keys. */
export const de = {
  search: 'Plugins suchen',
  nav: 'Plugin-Markt',
  title: 'Plugin-Markt',
  intro: 'Erweiterungen für Ihren Arbeitsbereich entdecken.',
  tabs: 'Plugin-Ansichten',
  empty: 'Diese Bereitstellung stellt keine Plugin-Ansichten bereit.',
} satisfies Record<keyof typeof en, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  search: 'Поиск плагинов',
  nav: 'Маркет плагинов',
  title: 'Маркет плагинов',
  intro: 'Расширения для вашего рабочего пространства.',
  tabs: 'Просмотры плагинов',
  empty: 'Это развертывание не предоставляет никаких представлений плагинов.',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  search: 'Pesquisar plug-ins',
  nav: 'Mercado de plug-ins',
  title: 'Mercado de plug-ins',
  intro: 'Descubra extensões para seu espaço de trabalho.',
  tabs: 'Visualizações de plug-in',
  empty: 'Esta implantação não expõe visualizações de plug-ins.',
} satisfies Record<keyof typeof en, string>
