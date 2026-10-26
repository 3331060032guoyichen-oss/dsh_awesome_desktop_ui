import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { PluginTabProps } from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type { DiscoverFace } from './market-store.ts'
import { DiscoverSection } from './DiscoverSection.tsx'

type Props = PropsRuntime<'settings.plugins.tab'> & PropsLocale<'pluginMarket'>
  & InjectFace<DiscoverFace & { requestInstall: PluginTabProps['install']; openInstalled: PluginTabProps['openPackage'] }>

/** Settings uses the same catalog and transfers confirmed actions to the existing manager. */
export function SettingsMarket(props: Props) {
  return <DiscoverSection {...props} marketQuery={props.query}
    install={(target) => { props.close?.(); props.requestInstall(target) }}
    openPackage={(name) => { props.close?.(); props.openInstalled(name) }} />
}
