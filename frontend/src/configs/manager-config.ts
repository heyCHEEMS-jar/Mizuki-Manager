import {
  BookOpen,
  Info,
  CirclePlay,
  FileText,
  FolderKanban,
  Headphones,
  History,
  House,
  Image,
  Network,
  Rocket,
  Settings,
  Users,
  Volume2,
  type LucideIcon
} from 'lucide-react'

export interface ManagerItem {
  titleKey: string
  subtitleKey: string
  icon: LucideIcon
  path: string
  hideFromHome?: boolean
}

export const managerList: ManagerItem[] = [
  { titleKey: 'nav.home', subtitleKey: 'navSub.home', icon: House, path: '/index', hideFromHome: true },
  { titleKey: 'nav.about', subtitleKey: 'navSub.about', icon: Info, path: '/about' },
  { titleKey: 'nav.album', subtitleKey: 'navSub.album', icon: Image, path: '/album' },
  { titleKey: 'nav.anime', subtitleKey: 'navSub.anime', icon: CirclePlay, path: '/anime' },
  { titleKey: 'nav.builder', subtitleKey: 'navSub.builder', icon: Rocket, path: '/builder' },
  { titleKey: 'nav.config', subtitleKey: 'navSub.config', icon: Settings, path: '/config' },
  { titleKey: 'nav.device', subtitleKey: 'navSub.device', icon: Network, path: '/device' },
  { titleKey: 'nav.diary', subtitleKey: 'navSub.diary', icon: BookOpen, path: '/diary' },
  { titleKey: 'nav.friend', subtitleKey: 'navSub.friend', icon: Users, path: '/friend' },
  { titleKey: 'nav.music', subtitleKey: 'navSub.music', icon: Volume2, path: '/music' },
  { titleKey: 'nav.post', subtitleKey: 'navSub.post', icon: FileText, path: '/post' },
  { titleKey: 'nav.project', subtitleKey: 'navSub.project', icon: FolderKanban, path: '/project' },
  { titleKey: 'nav.skill', subtitleKey: 'navSub.skill', icon: Headphones, path: '/skill' },
  { titleKey: 'nav.timeline', subtitleKey: 'navSub.timeline', icon: History, path: '/timeline' }
]
